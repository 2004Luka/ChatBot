import { useState, useRef, useEffect } from 'react';
import type { Message, Conversation, ChatSettings } from '../types/chat';
import {
  LLAMA_MODEL,
  generateConversationId,
  generateMessageId,
  saveConversation,
  getConversations,
  deleteConversation,
  getChatSettings,
  saveChatSettings,
  generateConversationTitle,
  exportConversation,
  copyToClipboard,
} from '../utils/chatUtils';
import { Header } from './Header';
import { MessageList } from './MessageList';
import { InputBar } from './InputBar';
import { Sidebar } from './Sidebar';
import { SettingsPanel } from './SettingsPanel';
import { NotificationBanner } from './NotificationBanner';
import './deepseak.css';

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
  const [showNotification, setShowNotification] = useState(false);

  const chatAreaRef = useRef<HTMLDivElement>(null);
  const lastRequestTime = useRef<number>(0);
  const REQUEST_COOLDOWN = 2000; // 2 seconds between requests to respect rate limits

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

    // Show notification after a delay
    const notificationTimer = setTimeout(() => {
      setShowNotification(true);
    }, 1500);

    return () => {
      clearTimeout(notificationTimer);
    };
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
      updatedAt: new Date(),
    };
    setCurrentConversation(newConversation);
    setMessages([]);
    setConversations((prev) => [newConversation, ...prev]);
  };

  const loadConversation = (conversation: Conversation) => {
    setCurrentConversation(conversation);
    setMessages(conversation.messages);
    setShowSidebar(false);
  };

  const deleteConversationById = (conversationId: string) => {
    deleteConversation(conversationId);
    setConversations((prev) => {
      const filtered = prev.filter((c) => c.id !== conversationId);
      if (currentConversation?.id === conversationId) {
        setTimeout(() => filtered.length > 0 ? loadConversation(filtered[0]) : startNewConversation(), 0);
      }
      return filtered;
    });
  };

  const deleteCurrentConversation = () => {
    if (!currentConversation) return;
    deleteConversationById(currentConversation.id);
    setShowSettings(false);
  };

  const handleCopyMessage = async (text: string, idx: number) => {
    if (await copyToClipboard(text)) {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 1200);
    }
  };

  const exportCurrentConversation = () => {
    if (!currentConversation) return;
    const blob = new Blob([exportConversation({ ...currentConversation, messages, updatedAt: new Date() })], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `conversation-${currentConversation.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const now = Date.now();
    if (now - lastRequestTime.current < REQUEST_COOLDOWN) {
      alert(`Please wait ${Math.ceil((REQUEST_COOLDOWN - (now - lastRequestTime.current)) / 1000)} second(s) before sending another message.`);
      return;
    }
    lastRequestTime.current = now;

    const userMessage: Message = {
      id: generateMessageId(),
      sender: 'user',
      content: input.trim(),
      timestamp: new Date(),
      status: 'sending',
    };

    setInput('');
    setIsLoading(true);
    setMessages((msgs) => [...msgs, userMessage]);

    try {
      const apiKey = import.meta.env.VITE_API_KEY;
      if (!apiKey) throw new Error('API key is not set. Please add VITE_API_KEY to your .env file');

      const conversationHistory = messages.slice(-10)
        .filter((msg) => msg.content?.trim())
        .map((msg) => ({ role: msg.sender === 'user' ? 'user' : 'assistant' as const, content: msg.content }));

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: LLAMA_MODEL,
          messages: [{ role: "system", content: "You are a helpful assistant." }, ...conversationHistory, { role: "user", content: userMessage.content }],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP error: ${response.status}`);
      }

      const data = await response.json();
      const botMessage: Message = {
        id: generateMessageId(),
        sender: 'bot',
        content: data.choices?.[0]?.message?.content || 'No response',
        timestamp: new Date(),
        status: 'sent',
      };

      setMessages((msgs) => [...msgs, botMessage]);

      if (currentConversation) {
        const updatedConversation = {
          ...currentConversation,
          title: currentConversation.messages.length === 0 ? generateConversationTitle(userMessage.content) : currentConversation.title,
          messages: [...messages, userMessage, botMessage],
          updatedAt: new Date(),
        };
        setCurrentConversation(updatedConversation);
        saveConversation(updatedConversation);
        setConversations((prev) => prev.map((c) => (c.id === updatedConversation.id ? updatedConversation : c)));
      }
    } catch (error: any) {
      console.error('Error:', error);
      const errorMessages: Record<number, string> = {
        429: 'Rate limit exceeded. Please wait a moment before trying again.',
        401: 'Invalid API key. Please check your VITE_API_KEY in .env file.',
        400: error.message || 'Invalid request. Please check your API key.',
      };
      const errorMessage = errorMessages[error.status] || error.message || 'An error occurred. Please try again later.';
      setMessages((msgs) => [...msgs, {
        id: generateMessageId(),
        sender: 'bot',
        content: errorMessage,
        timestamp: new Date(),
        status: 'error',
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = () => setSettings((prev) => ({ ...prev, theme: prev.theme === 'light' ? 'dark' : 'light' }));

  return (
    <div className="chat-app-container">
      <NotificationBanner
        isVisible={showNotification}
        onClose={() => setShowNotification(false)}
        autoHideDelay={5000}
      />

      <Header
        settings={settings}
        onToggleSidebar={() => setShowSidebar(!showSidebar)}
        onToggleTheme={toggleTheme}
        onToggleSettings={() => setShowSettings(!showSettings)}
      />

      <Sidebar
        isOpen={showSidebar}
        conversations={conversations}
        currentConversationId={currentConversation?.id || null}
        onClose={() => setShowSidebar(false)}
        onNewConversation={startNewConversation}
        onSelectConversation={loadConversation}
        onDeleteConversation={deleteConversationById}
      />

      <SettingsPanel
        isOpen={showSettings}
        settings={settings}
        onClose={() => setShowSettings(false)}
        onSettingsChange={setSettings}
        onExport={exportCurrentConversation}
        onDelete={deleteCurrentConversation}
      />

      <div className="chat-main-container">
        <div className="chat-area-wrapper">
          <div className="chat-area" ref={chatAreaRef}>
            <MessageList
              messages={messages}
              showTimestamps={settings.showTimestamps}
              copiedIndex={copiedIdx}
              isLoading={isLoading}
              onCopy={handleCopyMessage}
            />
          </div>
        </div>

        <InputBar
          input={input}
          isLoading={isLoading}
          onInputChange={setInput}
          onSend={sendMessage}
        />
      </div>
    </div>
  );
};

export default Deepseek;
