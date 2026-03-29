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

#include <QTextEdit>
#include <QScrollArea>
#include <QVBoxLayout>
#include <QColor>
#include <FCGlobal.h>

namespace Gui
{

/**
 * @brief A custom widget for displaying chat messages in the LLM Assistant panel.
 * 
 * This widget provides a scrollable area containing formatted chat messages
 * with different styles for user, assistant, and system messages.
 */
class GuiExport LLMChatWidget : public QScrollArea
{
    Q_OBJECT

public:
    /// Message role enum
    enum class MessageRole
    {
        User,       ///< User message (right-aligned, different color)
        Assistant,  ///< Assistant/LLM message (left-aligned)
        System      ///< System message (centered, muted)
    };

    /// Constructor
    explicit LLMChatWidget(QWidget* parent = nullptr);
    
    /// Destructor
    ~LLMChatWidget() override;

    /// Append a user message to the chat
    void appendUserMessage(const QString& message);
    
    /// Append an assistant message to the chat
    void appendAssistantMessage(const QString& message);
    
    /// Append a system message to the chat
    void appendSystemMessage(const QString& message);
    
    /// Clear all messages from the chat
    void clearMessages();
    
    /// Scroll to the bottom of the chat
    void scrollToBottom();

protected:
    /// Handle resize events to maintain scroll position
    void resizeEvent(QResizeEvent* event) override;

private:
    /// Internal method to append a message with specific formatting
    void appendMessage(const QString& message, MessageRole role);
    
    /// Create a message label with appropriate styling
    QWidget* createMessageLabel(const QString& message, MessageRole role);
    
    /// Get background color for message role
    QColor getBackgroundColor(MessageRole role) const;
    
    /// Get text alignment for message role
    Qt::Alignment getTextAlignment(MessageRole role) const;

private:
    QWidget* m_containerWidget;      ///< Container widget for messages
    QVBoxLayout* m_layout;           ///< Layout for stacking messages
    bool m_scrollingEnabled;         ///< Whether auto-scroll is enabled
};

}  // namespace Gui
