import React, { useState, useRef, useEffect } from 'react';
import { marked } from 'marked';
import './deepseak.css';
import { FiMenu, FiSun, FiMoon, FiSettings, FiSend, FiPlus, FiX } from 'react-icons/fi';
import type { Message, Conversation, ChatSettings } from '../types/chat';
import { 
  markdownToPlainText, 
  detectTaskType, 
  getModelForTask, 
  retryWithBackoff,
  generateConversationId,
  generateMessageId,
  saveConversation,
  getConversations,
  deleteConversation,
  getChatSettings,
  saveChatSettings,
  formatTimestamp,
  generateConversationTitle,
  exportConversation,
  copyToClipboard
} from '../utils/chatUtils';

const Deepseek = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [settings, setSettings] = useState<ChatSettings>(getChatSettings());
  const [showSidebar, setShowSidebar] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  
  const chatAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Load conversations on mount
  useEffect(() => {
    const savedConversations = getConversations();
    setConversations(savedConversations);
    
    if (savedConversations.length > 0) {
      setCurrentConversation(savedConversations[0]);
      setMessages(savedConversations[0].messages);
    } else {
      startNewConversation();
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (chatAreaRef.current && settings.autoScroll) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [messages, settings.autoScroll]);

  // Save settings when changed
  useEffect(() => {
    saveChatSettings(settings);
  }, [settings]);

  // Update document theme attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme);
  }, [settings.theme]);

  // Handle click outside to close panels
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      // Close sidebar if clicking outside
      if (showSidebar && sidebarRef.current && !sidebarRef.current.contains(target)) {
        setShowSidebar(false);
      }
      
      // Close settings if clicking outside
      if (showSettings && settingsRef.current && !settingsRef.current.contains(target)) {
        setShowSettings(false);
      }
    };

    // Add event listener if any panel is open
    if (showSidebar || showSettings) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSidebar, showSettings]);

  // Handle escape key to close panels
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowSidebar(false);
        setShowSettings(false);
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, []);

  const startNewConversation = () => {
    const newConversation: Conversation = {
      id: generateConversationId(),
      title: 'New Conversation',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setCurrentConversation(newConversation);
    setMessages([]);
    setConversations(prev => [newConversation, ...prev]);
  };

  const loadConversation = (conversation: Conversation) => {
    setCurrentConversation(conversation);
    setMessages(conversation.messages);
    setShowSidebar(false);
  };

  const deleteCurrentConversation = () => {
    if (!currentConversation) return;
    
    deleteConversation(currentConversation.id);
    setConversations(prev => prev.filter(c => c.id !== currentConversation.id));
    
    if (conversations.length > 1) {
      const nextConversation = conversations.find(c => c.id !== currentConversation.id);
      if (nextConversation) {
        loadConversation(nextConversation);
      }
    } else {
      startNewConversation();
    }
  };

  const handleCopyMessage = async (text: string, idx: number) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 1200);
    }
  };

  const exportCurrentConversation = () => {
    if (!currentConversation) return;
    
    const updatedConversation = {
      ...currentConversation,
      messages,
      updatedAt: new Date()
    };
    
    const dataStr = exportConversation(updatedConversation);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `conversation-${currentConversation.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  async function sendMessage() {
    if (!input.trim() || isLoading) return;
    
    const userMessage: Message = {
      id: generateMessageId(),
      sender: 'user',
      content: input.trim(),
      timestamp: new Date(),
      status: 'sending'
    };
    
    setInput('');
    setIsLoading(true);
    setMessages(msgs => [...msgs, userMessage]);

    try {
      const taskType = detectTaskType(userMessage.content);
      const selectedModel = getModelForTask(taskType);
      
      const makeRequest = async () => {
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
              { "role": "user", "content": userMessage.content }
            ],
            "temperature": taskType === 'coding' ? 0.3 : taskType === 'research' ? 0.5 : 0.7,
            "max_tokens": taskType === 'coding' ? 1000 : taskType === 'research' ? 800 : 500,
            "presence_penalty": 0.1,
            "frequency_penalty": 0.1,
            "top_p": 0.95
          })
        });

        if (!response.ok) {
          const error = new Error(`HTTP error! status: ${response.status}`);
          (error as any).status = response.status;
          throw error;
        }

        return response;
      };

      const response = await retryWithBackoff(makeRequest);
      const data = await response.json();
      const markdownText = data.choices[0]?.message?.content || 'No response from the model';
      
      const updatedBotMessage: Message = {
        id: generateMessageId(),
        sender: 'bot',
        content: markdownText,
        model: selectedModel,
        timestamp: new Date(),
        status: 'sent'
      };
      
      setMessages(msgs => [
        ...msgs,
        updatedBotMessage
      ]);
      
      // Update conversation
      if (currentConversation) {
        const updatedConversation = {
          ...currentConversation,
          title: currentConversation.messages.length === 0 
            ? generateConversationTitle(userMessage.content)
            : currentConversation.title,
          messages: [...messages, userMessage, updatedBotMessage],
          updatedAt: new Date()
        };
        
        setCurrentConversation(updatedConversation);
        saveConversation(updatedConversation);
        setConversations(prev => 
          prev.map(c => c.id === updatedConversation.id ? updatedConversation : c)
        );
      }
      
    } catch (error: any) {
      console.error('Error details:', error);
      let errorMessage = 'An error occurred. Please try again later.';
      
      if (error.status === 429) {
        errorMessage = 'Rate limit exceeded. Please wait a moment before trying again.';
      } else if (error.message.includes('API key')) {
        errorMessage = 'API key error. Please check your configuration.';
      }
      
      const errorBotMessage: Message = {
        id: generateMessageId(),
        sender: 'bot',
        content: errorMessage,
        timestamp: new Date(),
        status: 'error'
      };
      
      setMessages(msgs => [
        ...msgs,
        errorBotMessage
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const toggleTheme = () => {
    setSettings(prev => ({
      ...prev,
      theme: prev.theme === 'light' ? 'dark' : 'light'
    }));
  };

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };

  return (
    <div className={`container ${settings.theme}`}>
      {/* Header */}
      <div className="header">
        <button 
          className="sidebar-toggle"
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
        >
          <FiMenu size={24} color={settings.theme === 'dark' ? '#fff' : undefined} />
        </button>
        <h1 className="app-title">AI Chat Assistant</h1>
        <div className="header-actions">
          <button 
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {settings.theme === 'light' 
              ? <FiMoon size={22} color={undefined} /> 
              : <FiSun size={22} color="#fff" />}
          </button>
          <button 
            className="settings-toggle"
            onClick={toggleSettings}
            aria-label="Settings"
          >
            <FiSettings size={22} color={settings.theme === 'dark' ? '#fff' : undefined} />
          </button>
        </div>
      </div>

      {/* Backdrop for sidebar */}
      {showSidebar && (
        <div className="backdrop" onClick={() => setShowSidebar(false)} />
      )}

      {/* Sidebar */}
      {showSidebar && (
        <div className="sidebar open" ref={sidebarRef}>
          <div className="sidebar-header">
            <div className="sidebar-header-top">
              <h3>Conversations</h3>
              <button 
                className="close-button"
                onClick={() => setShowSidebar(false)}
                aria-label="Close sidebar"
              >
                ×
              </button>
            </div>
            <button 
              className="new-chat-btn"
              onClick={startNewConversation}
            >
              <FiPlus size={20} color={settings.theme === 'dark' ? '#fff' : undefined} /> New Chat
            </button>
          </div>
          <div className="conversations-list">
            {conversations.map(conv => (
              <div 
                key={conv.id}
                className={`conversation-item ${currentConversation?.id === conv.id ? 'active' : ''}`}
                onClick={() => loadConversation(conv)}
              >
                <div className="conversation-content">
                  <div className="conversation-title">{conv.title}</div>
                  <div className="conversation-date">
                    {formatTimestamp(conv.updatedAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
 
      {/* Backdrop for settings */}
      {showSettings && (
        <div className="backdrop" onClick={() => setShowSettings(false)} />
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="settings-panel open" ref={settingsRef}>
          <div className="settings-header">
            <h3>Settings</h3>
            <button 
              className="close-button"
              onClick={() => setShowSettings(false)}
              aria-label="Close settings"
            >
              ×
            </button>
          </div>
          <div className="settings-content">
            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={settings.autoScroll}
                  onChange={(e) => setSettings(prev => ({ ...prev, autoScroll: e.target.checked }))}
                />
                Auto-scroll to bottom
              </label>
            </div>
            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={settings.showTimestamps}
                  onChange={(e) => setSettings(prev => ({ ...prev, showTimestamps: e.target.checked }))}
                />
                Show timestamps
              </label>
            </div>
            <div className="setting-actions">
              <button onClick={exportCurrentConversation}>Export Chat</button>
              <button onClick={deleteCurrentConversation} className="danger">Delete Chat</button>
            </div>
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="chat-container">
        <div className="chat-area" ref={chatAreaRef}>
          {messages.map((msg, idx) => (
            <div key={msg.id || idx} className={`message ${msg.sender}`}>
              <div className="message-content">
                {msg.sender === 'bot' ? (
                  <>
                    <div dangerouslySetInnerHTML={{ __html: marked.parse(msg.content, { async: false }) }} />
                    {settings.showTimestamps && msg.timestamp && (
                      <div className="message-timestamp">
                        {formatTimestamp(msg.timestamp)}
                      </div>
                    )}
                    <button
                      className="copy-button"
                      onClick={() => handleCopyMessage(markdownToPlainText(msg.content), idx)}
                      title="Copy to clipboard"
                    >
                      {copiedIdx === idx ? 'Copied!' : 'Copy'}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="user-message-text">{msg.content}</div>
                    {settings.showTimestamps && msg.timestamp && (
                      <div className="message-timestamp">
                        {formatTimestamp(msg.timestamp)}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="input-area">
          <input
            ref={inputRef}
            type="text"
            placeholder="Type your message..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleInputKeyDown}
            disabled={isLoading}
          />
          <button 
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="send-button"
          >
            {isLoading ? (
              <span className="input-spinner"></span>
            ) : (
              <FiSend size={22} color="#fff" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Deepseek; 