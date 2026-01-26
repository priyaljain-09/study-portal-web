export interface Recipient {
  id: number;
  username: string;
  email: string;
  role: string;
  classroom_name: string | null;
}

export interface Message {
  id: number;
  sender_id: number;
  sender_username: string;
  body: string;
  created_at: string;
  type?: 'text' | 'image' | 'video' | 'audio' | 'file';
  file_url?: string;
  thumbnail_url?: string;
  client_message_id?: string;
}

export interface Conversation {
  conversation_id: number;
  other_user: {
    id: number;
    username: string;
    email: string;
    role: string;
  };
  last_message: {
    id: number;
    body: string;
    sender_id: number;
    created_at: string;
    type?: 'text' | 'image' | 'video' | 'audio' | 'file';
  } | null;
  unread_count: number;
  last_message_at: string;
}

export interface MessagesResponse {
  results: Message[];
  next_cursor: number | null;
}

