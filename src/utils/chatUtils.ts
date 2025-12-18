import { marked } from 'marked';
import type { Conversation, ChatSettings } from '../types/chat';

const markdownCache = new Map<string, string>();
const STORAGE_KEYS = {
  conversations: 'chatbot_conversations',
  settings: 'chatbot_settings',
} as const;

const getStorageItem = <T>(key: string, defaultValue: T): T => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const setStorageItem = (key: string, value: unknown): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to save ${key}:`, error);
  }
};

export const markdownToPlainText = (markdown: string): string => {
  if (markdownCache.has(markdown)) return markdownCache.get(markdown)!;
  
  const html = marked.parse(markdown, { async: false });
  const div = document.createElement('div');
  div.innerHTML = html;
  const result = div.textContent || div.innerText || '';
  markdownCache.set(markdown, result);
  return result;
};

export const generateId = (prefix: string) => 
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

export const generateConversationId = () => generateId('conv');
export const generateMessageId = () => generateId('msg');

const normalizeConversation = (conv: any): Conversation => ({
  ...conv,
  createdAt: new Date(conv.createdAt),
  updatedAt: new Date(conv.updatedAt),
  messages: conv.messages.map((msg: any) => ({
    ...msg,
    timestamp: msg.timestamp ? new Date(msg.timestamp) : undefined,
  })),
});

export const getConversations = (): Conversation[] => {
  const conversations = getStorageItem<any[]>(STORAGE_KEYS.conversations, []);
  return conversations.map(normalizeConversation);
};

export const saveConversation = (conversation: Conversation): void => {
  const conversations = getConversations();
  const index = conversations.findIndex(c => c.id === conversation.id);
  if (index >= 0) conversations[index] = conversation;
  else conversations.push(conversation);
  setStorageItem(STORAGE_KEYS.conversations, conversations);
};

export const deleteConversation = (conversationId: string): void => {
  const conversations = getConversations().filter(c => c.id !== conversationId);
  setStorageItem(STORAGE_KEYS.conversations, conversations);
};

const defaultSettings: ChatSettings = {
  theme: 'dark',
  language: 'en',
  autoScroll: true,
  showTimestamps: true,
};

export const getChatSettings = (): ChatSettings => ({
  ...defaultSettings,
  ...getStorageItem<Partial<ChatSettings>>(STORAGE_KEYS.settings, {}),
});

export const saveChatSettings = (settings: ChatSettings): void => 
  setStorageItem(STORAGE_KEYS.settings, settings);

export const LLAMA_MODEL = "meta-llama/llama-3.3-70b-instruct:free";

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
});

export const formatTimestamp = (date: Date): string => dateFormatter.format(date);

export const generateConversationTitle = (firstMessage: string): string => {
  const words = firstMessage.split(' ').slice(0, 5).join(' ');
  return firstMessage.length > 30 ? `${words}...` : words;
};

export const exportConversation = (conversation: Conversation): string =>
  JSON.stringify(conversation, null, 2);

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.append(textArea);
    textArea.select();
    document.execCommand('copy');
    textArea.remove();
    return true;
  } catch {
    return false;
  }
};

export const getConversationPreview = (conversation: Conversation): string => {
  const preview = conversation.messages.find(msg => msg.sender === 'user')?.content.trim();
  if (!preview) return 'No messages yet';
  return preview.length > 50 ? `${preview.slice(0, 50)}...` : preview;
};

export type DateGroup = 'Today' | 'Yesterday' | 'This Week' | 'This Month' | 'Older';

export interface GroupedConversations {
  group: DateGroup;
  conversations: Conversation[];
}

const getDateBoundaries = () => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return {
    today,
    yesterday: new Date(today.getTime() - 86400000),
    thisWeek: new Date(today.getTime() - 604800000),
    thisMonth: new Date(today.getFullYear(), today.getMonth() - 1, today.getDate()),
  };
};

export const groupConversationsByDate = (conversations: Conversation[]): GroupedConversations[] => {
  const { today, yesterday, thisWeek, thisMonth } = getDateBoundaries();
  const groups: Record<DateGroup, Conversation[]> = {
    'Today': [],
    'Yesterday': [],
    'This Week': [],
    'This Month': [],
    'Older': [],
  };

  conversations.forEach(conv => {
    const updatedAt = new Date(conv.updatedAt);
    if (updatedAt >= today) groups['Today'].push(conv);
    else if (updatedAt >= yesterday) groups['Yesterday'].push(conv);
    else if (updatedAt >= thisWeek) groups['This Week'].push(conv);
    else if (updatedAt >= thisMonth) groups['This Month'].push(conv);
    else groups['Older'].push(conv);
  });

  const order: DateGroup[] = ['Today', 'Yesterday', 'This Week', 'This Month', 'Older'];
  return order
    .filter(group => groups[group].length > 0)
    .map(group => ({ group, conversations: groups[group] }));
};

export const formatRelativeDate = (date: Date): string => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.floor((today.getTime() - day.getTime()) / 86400000);

  if (diffDays === 0) return formatTimestamp(date);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return date.toLocaleDateString('en-US', { weekday: 'short' });
  if (diffDays < 30) return `${diffDays} days ago`;
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}; 