import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import { useAppSelector } from '../redux/hooks';
import { MessageCircle, Search, Send, Plus, Image as ImageIcon, Video as VideoIcon, File as FileIcon, X, ChevronDown, Pencil, Trash2, Check, CheckCheck, Download } from 'lucide-react';
import { useAppDispatch } from '../redux/hooks';
import { store } from '../redux/store';
import {
  fetchConversations,
  fetchRecipients,
  fetchMessages,
  sendMessage,
  sendMediaMessage,
  setCurrentConversationId,
  markConversationAsRead,
  editMessage,
  deleteMessage,
  updateMessage,
  removeMessage,
  updateConversationLastMessage,
} from '../redux/slices/chat';
import { websocketService } from '../services/websocketService';
import type { Conversation, Message } from '../types/chat';

const Chat = () => {
  const dispatch = useAppDispatch();
  const userProfile = useAppSelector((state) => state.applicationData.userProfile);
  const { conversations, messages, cursors, isLoading, currentConversationId, typingUsers } = useAppSelector(
    (state) => state.chat,
  );
  const userInitial =
    userProfile?.user?.first_name?.charAt(0) ||
    userProfile?.user?.username?.charAt(0) ||
    'S';

  const [searchQuery, setSearchQuery] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [showMediaDropdown, setShowMediaDropdown] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hoveredMessageId, setHoveredMessageId] = useState<number | null>(null);
  const [messageMenuOpen, setMessageMenuOpen] = useState<number | null>(null);
  const [editingMessage, setEditingMessage] = useState<{ id: number; body: string } | null>(null);
  const [editText, setEditText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const mediaDropdownRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const hasFetchedConversations = useRef(false);
  const isLoadingOlder = useRef(false);
  const hasLoadedInitialMessages = useRef<{ [key: number]: boolean }>({});
  const previousConversationId = useRef<number | null>(null);
  const previousScrollHeight = useRef<number>(0);
  const previousScrollTop = useRef<number>(0);
  const hasScrolledToBottom = useRef<{ [key: number]: boolean }>({});

  const activeConversationId = currentConversationId;
  const activeConversation =
    conversations.find((c) => c.conversation_id === activeConversationId) || null;

  useEffect(() => {
    if (!hasFetchedConversations.current) {
      hasFetchedConversations.current = true;
      dispatch(fetchConversations());
      dispatch(fetchRecipients());
    }
  }, [dispatch]);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.user_id) {
        websocketService.connect(Number(payload.user_id));
      }
    } catch (error) {
      // Ignore token parse errors
    }
  }, []);

  useEffect(() => {
    if (activeConversationId) {
      if (!messages[activeConversationId]) {
        // First time loading messages for this conversation
        hasLoadedInitialMessages.current[activeConversationId] = false;
        dispatch(fetchMessages(activeConversationId)).then(() => {
          hasLoadedInitialMessages.current[activeConversationId] = true;
        }).catch(() => {
          hasLoadedInitialMessages.current[activeConversationId] = true;
        });
      } else if (messages[activeConversationId]?.length > 0) {
        // Messages already loaded
        hasLoadedInitialMessages.current[activeConversationId] = true;
      }
    }
  }, [activeConversationId, messages, dispatch]);

  useEffect(() => {
    if (activeConversationId) {
      websocketService.markAsRead(activeConversationId);
      dispatch(markConversationAsRead(activeConversationId));
    }
  }, [activeConversationId, dispatch]);

  // Scroll to bottom when opening a new conversation (always show latest message at start)
  useEffect(() => {
    if (activeConversationId && messagesContainerRef.current) {
      const isNewConversation = previousConversationId.current !== activeConversationId;
      const messageCount = messages[activeConversationId]?.length || 0;
      const hasScrolled = hasScrolledToBottom.current[activeConversationId];
      
      if (isNewConversation) {
        previousConversationId.current = activeConversationId;
        // Reset scroll flag when switching conversations
        hasScrolledToBottom.current[activeConversationId] = false;
      }
      
      // Scroll to bottom when opening conversation and messages are available
      // Only scroll if we haven't already scrolled for this conversation and not loading older messages
      if (messageCount > 0 && !hasScrolled && !isLoadingOlder.current) {
        const scrollToBottom = () => {
          if (messagesContainerRef.current && previousConversationId.current === activeConversationId) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
            hasScrolledToBottom.current[activeConversationId] = true;
          }
        };
        
        // Use setTimeout to ensure DOM has updated
        const timeoutId = setTimeout(scrollToBottom, 100);
        return () => clearTimeout(timeoutId);
      }
    } else if (!activeConversationId) {
      // Reset when no conversation is selected
      previousConversationId.current = null;
    }
  }, [activeConversationId, activeConversationId ? messages[activeConversationId]?.length : 0]);

  // Scroll to bottom when new messages arrive (not when loading older messages)
  useEffect(() => {
    if (
      activeConversationId && 
      messagesContainerRef.current && 
      !isLoadingOlder.current &&
      !isLoadingMore &&
      previousConversationId.current === activeConversationId &&
      hasLoadedInitialMessages.current[activeConversationId]
    ) {
      const container = messagesContainerRef.current;
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 200;
      
      // Only auto-scroll if user is near the bottom (within 200px) and not loading older messages
      if (isNearBottom) {
        const scrollToBottom = () => {
          if (messagesContainerRef.current && !isLoadingOlder.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
          }
        };
        
        const timeoutId = setTimeout(scrollToBottom, 50);
        return () => clearTimeout(timeoutId);
      }
    }
  }, [activeConversationId, isLoadingMore, activeConversationId ? messages[activeConversationId]?.length : 0]);

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) {
      return conversations;
    }
    const query = searchQuery.toLowerCase();
    return conversations.filter(
      (conversation) =>
        conversation.other_user.username.toLowerCase().includes(query) ||
        conversation.other_user.email.toLowerCase().includes(query) ||
        (conversation.last_message?.body || '').toLowerCase().includes(query),
    );
  }, [searchQuery, conversations]);


  const conversationMessages = useMemo(() => {
    if (!activeConversationId) return [];
    return [...(messages[activeConversationId] || [])].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
  }, [messages, activeConversationId]);

  const hasMoreMessages = activeConversationId ? cursors[activeConversationId] !== null : false;

  const handleEditMessage = async () => {
    if (!editingMessage || !editText.trim() || !activeConversationId) {
      setEditingMessage(null);
      setEditText('');
      return;
    }

    const trimmedText = editText.trim();
    
    try {
      // Try websocket first
      const wsSent = websocketService.editMessage(editingMessage.id, trimmedText);
      
      if (wsSent) {
        // Update local state immediately for websocket
        dispatch(updateMessage({ conversationId: activeConversationId, messageId: editingMessage.id, body: trimmedText }));
        
        // Update conversation last message if this is the last message
        const state = store.getState();
        const conversation = state.chat.conversations.find((c: Conversation) => c.conversation_id === activeConversationId);
        if (conversation?.last_message?.id === editingMessage.id && conversation.last_message) {
          const updatedMessage = { 
            ...conversation.last_message, 
            body: trimmedText,
            sender_username: userProfile?.user?.username || ''
          };
          dispatch(updateConversationLastMessage({ conversationId: activeConversationId, message: updatedMessage as Message }));
        }
      } else {
        // Fallback to API
        await dispatch(editMessage(editingMessage.id, trimmedText));
      }
      
      setEditingMessage(null);
      setEditText('');
    } catch (error) {
      // Error is handled by the thunk
      console.error('Error editing message:', error);
    }
  };

  const handleDeleteMessage = async (messageId: number) => {
    if (!activeConversationId) return;
    
    if (!window.confirm('Are you sure you want to delete this message?')) {
      return;
    }

    try {
      // Try websocket first
      const wsSent = websocketService.deleteMessage(messageId);
      
      if (wsSent) {
        // Update local state immediately for websocket
        dispatch(removeMessage({ conversationId: activeConversationId, messageId }));
        
        // Update conversation last message if this was the last message
        const state = store.getState();
        const conversation = state.chat.conversations.find((c: Conversation) => c.conversation_id === activeConversationId);
        if (conversation?.last_message?.id === messageId) {
          const messages = state.chat.messages[activeConversationId] || [];
          const newLastMessage = messages.length > 1 ? messages[messages.length - 2] : null;
          if (newLastMessage) {
            dispatch(updateConversationLastMessage({ conversationId: activeConversationId, message: newLastMessage }));
          } else {
            // If no more messages, clear last message
            dispatch(updateConversationLastMessage({ conversationId: activeConversationId, message: null as any }));
          }
        }
      } else {
        // Fallback to API
        await dispatch(deleteMessage(messageId));
      }
    } catch (error) {
      // Error is handled by the thunk
      console.error('Error deleting message:', error);
    }
  };

  const handleSendMessage = () => {
    if (!inputValue.trim() || !activeConversationId) return;
    const clientMessageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const wsSent = websocketService.sendMessage(
      activeConversationId,
      inputValue.trim(),
      clientMessageId,
    );
    if (!wsSent) {
      dispatch(sendMessage(activeConversationId, inputValue.trim(), clientMessageId));
    }
    setInputValue('');
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mediaDropdownRef.current && !mediaDropdownRef.current.contains(event.target as Node)) {
        setShowMediaDropdown(false);
      }
    };

    if (showMediaDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMediaDropdown]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      // Don't close if clicking on the menu or its children
      if (messageMenuOpen !== null) {
        const menuElement = document.querySelector(`[data-message-menu="${messageMenuOpen}"]`);
        if (menuElement && !menuElement.contains(target)) {
          setMessageMenuOpen(null);
        }
      }
    };

    if (messageMenuOpen !== null) {
      // Use a small delay to allow click events to process
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [messageMenuOpen]);

  const handleFileSelect = async (file: File, type: 'image' | 'video' | 'file') => {
    if (!activeConversationId || uploadingMedia) return;
    setShowMediaDropdown(false);
    setUploadingMedia(true);

    try {
      const clientMessageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await dispatch(sendMediaMessage(activeConversationId, file, type, inputValue.trim() || undefined, clientMessageId));
      setInputValue('');
    } catch (error) {
      // Error toast is handled by the thunk
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleFileSelect(file, 'image');
    }
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  const handleVideoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      handleFileSelect(file, 'video');
    }
    if (videoInputRef.current) {
      videoInputRef.current.value = '';
    }
  };

  const handleDocumentSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file, 'file');
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileUrl = (url: string): string => {
    if (url.startsWith('http') || url.startsWith('https')) {
      return url;
    }
    const domain = localStorage.getItem('schoolDomain');
    if (domain) {
      return `https://${domain}${url.startsWith('/') ? url : `/${url}`}`;
    }
    return `https://euniiq.com${url.startsWith('/') ? url : `/${url}`}`;
  };

  const getFileInfo = (fileUrl: string, body?: string) => {
    const fileName = body || fileUrl.split('/').pop() || 'Download file';
    const fileExtension = fileName.split('.').pop()?.toUpperCase() || 'FILE';
    return { fileName, fileExtension };
  };

  const formatMessageTime = (dateString: string): string => {
    const date = new Date(dateString);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'pm' : 'am';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    return `${displayHours}:${displayMinutes} ${ampm}`;
  };

  const loadOlderMessages = useCallback(async () => {
    if (
      !activeConversationId ||
      isLoadingOlder.current ||
      isLoadingMore ||
      !hasMoreMessages ||
      conversationMessages.length === 0
    ) {
      return;
    }

    const oldestMessage = conversationMessages[0];
    if (!oldestMessage?.id) return;

    // Save current scroll position before loading
    const container = messagesContainerRef.current;
    if (container) {
      previousScrollHeight.current = container.scrollHeight;
      previousScrollTop.current = container.scrollTop;
    }

    isLoadingOlder.current = true;
    setIsLoadingMore(true);

    try {
      await dispatch(fetchMessages(activeConversationId, oldestMessage.id, 20));
      
      // Restore scroll position after messages are loaded
      if (container) {
        // Use setTimeout to ensure DOM has fully updated with new messages
        setTimeout(() => {
          if (container) {
            const newScrollHeight = container.scrollHeight;
            const scrollDifference = newScrollHeight - previousScrollHeight.current;
            // Maintain scroll position by adjusting for the new content height
            // When messages are added at the top, we need to add the difference to maintain visual position
            container.scrollTop = previousScrollTop.current + scrollDifference;
          }
        }, 100);
      }
    } catch (error) {
      // Error is handled by the thunk
    } finally {
      setTimeout(() => {
        isLoadingOlder.current = false;
        setIsLoadingMore(false);
      }, 300);
    }
  }, [activeConversationId, isLoadingMore, conversationMessages, hasMoreMessages, dispatch]);

  const handleScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      const target = event.currentTarget;
      const scrollTop = target.scrollTop;

      // If scrolled to top (within 100px), load older messages
      if (scrollTop < 100 && !isLoadingOlder.current && !isLoadingMore && hasMoreMessages) {
        loadOlderMessages();
      }
    },
    [loadOlderMessages, isLoadingMore, hasMoreMessages],
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile Sidebar Overlay */}
      {showSidebar && (
        <>
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowSidebar(false)}></div>
            <div className="fixed left-0 top-0 bottom-0 z-50" onClick={(e) => e.stopPropagation()}>
              <Sidebar 
                activePath="/chat" 
                className="h-full"
                onNavigate={() => setShowSidebar(false)}
              />
            </div>
          </div>
          {/* Desktop Sidebar */}
          <div className="hidden lg:block">
            <Sidebar 
              activePath="/chat" 
              className="h-full"
            />
          </div>
        </>
      )}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          userInitial={userInitial}
          userName={userProfile?.user?.first_name || userProfile?.user?.username}
          onMenuClick={() => setShowSidebar(!showSidebar)}
        />

          <div className="flex-1 grid grid-cols-1 lg:grid-cols-[320px_1fr]">
          {/* Left Panel - Conversations */}
          <div className="border-r border-gray-200 bg-white flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Chats</h2>
              <div className="flex items-center bg-gray-100 rounded-lg px-3 py-2">
                <Search className="w-4 h-4 text-gray-500 mr-2" />
                <input
                  type="text"
                  className="bg-transparent text-sm text-gray-700 w-full outline-none"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {isLoading && conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center p-6 text-gray-500">
                  <MessageCircle className="w-10 h-10 mb-2" />
                  <p className="text-sm">Loading conversations...</p>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center p-6 text-gray-500">
                  <MessageCircle className="w-10 h-10 mb-2" />
                  <p className="text-sm">No conversations found.</p>
                </div>
              ) : (
                <div>
                  {filteredConversations.map((conversation: Conversation) => {
                    const isActive = conversation.conversation_id === activeConversationId;
                    const isTyping =
                      typingUsers[conversation.conversation_id] &&
                      typingUsers[conversation.conversation_id].length > 0;
                    return (
                      <button
                        key={conversation.conversation_id}
                        onClick={() => {
                          if (conversation.conversation_id !== activeConversationId) {
                            dispatch(setCurrentConversationId(conversation.conversation_id));
                            websocketService.markAsRead(conversation.conversation_id);
                            dispatch(markConversationAsRead(conversation.conversation_id));
                          }
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 border-b border-gray-100 text-left transition ${
                          isActive ? 'bg-[#043276]/10' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full bg-[#043276] text-white flex items-center justify-center font-semibold">
                          {conversation.other_user.username.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {conversation.other_user.username}
                            </p>
                            {conversation.last_message_at && (
                              <span className="text-[11px] text-gray-400">
                                {new Date(conversation.last_message_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <p className={`text-xs ${isTyping ? 'text-blue-600' : 'text-gray-500'} truncate`}>
                              {isTyping ? (
                                'typing...'
                              ) : conversation.last_message ? (
                                conversation.last_message.type === 'image' ? (
                                  'Photo'
                                ) : conversation.last_message.type === 'video' ? (
                                  'Video'
                                ) : conversation.last_message.type === 'file' ? (
                                  'Document'
                                ) : conversation.last_message.type === 'audio' ? (
                                  'Audio'
                                ) : (
                                  conversation.last_message.body || 'No messages yet'
                                )
                              ) : (
                                'No messages yet'
                              )}
                            </p>
                            {conversation.unread_count > 0 && (
                              <span className="bg-[#043276] text-white text-[11px] font-semibold px-2 py-0.5 rounded-full">
                                {conversation.unread_count}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Chat */}
          <div className="flex flex-col bg-gray-50">
            {activeConversation ? (
              <>
                <div className="border-b border-gray-200 bg-white p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#043276] text-white flex items-center justify-center font-semibold">
                      {activeConversation.other_user.username.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {activeConversation.other_user.username}
                      </p>
                      <p className="text-xs text-gray-500">{activeConversation.other_user.role}</p>
                    </div>
                  </div>
                </div>

                <div
                  ref={messagesContainerRef}
                  className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[calc(100vh-220px)]"
                  onScroll={handleScroll}
                >
                  {/* Loading indicator for older messages (at top) */}
                  {isLoadingMore && (
                    <div className="flex items-center justify-center py-4">
                      <div className="w-5 h-5 border-2 border-[#043276] border-t-transparent rounded-full animate-spin"></div>
                      <span className="ml-2 text-sm text-gray-500">Loading older messages...</span>
                    </div>
                  )}
                  {/* Loading indicator for initial messages (center) */}
                  {isLoading && activeConversationId && !hasLoadedInitialMessages.current[activeConversationId] && conversationMessages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-4 border-[#043276] border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-sm text-gray-500">Loading messages...</p>
                      </div>
                    </div>
                  ) : conversationMessages.length > 0 ? (
                    conversationMessages.map((message) => {
                      const isMine = message.sender_id === userProfile?.user?.id;
                      const isHovered = hoveredMessageId === message.id;
                      const isMenuOpen = messageMenuOpen === message.id;
                      const showMenuButton = isMine && message.id && (isHovered || isMenuOpen);
                      
                      return (
                        <div
                          key={message.id || message.client_message_id}
                          className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-2`}
                          onMouseEnter={() => message.id && setHoveredMessageId(message.id)}
                          onMouseLeave={() => setHoveredMessageId(null)}
                        >
                          <div className={`relative max-w-[50%] rounded-lg ${
                                isMine
                                  ? 'bg-[#043276] text-white'
                                  : 'bg-[#F3F4F6] text-gray-900'
                              }`}>
                          
                              {/* Menu button and dropdown inside message box */}
                              {showMenuButton && (
                                <div className={`absolute ${isMine ? 'top-1 right-1' : 'top-1 left-1'} z-10`}>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setMessageMenuOpen(isMenuOpen ? null : message.id!);
                                    }}
                                    className={`w-6 h-6 flex items-center justify-center rounded-full transition ${
                                      isMine 
                                        ? 'text-white/70 hover:text-white hover:bg-white/20' 
                                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                                    }`}
                                  >
                                    <ChevronDown className="w-4 h-4" />
                                  </button>
                                  {isMenuOpen && (
                                    <div 
                                      data-message-menu={message.id}
                                      className={`absolute ${isMine ? 'right-0' : 'left-0'} top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[120px] z-50`}
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          e.preventDefault();
                                          const canEdit = !message.type || message.type === 'text';
                                          if (message.id && canEdit && message.body) {
                                            // Close menu first
                                            setMessageMenuOpen(null);
                                            // Small delay to ensure menu closes before modal opens
                                            setTimeout(() => {
                                              setEditingMessage({ id: message.id, body: message.body });
                                              setEditText(message.body);
                                            }, 50);
                                          }
                                        }}
                                        disabled={message.type && message.type !== 'text'}
                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        <Pencil className="w-4 h-4" />
                                        <span>Edit</span>
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          e.preventDefault();
                                          if (message.id) {
                                            setMessageMenuOpen(null);
                                            // Small delay to ensure menu closes
                                            setTimeout(() => {
                                              handleDeleteMessage(message.id);
                                            }, 50);
                                          }
                                        }}
                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                        <span>Delete</span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                                {message.type === 'image' && message.file_url ? (
                                  <div className="p-1">
                                    <img
                                      src={getFileUrl(message.file_url)}
                                      alt={message.body || 'Image'}
                                      className="max-w-full rounded-lg cursor-pointer"
                                      onClick={() => message.file_url && setFullScreenImage(getFileUrl(message.file_url))}
                                    />
                                    {message.body && (
                                      <div className="px-3 pt-2 pb-2">
                                        <p className={`text-[15px] leading-5 mb-1 ${isMine ? 'text-white' : 'text-gray-900'}`}>
                                          {message.body}
                                        </p>
                                        <div className="flex items-center justify-end mt-1">
                                          <span className={`text-[11px] ${isMine ? 'text-white/70' : 'text-gray-500'}`}>
                                            {formatMessageTime(message.created_at)}
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ) : message.type === 'video' && message.file_url ? (
                                  <div className="p-1">
                                    <video
                                      src={getFileUrl(message.file_url)}
                                      controls
                                      className="max-w-full rounded-lg"
                                    />
                                    {message.body && (
                                      <div className="px-3 pt-2 pb-2">
                                        <p className={`text-[15px] leading-5 mb-1 ${isMine ? 'text-white' : 'text-gray-900'}`}>
                                          {message.body}
                                        </p>
                                        <div className="flex items-center justify-end mt-1">
                                          <span className={`text-[11px] ${isMine ? 'text-white/70' : 'text-gray-500'}`}>
                                            {formatMessageTime(message.created_at)}
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ) : message.type === 'file' && message.file_url ? (
                                  <div className="px-3 py-2">
                                    {(() => {
                                      const { fileName, fileExtension } = getFileInfo(message.file_url, message.body);
                                      return (
                                        <a
                                          href={getFileUrl(message.file_url)}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className={`flex items-center gap-3 ${
                                            isMine 
                                              ? 'bg-white/20 hover:bg-white/30' 
                                              : 'bg-white hover:bg-gray-50'
                                          } rounded-lg p-3 transition cursor-pointer`}
                                        >
                                          {/* File Icon with Extension Badge */}
                                          <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center relative ${
                                            isMine 
                                              ? 'bg-white/30' 
                                              : 'bg-gray-100'
                                          }`}>
                                            <FileIcon className={`w-7 h-7 ${isMine ? 'text-white' : 'text-gray-600'}`} />
                                            {/* <span className={`absolute bottom-0 right-0 text-[9px] font-bold px-1.5 py-0.5 rounded-tl-lg rounded-br-lg ${
                                              isMine 
                                                ? 'bg-white/40 text-white' 
                                                : 'bg-gray-200 text-gray-700'
                                            }`}>
                                              {fileExtension.length > 4 ? fileExtension.substring(0, 4) : fileExtension}
                                            </span> */}
                                          </div>
                                          
                                          {/* File Info */}
                                          <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-medium truncate ${
                                              isMine ? 'text-white' : 'text-gray-900'
                                            }`}>
                                              {fileName}
                                            </p>
                                            <p className={`text-xs mt-0.5 ${
                                              isMine ? 'text-white/70' : 'text-gray-500'
                                            }`}>
                                              {fileExtension} • Document
                                            </p>
                                          </div>
                                          
                                          {/* Download Icon */}
                                          {/* <div className="flex-shrink-0">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                              isMine 
                                                ? 'bg-white/20 hover:bg-white/30' 
                                                : 'bg-gray-100 hover:bg-gray-200'
                                            } transition`}>
                                              <Download className={`w-4 h-4 ${isMine ? 'text-white' : 'text-gray-600'}`} />
                                            </div>
                                          </div> */}
                                        </a>
                                      );
                                    })()}
                                    <div className="flex items-center justify-end mt-1.5">
                                      <span className={`text-[11px] ${isMine ? 'text-white/70' : 'text-gray-500'}`}>
                                        {formatMessageTime(message.created_at)}
                                      </span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-end gap-1.5 px-3 py-2" style={{
                                    ...(isMine
                                      ? {
                                          borderTopLeftRadius: '18px',
                                          borderTopRightRadius: '18px',
                                          borderBottomLeftRadius: '18px',
                                          borderBottomRightRadius: '4px',
                                        }
                                      : {
                                          borderTopLeftRadius: '18px',
                                          borderTopRightRadius: '18px',
                                          borderBottomLeftRadius: '4px',
                                          borderBottomRightRadius: '18px',
                                        }),
                                  }}>
                                    <span 
                                      className={`text-[15px] leading-5 flex-shrink mr-1.5 max-w-full ${isMine ? 'text-white' : 'text-gray-900'}`}
                                    >
                                      {message.body || ''}
                                    </span>
                                    <div className="flex items-center gap-0.5 flex-shrink-0">
                                      <span className={`text-[11px] whitespace-nowrap ${isMine ? 'text-white/70' : 'text-gray-500'}`}>
                                        {formatMessageTime(message.created_at)}
                                      </span>
                                    </div>
                                  </div>
                                )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-sm text-gray-500">No messages yet.</div>
                  )}
                </div>

                <div className="border-t border-gray-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="relative" ref={mediaDropdownRef}>
                  <button
                    className="w-10 h-10 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center disabled:opacity-40 hover:bg-gray-200 transition"
                    disabled={!activeConversation || uploadingMedia}
                    title="Attach"
                    onClick={() => setShowMediaDropdown(!showMediaDropdown)}
                  >
                    {uploadingMedia ? (
                      <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                  </button>
                  
                  {/* Media Dropdown */}
                  {showMediaDropdown && (
                    <div className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-[200px] z-50">
                      <button
                        onClick={() => {
                          imageInputRef.current?.click();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-left"
                      >
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <ImageIcon className="w-5 h-5 text-blue-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">Image</span>
                      </button>
                      <button
                        onClick={() => {
                          videoInputRef.current?.click();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-left"
                      >
                        <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                          <VideoIcon className="w-5 h-5 text-pink-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">Video</span>
                      </button>
                      <button
                        onClick={() => {
                          fileInputRef.current?.click();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-left"
                      >
                        <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                          <FileIcon className="w-5 h-5 text-yellow-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">Document</span>
                      </button>
                    </div>
                  )}
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageSelect}
                  />
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={handleVideoSelect}
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleDocumentSelect}
                  />
                </div>
                <input
                  type="text"
                  className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm outline-none"
                  placeholder="Type a message..."
                  value={inputValue}
                  onChange={(event) => setInputValue(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      handleSendMessage();
                    }
                  }}
                  disabled={!activeConversation || uploadingMedia}
                />
                <button
                  onClick={handleSendMessage}
                  className="w-10 h-10 rounded-full bg-[#043276] text-white flex items-center justify-center disabled:opacity-40 hover:bg-[#043276]/90 transition"
                  disabled={!inputValue.trim() || !activeConversation || uploadingMedia}
                  title="Send"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">Select a recipient from the left to start chatting</p>
                </div>
              </div>
            )}

            {/* Edit Message Modal */}
            {editingMessage && (
              <div
                className="fixed inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-[9999]"
                onClick={() => {
                  setEditingMessage(null);
                  setEditText('');
                }}
              >
                <div
                  className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden z-[10000]"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Blue Header */}
                  <div className="bg-[#043276] flex items-center justify-between p-4">
                    <button
                      onClick={() => {
                        setEditingMessage(null);
                        setEditText('');
                      }}
                      className="p-1 hover:bg-white/20 rounded-full transition"
                    >
                      <X className="w-5 h-5 text-white" />
                    </button>
                    <h3 className="text-lg font-semibold text-white">Edit message</h3>
                    <div className="w-6"></div>
                  </div>
                  
                  {/* Message Preview */}
                  <div className="p-4 bg-blue-50 border-b border-blue-100">
                    <p className="text-xs text-gray-500 mb-2 font-medium">Original message</p>
                    <div className="flex justify-end">
                      <div
                        className="relative max-w-[100%] bg-[#043276] text-white"
                        style={{
                          paddingLeft: '12px',
                          paddingRight: '12px',
                          paddingTop: '8px',
                          paddingBottom: '8px',
                          borderTopLeftRadius: '18px',
                          borderTopRightRadius: '18px',
                          borderBottomLeftRadius: '18px',
                          borderBottomRightRadius: '4px',
                        }}
                      >
                        <div className="flex items-end gap-1.5">
                          <span className="text-[15px] leading-5 flex-shrink mr-1.5 max-w-full text-white break-words">
                            {editingMessage.body}
                          </span>
                          <div className="flex items-center gap-0.5 flex-shrink-0">
                            <span className="text-[11px] whitespace-nowrap text-white/70">now</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Edit Input */}
                  <div className="p-4 bg-white">
                    <p className="text-xs text-gray-500 mb-2 font-medium">Edit your message</p>
                    <div className="flex items-center gap-2 border-2 border-[#043276] rounded-lg px-3 py-2 bg-blue-50/50 focus-within:bg-white focus-within:border-[#043276] transition">
                      <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="flex-1 outline-none text-gray-900 bg-transparent"
                        placeholder="Type your message"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            if (editText.trim()) {
                              handleEditMessage();
                            }
                          }
                          if (e.key === 'Escape') {
                            setEditingMessage(null);
                            setEditText('');
                          }
                        }}
                      />
                      <button
                        onClick={handleEditMessage}
                        disabled={!editText.trim()}
                        className="w-10 h-10 rounded-full bg-[#043276] text-white flex items-center justify-center disabled:opacity-40 hover:bg-[#043276]/90 transition"
                        title="Save changes"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Press Enter to save, Esc to cancel</p>
                  </div>
                </div>
              </div>
            )}

            {/* Full Screen Image Modal */}
            {fullScreenImage && (
              <div
                className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50"
                onClick={() => setFullScreenImage(null)}
              >
                <button
                  onClick={() => setFullScreenImage(null)}
                  className="absolute top-4 right-4 w-10 h-10 bg-black bg-opacity-50 rounded-full flex items-center justify-center hover:bg-opacity-70 transition"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
                <img
                  src={fullScreenImage}
                  alt="Full screen"
                  className="max-w-full max-h-full object-contain"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;

