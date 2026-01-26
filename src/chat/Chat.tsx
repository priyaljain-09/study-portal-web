import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import { useAppSelector } from '../redux/hooks';
import { MessageCircle, Search, Send, Plus, Image as ImageIcon, Video as VideoIcon, File as FileIcon, X } from 'lucide-react';
import { useAppDispatch } from '../redux/hooks';
import {
  fetchConversations,
  fetchRecipients,
  fetchMessages,
  sendMessage,
  sendMediaMessage,
  setCurrentConversationId,
  markConversationAsRead,
} from '../redux/slices/chat';
import { websocketService } from '../services/websocketService';
import type { Conversation } from '../types/chat';

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const mediaDropdownRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const hasFetchedConversations = useRef(false);
  const isLoadingOlder = useRef(false);

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
    if (activeConversationId && !messages[activeConversationId]) {
      dispatch(fetchMessages(activeConversationId));
    }
  }, [activeConversationId, messages, dispatch]);

  useEffect(() => {
    if (activeConversationId) {
      websocketService.markAsRead(activeConversationId);
      dispatch(markConversationAsRead(activeConversationId));
    }
  }, [activeConversationId, dispatch]);

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

    isLoadingOlder.current = true;
    setIsLoadingMore(true);

    try {
      await dispatch(fetchMessages(activeConversationId, oldestMessage.id, 20));
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
              {isLoading ? (
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
                          isActive ? 'bg-blue-50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
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
                              <span className="bg-blue-600 text-white text-[11px] font-semibold px-2 py-0.5 rounded-full">
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
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
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
                  {isLoadingMore && (
                    <div className="flex items-center justify-center py-4">
                      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="ml-2 text-sm text-gray-500">Loading older messages...</span>
                    </div>
                  )}
                  {conversationMessages.length > 0 ? (
                    conversationMessages.map((message) => {
                      const isMine = message.sender_id === userProfile?.user?.id;
                      return (
                        <div
                          key={message.id || message.client_message_id}
                          className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-4`}
                        >
                          <div
                            className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm ${
                              isMine
                                ? 'bg-blue-600 text-white rounded-tr-md'
                                : 'bg-white text-gray-900 border border-gray-200 rounded-tl-md'
                            }`}
                          >
                            {message.type === 'image' && message.file_url ? (
                              <div className="space-y-2">
                                <img
                                  src={getFileUrl(message.file_url)}
                                  alt={message.body || 'Image'}
                                  className="max-w-full rounded-lg cursor-pointer"
                                  onClick={() => message.file_url && setFullScreenImage(getFileUrl(message.file_url))}
                                />
                                {message.body && <p>{message.body}</p>}
                              </div>
                            ) : message.type === 'video' && message.file_url ? (
                              <div className="space-y-2">
                                <video
                                  src={getFileUrl(message.file_url)}
                                  controls
                                  className="max-w-full rounded-lg"
                                />
                                {message.body && <p>{message.body}</p>}
                              </div>
                            ) : message.type === 'file' && message.file_url ? (
                              <div className="space-y-2">
                                <a
                                  href={getFileUrl(message.file_url)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 underline"
                                >
                                  <FileIcon className="w-4 h-4" />
                                  <span>{message.body || 'Download file'}</span>
                                </a>
                              </div>
                            ) : (
                              <p>{message.body || ''}</p>
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
                  className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center disabled:opacity-40 hover:bg-blue-700 transition"
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

