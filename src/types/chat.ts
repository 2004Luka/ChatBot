export type MessageSender = 'user' | 'bot';
export type MessageStatus = 'sending' | 'sent' | 'error';
export type Theme = 'light' | 'dark';

export interface Message {
  sender: MessageSender;
  content: string;
  timestamp?: Date;
  status?: MessageStatus;
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
  theme: Theme;
  language: string;
  autoScroll: boolean;
  showTimestamps: boolean;
} 