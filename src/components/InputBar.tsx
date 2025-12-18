import { useRef, useEffect } from 'react';
import { FiSend } from 'react-icons/fi';
import './InputBar.css';

interface InputBarProps {
  input: string;
  isLoading: boolean;
  onInputChange: (value: string) => void;
  onSend: () => void;
}

export const InputBar = ({ input, isLoading, onInputChange, onSend }: InputBarProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  }, [input]);

  return (
    <div className="input-bar">
      <textarea
        ref={textareaRef}
        placeholder="Type your message..."
        value={input}
        onChange={(e) => onInputChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), onSend())}
        disabled={isLoading}
        className="input-field"
        rows={1}
        aria-label="Message input"
      />
      <button onClick={onSend} disabled={isLoading || !input.trim()} className="send-button" aria-label="Send message">
        {isLoading ? <span className="input-spinner"></span> : <FiSend size={22} />}
      </button>
    </div>
  );
};

