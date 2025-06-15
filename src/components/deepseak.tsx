import React, { useState, useRef, useEffect } from 'react';
import { marked } from 'marked';
import './deepseak.css';

interface Message {
  sender: 'user' | 'bot';
  content: string;
  model?: string;
} 

const markdownCache = new Map<string, string>();

function markdownToPlainText(markdown: string): string {
  if (markdownCache.has(markdown)) {
    return markdownCache.get(markdown)!;
  }

  const html = marked.parse(markdown, { async: false });
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  const result = tempDiv.textContent || tempDiv.innerText || '';
  
  markdownCache.set(markdown, result);
  return result;
}

const codingKeywords = new Set([
  'code', 'function', 'class', 'variable', 'loop', 'array', 'object',
  'method', 'api', 'database', 'server', 'client', 'frontend', 'backend',
  'algorithm', 'debug', 'error', 'exception', 'compile', 'runtime',
  'javascript', 'python', 'java', 'typescript', 'react', 'node',
  'write', 'create', 'implement', 'develop', 'program', 'script',
  'def', 'import', 'print', 'return', 'if', 'else', 'for', 'while'
]);

const researchKeywords = new Set([
  'research', 'study', 'analysis', 'investigate', 'explore', 'examine',
  'compare', 'contrast', 'evaluate', 'assess', 'review', 'literature',
  'methodology', 'findings', 'conclusion', 'hypothesis', 'theory',
  'data', 'statistics', 'survey', 'experiment', 'observation'
]);

const detectTaskType = (message: string): 'coding' | 'research' | 'general' => {
  const words = message.toLowerCase().split(/\s+/);
  let codingScore = 0;
  let researchScore = 0;

  // Check for explicit coding requests
  if (message.toLowerCase().includes('write code') || 
      message.toLowerCase().includes('create code') ||
      message.toLowerCase().includes('implement') ||
      message.toLowerCase().includes('program')) {
    return 'coding';
  }

  // Single pass through words
  for (const word of words) {
    if (codingKeywords.has(word)) codingScore++;
    if (researchKeywords.has(word)) researchScore++;
  }

  if (codingScore > researchScore) return 'coding';
  if (researchScore > codingScore) return 'research';
  return 'general';
};

const getModelForTask = (taskType: 'coding' | 'research' | 'general'): string => {
  switch (taskType) {
    case 'coding':
      // Deepseek is better for code generation and technical tasks
      return "deepseek/deepseek-r1-0528:free";
    case 'research':
      // Llama 4 Maverick is better for research and analytical tasks
      return "meta-llama/llama-4-maverick:free";
    default:
      // Mistral is good for general conversation and balanced responses
      return "mistralai/mistral-7b-instruct:free";
  }
};

const modelDisplayNames = new Map([
  ["deepseek/deepseek-r1-0528:free", "Deepseek"],
  ["meta-llama/llama-4-maverick:free", "Llama 4 Maverick"],
  ["mistralai/mistral-7b-instruct:free", "Mistral"]
]);

const getModelDisplayName = (modelId: string): string => {
  return modelDisplayNames.get(modelId) || modelId;
};

const Deepseek = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const chatAreaRef = useRef<HTMLDivElement>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Add welcome message on component mount
  useEffect(() => {
    const welcomeMessage = {
      sender: 'bot' as const,
      content: `👋 Please use English for the best results. I can help you with simple coding, research, and general questions!`,
      model: "mistralai/mistral-7b-instruct:free"
    };
    setMessages([welcomeMessage]);
  }, []);

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
    if (!input.trim() || isLoading) return;
    
    const userMessage = input;
    setInput('');
    setIsLoading(true);
    
    setMessages(msgs => [...msgs, { sender: 'user', content: userMessage }]);
    setMessages(msgs => [...msgs, { sender: 'bot', content: 'Thinking...' }]);
    
    try {
      const taskType = detectTaskType(userMessage);
      const selectedModel = getModelForTask(taskType);
      
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${import.meta.env.VITE_API_KEY}`,
          "HTTP-Referer": "<YOUR_SITE_URL>",
          "X-Title": "<YOUR_SITE_NAME>",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "model": selectedModel,
          "messages": [
            {
              "role": "system",
              "content": taskType === 'coding' 
                ? "You are a helpful programming assistant. Provide clear, well-documented code examples with explanations."
                : taskType === 'research'
                ? "You are a research assistant. Provide detailed, well-researched responses with citations and explanations."
                : "You are a helpful assistant. Provide clear and concise responses."
            },
            { "role": "user", "content": userMessage }
          ],
          "temperature": taskType === 'coding' ? 0.3 : taskType === 'research' ? 0.5 : 0.7,
          "max_tokens": taskType === 'coding' ? 1000 : taskType === 'research' ? 800 : 500,
          "presence_penalty": 0.1,
          "frequency_penalty": 0.1,
          "top_p": 0.95
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const markdownText = data.choices[0]?.message?.content || 'No response from the model';
      
      setMessages(msgs => [
        ...msgs.slice(0, -1),
        { 
          sender: 'bot', 
          content: markdownText,
          model: selectedModel
        }
      ]);
    } catch (error: any) {
      console.error('Error details:', error);
      setMessages(msgs => [
        ...msgs.slice(0, -1),
        { 
          sender: 'bot', 
          content: `Error: ${error.message}. Please try rephrasing your request or try again later.`
        }
      ]);
    } finally {
      setIsLoading(false);
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
                  <div style={{ 
                    fontSize: '0.8em', 
                    color: '#666', 
                    marginTop: '8px', 
                    fontStyle: 'italic',
                    textAlign: 'right'
                  }}>
                    Powered by {getModelDisplayName(msg.model || "deepseek/deepseek-r1-0528:free")}
                  </div>
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