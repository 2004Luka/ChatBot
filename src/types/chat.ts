export interface Message {
  sender: 'user' | 'bot';
  content: string;
  model?: string;
  timestamp?: Date;
  status?: 'sending' | 'sent' | 'error';
  id?: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatSettings {
  theme: 'light' | 'dark';
  language: string;
  autoScroll: boolean;
  showTimestamps: boolean;
} 