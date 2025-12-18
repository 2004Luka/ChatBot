import { useState } from 'react';
import { FiPlus, FiTrash2, FiMessageCircle, FiX } from 'react-icons/fi';
import type { Conversation } from '../types/chat';
import { groupConversationsByDate, getConversationPreview, formatRelativeDate } from '../utils/chatUtils';
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

export const Sidebar = ({ isOpen, conversations, currentConversationId, onClose, onNewConversation, onSelectConversation, onDeleteConversation }: SidebarProps) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const groupedConversations = groupConversationsByDate([...conversations].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()));

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (deletingId === id) {
      onDeleteConversation?.(id);
      setDeletingId(null);
    } else {
      setDeletingId(id);
      setTimeout(() => setDeletingId(null), 3000);
    }
  };

  const handleItemClick = (conv: Conversation) => {
    deletingId === conv.id ? setDeletingId(null) : onSelectConversation(conv);
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
                  const isHovered = hoveredId === conv.id;
                  const isDeleting = deletingId === conv.id;
                  const preview = getConversationPreview(conv);

                  return (
                    <div
                      key={conv.id}
                      className={`conversation-item ${isActive ? 'active' : ''} ${isDeleting ? 'deleting' : ''}`}
                      onClick={() => handleItemClick(conv)}
                      onMouseEnter={() => setHoveredId(conv.id)}
                      onMouseLeave={() => setHoveredId(null)}
                    >
                      <div className="conversation-icon">
                        <FiMessageCircle size={16} />
                      </div>
                      <div className="conversation-content">
                        <div className="conversation-header">
                          <div className="conversation-title">{conv.title}</div>
                          {conv.messages.length > 0 && <span className="conversation-badge">{conv.messages.length}</span>}
                        </div>
                        {preview && <div className="conversation-preview">{preview}</div>}
                        <div className="conversation-footer">
                          <div className="conversation-date">{formatRelativeDate(conv.updatedAt)}</div>
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

