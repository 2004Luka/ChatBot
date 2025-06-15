export interface Message {
  sender: 'user' | 'bot';
  content: string;
  model?: string;
} 