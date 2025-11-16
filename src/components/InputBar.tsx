import { useRef, useEffect } from 'react';
import { FiSend } from 'react-icons/fi';
import './InputBar.css';

interface InputBarProps {
  input: string;
  isLoading: boolean;
  onInputChange: (value: string) => void;
  onSend: () => void;
}

export const InputBar: React.FC<InputBarProps> = ({
  input,
  isLoading,
  onInputChange,
  onSend,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Auto-focus textarea on mount
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 120; // Max 5 lines approx
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onInputChange(e.target.value);
  };

  return (
    <div className="input-bar">
      <textarea
        ref={textareaRef}
        placeholder="Type your message..."
        value={input}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={isLoading}
        className="input-field"
        rows={1}
        aria-label="Message input"
      />
      <button
        onClick={onSend}
        disabled={isLoading || !input.trim()}
        className="send-button"
        aria-label="Send message"
      >
        {isLoading ? (
          <span className="input-spinner"></span>
        ) : (
          <FiSend size={22} />
        )}
      </button>
    </div>
  );
};

