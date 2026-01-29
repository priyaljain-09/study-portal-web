import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../redux/hooks';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import {
  useGetDiscussionByIdQuery,
  useSubmitDiscussionReplyMutation,
  useUpdateReplyMutation,
  useDeleteReplyMutation,
  useLikeReplyMutation,
} from '../redux/api/discussionApi';
import HTMLContentViewer from '../components/HTMLContentViewer';
import Avatar from '../components/Avatar';
import { Send, Heart, MoreVertical, Pencil, Trash2 } from 'lucide-react';

const formatDate = (isoDate: string | undefined): string => {
  if (!isoDate) return 'Invalid date';

  const date = new Date(isoDate);
  if (isNaN(date.getTime())) return 'Invalid date';

  const options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  };

  return new Intl.DateTimeFormat('en-GB', options)
    .format(date)
    .replace(',', ' at');
};

// Helper function to format relative time like YouTube
const formatRelativeTime = (isoDate: string): string => {
  const date = new Date(isoDate);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)}w ago`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
  return `${Math.floor(diffInSeconds / 31536000)}y ago`;
};

const DiscussionDetail = () => {
  const { subjectId, discussionId } = useParams<{ subjectId: string; discussionId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const userProfile = useAppSelector((state) => state.applicationData.userProfile);
  const userRole = useAppSelector((state) => state.applicationData.userRole) || localStorage.getItem('userRole') || 'student';

  const { data: discussionDetails, isLoading } = useGetDiscussionByIdQuery(Number(discussionId), {
    skip: !discussionId,
  });

  const [submitReply, { isLoading: isSubmittingReply }] = useSubmitDiscussionReplyMutation();
  const [updateReply] = useUpdateReplyMutation();
  const [deleteReply] = useDeleteReplyMutation();
  const [likeReply] = useLikeReplyMutation();

  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [menuVisibleForReplyId, setMenuVisibleForReplyId] = useState<number | null>(null);
  const [editingReply, setEditingReply] = useState<any>(null);
  const [editReplyText, setEditReplyText] = useState('');
  const [likingReplyId, setLikingReplyId] = useState<number | null>(null);
  const [updatingReplyId, setUpdatingReplyId] = useState<number | null>(null);
  const [deletingReplyId, setDeletingReplyId] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const userInitial = userProfile?.user?.first_name?.charAt(0) ||
    userProfile?.user?.username?.charAt(0) ||
    'S';


  // Close menu when clicking outside
  useEffect(() => {
    if (menuVisibleForReplyId !== null) {
      const handleClickOutside = (event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
          setMenuVisibleForReplyId(null);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [menuVisibleForReplyId]);

  const handleReply = () => {
    if (discussionDetails?.is_locked) {
      alert('This discussion is locked. You cannot reply.');
      return;
    }
    setShowReplyInput(true);
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) {
      alert('Please enter a reply before sending.');
      return;
    }
    if (discussionDetails?.is_locked) {
      alert('This discussion is locked. You cannot reply.');
      return;
    }
    try {
      await submitReply({
        discussionId: Number(discussionId),
        replyData: { message: replyText },
      }).unwrap();
      setReplyText('');
      setShowReplyInput(false);
    } catch (error) {
      console.error('Error submitting reply:', error);
    }
  };

  const handleLikeReply = async (replyId: number) => {
    if (likingReplyId === replyId) return;

    setLikingReplyId(replyId);

    try {
      await likeReply(replyId).unwrap();
      // The optimistic update in the API will automatically update the cache
      // The component will re-render with the updated discussionDetails
      setLikingReplyId(null);
    } catch (error) {
      setLikingReplyId(null);
      console.error('Error liking reply:', error);
    }
  };

  const handleReplyMenuPress = (replyId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    if (menuVisibleForReplyId === replyId) {
      setMenuVisibleForReplyId(null);
    } else {
      setMenuVisibleForReplyId(replyId);
    }
  };

  const handleCloseReplyMenu = () => {
    setMenuVisibleForReplyId(null);
  };

  const handleEditReply = (reply: any) => {
    setMenuVisibleForReplyId(null);
    setEditingReply(reply);
    const messageText = reply.message || reply.content || '';
    const plainText = messageText.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
    setEditReplyText(plainText || messageText);
  };

  const handleCancelEdit = () => {
    setEditingReply(null);
    setEditReplyText('');
  };

  const handleSaveEditReply = async () => {
    if (!editReplyText.trim()) {
      alert('Please enter a reply before saving.');
      return;
    }

    if (!editingReply) return;

    setUpdatingReplyId(editingReply.id);
    try {
      await updateReply({
        replyId: editingReply.id,
        replyData: { message: editReplyText },
        discussionId: Number(discussionId),
      }).unwrap();
      setEditingReply(null);
      setEditReplyText('');
    } catch (error) {
      console.error('Error updating reply:', error);
    } finally {
      setUpdatingReplyId(null);
    }
  };

  const handleDeleteReply = (replyId: number) => {
    setMenuVisibleForReplyId(null);
    if (!window.confirm('Are you sure you want to delete this reply?')) {
      return;
    }

    setDeletingReplyId(replyId);
    deleteReply(replyId)
      .unwrap()
      .then(() => {
        // Reply deleted successfully, cache will be updated automatically
      })
      .catch((error) => {
        console.error('Error deleting reply:', error);
      })
      .finally(() => {
        setDeletingReplyId(null);
      });
  };

  // Check if user can edit/delete a reply
  const canEditReply = (reply: any) => {
    return reply.is_mine === true;
  };

  const canDeleteReply = (reply: any) => {
    return userRole === 'teacher' || reply.is_mine === true;
  };

  const showReplyMenu = (reply: any) => {
    return canEditReply(reply) || canDeleteReply(reply);
  };

  if (isLoading || !discussionDetails) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar activePath={`/subject/${subjectId}`} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header
            userInitial={userInitial}
            userName={userProfile?.user?.first_name || userProfile?.user?.username}
            onBackClick={() => {
            const getRoutePath = (path: string) => {
              if (userRole === 'teacher' && location.state?.classroomId) {
                return `/classroom/${location.state.classroomId}${path}`;
              }
              return path;
            };
            navigate(`${getRoutePath(`/subject/${subjectId}`)}?tab=discussion`);
          }}
          />
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activePath={`/subject/${subjectId}`} />

      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Header
          userInitial={userInitial}
          userName={userProfile?.user?.first_name || userProfile?.user?.username}
          onBackClick={() => {
            const getRoutePath = (path: string) => {
              if (userRole === 'teacher' && location.state?.classroomId) {
                return `/classroom/${location.state.classroomId}${path}`;
              }
              return path;
            };
            navigate(`${getRoutePath(`/subject/${subjectId}`)}?tab=discussion`);
          }}
        />

        <div className="flex-1 overflow-y-auto bg-white" style={{ paddingBottom: '100px' }}>
          <div className="p-8">
            {/* Author Info */}
            <div className="flex items-center gap-4 mb-6">
              <Avatar label={discussionDetails?.author_name || ''} size={60} />
              <div>
                <p className="text-base font-semibold text-blue-700">
                  {discussionDetails?.author_name}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {discussionDetails?.teacher_role?.toUpperCase()} Posted {formatDate(discussionDetails?.created_at)}
                </p>
              </div>
            </div>

            {/* Discussion Content */}
            <div className="border-b border-gray-200 pb-6 mb-6">
              <h1 className="text-xl font-semibold text-gray-900 mb-4">
                {discussionDetails?.title}
              </h1>
              <HTMLContentViewer
                html={discussionDetails.content || ''}
                textColor="#374151"
              />
            </div>

            {/* Comments Section */}
            <div>
              {!discussionDetails?.is_locked && (
                <div className="mb-6">
                  <h2 className="text-base font-semibold text-gray-900">
                    {discussionDetails?.replies?.length || 0} Comments
                  </h2>
                </div>
              )}

              {discussionDetails?.replies?.length === 0 ? (
                !discussionDetails?.is_locked && (
                  <div className="py-12 text-center">
                    <p className="text-sm text-gray-600">
                      No comments yet. Be the first to comment!
                    </p>
                  </div>
                )
              ) : (
                <div className="space-y-4">
                  {discussionDetails?.replies?.map((reply: any) => (
                    <div
                      key={reply.id}
                      className={`flex gap-3 ${deletingReplyId === reply.id ? 'opacity-60' : ''}`}
                    >
                      {deletingReplyId === reply.id ? (
                        <div className="flex-1 flex items-center justify-center py-8 gap-3">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
                          <span className="text-sm text-gray-600 font-medium">Deleting...</span>
                        </div>
                      ) : (
                        <>
                          <Avatar label={reply?.author_name || ''} size={36} />

                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-gray-900">
                                  {reply.author_name}
                                </span>
                                <span className="text-xs text-gray-600">
                                  {formatRelativeTime(reply.created_at)}
                                </span>
                              </div>

                              {/* Three dots menu for edit/delete */}
                              {showReplyMenu(reply) && (
                                <div className="relative" ref={menuRef}>
                                  <button
                                    onClick={(e) => handleReplyMenuPress(reply.id, e)}
                                    className="p-1 hover:bg-gray-100 rounded transition"
                                  >
                                    <MoreVertical className="w-4 h-4 text-gray-600" />
                                  </button>

                                  {/* Dropdown Menu */}
                                  {menuVisibleForReplyId === reply.id && (
                                    <>
                                      <div
                                        className="fixed inset-0 z-10"
                                        onClick={handleCloseReplyMenu}
                                      />
                                      <div
                                        className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-200 z-20 min-w-[140px]"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        {canEditReply(reply) && (
                                          <button
                                            onClick={() => handleEditReply(reply)}
                                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-left"
                                          >
                                            <Pencil className="w-4 h-4 text-blue-600" />
                                            <span className="text-sm font-medium text-gray-900">Edit</span>
                                          </button>
                                        )}
                                        {canEditReply(reply) && canDeleteReply(reply) && (
                                          <div className="border-t border-gray-200" />
                                        )}
                                        {canDeleteReply(reply) && (
                                          <button
                                            onClick={() => handleDeleteReply(reply.id)}
                                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-left"
                                          >
                                            <Trash2 className="w-4 h-4 text-red-600" />
                                            <span className="text-sm font-medium text-red-600">Delete</span>
                                          </button>
                                        )}
                                      </div>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Show edit input or regular content */}
                            {editingReply?.id === reply.id ? (
                              <div className="mb-2">
                                <textarea
                                  value={editReplyText}
                                  onChange={(e) => setEditReplyText(e.target.value)}
                                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 min-h-[60px] focus:outline-none focus:ring-2 focus:ring-purple-500"
                                  maxLength={500}
                                  autoFocus
                                  disabled={updatingReplyId === reply.id}
                                />
                                <div className="flex justify-end gap-2 mt-2">
                                  <button
                                    onClick={handleCancelEdit}
                                    disabled={updatingReplyId === reply.id}
                                    className="px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-md hover:bg-gray-50 transition disabled:opacity-50"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={handleSaveEditReply}
                                    disabled={updatingReplyId === reply.id || !editReplyText.trim()}
                                    className="px-3 py-1.5 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 transition disabled:opacity-50"
                                  >
                                    {updatingReplyId === reply.id ? (
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    ) : (
                                      'Save'
                                    )}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="mb-2">
                                <HTMLContentViewer
                                  html={reply.message || ''}
                                  textColor="#0f0f0f"
                                />
                              </div>
                            )}

                            {/* Like Button */}
                            <button
                              onClick={() => handleLikeReply(reply.id)}
                              disabled={likingReplyId === reply.id}
                              className="flex items-center gap-1 px-2 py-1 -ml-2 hover:bg-gray-100 rounded transition disabled:opacity-50"
                            >
                              {likingReplyId === reply.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                              ) : (
                                (() => {
                                  // Use reply data directly from API (updated by optimistic update)
                                  const isLiked = reply.liked_by_me === true || reply.is_liked_by_me === true;
                                  const likeCount = reply.like_count || 0;

                                  return (
                                    <>
                                      <Heart
                                        className="w-4 h-4 transition-colors"
                                        style={{ 
                                          color: isLiked ? '#ef4444' : '#606060',
                                          fill: isLiked ? '#ef4444' : 'none'
                                        }}
                                      />
                                      <span className={`text-xs font-medium transition-colors ${isLiked ? 'text-red-600' : 'text-gray-600'}`}>
                                        {likeCount}
                                      </span>
                                    </>
                                  );
                                })()
                              )}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Reply Input or Button - Fixed at Bottom */}
        {!discussionDetails?.is_locked && (
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-8 py-4 z-10">
            {showReplyInput ? (
              <div className="flex items-center gap-3">
                <Avatar label="You" size={32} />
                <div className="flex-1 flex items-center gap-2">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    rows={1}
                    maxLength={500}
                    disabled={isSubmittingReply}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendReply();
                      }
                    }}
                  />
                  <button
                    onClick={handleSendReply}
                    disabled={isSubmittingReply || !replyText.trim()}
                    className={`p-2 rounded-full transition ${
                      replyText.trim() ? 'bg-primary hover:bg-primary/90' : 'bg-gray-300 cursor-not-allowed'
                    }`}
                  >
                    {isSubmittingReply ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Send className="w-4 h-4 text-white" />
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={handleReply}
                className="flex items-center gap-3 w-full"
              >
                <Avatar label="You" size={32} />
                <span className="text-sm text-gray-600">Add a comment...</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DiscussionDetail;

