import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StatusBar,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  Keyboard,
  Modal,
  Pressable,
  Dimensions,
  Linking,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../../types/types';
import { ArrowLeft, Send, Pencil, Trash2, X, MoreVertical, Check, Plus, Image as ImageIcon, Video as VideoIcon, File, Music, Download } from 'lucide-react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch, store } from '../../redux/store';
import Avatar from '../../components/Avatar';
import ChatMessage from '../../components/ChatMessage';
import {
  createOrGetConversation,
  fetchMessages,
  sendMessage as sendMessageAction,
  sendMediaMessage,
  markAsRead,
  setCurrentConversationId,
  editMessage,
  deleteMessage,
  updateMessage,
  updateConversationLastMessage,
  removeMessage,
} from '../../redux/slice/chat';
import { Message } from '../../types/chat';
import { websocketService } from '../../services/websocketService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchImageLibrary, launchCamera, ImagePickerResponse, MediaType } from 'react-native-image-picker';
import DocumentPicker from 'react-native-document-picker';
import { getCurrentBaseURL } from '../../api/axiosInterceptor';

type Props = NativeStackScreenProps<RootStackParamList, 'ChatScreen'>;

const ChatScreen: React.FC<Props> = ({ navigation, route }) => {
  const { userId, userName, userAvatar, conversationId: routeConversationId } = route.params;
  const dispatch = useDispatch<AppDispatch>();
  const { messages, cursors, isLoading, typingUsers } = useSelector(
    (state: RootState) => state.chat,
  );

  const [messageText, setMessageText] = useState('');
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [conversationId, setConversationId] = useState<number | null>(routeConversationId || null);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showMessageMenu, setShowMessageMenu] = useState(false);
  const [menuButtonLayout, setMenuButtonLayout] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [isEditingMessage, setIsEditingMessage] = useState(false);
  const [showHeaderDropdown, setShowHeaderDropdown] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  
  const isSendingMessage = isSending || uploadingMedia;

  const flatListRef = useRef<FlatList | null>(null);
  const isLoadingOlder = useRef(false);
  const hasFetchedConversation = useRef(new Set<number>());
  const hasInitializedConversation = useRef(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isAtBottom = useRef(true);
  const lastMessageCount = useRef(0);
  const previousConversationId = useRef<number | null>(null);
  const previousScrollOffset = useRef<number>(0);
  const hasScrolledToBottom = useRef<{ [key: number]: boolean }>({});
  const previousContentHeight = useRef<number>(0);

  const conversationMessages = conversationId ? (messages[conversationId] || []) : [];
  const hasMoreMessages = conversationId ? cursors[conversationId] !== null : false;
  
  const reversedMessages = [...conversationMessages].reverse();

  // ============ INITIALIZE USER ID ============
  useEffect(() => {
    const getCurrentUserId = async () => {
      try {
        const token = await AsyncStorage.getItem('accessToken');
        if (token) {
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload.user_id) {
            const userId = Number(payload.user_id);
            setCurrentUserId(userId);
            if (!websocketService.isConnected()) {
              websocketService.connect(userId);
            }
          }
        }
      } catch (error) {
      }
    };
    getCurrentUserId();
  }, []);

  // ============ MARK AS READ ============
  const markConversationAsRead = useCallback(() => {
    if (conversationId) {
      dispatch(markAsRead(conversationId));
      websocketService.markAsRead(conversationId);
    }
  }, [conversationId, dispatch]);

  // ============ SYNC CONVERSATION ID WITH ROUTE PARAMS ============
  useEffect(() => {
    if (routeConversationId && routeConversationId !== conversationId) {
      setConversationId(routeConversationId);
    }
  }, [routeConversationId]);

  // ============ INITIALIZE CONVERSATION ============
  useEffect(() => {
    const initializeConversation = async () => {
      if (!currentUserId || hasInitializedConversation.current) return;

      let convId: number | null = null;

      // If conversationId is already in route params, use it
      if (routeConversationId && typeof routeConversationId === 'number') {
        convId = routeConversationId;
      } else {
        // Otherwise, create or get conversation
        const result = await dispatch(createOrGetConversation(userId));
        convId = result as unknown as number;
      }
      
      if (convId && typeof convId === 'number') {
        hasInitializedConversation.current = true;
        
        if (!hasFetchedConversation.current.has(convId)) {
          hasFetchedConversation.current.add(convId);
          await dispatch(fetchMessages(convId));
        }
        
        setConversationId(convId);
        dispatch(setCurrentConversationId(convId));
        websocketService.subscribeToConversation(convId);
        markConversationAsRead();
      }
    };

    if (currentUserId) {
      initializeConversation();
    }

    return () => {
      if (conversationId) {
        websocketService.unsubscribeFromConversation(conversationId);
        dispatch(setCurrentConversationId(null));
      }
      hasInitializedConversation.current = false;
    };
  }, [userId, currentUserId, routeConversationId, dispatch, markConversationAsRead]);

  // ============ SCROLL TO BOTTOM WHEN OPENING CONVERSATION ============
  useEffect(() => {
    if (conversationId && flatListRef.current) {
      const isNewConversation = previousConversationId.current !== conversationId;
      const messageCount = conversationMessages.length;
      const hasScrolled = hasScrolledToBottom.current[conversationId];
      
      if (isNewConversation) {
        previousConversationId.current = conversationId;
        // Reset scroll flag when switching conversations
        hasScrolledToBottom.current[conversationId] = false;
        isAtBottom.current = true;
        setShowScrollToBottom(false);
        setUnreadCount(0);
      }
      
      // Scroll to bottom when opening conversation and messages are available
      // Only scroll if we haven't already scrolled for this conversation and not loading older messages
      if (messageCount > 0 && !hasScrolled && !isLoadingOlder.current) {
        const scrollToBottom = () => {
          if (flatListRef.current && previousConversationId.current === conversationId) {
            flatListRef.current.scrollToOffset({ offset: 0, animated: true });
            hasScrolledToBottom.current[conversationId] = true;
            isAtBottom.current = true;
            setShowScrollToBottom(false);
            setUnreadCount(0);
          }
        };
        
        // Use setTimeout to ensure FlatList has rendered
        const timeoutId = setTimeout(scrollToBottom, 200);
        return () => clearTimeout(timeoutId);
      }
    } else if (!conversationId) {
      // Reset when no conversation is selected
      previousConversationId.current = null;
    }
  }, [conversationId, conversationMessages.length]);

  // ============ MARK AS READ ON FOCUS ============
  useFocusEffect(
    useCallback(() => {
      if (conversationId) {
        const timer = setTimeout(markConversationAsRead, 300);
        return () => clearTimeout(timer);
      }
    }, [conversationId, markConversationAsRead])
  );

  // ============ DETECT NEW MESSAGES ============
  useEffect(() => {
    if (conversationMessages.length > lastMessageCount.current && lastMessageCount.current > 0) {
      const myUserId = currentUserId ? Number(currentUserId) : null;
      const latestMessage = conversationMessages[conversationMessages.length - 1];
      const isMyMessage = myUserId !== null && Number(latestMessage.sender_id) === myUserId;
      
      if (!isAtBottom.current && !isMyMessage) {
        setShowScrollToBottom(true);
        setUnreadCount(prev => prev + 1);
      } else if (isAtBottom.current && !isMyMessage) {
        // Auto-scroll to bottom if user is already at bottom and new message arrives
        setTimeout(() => {
          flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
          isAtBottom.current = true;
          setShowScrollToBottom(false);
          setUnreadCount(0);
        }, 100);
      }
    }
    lastMessageCount.current = conversationMessages.length;
  }, [conversationMessages.length, currentUserId, conversationMessages]);

  // ============ TYPING INDICATOR ============
  const handleTextChange = (text: string) => {
    setMessageText(text);
    if (conversationId && text.trim()) {
      websocketService.sendTyping(conversationId);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  // ============ SEND MESSAGE ============
  const handleSendMessage = async () => {
    if (!messageText.trim() || isSending) return;

    if (isEditingMessage && selectedMessage) {
      await handleSaveEditFromInput();
      return;
    }

    if (!conversationId) return;

    const text = messageText.trim();
    setMessageText('');
    setIsSending(true);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    const clientMessageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const wsSent = websocketService.sendMessage(conversationId, text, clientMessageId);

    if (!wsSent) {
      await dispatch(sendMessageAction(conversationId, text, clientMessageId));
    }
    
    setTimeout(() => {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      isAtBottom.current = true;
      setShowScrollToBottom(false);
      setUnreadCount(0);
    }, 100);
    
    setIsSending(false);
  };

  // ============ MEDIA HANDLING ============
  const handleSelectImage = () => {
    setShowMediaModal(false);
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1920,
        maxHeight: 1920,
      },
      (response: ImagePickerResponse) => {
        if (response.didCancel || response.errorMessage) {
          return;
        }
        const asset = response.assets?.[0];
        if (asset?.uri) {
          handleSendMedia(asset.uri, 'image', asset.fileName || 'image.jpg', asset.type || 'image/jpeg');
        }
      },
    );
  };

  const handleSelectVideo = () => {
    setShowMediaModal(false);
    launchImageLibrary(
      {
        mediaType: 'video',
        quality: 0.8,
      },
      (response: ImagePickerResponse) => {
        if (response.didCancel || response.errorMessage) {
          return;
        }
        const asset = response.assets?.[0];
        if (asset?.uri) {
          handleSendMedia(asset.uri, 'video', asset.fileName || 'video.mp4', asset.type || 'video/mp4');
        }
      },
    );
  };

  const handleSelectDocument = async () => {
    setShowMediaModal(false);
    try {
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
        copyTo: 'cachesDirectory',
      });

      if (result && result.length > 0) {
        const file = result[0];
        if (file.uri) {
          handleSendMedia(file.uri, 'file', file.name || 'document', file.type || 'application/octet-stream');
        }
      }
    } catch (err: any) {
      if (!DocumentPicker.isCancel(err)) {
        // Error picking document
      }
    }
  };

  // ============ OPEN FILE/DOCUMENT ============
  const getAbsoluteUrl = async (url: string): Promise<string> => {
    if (url.startsWith('http') || url.startsWith('file://') || url.startsWith('content://')) {
      return url;
    }
    if (url.startsWith('/')) {
      const baseURL = await getCurrentBaseURL();
      return `${baseURL}${url}`;
    }
    return `https://euniiq.com${url}`;
  };

  const handleOpenFile = async (fileUrl: string) => {
    if (!fileUrl) return;
    
    try {
      const url = await getAbsoluteUrl(fileUrl);
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Cannot open this file. Please try downloading it first.');
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to open file. Please try again.');
    }
  };

  const handleSendMedia = async (
    fileUri: string,
    mediaType: 'image' | 'video' | 'audio' | 'file',
    fileName: string,
    mimeType: string,
  ) => {
    if (!conversationId || uploadingMedia) return;

    if (!fileUri) {
      return;
    }

    setUploadingMedia(true);
    const clientMessageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await dispatch(
      sendMediaMessage(conversationId, fileUri, mediaType, fileName, mimeType, messageText.trim() || undefined, clientMessageId),
    );
    setMessageText('');
    
    setTimeout(() => {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      isAtBottom.current = true;
      setShowScrollToBottom(false);
      setUnreadCount(0);
    }, 100);
    
    setUploadingMedia(false);
  };

  const handleSaveEditFromInput = async () => {
    if (!selectedMessage || !messageText.trim() || !conversationId) {
      setIsEditingMessage(false);
      setSelectedMessage(null);
      setMessageText('');
      return;
    }

    setIsSending(true);
    const trimmedText = messageText.trim();
    
    const wsSent = websocketService.editMessage(selectedMessage.id, trimmedText);
    
    if (wsSent) {
      if (conversationId) {
        store.dispatch(updateMessage({ conversationId, messageId: selectedMessage.id, body: trimmedText }));
        
        const state = store.getState();
        const conversation = state.chat.conversations.find(c => c.conversation_id === conversationId);
        if (conversation?.last_message?.id === selectedMessage.id) {
          const updatedMessage = { ...selectedMessage, body: trimmedText };
          store.dispatch(updateConversationLastMessage({ conversationId, message: updatedMessage }));
        }
      }
    } else {
      await dispatch(editMessage(selectedMessage.id, trimmedText));
    }
    
    setIsEditingMessage(false);
    setSelectedMessage(null);
    setMessageText('');
    setIsSending(false);
  };

  const handleCancelEdit = () => {
    setIsEditingMessage(false);
    setSelectedMessage(null);
    setMessageText('');
    setShowMessageMenu(false);
    setShowHeaderDropdown(false);
  };

  // ============ LOAD OLDER MESSAGES WITH SCROLL POSITION PRESERVATION ============
  const loadOlderMessages = useCallback(async () => {
    if (
      !conversationId ||
      isLoadingOlder.current ||
      isLoadingMore ||
      !hasMoreMessages ||
      conversationMessages.length === 0
    ) {
      return;
    }

    const oldestMessage = conversationMessages[0];
    
    // Save current scroll position before loading
    // For inverted FlatList, offset 0 is at bottom, so we track the current offset
    previousScrollOffset.current = 0; // We'll get this from scroll event
    previousContentHeight.current = 0; // We'll track content height
    
    isLoadingOlder.current = true;
    setIsLoadingMore(true);

    await dispatch(fetchMessages(conversationId, oldestMessage.id, 20));
    
    // Note: Scroll position preservation for FlatList is handled in handleScroll
    // by tracking the content height difference
    
    setTimeout(() => {
      isLoadingOlder.current = false;
      setIsLoadingMore(false);
    }, 300);
  }, [conversationId, isLoadingMore, conversationMessages, hasMoreMessages, dispatch]);

  // ============ HANDLE SCROLL ============
  const handleScroll = useCallback((event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const scrollY = Math.abs(contentOffset.y); // For inverted list, y is negative
    const contentHeight = contentSize.height;
    const viewportHeight = layoutMeasurement.height;
    
    // For inverted FlatList, offset 0 means we're at the bottom (newest messages)
    const atBottom = scrollY < 50;
    isAtBottom.current = atBottom;
    
    if (atBottom) {
      setShowScrollToBottom(false);
      setUnreadCount(0);
    } else {
      // Show scroll to bottom button if not at bottom
      if (conversationMessages.length > 0) {
        setShowScrollToBottom(true);
      }
    }
    
    // Track content height for scroll position preservation when loading older messages
    if (isLoadingOlder.current) {
      previousContentHeight.current = contentHeight;
    }
    
    // Load older messages when near the top (end of inverted list)
    const distanceFromEnd = contentHeight - scrollY - viewportHeight;
    
    if (distanceFromEnd < 300 && !isLoadingOlder.current && !isLoadingMore && hasMoreMessages) {
      loadOlderMessages();
    }
  }, [loadOlderMessages, isLoadingMore, hasMoreMessages, conversationMessages.length]);

  // ============ SCROLL TO BOTTOM FUNCTION ============
  const scrollToBottom = () => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    isAtBottom.current = true;
    setShowScrollToBottom(false);
    setUnreadCount(0);
  };

  // ============ RENDER FUNCTIONS ============
  const handleMessagePress = (item: Message) => (e: any) => {
    e.stopPropagation();
    
    const senderId = Number(item.sender_id);
    const myUserId = currentUserId ? Number(currentUserId) : null;
    const isMyMessage = myUserId !== null && senderId === myUserId;
    const isSelected = selectedMessage && item.id === selectedMessage.id && !isEditingMessage;
    
    if (selectedMessage && !isEditingMessage) {
      if (isSelected) {
        setSelectedMessage(null);
        setShowMessageMenu(false);
        setShowHeaderDropdown(false);
      } else if (isMyMessage && item.id) {
        setSelectedMessage(item);
        setShowMessageMenu(false);
        setShowHeaderDropdown(false);
      }
    }
  };

  const handleImagePress = async (imageUrl: string) => {
    setFullScreenImage(imageUrl);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    return (
      <ChatMessage
        item={item}
        currentUserId={currentUserId}
        userName={userName}
        userAvatar={userAvatar}
        selectedMessage={selectedMessage}
        isEditingMessage={isEditingMessage}
        onMessagePress={handleMessagePress(item)}
        onMessageLongPress={handleMessageLongPress}
        onImagePress={handleImagePress}
        onFilePress={handleOpenFile}
      />
    );
  };

  const renderTypingIndicator = () => {
    if (!conversationId || !typingUsers[conversationId] || typingUsers[conversationId].length === 0) {
      return null;
    }

    return (
      <View style={styles.typingContainer}>
        <Text style={styles.typingText}>{userName} is typing...</Text>
      </View>
    );
  };

  const keyExtractor = (item: Message) => {
    return `msg_${item.id || item.client_message_id}`;
  };

  const menuButtonRefs = useRef<{ [key: number]: View | null }>({});

  const handleMessageLongPress = (message: Message) => {
    const senderId = Number(message.sender_id);
    const myUserId = currentUserId ? Number(currentUserId) : null;
    const isMyMessage = myUserId !== null && senderId === myUserId;
    
    if (isMyMessage && message.id) {
      setSelectedMessage(message);
      setShowMessageMenu(false);
      setShowHeaderDropdown(false);
    }
  };

  const handleMenuButtonPress = (message: Message) => {
    const senderId = Number(message.sender_id);
    const myUserId = currentUserId ? Number(currentUserId) : null;
    const isMyMessage = myUserId !== null && senderId === myUserId;
    
    if (isMyMessage && message.id) {
      const buttonRef = menuButtonRefs.current[message.id];
      if (buttonRef) {
        buttonRef.measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
          setMenuButtonLayout({ x: pageX, y: pageY, width, height });
          setSelectedMessage(message);
          setShowMessageMenu(true);
        });
      } else {
        // Fallback if measure fails
        setSelectedMessage(message);
        setShowMessageMenu(true);
      }
    }
  };

  const handleCloseMenu = () => {
    setShowMessageMenu(false);
    setShowHeaderDropdown(false);
    if (!isEditingMessage) {
      setSelectedMessage(null);
    }
    setMenuButtonLayout(null);
  };

  const handleDeselectMessage = () => {
    if (selectedMessage && !isEditingMessage) {
      setSelectedMessage(null);
      setShowMessageMenu(false);
      setShowHeaderDropdown(false);
      setMenuButtonLayout(null);
    }
  };

  const handleHeaderMenuPress = () => {
    setShowHeaderDropdown(!showHeaderDropdown);
  };

  const handleEditMessage = () => {
    if (selectedMessage) {
      setMessageText(selectedMessage.body);
      setIsEditingMessage(true);
      setShowMessageMenu(false);
      setShowHeaderDropdown(false);
    }
  };

  const handleDeleteMessage = async () => {
    if (selectedMessage && conversationId) {
      const wsSent = websocketService.deleteMessage(selectedMessage.id);
      
      if (wsSent) {
        store.dispatch(removeMessage({ conversationId, messageId: selectedMessage.id }));
      } else {
        await dispatch(deleteMessage(selectedMessage.id));
      }
      
      handleCloseMenu();
      if (isEditingMessage && selectedMessage) {
        setIsEditingMessage(false);
        setMessageText('');
        setSelectedMessage(null);
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />

      <View style={[styles.header, isEditingMessage && styles.headerEditing]}>
        <TouchableOpacity style={styles.backButton} onPress={() => {
          if (isEditingMessage) {
            handleCancelEdit();
          } else {
            navigation.goBack();
          }
        }}>
          <ArrowLeft size={24} color="#0A1014" />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          {!isEditingMessage && (
            <>
              {userAvatar ? (
                <Image source={{ uri: userAvatar }} style={styles.headerAvatar} />
              ) : (
                <Avatar label={userName} size={40} />
              )}
              <TouchableOpacity
                style={styles.headerText}
                onPress={() => {
                  navigation.navigate('UserProfile', { userId });
                }}
                activeOpacity={0.7}>
                <Text style={styles.headerName} numberOfLines={1}>
                  {userName}
                </Text>
              </TouchableOpacity>
            </>
          )}
          {isEditingMessage && (
            <View style={styles.headerText}>
              <Text style={styles.headerName} numberOfLines={1}>
                Edit message
              </Text>
            </View>
          )}
        </View>

        {selectedMessage && !isEditingMessage && (
          <TouchableOpacity
            style={styles.headerMenuButton}
            onPress={handleHeaderMenuPress}
            activeOpacity={0.7}>
            <MoreVertical size={24} color="#0A1014" />
          </TouchableOpacity>
        )}
      </View>

      {isLoading && conversationMessages.length === 0 ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      ) : (
        <View style={[styles.messagesContainer, isEditingMessage && styles.messagesContainerEditing]}>
          <TouchableWithoutFeedback onPress={handleDeselectMessage}>
            <View style={styles.messagesWrapper}>
              {isEditingMessage && (
                <View style={styles.editModeOverlay} pointerEvents="none" />
              )}
              {renderTypingIndicator()}
              <FlatList
                ref={flatListRef}
                data={reversedMessages}
                renderItem={renderMessage}
                keyExtractor={keyExtractor}
                contentContainerStyle={styles.messagesList}
                showsVerticalScrollIndicator={true}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                inverted={true}
                scrollEnabled={true}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="none"
                onEndReached={() => {
                  if (!isLoadingOlder.current && !isLoadingMore && hasMoreMessages) {
                    loadOlderMessages();
                  }
                }}
                onEndReachedThreshold={0.5}
                removeClippedSubviews={Platform.OS === 'android'}
                windowSize={10}
                maxToRenderPerBatch={20}
                initialNumToRender={20}
                ListFooterComponent={
                  isLoadingMore ? (
                    <View style={styles.loadMoreContainer}>
                      <ActivityIndicator size="small" color="#6366F1" />
                      <Text style={styles.loadingText}>Loading older messages...</Text>
                    </View>
                  ) : null
                }
              />
              
              {showScrollToBottom && (
                <TouchableOpacity 
                  style={styles.scrollToBottomButton} 
                  onPress={scrollToBottom}
                  activeOpacity={0.8}>
                  <View style={styles.scrollToBottomContent}>
                    <Text style={styles.scrollToBottomArrow}>↓</Text>
                    {unreadCount > 0 && (
                      <View style={styles.unreadBadge}>
                        <Text style={styles.unreadBadgeText}>
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      )}

      {showHeaderDropdown && selectedMessage && !isEditingMessage && (
        <View style={styles.headerDropdownContainer}>
          <Pressable style={styles.headerDropdownOverlay} onPress={handleCloseMenu}>
            <Pressable
              style={styles.headerDropdownMenu}
              onPress={(e) => e.stopPropagation()}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleEditMessage}
                activeOpacity={0.7}>
                <Pencil size={18} color="#3B82F6" />
                <Text style={styles.menuItemText}>Edit</Text>
              </TouchableOpacity>
              <View style={styles.menuDivider} />
              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleDeleteMessage}
                activeOpacity={0.7}>
                <Trash2 size={18} color="#EF4444" />
                <Text style={[styles.menuItemText, styles.deleteText]}>Delete</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </View>
      )}
      
      {(isSending || uploadingMedia) && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingOverlayContent}>
            <ActivityIndicator size="large" color="#1A59C5" />
            <Text style={styles.loadingOverlayText}>
              {uploadingMedia ? 'Sending media...' : 'Sending message...'}
            </Text>
          </View>
        </View>
      )}
      
      <Modal
        visible={fullScreenImage !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setFullScreenImage(null)}>
        <View style={styles.fullScreenImageContainer}>
          <TouchableOpacity
            style={styles.fullScreenImageCloseButton}
            onPress={() => setFullScreenImage(null)}>
            <X size={24} color="#FFFFFF" />
          </TouchableOpacity>
          {fullScreenImage && (
            <Image
              source={{ uri: fullScreenImage }}
              style={styles.fullScreenImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
      
      <View style={[styles.inputContainer, isEditingMessage && styles.inputContainerEditing]}>
        {isEditingMessage && selectedMessage && (
          <View style={styles.editPreviewBubble}>
              <Text style={styles.editPreviewText} numberOfLines={2}>
                {selectedMessage.body}
              </Text>
            </View>
        )}
        <View style={styles.inputRow}>
          {!isEditingMessage && (
            <TouchableOpacity
              style={styles.attachButton}
              onPress={() => setShowMediaModal(true)}
              disabled={isSendingMessage}>
              {isSendingMessage ? (
                <ActivityIndicator size="small" color="#1A59C5" />
              ) : (
                <Plus size={24} color="#1A59C5" />
              )}
            </TouchableOpacity>
          )}
          <TextInput
            style={styles.input}
            placeholder={isEditingMessage ? "Edit your message..." : "Type a message..."}
            placeholderTextColor="#9CA3AF"
            value={messageText}
            onChangeText={handleTextChange}
            multiline
            maxLength={500}
            editable={!isSendingMessage}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              ((!messageText.trim() && !isSendingMessage) || isSendingMessage) && styles.sendButtonDisabled,
            ]}
            onPress={handleSendMessage}
            disabled={(!messageText.trim() && !isSendingMessage) || isSendingMessage}>
            {isSendingMessage ? (
              <ActivityIndicator size="small" color="white" />
            ) : isEditingMessage ? (
              <Check size={20} color={messageText.trim() ? 'white' : '#9CA3AF'} />
            ) : (
              <Send size={20} color={messageText.trim() ? 'white' : '#9CA3AF'} />
            )}
          </TouchableOpacity>
        </View>
        
        <Modal
          visible={showMediaModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowMediaModal(false)}>
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowMediaModal(false)}>
            <Pressable
              style={styles.mediaModalContent}
              onPress={(e) => e.stopPropagation()}>
              <View style={styles.mediaModalHeader}>
                <Text style={styles.mediaModalTitle}>Send Media</Text>
                <TouchableOpacity onPress={() => setShowMediaModal(false)}>
                  <X size={24} color="#111827" />
                </TouchableOpacity>
              </View>
              <View style={styles.mediaOptions}>
                <TouchableOpacity
                  style={styles.mediaOption}
                  onPress={handleSelectImage}>
                  <View style={[styles.mediaOptionIcon, { backgroundColor: '#E0F2FE' }]}>
                    <ImageIcon size={28} color="#1A59C5" />
                  </View>
                  <Text style={styles.mediaOptionText}>Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.mediaOption}
                  onPress={handleSelectVideo}>
                  <View style={[styles.mediaOptionIcon, { backgroundColor: '#FCE7F3' }]}>
                    <VideoIcon size={28} color="#EC4899" />
                  </View>
                  <Text style={styles.mediaOptionText}>Video</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.mediaOption}
                  onPress={handleSelectDocument}>
                  <View style={[styles.mediaOptionIcon, { backgroundColor: '#FEF3C7' }]}>
                    <File size={28} color="#F59E0B" />
                  </View>
                  <Text style={styles.mediaOptionText}>Document</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    flex: 1,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  headerName: {
    fontSize: 18,
    fontWeight: '400',
    color: '#1B2125',
  },
  headerMenuButton: {
    padding: 8,
    marginLeft: 8,
  },
  headerEditing: {
    zIndex: 700,
    position: 'relative',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },
  menuButton: {
    padding: 4,
    marginTop: -2,
  },
  typingContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  typingText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#9CA3AF',
  },
  loadMoreContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12,
    color: '#9CA3AF',
  },
  inputContainer: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingBottom: Platform.OS === 'ios' ? 20 : 12,
  },
  editPreviewContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  editPreviewBubble: {
    backgroundColor: '#1A59C5',
    paddingHorizontal: 16,
    position: 'absolute',
    right: 20,
    bottom: 90,
    paddingVertical: 12,
    borderRadius: 18,
    borderTopRightRadius: 4,
  },
  editPreviewLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
    fontWeight: '500',
  },
  editPreviewText: {
    fontSize: 15,
    color: 'white',
    lineHeight: 20,
  },
  editIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    backgroundColor: '#FEF3C7',
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
  },
  editIndicatorText: {
    fontSize: 14,
    color: '#92400E',
    fontWeight: '500',
  },
  cancelEditButton: {
    padding: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1A59C5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#F3F4F6',
  },
  scrollToBottomButton: {
    position: 'absolute',
    right: 20,
    bottom: 80,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollToBottomContent: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollToBottomArrow: {
    fontSize: 24,
    color: '#6366F1',
    fontWeight: 'bold',
  },
  unreadBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  dropdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 8,
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1000,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  deleteText: {
    color: '#EF4444',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 4,
  },
  editingMessageContainer: {
    zIndex: 100,
    elevation: 100,
    position: 'relative',
    backgroundColor: 'transparent',
  },
  editModeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    zIndex: 1,
    pointerEvents: 'none',
  },
  editingMessageOverlay: {
    zIndex: 100,
    elevation: 100,
    position: 'relative',
  },
  headerDropdownContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  headerDropdownOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  headerDropdownMenu: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 100 : 80,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 8,
    minWidth: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1001,
  },
  messagesContainer: {
    flex: 1,
    position: 'relative',
    zIndex: 1,
  },
  messagesWrapper: {
    flex: 1,
  },
  messagesContainerEditing: {
    zIndex: 1,
    opacity: 0.4,
  },
  inputContainerEditing: {
    zIndex: 700,
    position: 'relative',
  },
  attachButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  mediaModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  mediaModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  mediaModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  mediaOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    gap: 20,
  },
  mediaOption: {
    alignItems: 'center',
    gap: 8,
  },
  mediaOptionIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  loadingOverlayContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    minWidth: 200,
  },
  loadingOverlayText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginTop: 8,
  },
  fullScreenImageContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImageCloseButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 40,
    right: 20,
    zIndex: 1000,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
});

export default ChatScreen;


