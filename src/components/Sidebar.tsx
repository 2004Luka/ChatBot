import React, { useState } from 'react';
import { FiPlus, FiTrash2, FiMessageCircle, FiX } from 'react-icons/fi';
import type { Conversation } from '../types/chat';
import {
  groupConversationsByDate,
  getConversationPreview,
  formatRelativeDate,
} from '../utils/chatUtils';
import './Sidebar.css';

interface SidebarProps {
  isOpen: boolean;
  conversations: Conversation[];
  currentConversationId: string | null;
  onClose: () => void;
  onNewConversation: () => void;
  onSelectConversation: (conversation: Conversation) => void;
  onDeleteConversation?: (conversationId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  conversations,
  currentConversationId,
  onClose,
  onNewConversation,
  onSelectConversation,
  onDeleteConversation,
}) => {
  const [hoveredConversationId, setHoveredConversationId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const groupedConversations = groupConversationsByDate(
    conversations.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
  );

  const handleDeleteClick = (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    if (deletingId === conversationId) {
      if (onDeleteConversation) {
        onDeleteConversation(conversationId);
      }
      setDeletingId(null);
    } else {
      setDeletingId(conversationId);
      setTimeout(() => {
        setDeletingId(null);
      }, 3000);
    }
  };

  const handleItemClick = (conv: Conversation) => {
    if (deletingId === conv.id) {
      // If deleting, cancel deletion on click
      setDeletingId(null);
    } else {
      onSelectConversation(conv);
    }
  };

  return (
    <>
      {isOpen && <div className="sidebar-backdrop" onClick={onClose} />}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-header-top">
            <h3>Conversations</h3>
            <button
              className="close-button"
              onClick={onClose}
              aria-label="Close sidebar"
            >
              ×
            </button>
          </div>
          <button className="new-chat-btn" onClick={onNewConversation}>
            <FiPlus size={20} />
            New Chat
          </button>
        </div>
        <div className="conversations-list">
          {conversations.length === 0 ? (
            <div className="empty-state">
              <FiMessageCircle size={48} className="empty-state-icon" />
              <p className="empty-state-title">No conversations yet</p>
              <p className="empty-state-subtitle">Start a new chat to begin</p>
            </div>
          ) : (
            groupedConversations.map(({ group, conversations: groupConvs }) => (
              <div key={group} className="conversation-group">
                <div className="conversation-group-header">
                  <span className="group-label">{group}</span>
                  <span className="group-count">{groupConvs.length}</span>
                </div>
                {groupConvs.map((conv) => {
                  const isActive = currentConversationId === conv.id;
                  const isHovered = hoveredConversationId === conv.id;
                  const isDeleting = deletingId === conv.id;
                  const messageCount = conv.messages.length;
                  const preview = getConversationPreview(conv);

                  return (
                    <div
                      key={conv.id}
                      className={`conversation-item ${
                        isActive ? 'active' : ''
                      } ${isDeleting ? 'deleting' : ''}`}
                      onClick={() => handleItemClick(conv)}
                      onMouseEnter={() => setHoveredConversationId(conv.id)}
                      onMouseLeave={() => setHoveredConversationId(null)}
                    >
                      <div className="conversation-icon">
                        <FiMessageCircle size={16} />
                      </div>
                      <div className="conversation-content">
                        <div className="conversation-header">
                          <div className="conversation-title">{conv.title}</div>
                          {messageCount > 0 && (
                            <span className="conversation-badge">
                              {messageCount}
                            </span>
                          )}
                        </div>
                        {preview && (
                          <div className="conversation-preview">{preview}</div>
                        )}
                        <div className="conversation-footer">
                          <div className="conversation-date">
                            {formatRelativeDate(conv.updatedAt)}
                          </div>
                        </div>
                      </div>
                      {onDeleteConversation && (
                        <button
                          className={`delete-button ${isHovered || isDeleting ? 'visible' : ''} ${isDeleting ? 'confirm' : ''}`}
                          onClick={(e) => handleDeleteClick(e, conv.id)}
                          aria-label={isDeleting ? 'Confirm delete' : 'Delete conversation'}
                          title={isDeleting ? 'Click again to confirm' : 'Delete conversation'}
                        >
                          {isDeleting ? <FiX size={14} /> : <FiTrash2 size={14} />}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </aside>
    </>
  );
};

