import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { store } from '../store';
import type { AppDispatch } from '../store';
import { api } from '../../api/axiosInterceptor';
import { setShowToast } from './applicationSlice';
import type { Recipient, Message, Conversation, MessagesResponse } from '../../types/chat';

const generateClientMessageId = (): string => {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

interface ChatState {
  recipients: Recipient[];
  conversations: Conversation[];
  messages: { [conversationId: number]: Message[] };
  cursors: { [conversationId: number]: number | null };
  currentConversationId: number | null;
  isLoading: boolean;
  isWebSocketConnected: boolean;
  typingUsers: { [conversationId: number]: number[] };
}

const initialState: ChatState = {
  recipients: [],
  conversations: [],
  messages: {},
  cursors: {},
  currentConversationId: null,
  isLoading: false,
  isWebSocketConnected: false,
  typingUsers: {},
};

const slice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setRecipients(state, action: PayloadAction<Recipient[]>) {
      state.recipients = action.payload;
    },
    setConversations(state, action: PayloadAction<Conversation[]>) {
      state.conversations = action.payload;
    },
    setMessages(
      state,
      action: PayloadAction<{ conversationId: number; messages: Message[]; append?: boolean }>,
    ) {
      const { conversationId, messages, append } = action.payload;
      if (append && state.messages[conversationId]) {
        const existingIds = new Set(
          state.messages[conversationId].map((m) => m.id || m.client_message_id),
        );
        const newMessages = messages.filter((m) => !existingIds.has(m.id || m.client_message_id));
        state.messages[conversationId] = [...newMessages, ...state.messages[conversationId]];
        state.messages[conversationId].sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        );
      } else {
        const seen = new Set();
        const uniqueMessages = messages.filter((m) => {
          const key = m.id || m.client_message_id;
          if (seen.has(key)) {
            return false;
          }
          seen.add(key);
          return true;
        });
        state.messages[conversationId] = uniqueMessages.sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        );
      }
    },
    addMessage(state, action: PayloadAction<{ conversationId: number; message: Message }>) {
      const { conversationId, message } = action.payload;
      if (!state.messages[conversationId]) {
        state.messages[conversationId] = [];
      }
      const exists = state.messages[conversationId].some(
        (m) => m.id === message.id || m.client_message_id === message.client_message_id,
      );
      if (!exists) {
        state.messages[conversationId].push(message);
      }
    },
    setCursor(state, action: PayloadAction<{ conversationId: number; cursor: number | null }>) {
      state.cursors[action.payload.conversationId] = action.payload.cursor;
    },
    setCurrentConversationId(state, action: PayloadAction<number | null>) {
      state.currentConversationId = action.payload;
    },
    setChatIsLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    setWebSocketConnected(state, action: PayloadAction<boolean>) {
      state.isWebSocketConnected = action.payload;
    },
    updateConversationLastMessage(
      state,
      action: PayloadAction<{ conversationId: number; message: Message }>,
    ) {
      const { conversationId, message } = action.payload;
      const conversationIndex = state.conversations.findIndex(
        (c) => c.conversation_id === conversationId,
      );
      if (conversationIndex !== -1) {
        const conversation = state.conversations[conversationIndex];
        conversation.last_message = {
          id: message.id,
          body: message.body,
          sender_id: message.sender_id,
          created_at: message.created_at,
          type: message.type,
        };
        conversation.last_message_at = message.created_at;
        state.conversations = [...state.conversations].sort(
          (a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime(),
        );
      }
    },
    setUnreadCount(state, action: PayloadAction<{ conversationId: number; count: number }>) {
      const conversation = state.conversations.find(
        (c) => c.conversation_id === action.payload.conversationId,
      );
      if (conversation) {
        conversation.unread_count = action.payload.count;
      }
    },
    markConversationAsRead(state, action: PayloadAction<number>) {
      const conversation = state.conversations.find((c) => c.conversation_id === action.payload);
      if (conversation) {
        conversation.unread_count = 0;
      }
    },
    setTypingUsers(state, action: PayloadAction<{ conversationId: number; userIds: number[] }>) {
      state.typingUsers[action.payload.conversationId] = action.payload.userIds;
    },
    clearTypingUsers(state, action: PayloadAction<number>) {
      delete state.typingUsers[action.payload];
    },
    updateConversation(state, action: PayloadAction<Conversation>) {
      const conversation = action.payload;
      const index = state.conversations.findIndex(
        (c) => c.conversation_id === conversation.conversation_id,
      );
      if (index !== -1) {
        state.conversations[index] = conversation;
        state.conversations.sort(
          (a, b) =>
            new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime(),
        );
      } else {
        state.conversations.push(conversation);
        state.conversations.sort(
          (a, b) =>
            new Date(b.last_message_at || 0).getTime() -
            new Date(a.last_message_at || 0).getTime(),
        );
      }
    },
    addConversation(state, action: PayloadAction<Conversation>) {
      const conversation = action.payload;
      const exists = state.conversations.some(
        (c) => c.conversation_id === conversation.conversation_id,
      );
      if (!exists) {
        state.conversations.push(conversation);
        state.conversations.sort(
          (a, b) =>
            new Date(b.last_message_at || 0).getTime() -
            new Date(a.last_message_at || 0).getTime(),
        );
      }
    },
    updateMessage(
      state,
      action: PayloadAction<{ conversationId: number; messageId: number; body: string }>,
    ) {
      const { conversationId, messageId, body } = action.payload;
      const messages = state.messages[conversationId];
      if (messages) {
        const messageIndex = messages.findIndex((m) => m.id === messageId);
        if (messageIndex !== -1) {
          messages[messageIndex] = { ...messages[messageIndex], body };
        }
      }
      const conversation = state.conversations.find((c) => c.conversation_id === conversationId);
      if (conversation && conversation.last_message && conversation.last_message.id === messageId) {
        conversation.last_message.body = body;
      }
    },
    removeMessage(
      state,
      action: PayloadAction<{ conversationId: number; messageId: number }>,
    ) {
      const { conversationId, messageId } = action.payload;
      const messages = state.messages[conversationId];
      if (messages) {
        state.messages[conversationId] = messages.filter((m) => m.id !== messageId);
      }
    },
    removeConversation(state, action: PayloadAction<number>) {
      const conversationId = action.payload;
      state.conversations = state.conversations.filter(
        (c) => c.conversation_id !== conversationId,
      );
      delete state.messages[conversationId];
      delete state.cursors[conversationId];
      delete state.typingUsers[conversationId];
      if (state.currentConversationId === conversationId) {
        state.currentConversationId = null;
      }
    },
  },
});

export const {
  setRecipients,
  setConversations,
  setMessages,
  addMessage,
  setCursor,
  setCurrentConversationId,
  setChatIsLoading,
  setWebSocketConnected,
  updateConversationLastMessage,
  setUnreadCount,
  markConversationAsRead,
  setTypingUsers,
  clearTypingUsers,
  updateConversation,
  addConversation,
  updateMessage,
  removeMessage,
  removeConversation,
} = slice.actions;

export default slice.reducer;

export function fetchRecipients() {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setChatIsLoading(true));
      const response = await api.get<Recipient[]>('/chat/recipients/');
      dispatch(setRecipients(response.data));
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.detail || error?.message || 'Failed to fetch recipients';
      dispatch(setShowToast({ show: true, type: 'error', toastMessage: errorMessage }));
      throw error;
    } finally {
      dispatch(setChatIsLoading(false));
    }
  };
}

export function fetchConversations() {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setChatIsLoading(true));
      const response = await api.get<Conversation[]>('/chat/conversations/list/');
      dispatch(setConversations(response.data));
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.detail || error?.message || 'Failed to fetch conversations';
      dispatch(setShowToast({ show: true, type: 'error', toastMessage: errorMessage }));
      throw error;
    } finally {
      dispatch(setChatIsLoading(false));
    }
  };
}

export function createOrGetConversation(recipientUserId: number) {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setChatIsLoading(true));
      const response = await api.post<{ conversation_id: number }>('/chat/conversations/', {
        recipient_user_id: recipientUserId,
      });
      const conversationId = response.data.conversation_id;
      dispatch(setCurrentConversationId(conversationId));
      return conversationId;
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.detail || error?.message || 'Failed to create conversation';
      dispatch(setShowToast({ show: true, type: 'error', toastMessage: errorMessage }));
      throw error;
    } finally {
      dispatch(setChatIsLoading(false));
    }
  };
}

export function fetchMessages(conversationId: number, cursor?: number | null, limit = 20) {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setChatIsLoading(true));
      const effectiveLimit = cursor ? Math.max(limit, 20) : limit;
      const params: any = { limit: effectiveLimit };
      if (cursor) {
        params.cursor = cursor;
      }
      const response = await api.get<MessagesResponse>(
        `/chat/conversations/${conversationId}/messages/`,
        { params },
      );
      const { results, next_cursor } = response.data;
      const sortedResults = [...results].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );
      dispatch(
        setMessages({
          conversationId,
          messages: sortedResults,
          append: !!cursor,
        }),
      );

      if (cursor) {
        const state = store.getState();
        const updatedMessages = state.chat.messages[conversationId] || [];
        if (updatedMessages.length > 0 && next_cursor !== null) {
          const oldestMessageId = updatedMessages[0].id;
          dispatch(setCursor({ conversationId, cursor: oldestMessageId }));
        } else {
          dispatch(setCursor({ conversationId, cursor: null }));
        }
      } else {
        dispatch(setCursor({ conversationId, cursor: next_cursor }));
      }
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.detail || error?.message || 'Failed to fetch messages';
      dispatch(setShowToast({ show: true, type: 'error', toastMessage: errorMessage }));
      throw error;
    } finally {
      dispatch(setChatIsLoading(false));
    }
  };
}

export function sendMessage(conversationId: number, body: string, clientMessageId?: string) {
  return async (dispatch: AppDispatch) => {
    try {
      const messageId = clientMessageId || generateClientMessageId();
      const response = await api.post<Message>(`/chat/conversations/${conversationId}/send/`, {
        body,
        client_message_id: messageId,
      });
      dispatch(addMessage({ conversationId, message: response.data }));
      dispatch(updateConversationLastMessage({ conversationId, message: response.data }));
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.detail || error?.message || 'Failed to send message';
      dispatch(setShowToast({ show: true, type: 'error', toastMessage: errorMessage }));
      throw error;
    }
  };
}

export function sendMediaMessage(
  conversationId: number,
  file: File,
  fileType: 'image' | 'video' | 'audio' | 'file',
  body?: string,
  clientMessageId?: string,
) {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setChatIsLoading(true));
      const messageId = clientMessageId || generateClientMessageId();

      const formData = new FormData();
      formData.append('type', fileType);
      formData.append('file', file);
      if (body) {
        formData.append('body', body);
      }
      formData.append('client_message_id', messageId);

      const response = await api.post<Message>(`/chat/conversations/${conversationId}/send/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      dispatch(addMessage({ conversationId, message: response.data }));
      dispatch(updateConversationLastMessage({ conversationId, message: response.data }));
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.detail || error?.message || 'Failed to send media message';
      dispatch(setShowToast({ show: true, type: 'error', toastMessage: errorMessage }));
      throw error;
    } finally {
      dispatch(setChatIsLoading(false));
    }
  };
}

