import type { Message } from '../types/chat';
import { MessageBubble } from './MessageBubble';
import './MessageList.css';

interface MessageListProps {
  messages: Message[];
  showTimestamps: boolean;
  copiedIndex: number | null;
  isLoading: boolean;
  onCopy: (text: string, index: number) => void;
}

export const MessageList = ({ messages, showTimestamps, copiedIndex, isLoading, onCopy }: MessageListProps) => (
  <div className="message-list">
    {messages.map((msg, idx) => (
      <MessageBubble key={msg.id || idx} message={msg} index={idx} showTimestamps={showTimestamps} copiedIndex={copiedIndex} onCopy={onCopy} />
    ))}
    {isLoading && (
      <div className="message-bubble bot typing-indicator-container">
        <div className="message-content">
          <div className="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <div className="typing-text">AI is thinking...</div>
        </div>
      </div>
    )}
  </div>
);

