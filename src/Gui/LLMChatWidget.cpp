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

#include "LLMChatWidget.h"

#include <QLabel>
#include <QScrollBar>
#include <QApplication>
#include <QPalette>

using namespace Gui;

LLMChatWidget::LLMChatWidget(QWidget* parent)
    : QScrollArea(parent)
    , m_scrollingEnabled(true)
{
    // Set up the container widget
    m_containerWidget = new QWidget(this);
    m_layout = new QVBoxLayout(m_containerWidget);
    m_layout->setSpacing(8);
    m_layout->setContentsMargins(8, 8, 8, 8);
    m_layout->addStretch();  // Push messages to the top

    // Configure scroll area
    setWidget(m_containerWidget);
    setWidgetResizable(true);
    setHorizontalScrollBarPolicy(Qt::ScrollBarAsNeeded);
    setVerticalScrollBarPolicy(Qt::ScrollBarAsNeeded);
    setFrameShape(QFrame::NoFrame);
    
    // Set background color on both scroll area and container
    setAutoFillBackground(true);
    QPalette pal = palette();
    pal.setColor(QPalette::Window, Qt::white);
    pal.setColor(QPalette::Base, Qt::white);
    setPalette(pal);

    m_containerWidget->setAutoFillBackground(true);
    m_containerWidget->setPalette(pal);
}

LLMChatWidget::~LLMChatWidget() = default;

void LLMChatWidget::appendUserMessage(const QString& message)
{
    appendMessage(message, MessageRole::User);
}

void LLMChatWidget::appendAssistantMessage(const QString& message)
{
    appendMessage(message, MessageRole::Assistant);
}

void LLMChatWidget::appendSystemMessage(const QString& message)
{
    appendMessage(message, MessageRole::System);
}

void LLMChatWidget::clearMessages()
{
    // Remove all message widgets, keeping the stretch at the end
    QLayoutItem* item;
    while ((item = m_layout->takeAt(0)) != nullptr) {
        if (item->widget()) {
            delete item->widget();
        }
        delete item;
    }
    m_layout->addStretch();  // Re-add the stretch
}

void LLMChatWidget::scrollToBottom()
{
    QScrollBar* vBar = verticalScrollBar();
    if (vBar) {
        vBar->setValue(vBar->maximum());
    }
}

void LLMChatWidget::resizeEvent(QResizeEvent* event)
{
    QScrollArea::resizeEvent(event);
    // Scroll to bottom on resize if enabled
    if (m_scrollingEnabled) {
        scrollToBottom();
    }
}

void LLMChatWidget::appendMessage(const QString& message, MessageRole role)
{
    QWidget* messageWidget = createMessageLabel(message, role);
    
    // Insert before the stretch (last item)
    m_layout->insertWidget(m_layout->count() - 1, messageWidget);
    
    // Scroll to bottom to show new message
    if (m_scrollingEnabled) {
        scrollToBottom();
    }
}

QWidget* LLMChatWidget::createMessageLabel(const QString& message, MessageRole role)
{
    auto* container = new QWidget();
    auto* layout = new QHBoxLayout(container);
    layout->setContentsMargins(4, 4, 4, 4);
    
    auto* label = new QLabel(message);
    label->setWordWrap(true);
    label->setTextInteractionFlags(Qt::TextSelectableByMouse | Qt::TextSelectableByKeyboard);
    
    // Apply styling based on role
    QColor bgColor = getBackgroundColor(role);
    QPalette pal = label->palette();
    pal.setColor(QPalette::Base, bgColor);
    pal.setColor(QPalette::Window, bgColor);
    label->setAutoFillBackground(true);
    label->setPalette(pal);
    
    // Set alignment
    Qt::Alignment alignment = getTextAlignment(role);
    label->setAlignment(alignment);
    
    // Add some padding
    label->setContentsMargins(8, 6, 8, 6);
    label->setStyleSheet(
        "QLabel { "
        "  border-radius: 8px; "
        "  padding: 6px 10px; "
        "  background-color: " + bgColor.name() + "; "
        "}"
    );
    
    layout->addWidget(label);
    
    // Set layout alignment based on role
    if (role == MessageRole::User) {
        layout->setDirection(QBoxLayout::RightToLeft);
    }
    else {
        layout->setDirection(QBoxLayout::LeftToRight);
    }
    
    container->setLayout(layout);
    return container;
}

QColor LLMChatWidget::getBackgroundColor(MessageRole role) const
{
    switch (role) {
        case MessageRole::User:
            // Light blue for user messages
            return QColor(200, 230, 255);
        case MessageRole::Assistant:
            // Light gray for assistant messages
            return QColor(240, 240, 240);
        case MessageRole::System:
            // Light yellow for system messages
            return QColor(255, 250, 200);
    }
    return QColor(240, 240, 240);  // Default
}

Qt::Alignment LLMChatWidget::getTextAlignment(MessageRole role) const
{
    switch (role) {
        case MessageRole::User:
            return Qt::AlignRight | Qt::AlignVCenter;
        case MessageRole::Assistant:
            return Qt::AlignLeft | Qt::AlignVCenter;
        case MessageRole::System:
            return Qt::AlignCenter;
    }
    return Qt::AlignLeft | Qt::AlignVCenter;  // Default
}

#include "moc_LLMChatWidget.cpp"
