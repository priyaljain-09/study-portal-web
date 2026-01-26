import { store } from '../redux/store';
import {
  addMessage,
  setWebSocketConnected,
  updateConversationLastMessage,
  setUnreadCount,
  setTypingUsers,
  clearTypingUsers,
  markConversationAsRead,
  updateMessage,
  removeMessage,
  removeConversation,
  updateConversation,
  addConversation,
} from '../redux/slices/chat';
import { addNotification, setUnreadCount as setNotificationUnreadCount } from '../redux/slices/notificationsSlice';

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private readonly reconnectDelay = 3000;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private userId: number | null = null;
  private typingTimers: { [conversationId: number]: ReturnType<typeof setTimeout> } = {};
  private expectedConversationUpdates: Map<number, ReturnType<typeof setTimeout>> = new Map();

  async connect(userId: number) {
    this.userId = userId;
    try {
      const token = localStorage.getItem('accessToken');
      const domain = localStorage.getItem('schoolDomain');
      if (!token) {
        return;
      }

      const wsUrl = this.buildWebSocketUrl(domain, token);
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        store.dispatch(setWebSocketConnected(true));
      };

      this.ws.onmessage = (event) => this.handleIncomingMessage(event);
      this.ws.onerror = () => {
        store.dispatch(setWebSocketConnected(false));
      };
      this.ws.onclose = () => {
        store.dispatch(setWebSocketConnected(false));
        this.attemptReconnect();
      };
    } catch (error) {
      store.dispatch(setWebSocketConnected(false));
    }
  }

  private buildWebSocketUrl(domain: string | null, token: string): string {
    if (domain) {
      const cleanDomain = domain.replace(/^https?:\/\//, '');
      return `wss://${cleanDomain}/ws/chat/?token=${token}`;
    }
    return `ws://localhost:8000/ws/chat/?token=${token}`;
  }

  private handleIncomingMessage(event: MessageEvent) {
    try {
      const data: WebSocketMessage = JSON.parse(event.data);
      this.handleMessage(data);
    } catch (error) {
      // Ignore malformed websocket messages
    }
  }

  private handleMessage(data: WebSocketMessage) {
    const eventType = data.type?.toLowerCase();
    const eventHandlers: { [key: string]: (data: any) => void } = {
      'message.new': (d) => this.handleNewMessage(d),
      'message.edit': (d) => this.handleMessageUpdate(d),
      'message.update': (d) => this.handleMessageUpdate(d),
      'message.delete': (d) => this.handleMessageDelete(d),
      'message.read': (d) => this.handleMessageRead(d),
      'unread_count.update': (d) => this.handleUnreadCountUpdate(d),
      typing: (d) => this.handleTyping(d),
      'typing.stop': (d) => this.handleTypingStop(d),
      'conversation.delete': (d) => this.handleConversationDelete(d),
      'conversation.updated': (d) => this.handleConversationUpdated(d),
      'conversation.new': (d) => this.handleConversationNew(d),
      'notification.new': (d) => this.handleNewNotification(d),
      'notification.read': (d) => this.handleNotificationRead(d),
      error: (d) => this.handleError(d),
    };

    const handler = eventHandlers[eventType || ''];
    if (handler) {
      handler(data);
    } else if (this.isConversationUpdateEvent(data)) {
      this.handleConversationUpdated(data);
    }
  }

  private isConversationUpdateEvent(data: WebSocketMessage): boolean {
    if (!data.type) return false;
    const type = data.type.toLowerCase();
    return (
      (type.includes('conversation') && (type.includes('update') || type.includes('updated'))) ||
      (data.conversation_id && (data.last_message || data.unread_count !== undefined))
    );
  }

  private handleError(data: any) {
    const errorMessage = data.message || data.error || data.detail || 'WebSocket error occurred';
    const errorCode = data.code || data.error_code;

    if (
      errorCode === 'authentication_failed' ||
      errorCode === 'token_invalid' ||
      errorMessage.includes('token')
    ) {
      this.disconnect();
    }
  }

  private handleNewMessage(data: any) {
    const { conversation_id, message } = data;
    if (!message) return;

    const state = store.getState();
    const isMyMessage = message.sender_id === this.userId;
    const isCurrentConversation = state.chat.currentConversationId === conversation_id;
    const currentConversation = state.chat.conversations.find(
      (c) => c.conversation_id === conversation_id,
    );

    store.dispatch(addMessage({ conversationId: conversation_id, message }));
    this.expectConversationUpdate(conversation_id);

    if (currentConversation) {
      store.dispatch(updateConversationLastMessage({ conversationId: conversation_id, message }));

      if (isCurrentConversation) {
        if (!isMyMessage) this.markAsRead(conversation_id);
        store.dispatch(markConversationAsRead(conversation_id));
        store.dispatch(setUnreadCount({ conversationId: conversation_id, count: 0 }));
      } else if (!isMyMessage) {
        store.dispatch(
          setUnreadCount({
            conversationId: conversation_id,
            count: currentConversation.unread_count + 1,
          }),
        );
      }
    } else if (isCurrentConversation && !isMyMessage) {
      this.markAsRead(conversation_id);
      store.dispatch(markConversationAsRead(conversation_id));
      store.dispatch(setUnreadCount({ conversationId: conversation_id, count: 0 }));
    }
  }

  private expectConversationUpdate(conversationId: number) {
    if (this.expectedConversationUpdates.has(conversationId)) {
      clearTimeout(this.expectedConversationUpdates.get(conversationId)!);
    }
    const timeoutId = setTimeout(() => {
      this.expectedConversationUpdates.delete(conversationId);
    }, 2000);
    this.expectedConversationUpdates.set(conversationId, timeoutId);
  }

  private handleTyping(data: any) {
    const { conversation_id, user_id } = data;
    if (user_id === this.userId) return;

    const state = store.getState();
    const currentTyping = state.chat.typingUsers[conversation_id] || [];

    if (!currentTyping.includes(user_id)) {
      store.dispatch(
        setTypingUsers({
          conversationId: conversation_id,
          userIds: [...currentTyping, user_id],
        }),
      );
    }

    if (this.typingTimers[conversation_id]) {
      clearTimeout(this.typingTimers[conversation_id]);
    }
    this.typingTimers[conversation_id] = setTimeout(() => {
      store.dispatch(clearTypingUsers(conversation_id));
    }, 3000);
  }

  private handleTypingStop(data: any) {
    const { conversation_id, user_id } = data;
    if (user_id === this.userId) return;

    const state = store.getState();
    const currentTyping = state.chat.typingUsers[conversation_id] || [];
    store.dispatch(
      setTypingUsers({
        conversationId: conversation_id,
        userIds: currentTyping.filter((id) => id !== user_id),
      }),
    );
  }

  private handleMessageRead(data: any) {
    const { conversation_id, unread_count } = data;
    if (conversation_id === undefined) return;

    const count = unread_count !== undefined ? unread_count : 0;
    store.dispatch(setUnreadCount({ conversationId: conversation_id, count }));
    if (count === 0) {
      store.dispatch(markConversationAsRead(conversation_id));
    }
  }

  private handleUnreadCountUpdate(data: any) {
    const { conversation_id, unread_count } = data;
    if (conversation_id === undefined || unread_count === undefined) return;

    store.dispatch(setUnreadCount({ conversationId: conversation_id, count: unread_count }));
    if (unread_count === 0) {
      store.dispatch(markConversationAsRead(conversation_id));
    }
  }

  private findConversationIdByMessageId(messageId: number): number | null {
    const state = store.getState();
    for (const [convId, messages] of Object.entries(state.chat.messages)) {
      if (messages.some((m) => m.id === messageId)) {
        return Number(convId);
      }
    }
    return null;
  }

  private handleMessageUpdate(data: any) {
    const { message_id, body } = data;
    if (!message_id || body === undefined) return;

    const conversationId = this.findConversationIdByMessageId(message_id);
    if (!conversationId) return;

    store.dispatch(updateMessage({ conversationId, messageId: message_id, body }));

    const state = store.getState();
    const conversation = state.chat.conversations.find(
      (c) => c.conversation_id === conversationId,
    );
    if (conversation?.last_message?.id === message_id) {
      const updatedMessage = state.chat.messages[conversationId]?.find((m) => m.id === message_id);
      if (updatedMessage) {
        store.dispatch(updateConversationLastMessage({ conversationId, message: updatedMessage }));
      }
    }
  }

  private handleMessageDelete(data: any) {
    const { message_id } = data;
    if (!message_id) return;

    const conversationId = this.findConversationIdByMessageId(message_id);
    if (conversationId) {
      store.dispatch(removeMessage({ conversationId, messageId: message_id }));
    }
  }

  private handleConversationDelete(data: any) {
    const { conversation_id } = data;
    if (conversation_id) {
      store.dispatch(removeConversation(conversation_id));
    }
  }

  private handleConversationUpdated(data: any) {
    const conversation = data.conversation || data;
    if (!conversation.conversation_id) return;

    if (this.expectedConversationUpdates.has(conversation.conversation_id)) {
      clearTimeout(this.expectedConversationUpdates.get(conversation.conversation_id)!);
      this.expectedConversationUpdates.delete(conversation.conversation_id);
    }
    store.dispatch(updateConversation(conversation));
  }

  private handleConversationNew(data: any) {
    const conversation = data.conversation || data;
    if (conversation.conversation_id) {
      store.dispatch(addConversation(conversation));
    }
  }

  private sendWebSocketMessage(message: any): boolean {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  sendMessage(conversationId: number, body: string, clientMessageId: string) {
    return this.sendWebSocketMessage({
      type: 'message.send',
      conversation_id: conversationId,
      body,
      client_message_id: clientMessageId,
    });
  }

  sendTyping(conversationId: number) {
    this.sendWebSocketMessage({
      type: 'typing',
      conversation_id: conversationId,
    });
  }

  markAsRead(conversationId: number) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return false;
    }
    return this.sendWebSocketMessage({
      type: 'message.read',
      conversation_id: conversationId,
    });
  }

  editMessage(messageId: number, body: string) {
    return this.sendWebSocketMessage({
      type: 'message.edit',
      message_id: messageId,
      body,
    });
  }

  deleteMessage(messageId: number) {
    return this.sendWebSocketMessage({
      type: 'message.delete',
      message_id: messageId,
    });
  }

  deleteConversation(conversationId: number) {
    return this.sendWebSocketMessage({
      type: 'conversation.delete',
      conversation_id: conversationId,
    });
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      return;
    }

    this.reconnectAttempts += 1;
    this.reconnectTimer = setTimeout(() => {
      if (this.userId) {
        this.connect(this.userId);
      }
    }, this.reconnectDelay);
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.expectedConversationUpdates.forEach((timeout) => clearTimeout(timeout));
    this.expectedConversationUpdates.clear();

    Object.values(this.typingTimers).forEach((timeout) => clearTimeout(timeout));
    this.typingTimers = {};

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.reconnectAttempts = 0;
    store.dispatch(setWebSocketConnected(false));
  }

  private handleNewNotification(data: any) {
    const { notification } = data;
    if (notification) {
      store.dispatch(addNotification(notification));
      if (!notification.is_read) {
        const state = store.getState();
        const currentCount = state.notifications.unreadCount;
        store.dispatch(setNotificationUnreadCount(currentCount + 1));
      }
    }
  }

  private handleNotificationRead(data: any) {
    const { notification_id } = data;
    if (notification_id) {
      const state = store.getState();
      const currentCount = state.notifications.unreadCount;
      store.dispatch(setNotificationUnreadCount(Math.max(0, currentCount - 1)));
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

export const websocketService = new WebSocketService();

