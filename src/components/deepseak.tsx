import { useState, useRef, useEffect } from 'react';
import type { Message, Conversation, ChatSettings } from '../types/chat';
import {
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
      
      // If the deleted conversation was the current one, load another or start new
      if (currentConversation?.id === conversationId) {
        if (filtered.length > 0) {
          // Use setTimeout to ensure state update happens after this one
          setTimeout(() => {
            loadConversation(filtered[0]);
          }, 0);
        } else {
          setTimeout(() => {
            startNewConversation();
          }, 0);
        }
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
      updatedAt: new Date(),
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

    // Throttle requests to prevent rate limit issues (2 seconds between requests)
    const now = Date.now();
    if (now - lastRequestTime.current < REQUEST_COOLDOWN) {
      const waitTime = Math.ceil((REQUEST_COOLDOWN - (now - lastRequestTime.current)) / 1000);
      alert(`Please wait ${waitTime} second(s) before sending another message to avoid rate limits.`);
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
      const taskType = detectTaskType(userMessage.content);
      const selectedModel = getModelForTask(taskType);
      const apiKey = import.meta.env.VITE_API_KEY;

      if (!apiKey) {
        throw new Error('API key is not set. Please add VITE_API_KEY to your .env file');
      }

      // Build system instruction based on task type
      const systemInstruction =
        taskType === 'coding'
          ? 'You are a helpful programming assistant. Provide clear, well-documented code examples with explanations.'
          : taskType === 'research'
          ? 'You are a research assistant. Provide detailed, well-researched responses with citations and explanations.'
          : 'You are a helpful assistant. Provide clear and concise responses.';

      // Get conversation history for context (limit to last 5 message pairs to avoid rate limits)
      const recentMessages = messages.slice(-10);
      const conversationHistory = recentMessages
        .filter((msg) => msg.content && msg.content.trim().length > 0)
        .map((msg) => ({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }],
        }));

      const makeRequest = async () => {
        // Gemini API endpoint
        // v1 API supports newer models like gemini-2.5-flash and gemini-2.5-pro
        // v1beta supports older models like gemini-1.5-flash and gemini-pro
        // Try v1 first for newer models, fallback to v1beta for older models
        const useV1Beta = selectedModel.includes('1.5') || selectedModel === 'gemini-pro' || selectedModel === 'gemini-pro-vision';
        const apiVersion = useV1Beta ? 'v1beta' : 'v1';
        const url = `https://generativelanguage.googleapis.com/${apiVersion}/models/${selectedModel}:generateContent?key=${apiKey}`;

        // Build request payload for Gemini API
        const requestBody: any = {
          contents: [
            ...conversationHistory,
            {
              role: 'user',
              parts: [{ text: userMessage.content }],
            },
          ],
          generationConfig: {
            temperature: taskType === 'coding' ? 0.3 : taskType === 'research' ? 0.5 : 0.7,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: taskType === 'coding' ? 2048 : taskType === 'research' ? 1536 : 1024,
          },
        };

        // Add system instruction (format differs by API version)
        if (systemInstruction) {
          if (apiVersion === 'v1beta') {
            // v1beta supports systemInstruction field at root level
            requestBody.systemInstruction = {
              parts: [{ text: systemInstruction }],
            };
          } else {
            // v1 API: prepend system instruction as first message in contents
            requestBody.contents = [
              {
                role: 'user',
                parts: [{ text: systemInstruction }],
              },
              ...requestBody.contents,
            ];
          }
        }

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          let errorMessage = `HTTP error! status: ${response.status}`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.error?.message || errorData.error?.details?.[0]?.message || errorMessage;
            // Handle common Gemini API errors
            if (response.status === 400) {
              errorMessage = errorMessage || 'Invalid request. Please check your API key and request format.';
            } else if (response.status === 429) {
              errorMessage = 'Rate limit exceeded. Please wait a moment before trying again.';
            } else if (response.status === 401) {
              errorMessage = 'Invalid API key. Please check your VITE_API_KEY in .env file.';
            }
          } catch {
            // If parsing fails, use default message
          }
          const error = new Error(errorMessage);
          (error as any).status = response.status;
          throw error;
        }

        return response;
      };

      const response = await retryWithBackoff(makeRequest, 2, 5000); // Max 2 retries, 5s initial delay
      const data = await response.json();
      
      // Check for errors in Gemini response
      if (data.error) {
        throw new Error(data.error.message || 'Error from Gemini API');
      }
      
      // Extract text from Gemini response format
      const candidate = data.candidates?.[0];
      if (!candidate || !candidate.content) {
        throw new Error('No response from Gemini API');
      }
      
      const markdownText = candidate.content.parts?.[0]?.text || 'No response from the model';
      
      // Check for finish reason (safety filters, etc.)
      if (candidate.finishReason && candidate.finishReason !== 'STOP') {
        console.warn('Gemini finish reason:', candidate.finishReason);
      }

      const updatedBotMessage: Message = {
        id: generateMessageId(),
        sender: 'bot',
        content: markdownText,
        model: selectedModel,
        timestamp: new Date(),
        status: 'sent',
      };

      setMessages((msgs) => [...msgs, updatedBotMessage]);

      // Update conversation
      if (currentConversation) {
        const updatedConversation = {
          ...currentConversation,
          title:
            currentConversation.messages.length === 0
              ? generateConversationTitle(userMessage.content)
              : currentConversation.title,
          messages: [...messages, userMessage, updatedBotMessage],
          updatedAt: new Date(),
        };

        setCurrentConversation(updatedConversation);
        saveConversation(updatedConversation);
        setConversations((prev) =>
          prev.map((c) => (c.id === updatedConversation.id ? updatedConversation : c))
        );
      }
    } catch (error: any) {
      console.error('Error details:', error);
      let errorMessage = 'An error occurred. Please try again later.';

      if (error.status === 429) {
        errorMessage = 'Rate limit exceeded. Gemini free tier allows 15 requests per minute. Please wait 60 seconds before trying again.';
      } else if (error.status === 401) {
        errorMessage = 'Invalid API key. Please check your VITE_API_KEY in .env file and restart the server.';
      } else if (error.status === 400) {
        errorMessage = error.message || 'Invalid request. Please check your API key and request format.';
      } else if (error.message && error.message.includes('API key')) {
        errorMessage = 'API key error. Please check your .env file and restart the server.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      const errorBotMessage: Message = {
        id: generateMessageId(),
        sender: 'bot',
        content: errorMessage,
        timestamp: new Date(),
        status: 'error',
      };

      setMessages((msgs) => [...msgs, errorBotMessage]);
    } finally {
      setIsLoading(false);
    }
  }

  const toggleTheme = () => {
    setSettings((prev) => ({
      ...prev,
      theme: prev.theme === 'light' ? 'dark' : 'light',
    }));
  };

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
