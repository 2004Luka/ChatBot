import React, { useState, useRef, useEffect } from 'react';
import { marked } from 'marked';
import './deepseak.css';

interface Message {
  sender: 'user' | 'bot';
  content: string;
} 

function markdownToPlainText(markdown: string): string {
  const html = marked.parse(markdown, { async: false });
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  return tempDiv.textContent || tempDiv.innerText || '';
}

const Deepseek = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const chatAreaRef = useRef<HTMLDivElement>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const copyToClipboard = async (text: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 1200);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  async function sendMessage() {
    if (!input.trim()) return;
    const userMessage = input;
    setMessages((msgs) => [...msgs, { sender: 'user', content: userMessage }]);
    setInput('');
    setMessages((msgs) => [...msgs, { sender: 'bot', content: 'Thinking...' }]);
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${import.meta.env.VITE_API_KEY}`,
          "HTTP-Referer": "<YOUR_SITE_URL>",
          "X-Title": "<YOUR_SITE_NAME>",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "model": "deepseek/deepseek-r1-0528:free",
          "messages": [{ "role": "user", "content": userMessage }]
        })
      });
      const data = await response.json();
      const markdownText = data.choices[0]?.message?.content || 'No response from the model';
      setMessages((msgs) => [
        ...msgs.slice(0, -1), // Remove 'Thinking...'
        { sender: 'bot', content: markdownText }
      ]);
    } catch (error: any) {
      setMessages((msgs) => [
        ...msgs.slice(0, -1),
        { sender: 'bot', content: 'Error: ' + error.message }
      ]);
    }
  }

  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      sendMessage();
    }
  }

  return (
    <div className="container">
      <div className="chat-area" ref={chatAreaRef} id="chat-area">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.sender}`}>
            <div className="message-content">
              {msg.sender === 'bot' ? (
                <>
                  <div dangerouslySetInnerHTML={{ __html: marked.parse(msg.content, { async: false }) }} />
                  <button
                    className="copy-button"
                    onClick={() => copyToClipboard(markdownToPlainText(msg.content), idx)}
                    style={{ position: 'absolute', top: 8, right: 8, zIndex: 10 }}
                    title="Copy to clipboard"
                  >
                    {copiedIdx === idx ? 'Copied!' : 'Copy'}
                  </button>
                </>
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="input-area">
        <input
          id="input"
          type="text"
          placeholder="Type your message..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleInputKeyDown}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default Deepseek; 