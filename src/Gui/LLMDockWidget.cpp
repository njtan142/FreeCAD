/***************************************************************************
 *   Copyright (c) 2026 FreeCAD Developers                                 *
 *                                                                         *
 *   This file is part of the FreeCAD CAx development system.              *
 *                                                                         *
 *   This library is free software; you can redistribute it and/or         *
 *   modify it under the terms of the GNU Library General Public           *
 *   License as published by the Free Software Foundation; either          *
 *   version 2 of the License, or (at your option) any later version.      *
 *                                                                         *
 *   This library  is distributed in the hope that it will be useful,      *
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of        *
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the         *
 *   GNU Library General Public License for more details.                  *
 *                                                                         *
 *   You should have received a copy of the GNU Library General Public     *
 *   License along with this library; see the file COPYING.LIB. If not,    *
 *   write to the Free Software Foundation, Inc., 59 Temple Place,         *
 *   Suite 330, Boston, MA  02111-1307, USA                                *
 *                                                                         *
 ***************************************************************************/

#include "LLMDockWidget.h"
#include "LLMChatWidget.h"

#include <QVBoxLayout>
#include <QHBoxLayout>
#include <QLineEdit>
#include <QPushButton>
#include <QLabel>
#include <QKeyEvent>
#include <QMessageBox>

#include <App/Application.h>
#include <Base/Interpreter.h>

#include <memory>

using namespace Gui;

// Static callback wrappers for Python calls
static PyObject* s_llmDockWidgetInstance = nullptr;

static PyObject* pyResponseCallback(PyObject* self, PyObject* args)
{
    Q_UNUSED(self);
    const char* response = nullptr;
    if (!PyArg_ParseTuple(args, "s", &response)) {
        return nullptr;
    }

    if (s_llmDockWidgetInstance) {
        LLMDockWidget* widget = reinterpret_cast<LLMDockWidget*>(PyLong_AsVoidPtr(
            PyObject_GetAttrString(s_llmDockWidgetInstance, "_ptr")));
        if (widget) {
            QMetaObject::invokeMethod(widget, "handleResponse", Qt::QueuedConnection,
                                      Q_ARG(QString, QString::fromUtf8(response)));
        }
    }

    Py_RETURN_NONE;
}

static PyObject* pyConnectionCallback(PyObject* self, PyObject* args)
{
    Q_UNUSED(self);
    int connected = 0;
    const char* statusMessage = nullptr;
    if (!PyArg_ParseTuple(args, "is", &connected, &statusMessage)) {
        return nullptr;
    }

    if (s_llmDockWidgetInstance) {
        LLMDockWidget* widget = reinterpret_cast<LLMDockWidget*>(PyLong_AsVoidPtr(
            PyObject_GetAttrString(s_llmDockWidgetInstance, "_ptr")));
        if (widget) {
            QMetaObject::invokeMethod(widget, "handleConnectionStatus", Qt::QueuedConnection,
                                      Q_ARG(bool, connected != 0),
                                      Q_ARG(QString, QString::fromUtf8(statusMessage)));
        }
    }

    Py_RETURN_NONE;
}

static PyMethodDef s_callbackMethods[] = {
    {"response_callback", pyResponseCallback, METH_VARARGS, "Callback for LLM responses"},
    {"connection_callback", pyConnectionCallback, METH_VARARGS, "Callback for connection status"},
    {nullptr, nullptr, 0, nullptr}
};

LLMDockWidget::LLMDockWidget(QWidget* parent)
    : QDockWidget(parent)
    , m_chatWidget(nullptr)
    , m_inputField(nullptr)
    , m_sendButton(nullptr)
    , m_mainWidget(nullptr)
    , m_pythonBridgeInitialized(false)
    , m_sidecarConnected(false)
{
    setWindowTitle(tr("LLM Assistant"));
    setObjectName(QStringLiteral("LLMDockWidget"));
    
    setupUI();
    setupPythonBridge();
    
    // Add welcome message
    addSystemMessage(tr("LLM Assistant initialized. Type your request below."));
}

LLMDockWidget::~LLMDockWidget() = default;

const QList<LLMDockWidget::Message>& LLMDockWidget::getConversationHistory() const
{
    return m_conversationHistory;
}

void LLMDockWidget::clearConversation()
{
    m_conversationHistory.clear();
    m_chatWidget->clearMessages();
    addSystemMessage(tr("Conversation cleared."));
}

void LLMDockWidget::sendMessage()
{
    QString text = m_inputField->text().trimmed();
    if (text.isEmpty()) {
        return;
    }
    
    // Add user message to chat
    addUserMessage(text);
    m_inputField->clear();
    
    // Try to send via Python bridge
    if (m_pythonBridgeInitialized && m_sidecarConnected) {
        try {
            Base::PyGILStateLocker lock;
            PyObject* module = PyImport_ImportModule("llm_bridge.llm_panel_bridge");
            if (module) {
                PyObject* func = PyObject_GetAttrString(module, "send_message");
                if (func && PyCallable_Check(func)) {
                    PyObject* args = Py_BuildValue("(s)", text.toUtf8().constData());
                    PyObject* result = PyObject_CallObject(func, args);
                    
                    Py_XDECREF(result);
                    Py_XDECREF(args);
                    Py_XDECREF(func);
                    Py_DECREF(module);
                }
                else {
                    Py_XDECREF(func);
                    Py_DECREF(module);
                    addSystemMessage(tr("Error: send_message function not found in Python bridge."));
                }
            }
            else {
                addSystemMessage(tr("Error: Could not import llm_bridge.llm_panel_bridge module."));
            }
        }
        catch (const Base::Exception& e) {
            addSystemMessage(tr("Error sending message: %1").arg(QString::fromUtf8(e.what())));
        }
    }
    else if (!m_pythonBridgeInitialized) {
        addSystemMessage(tr("Python bridge not initialized."));
    }
    else if (!m_sidecarConnected) {
        // Placeholder response when sidecar is not available
        addAssistantMessage(tr("Sidecar not connected yet. This is a placeholder response.\n\n"
                               "The Node.js sidecar will be built in the next step.\n"
                               "Once connected, I'll be able to execute FreeCAD commands."));
    }
}

void LLMDockWidget::appendMessage(const QString& message, Message::Role role)
{
    switch (role) {
        case Message::User:
            m_chatWidget->appendUserMessage(message);
            break;
        case Message::Assistant:
            m_chatWidget->appendAssistantMessage(message);
            break;
        case Message::System:
            m_chatWidget->appendSystemMessage(message);
            break;
    }
}

void LLMDockWidget::handleResponse(const QString& response)
{
    if (!response.isEmpty()) {
        addAssistantMessage(response);
    }
}

void LLMDockWidget::handleConnectionStatus(bool connected, const QString& statusMessage)
{
    m_sidecarConnected = connected;
    if (!statusMessage.isEmpty()) {
        addSystemMessage(statusMessage);
    }
}

void LLMDockWidget::handleInputTextChanged()
{
    // Could be used for auto-send on Enter, but we handle that in keyPressEvent
}

void LLMDockWidget::setupUI()
{
    m_mainWidget = new QWidget(this);
    auto* mainLayout = new QVBoxLayout(m_mainWidget);
    mainLayout->setContentsMargins(0, 0, 0, 0);
    mainLayout->setSpacing(0);
    
    // Chat display area
    m_chatWidget = new LLMChatWidget(this);
    mainLayout->addWidget(m_chatWidget, 1);  // Stretch factor 1
    
    // Input area
    auto* inputLayout = new QHBoxLayout();
    inputLayout->setSpacing(4);
    
    m_inputField = new QLineEdit(this);
    m_inputField->setPlaceholderText(tr("Type your request..."));
    m_inputField->setMinimumHeight(30);
    connect(m_inputField, &QLineEdit::returnPressed, this, &LLMDockWidget::sendMessage);
    inputLayout->addWidget(m_inputField, 1);
    
    m_sendButton = new QPushButton(tr("Send"), this);
    m_sendButton->setMinimumHeight(30);
    m_sendButton->setMinimumWidth(60);
    connect(m_sendButton, &QPushButton::clicked, this, &LLMDockWidget::sendMessage);
    inputLayout->addWidget(m_sendButton);
    
    mainLayout->addLayout(inputLayout);
    
    setWidget(m_mainWidget);
}

void LLMDockWidget::setupPythonBridge()
{
    // Attempt to initialize the Python bridge
    // This is a stub - actual connection happens when sidecar exists
    try {
        Base::PyGILStateLocker lock;

        // Check if the module exists
        PyObject* module = PyImport_ImportModule("llm_bridge.llm_panel_bridge");
        if (module) {
            m_pythonBridgeInitialized = true;

            // Store widget instance pointer for callbacks
            if (s_llmDockWidgetInstance) {
                Py_DECREF(s_llmDockWidgetInstance);
            }
            s_llmDockWidgetInstance = PyDict_New();
            PyObject* ptrObj = PyLong_FromVoidPtr(reinterpret_cast<void*>(this));
            PyDict_SetItemString(s_llmDockWidgetInstance, "_ptr", ptrObj);
            Py_DECREF(ptrObj);

            // Register callback for receiving LLM responses
            PyObject* registerFunc = PyObject_GetAttrString(module, "register_callback");
            if (registerFunc && PyCallable_Check(registerFunc)) {
                // Create a simple Python callable using PyCFunction
                PyObject* responseCallback = PyCFunction_NewEx(
                    &s_callbackMethods[0], nullptr, nullptr);
                if (responseCallback) {
                    PyObject* args = Py_BuildValue("(O)", responseCallback);
                    PyObject_CallObject(registerFunc, args);
                    Py_XDECREF(args);
                    Py_DECREF(responseCallback);
                }
                Py_DECREF(registerFunc);
            }

            // Register callback for connection status changes
            PyObject* registerConnFunc = PyObject_GetAttrString(module, "register_connection_callback");
            if (registerConnFunc && PyCallable_Check(registerConnFunc)) {
                PyObject* connCallback = PyCFunction_NewEx(
                    &s_callbackMethods[1], nullptr, nullptr);
                if (connCallback) {
                    PyObject* args = Py_BuildValue("(O)", connCallback);
                    PyObject_CallObject(registerConnFunc, args);
                    Py_XDECREF(args);
                    Py_DECREF(connCallback);
                }
                Py_DECREF(registerConnFunc);
            }

            Py_DECREF(module);

            addSystemMessage(tr("Python bridge module found."));
        }
        else {
            PyErr_Clear();
            m_pythonBridgeInitialized = false;
            addSystemMessage(tr("Python bridge module not found. Make sure LLMBridge is loaded."));
        }
    }
    catch (const Base::Exception&) {
        m_pythonBridgeInitialized = false;
        addSystemMessage(tr("Failed to initialize Python bridge."));
    }
}

void LLMDockWidget::addUserMessage(const QString& message)
{
    m_chatWidget->appendUserMessage(message);
    
    Message msg;
    msg.role = Message::User;
    msg.content = message;
    m_conversationHistory.append(msg);
}

void LLMDockWidget::addAssistantMessage(const QString& message)
{
    m_chatWidget->appendAssistantMessage(message);
    
    Message msg;
    msg.role = Message::Assistant;
    msg.content = message;
    m_conversationHistory.append(msg);
}

void LLMDockWidget::addSystemMessage(const QString& message)
{
    m_chatWidget->appendSystemMessage(message);
    
    Message msg;
    msg.role = Message::System;
    msg.content = message;
    m_conversationHistory.append(msg);
}

#include "moc_LLMDockWidget.cpp"
