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
#include <QMenu>
#include <QInputDialog>
#include <QTimer>

#include <App/Application.h>
#include <Base/Interpreter.h>

#include <memory>
#include <iostream>

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
    , m_currentSessionName(tr("New Session"))
    , m_sessionLabel(nullptr)
    , m_sessionButton(nullptr)
{
    std::cerr << "LLMDockWidget: constructor start" << std::endl;
    setWindowTitle(tr("LLM Assistant"));
    setObjectName(QStringLiteral("LLMDockWidget"));
    setAttribute(Qt::WA_StyledBackground, true);
    setAutoFillBackground(true);

    std::cerr << "LLMDockWidget: calling setupUI" << std::endl;
    setupUI();
    std::cerr << "LLMDockWidget: calling setupSessionUI" << std::endl;
    setupSessionUI();

    // Add welcome message
    addSystemMessage(tr("LLM Assistant initialized. Type your request below."));

    std::cerr << "LLMDockWidget: deferring Python bridge init" << std::endl;
    // Defer Python bridge initialization until after event loop starts
    // to ensure Python is fully ready
    QTimer::singleShot(100, this, &LLMDockWidget::setupPythonBridge);
    std::cerr << "LLMDockWidget: constructor done" << std::endl;
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
    m_mainWidget->setAutoFillBackground(true);
    auto* mainLayout = new QVBoxLayout(m_mainWidget);
    mainLayout->setContentsMargins(4, 4, 4, 4);
    mainLayout->setSpacing(4);
    
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
    std::cerr << "LLMDockWidget: setupPythonBridge start" << std::endl;
    // Attempt to initialize the Python bridge
    try {
        std::cerr << "LLMDockWidget: acquiring GIL" << std::endl;
        Base::PyGILStateLocker lock;
        std::cerr << "LLMDockWidget: GIL acquired" << std::endl;

        // Import the module
        std::cerr << "LLMDockWidget: importing llm_bridge.llm_panel_bridge" << std::endl;
        PyObject* module = PyImport_ImportModule("llm_bridge.llm_panel_bridge");
        if (!module) {
            std::cerr << "LLMDockWidget: module import failed" << std::endl;
            PyErr_Print();
            PyErr_Clear();
            m_pythonBridgeInitialized = false;
            addSystemMessage(tr("Python bridge module not found. Make sure LLMBridge is loaded."));
            return;
        }
        std::cerr << "LLMDockWidget: module imported successfully" << std::endl;

        // Call initialize() to explicitly initialize the bridge
        PyObject* initFunc = PyObject_GetAttrString(module, "initialize");
        if (!initFunc || !PyCallable_Check(initFunc)) {
            Py_XDECREF(initFunc);
            Py_DECREF(module);
            m_pythonBridgeInitialized = false;
            addSystemMessage(tr("Python bridge initialize function not found."));
            return;
        }

        std::cerr << "LLMDockWidget: calling initialize()" << std::endl;
        PyObject* initResult = PyObject_CallObject(initFunc, nullptr);
        if (!initResult) {
            std::cerr << "LLMDockWidget: initialize() failed" << std::endl;
            PyErr_Print();
            PyErr_Clear();
            Py_DECREF(initFunc);
            Py_DECREF(module);
            m_pythonBridgeInitialized = false;
            addSystemMessage(tr("Failed to initialize Python bridge."));
            return;
        }
        std::cerr << "LLMDockWidget: initialize() succeeded" << std::endl;
        Py_DECREF(initResult);
        Py_DECREF(initFunc);

        m_pythonBridgeInitialized = true;
        Py_DECREF(module);

        addSystemMessage(tr("Python bridge initialized successfully."));
        std::cerr << "LLMDockWidget: setupPythonBridge complete" << std::endl;

        // Start polling for connection status and auto-reconnect
        auto* pollTimer = new QTimer(this);
        connect(pollTimer, &QTimer::timeout, this, [this]() {
            try {
                Base::PyGILStateLocker lock;
                PyObject* mod = PyImport_ImportModule("llm_bridge.llm_panel_bridge");
                if (!mod) return;

                // Check current connection status
                PyObject* func = PyObject_GetAttrString(mod, "is_connected");
                if (func && PyCallable_Check(func)) {
                    PyObject* result = PyObject_CallObject(func, nullptr);
                    if (result) {
                        bool connected = PyObject_IsTrue(result);
                        Py_DECREF(result);

                        if (connected != m_sidecarConnected) {
                            m_sidecarConnected = connected;
                            addSystemMessage(connected
                                ? tr("Connected to sidecar.")
                                : tr("Disconnected from sidecar."));
                        }

                        // If not connected, try to reconnect
                        if (!connected) {
                            PyObject* reconnFunc = PyObject_GetAttrString(mod, "_try_connect_background");
                            if (reconnFunc && PyCallable_Check(reconnFunc)) {
                                PyObject* r = PyObject_CallObject(reconnFunc, nullptr);
                                Py_XDECREF(r);
                            }
                            Py_XDECREF(reconnFunc);
                        }
                    }
                    Py_DECREF(func);
                }
                Py_DECREF(mod);
            }
            catch (...) {
                // Ignore polling errors
            }
        });
        pollTimer->start(5000);  // Poll every 5 seconds
    }
    catch (const Base::Exception& e) {
        std::cerr << "LLMDockWidget: Base::Exception: " << e.what() << std::endl;
        m_pythonBridgeInitialized = false;
        addSystemMessage(tr("Failed to initialize Python bridge: %1").arg(QString::fromUtf8(e.what())));
    }
    catch (const std::exception& e) {
        std::cerr << "LLMDockWidget: std::exception: " << e.what() << std::endl;
        m_pythonBridgeInitialized = false;
    }
    catch (...) {
        std::cerr << "LLMDockWidget: unknown exception" << std::endl;
        m_pythonBridgeInitialized = false;
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

QString LLMDockWidget::getSessionName() const
{
    return m_currentSessionName;
}

void LLMDockWidget::setSessionName(const QString& name)
{
    m_currentSessionName = name;
    updateSessionDisplay(name);
}

void LLMDockWidget::onSaveSession()
{
    // Prompt user for session name
    bool ok = false;
    QString name = QInputDialog::getText(
        this,
        tr("Save Session"),
        tr("Enter a name for this session:"),
        QLineEdit::Normal,
        m_currentSessionName,
        &ok
    );

    if (!ok || name.trimmed().isEmpty()) {
        return;
    }

    // Send save command via Python bridge
    if (m_pythonBridgeInitialized && m_sidecarConnected) {
        try {
            Base::PyGILStateLocker lock;
            PyObject* module = PyImport_ImportModule("llm_bridge.llm_panel_bridge");
            if (module) {
                PyObject* func = PyObject_GetAttrString(module, "send_message");
                if (func && PyCallable_Check(func)) {
                    QString command = QString("/save_session %1").arg(name);
                    PyObject* args = Py_BuildValue("(s)", command.toUtf8().constData());
                    PyObject* result = PyObject_CallObject(func, args);

                    Py_XDECREF(result);
                    Py_XDECREF(args);
                    Py_XDECREF(func);
                    Py_DECREF(module);

                    addSystemMessage(tr("Session save requested: '%1'").arg(name));
                }
                else {
                    Py_XDECREF(func);
                    Py_DECREF(module);
                    addSystemMessage(tr("Error: Could not send save command."));
                }
            }
            else {
                addSystemMessage(tr("Error: Could not import Python bridge module."));
            }
        }
        catch (const Base::Exception& e) {
            addSystemMessage(tr("Error saving session: %1").arg(QString::fromUtf8(e.what())));
        }
    }
    else {
        addSystemMessage(tr("Cannot save session: Sidecar not connected."));
    }
}

void LLMDockWidget::onLoadSession()
{
    // Prompt user for session ID
    bool ok = false;
    QString sessionId = QInputDialog::getText(
        this,
        tr("Load Session"),
        tr("Enter the session ID to load:"),
        QLineEdit::Normal,
        QString(),
        &ok
    );

    if (!ok || sessionId.trimmed().isEmpty()) {
        return;
    }

    // Send load command via Python bridge
    if (m_pythonBridgeInitialized && m_sidecarConnected) {
        try {
            Base::PyGILStateLocker lock;
            PyObject* module = PyImport_ImportModule("llm_bridge.llm_panel_bridge");
            if (module) {
                PyObject* func = PyObject_GetAttrString(module, "send_message");
                if (func && PyCallable_Check(func)) {
                    QString command = QString("/load_session %1").arg(sessionId);
                    PyObject* args = Py_BuildValue("(s)", command.toUtf8().constData());
                    PyObject* result = PyObject_CallObject(func, args);

                    Py_XDECREF(result);
                    Py_XDECREF(args);
                    Py_XDECREF(func);
                    Py_DECREF(module);

                    addSystemMessage(tr("Session load requested: '%1'").arg(sessionId));
                }
                else {
                    Py_XDECREF(func);
                    Py_DECREF(module);
                    addSystemMessage(tr("Error: Could not send load command."));
                }
            }
            else {
                addSystemMessage(tr("Error: Could not import Python bridge module."));
            }
        }
        catch (const Base::Exception& e) {
            addSystemMessage(tr("Error loading session: %1").arg(QString::fromUtf8(e.what())));
        }
    }
    else {
        addSystemMessage(tr("Cannot load session: Sidecar not connected."));
    }
}

void LLMDockWidget::updateSessionDisplay(const QString& sessionName)
{
    m_currentSessionName = sessionName;
    if (m_sessionLabel) {
        m_sessionLabel->setText(tr("Session: %1").arg(sessionName));
    }

    // Update window title to include session name
    setWindowTitle(tr("LLM Assistant - %1").arg(sessionName));
}

void LLMDockWidget::setupSessionUI()
{
    // Create session info bar above input field
    auto* sessionLayout = new QHBoxLayout();
    sessionLayout->setSpacing(8);

    // Session name label
    m_sessionLabel = new QLabel(tr("Session: %1").arg(m_currentSessionName), this);
    m_sessionLabel->setStyleSheet(QStringLiteral("QLabel { color: #666; font-size: 11px; }"));
    sessionLayout->addWidget(m_sessionLabel, 1);  // Stretch factor 1

    // Session actions button
    m_sessionButton = new QPushButton(tr("Session"), this);
    m_sessionButton->setMaximumWidth(80);
    m_sessionButton->setToolTip(tr("Session management options"));

    // Create context menu
    QMenu* sessionMenu = new QMenu(this);
    sessionMenu->addAction(tr("Save Session..."), this, &LLMDockWidget::onSaveSession);
    sessionMenu->addAction(tr("Load Session..."), this, &LLMDockWidget::onLoadSession);
    sessionMenu->addSeparator();
    sessionMenu->addAction(tr("New Session"), [this]() {
        setSessionName(tr("New Session"));
        clearConversation();
        addSystemMessage(tr("Started new session."));
    });

    m_sessionButton->setMenu(sessionMenu);
    sessionLayout->addWidget(m_sessionButton);

    // Insert session layout above input field in main layout
    // Find the main layout and insert before input layout
    auto* mainLayout = qobject_cast<QVBoxLayout*>(m_mainWidget->layout());
    if (mainLayout) {
        // Find the input layout position
        int inputLayoutIdx = -1;
        for (int i = 0; i < mainLayout->count(); ++i) {
            if (mainLayout->itemAt(i)->layout() != nullptr) {
                auto* layout = mainLayout->itemAt(i)->layout();
                if (qobject_cast<QHBoxLayout*>(layout)) {
                    // Check if this is the input layout (has QLineEdit)
                    for (int j = 0; j < layout->count(); ++j) {
                        if (qobject_cast<QLineEdit*>(layout->itemAt(j)->widget())) {
                            inputLayoutIdx = i;
                            break;
                        }
                    }
                }
            }
            if (inputLayoutIdx != -1) break;
        }

        // Insert session layout before input layout
        if (inputLayoutIdx != -1) {
            mainLayout->insertLayout(inputLayoutIdx, sessionLayout);
        }
        else {
            // Fallback: add at position 1 (after chat widget)
            mainLayout->insertLayout(1, sessionLayout);
        }
    }
}

#include "moc_LLMDockWidget.cpp"
