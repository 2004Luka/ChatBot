import { marked } from 'marked';
import type {Conversation, ChatSettings } from '../types/chat';

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
        theme: 'dark',
        language: 'en',
        autoScroll: true,
        showTimestamps: true
      };
    }
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to load settings:', error);
    return {
      theme: 'dark',
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

// Gemini Model Configuration
export const GEMINI_MODEL = "gemini-2.5-flash"; // Latest stable model (FREE tier, works with v1 API)
// Alternative models you can try:
// "gemini-2.5-pro" - More capable but slower (v1 API)
// "gemini-1.5-flash" - Older fast model (may need v1beta)
// "gemini-1.5-pro" - Older capable model (may need v1beta)
// "gemini-pro" - Legacy model (may need v1beta)
// Note: Model availability depends on your API key and API version

export const getModelForTask = (_taskType: 'coding' | 'research' | 'general'): string => {
  // Using Gemini for all task types - it handles everything well
  // Task type is still detected but all tasks use the same Gemini model
  return GEMINI_MODEL;
};

const modelDisplayNames = new Map([
  ["gemini-2.5-flash", "Gemini 2.5 Flash"],
  ["gemini-2.5-pro", "Gemini 2.5 Pro"],
  ["gemini-2.0-flash-exp", "Gemini 2.0 Flash"],
  ["gemini-1.5-flash", "Gemini 1.5 Flash"],
  ["gemini-1.5-pro", "Gemini 1.5 Pro"],
  ["gemini-1.5-flash-8b", "Gemini 1.5 Flash 8B"],
  ["gemini-pro", "Gemini Pro"],
  ["gemini-pro-vision", "Gemini Pro Vision"]
]);

export const getModelDisplayName = (modelId: string): string => {
  return modelDisplayNames.get(modelId) || "Gemini";
};

// Utility function to list available models (for debugging)
export const listAvailableModels = async (apiKey: string): Promise<string[]> => {
  try {
    // Try v1 API first
    const v1Url = `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`;
    const v1Response = await fetch(v1Url);
    
    if (v1Response.ok) {
      const v1Data = await v1Response.json();
      if (v1Data.models && v1Data.models.length > 0) {
        return v1Data.models.map((m: any) => m.name?.replace('models/', '') || m.name).filter(Boolean);
      }
    }
    
    // Try v1beta API if v1 doesn't work
    const v1betaUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const v1betaResponse = await fetch(v1betaUrl);
    
    if (v1betaResponse.ok) {
      const v1betaData = await v1betaResponse.json();
      if (v1betaData.models && v1betaData.models.length > 0) {
        return v1betaData.models.map((m: any) => m.name?.replace('models/', '') || m.name).filter(Boolean);
      }
    }
    
    return [];
  } catch (error) {
    console.error('Error listing models:', error);
    return [];
  }
};

// Utility Functions
export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const retryWithBackoff = async (
  fn: () => Promise<any>,
  maxRetries: number = 2,
  initialDelay: number = 5000 // Start with 5 seconds for rate limits
): Promise<any> => {
  let retries = 0;
  let delay = initialDelay;

  while (true) {
    try {
      return await fn();
    } catch (error: any) {
      // For rate limit errors (429), wait longer before retrying
      if (error.status === 429) {
        if (retries >= maxRetries) {
          throw error; // Don't retry forever
        }
        retries++;
        // Wait longer for rate limits - exponential backoff with minimum 5 seconds
        await sleep(Math.max(delay, 5000));
        delay *= 2;
        continue;
      }
      
      // For other errors, throw immediately (don't retry)
      throw error;
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

// Get conversation preview text (first user message or first 50 chars)
export const getConversationPreview = (conversation: Conversation): string => {
  const firstUserMessage = conversation.messages.find(msg => msg.sender === 'user');
  if (firstUserMessage) {
    const preview = firstUserMessage.content.trim();
    return preview.length > 50 ? preview.slice(0, 50) + '...' : preview;
  }
  return 'No messages yet';
};

// Group conversations by date
export type DateGroup = 'Today' | 'Yesterday' | 'This Week' | 'This Month' | 'Older';

export interface GroupedConversations {
  group: DateGroup;
  conversations: Conversation[];
}

export const groupConversationsByDate = (conversations: Conversation[]): GroupedConversations[] => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const thisWeek = new Date(today);
  thisWeek.setDate(thisWeek.getDate() - 7);
  const thisMonth = new Date(today);
  thisMonth.setMonth(thisMonth.getMonth() - 1);

  const groups: { [key in DateGroup]: Conversation[] } = {
    'Today': [],
    'Yesterday': [],
    'This Week': [],
    'This Month': [],
    'Older': [],
  };

  conversations.forEach(conv => {
    const updatedAt = new Date(conv.updatedAt);
    
    if (updatedAt >= today) {
      groups['Today'].push(conv);
    } else if (updatedAt >= yesterday) {
      groups['Yesterday'].push(conv);
    } else if (updatedAt >= thisWeek) {
      groups['This Week'].push(conv);
    } else if (updatedAt >= thisMonth) {
      groups['This Month'].push(conv);
    } else {
      groups['Older'].push(conv);
    }
  });

  // Return only non-empty groups in order
  const result: GroupedConversations[] = [];
  const order: DateGroup[] = ['Today', 'Yesterday', 'This Week', 'This Month', 'Older'];
  
  order.forEach(group => {
    if (groups[group].length > 0) {
      result.push({ group, conversations: groups[group] });
    }
  });

  return result;
};

// Format relative date for conversation list
export const formatRelativeDate = (date: Date): string => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const conversationDate = new Date(date);
  const conversationDay = new Date(conversationDate.getFullYear(), conversationDate.getMonth(), conversationDate.getDate());
  
  const diffTime = today.getTime() - conversationDay.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return formatTimestamp(date);
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return conversationDate.toLocaleDateString('en-US', { weekday: 'short' });
  } else if (diffDays < 30) {
    return `${diffDays} days ago`;
  } else if (conversationDate.getFullYear() === now.getFullYear()) {
    return conversationDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } else {
    return conversationDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}; 