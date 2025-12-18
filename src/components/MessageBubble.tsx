import { marked } from 'marked';
import type { Message } from '../types/chat';
import { markdownToPlainText, formatTimestamp } from '../utils/chatUtils';
import './MessageBubble.css';

interface MessageBubbleProps {
  message: Message;
  index: number;
  showTimestamps: boolean;
  copiedIndex: number | null;
  onCopy: (text: string, index: number) => void;
}

export const MessageBubble = ({ message, index, showTimestamps, copiedIndex, onCopy }: MessageBubbleProps) => {
  const isUser = message.sender === 'user';
  const showTimestamp = showTimestamps && message.timestamp;

  return (
    <div className={`message-bubble ${isUser ? 'user' : 'bot'}`}>
      <div className="message-content">
        {isUser ? (
          <>
            <div className="user-message-text">{message.content}</div>
            {showTimestamp && <div className="message-timestamp">{formatTimestamp(message.timestamp)}</div>}
          </>
        ) : (
          <>
            <div className="bot-message-text" dangerouslySetInnerHTML={{ __html: marked.parse(message.content, { async: false }) }} />
            {showTimestamp && <div className="message-timestamp">{formatTimestamp(message.timestamp)}</div>}
            <button className="copy-button" onClick={() => onCopy(markdownToPlainText(message.content), index)} title="Copy to clipboard" aria-label="Copy message">
              {copiedIndex === index ? 'Copied!' : 'Copy'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

