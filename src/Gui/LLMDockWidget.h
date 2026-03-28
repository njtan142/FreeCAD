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

#pragma once

#include <QDockWidget>
#include <QList>
#include <QString>
#include <Gui/GuiExport.h>

namespace Gui
{

class LLMChatWidget;

/**
 * @brief Dock widget providing an LLM Assistant chat panel in FreeCAD.
 *
 * This dock widget embeds a chat interface where users can type natural
 * language requests. The widget integrates with the LLM Bridge Python
 * module to communicate with the Node.js sidecar (when available).
 */
class GuiExport LLMDockWidget : public QDockWidget
{
    Q_OBJECT

public:
    /// Message structure for conversation history
    struct Message
    {
        enum Role
        {
            User,
            Assistant,
            System
        };

        Role role;
        QString content;
    };

    /// Constructor
    explicit LLMDockWidget(QWidget* parent = nullptr);

    /// Destructor
    ~LLMDockWidget() override;

    /// Get the conversation history
    const QList<Message>& getConversationHistory() const;

    /// Clear the conversation history
    void clearConversation();

    /// Get current session name
    QString getSessionName() const;

    /// Set current session name
    void setSessionName(const QString& name);

public Q_SLOTS:
    /// Send the current input text as a message
    void sendMessage();

    /// Append a message to the chat display
    void appendMessage(const QString& message, Message::Role role);

    /// Handle a response from the LLM (via Python bridge)
    void handleResponse(const QString& response);

    /// Handle connection status changes from the Python bridge
    void handleConnectionStatus(bool connected, const QString& statusMessage);

    /// Save current session
    void onSaveSession();

    /// Load a session
    void onLoadSession();

    /// Update session display
    void updateSessionDisplay(const QString& sessionName);

private Q_SLOTS:
    /// Handle text input (check for Enter key)
    void handleInputTextChanged();

private:
    /// Initialize the UI components
    void setupUI();

    /// Initialize the Python bridge connection
    void setupPythonBridge();

    /// Add a user message to the chat and history
    void addUserMessage(const QString& message);

    /// Add an assistant message to the chat and history
    void addAssistantMessage(const QString& message);

    /// Add a system message to the chat and history
    void addSystemMessage(const QString& message);

    /// Create session-related UI elements
    void setupSessionUI();

private:
    LLMChatWidget* m_chatWidget;        ///< Chat display widget
    QLineEdit* m_inputField;            ///< Text input field
    QPushButton* m_sendButton;          ///< Send button
    QWidget* m_mainWidget;              ///< Main container widget

    QList<Message> m_conversationHistory;  ///< Conversation history in memory

    bool m_pythonBridgeInitialized;     ///< Whether Python bridge is set up
    bool m_sidecarConnected;            ///< Whether sidecar connection is active

    // Session management
    QString m_currentSessionName;       ///< Current session name for display
    QLabel* m_sessionLabel;             ///< Session name display label
    QPushButton* m_sessionButton;       ///< Session actions button
};

}  // namespace Gui
