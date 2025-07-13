import { marked } from 'marked';
import type { Message, Conversation, ChatSettings } from '../types/chat';

const markdownCache = new Map<string, string>();

export function markdownToPlainText(markdown: string): string {
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

// Conversation Management
export const generateConversationId = (): string => {
  return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const generateMessageId = (): string => {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const saveConversation = (conversation: Conversation): void => {
  try {
    const conversations = getConversations();
    const existingIndex = conversations.findIndex(c => c.id === conversation.id);
    
    if (existingIndex >= 0) {
      conversations[existingIndex] = conversation;
    } else {
      conversations.push(conversation);
    }
    
    localStorage.setItem('chatbot_conversations', JSON.stringify(conversations));
  } catch (error) {
    console.error('Failed to save conversation:', error);
  }
};

export const getConversations = (): Conversation[] => {
  try {
    const stored = localStorage.getItem('chatbot_conversations');
    if (!stored) return [];
    
    const conversations = JSON.parse(stored);
    return conversations.map((conv: any) => ({
      ...conv,
      createdAt: new Date(conv.createdAt),
      updatedAt: new Date(conv.updatedAt),
      messages: conv.messages.map((msg: any) => ({
        ...msg,
        timestamp: msg.timestamp ? new Date(msg.timestamp) : undefined
      }))
    }));
  } catch (error) {
    console.error('Failed to load conversations:', error);
    return [];
  }
};

export const deleteConversation = (conversationId: string): void => {
  try {
    const conversations = getConversations();
    const filtered = conversations.filter(c => c.id !== conversationId);
    localStorage.setItem('chatbot_conversations', JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to delete conversation:', error);
  }
};

// Settings Management
export const getChatSettings = (): ChatSettings => {
  try {
    const stored = localStorage.getItem('chatbot_settings');
    if (!stored) {
      return {
        theme: 'light',
        language: 'en',
        autoScroll: true,
        showTimestamps: true
      };
    }
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to load settings:', error);
    return {
      theme: 'light',
      language: 'en',
      autoScroll: true,
      showTimestamps: true
    };
  }
};

export const saveChatSettings = (settings: ChatSettings): void => {
  try {
    localStorage.setItem('chatbot_settings', JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
};

// Enhanced Task Detection
const codingKeywords = new Set([
  'code', 'function', 'class', 'variable', 'loop', 'array', 'object',
  'method', 'api', 'database', 'server', 'client', 'frontend', 'backend',
  'algorithm', 'debug', 'error', 'exception', 'compile', 'runtime',
  'javascript', 'python', 'java', 'typescript', 'react', 'node',
  'write', 'create', 'implement', 'develop', 'program', 'script',
  'def', 'import', 'print', 'return', 'if', 'else', 'for', 'while',
  'html', 'css', 'sql', 'git', 'docker', 'kubernetes', 'aws', 'azure'
]);

const researchKeywords = new Set([
  'research', 'study', 'analysis', 'investigate', 'explore', 'examine',
  'compare', 'contrast', 'evaluate', 'assess', 'review', 'literature',
  'methodology', 'findings', 'conclusion', 'hypothesis', 'theory',
  'data', 'statistics', 'survey', 'experiment', 'observation',
  'paper', 'journal', 'academic', 'scholarly', 'peer-reviewed'
]);

export const detectTaskType = (message: string): 'coding' | 'research' | 'general' => {
  const words = message.toLowerCase().split(/\s+/);
  let codingScore = 0;
  let researchScore = 0;

  if (message.toLowerCase().includes('write code') || 
      message.toLowerCase().includes('create code') ||
      message.toLowerCase().includes('implement') ||
      message.toLowerCase().includes('program') ||
      message.toLowerCase().includes('debug') ||
      message.toLowerCase().includes('fix code')) {
    return 'coding';
  }

  if (message.toLowerCase().includes('research') ||
      message.toLowerCase().includes('analyze') ||
      message.toLowerCase().includes('study') ||
      message.toLowerCase().includes('investigate')) {
    return 'research';
  }

  for (const word of words) {
    if (codingKeywords.has(word)) codingScore++;
    if (researchKeywords.has(word)) researchScore++;
  }

  if (codingScore > researchScore) return 'coding';
  if (researchScore > codingScore) return 'research';
  return 'general';
};

export const getModelForTask = (taskType: 'coding' | 'research' | 'general'): string => {
  switch (taskType) {
    case 'coding':
      return "deepseek/deepseek-r1-0528:free";
    case 'research':
      return "meta-llama/llama-4-maverick:free";
    default:
      return "mistralai/mistral-7b-instruct:free";
  }
};

const modelDisplayNames = new Map([
  ["deepseek/deepseek-r1-0528:free", "Deepseek"],
  ["meta-llama/llama-4-maverick:free", "Llama 4 Maverick"],
  ["mistralai/mistral-7b-instruct:free", "Mistral"]
]);

export const getModelDisplayName = (modelId: string): string => {
  return modelDisplayNames.get(modelId) || modelId;
};

// Utility Functions
export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const retryWithBackoff = async (
  fn: () => Promise<any>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<any> => {
  let retries = 0;
  let delay = initialDelay;

  while (true) {
    try {
      return await fn();
    } catch (error: any) {
      if (retries >= maxRetries || error.status !== 429) {
        throw error;
      }
      
      retries++;
      await sleep(delay);
      delay *= 2; 
    }
  }
};

// Format timestamp
export const formatTimestamp = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(date);
};

// Generate conversation title from first message
export const generateConversationTitle = (firstMessage: string): string => {
  const words = firstMessage.split(' ').slice(0, 5);
  return words.join(' ') + (firstMessage.length > 30 ? '...' : '');
};

// Export conversation as JSON
export const exportConversation = (conversation: Conversation): string => {
  return JSON.stringify(conversation, null, 2);
};

// Copy text to clipboard with fallback
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}; 