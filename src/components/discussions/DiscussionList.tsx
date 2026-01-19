import { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Plus,
  Pencil,
  Trash2,
  MoreVertical,
  Lock,
} from 'lucide-react';
import {
  useGetDiscussionsBySubjectQuery,
  useDeleteDiscussionMutation,
  useLockDiscussionMutation,
} from '../../redux/api/discussionApi';
import { useAppSelector } from '../../redux/hooks';

interface DiscussionListProps {
  subjectId: number;
  classroomId?: number;
  userRole: string;
  onAddDiscussion?: () => void;
  onDiscussionClick?: (discussion: any) => void;
}

const DiscussionList: React.FC<DiscussionListProps> = ({
  subjectId,
  classroomId,
  userRole,
  onAddDiscussion,
  onDiscussionClick,
}) => {
  const [menuVisibleForId, setMenuVisibleForId] = useState<number | null>(null);
  const [lockingDiscussionId, setLockingDiscussionId] = useState<number | null>(null);
  const [deletingDiscussionId, setDeletingDiscussionId] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const { data: allDiscussion = [], isLoading } = useGetDiscussionsBySubjectQuery(
    {
      subjectId,
      classroomId,
    },
    {
      skip: !subjectId,
    }
  );

  const [deleteDiscussion] = useDeleteDiscussionMutation();
  const [lockDiscussion] = useLockDiscussionMutation();

  // Close menu when clicking outside
  useEffect(() => {
    if (menuVisibleForId !== null) {
      const handleClickOutside = (event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
          setMenuVisibleForId(null);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [menuVisibleForId]);

  const handleMenuPress = (discussion: any, event: React.MouseEvent) => {
    event.stopPropagation();
    if (menuVisibleForId === discussion.id) {
      setMenuVisibleForId(null);
    } else {
      setMenuVisibleForId(discussion.id);
    }
  };

  const handleCloseMenu = () => {
    setMenuVisibleForId(null);
  };

  const handleEditDiscussion = (discussion: any) => {
    handleCloseMenu();
    // Navigate to edit discussion page or show modal
    alert('Edit Discussion functionality - to be implemented');
  };

  const handleDeleteDiscussion = async (discussionId: number) => {
    handleCloseMenu();
    if (!window.confirm('Are you sure you want to delete this discussion?')) {
      return;
    }

    setDeletingDiscussionId(discussionId);
    try {
      await deleteDiscussion(discussionId).unwrap();
    } catch (error) {
      console.error('Error deleting discussion:', error);
      alert('Failed to delete discussion. Please try again.');
    } finally {
      setDeletingDiscussionId(null);
    }
  };

  const handleLockDiscussion = async (discussion: any) => {
    handleCloseMenu();
    setLockingDiscussionId(discussion.id);
    const newLockState = !discussion.is_locked;
    try {
      await lockDiscussion({
        discussionId: discussion.id,
        isLocked: newLockState,
      }).unwrap();
    } catch (error) {
      console.error('Error locking discussion:', error);
      alert('Failed to lock/unlock discussion. Please try again.');
    } finally {
      setLockingDiscussionId(null);
    }
  };

  const handleDiscussionPress = (discussion: any) => {
    if (menuVisibleForId === discussion.id) {
      return;
    }
    if (onDiscussionClick) {
      onDiscussionClick(discussion);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const discussions = Array.isArray(allDiscussion) ? allDiscussion : [];

  if (discussions.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 text-lg mb-4">No discussions yet</p>
        {onAddDiscussion && (
          <button
            onClick={onAddDiscussion}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            Start a Discussion
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add Discussion Button */}
      {onAddDiscussion && (
        <div className="flex justify-end mb-4">
          <button
            onClick={onAddDiscussion}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition shadow-sm"
          >
            <Plus className="w-5 h-5" />
            <span>Add Discussion</span>
          </button>
        </div>
      )}

      {/* Discussions List */}
      <div className="space-y-2">
        {discussions.map((discussion: any) => {
          const showMenu = discussion.is_mine === true || userRole === 'teacher';
          const isMenuOpen = menuVisibleForId === discussion.id;
          const isLocked = discussion.is_locked === true;
          const isLocking = lockingDiscussionId === discussion.id;
          const isDeleting = deletingDiscussionId === discussion.id;

          return (
            <div
              key={discussion.id}
              className={`relative bg-white rounded-lg border border-gray-200 hover:shadow-md transition ${
                (isLocking || isDeleting) ? 'opacity-60' : ''
              }`}
            >
              <div
                onClick={() => handleDiscussionPress(discussion)}
                className={`p-4 cursor-pointer ${isMenuOpen ? 'pointer-events-none' : ''}`}
              >
                {isLocking ? (
                  <div className="flex items-center justify-center py-8 gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
                    <span className="text-gray-600 font-medium">
                      {discussion.is_locked ? 'Unlocking...' : 'Locking...'}
                    </span>
                  </div>
                ) : isDeleting ? (
                  <div className="flex items-center justify-center py-8 gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                    <span className="text-gray-600 font-medium">Deleting...</span>
                  </div>
                ) : (
                  <div className="flex items-start space-x-4">
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <MessageSquare className="w-5 h-5 text-purple-600" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{discussion.title}</h3>
                            {isLocked && (
                              <Lock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            {!isLocked && (
                              <>
                                <span>{discussion.replies?.length || 0} Replies</span>
                                <span>•</span>
                              </>
                            )}
                            <span>{new Date(discussion.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>

                        {/* Menu Button */}
                        {showMenu && (
                          <button
                            onClick={(e) => handleMenuPress(discussion, e)}
                            className="flex-shrink-0 p-2 hover:bg-gray-100 rounded-lg transition"
                            disabled={isLocking || isDeleting}
                          >
                            <MoreVertical className="w-5 h-5 text-gray-600" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Menu Dropdown */}
              {isMenuOpen && showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={handleCloseMenu}
                  />
                  <div
                    ref={menuRef}
                    className="absolute right-4 top-16 bg-white rounded-lg shadow-lg border border-gray-200 z-20 min-w-[150px]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {userRole === 'teacher' && (
                      <>
                        <button
                          onClick={() => handleLockDiscussion(discussion)}
                          className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition text-left"
                          disabled={lockingDiscussionId === discussion.id}
                        >
                          <Lock
                            className={`w-4 h-4 ${
                              discussion.is_locked ? 'text-green-600' : 'text-red-600'
                            }`}
                          />
                          <span className="text-gray-900 font-medium">
                            {discussion.is_locked ? 'Unlock' : 'Lock'}
                          </span>
                        </button>
                        <div className="border-t border-gray-200" />
                      </>
                    )}
                    <button
                      onClick={() => handleEditDiscussion(discussion)}
                      className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition text-left"
                    >
                      <Pencil className="w-4 h-4 text-blue-600" />
                      <span className="text-gray-900 font-medium">Edit</span>
                    </button>
                    <div className="border-t border-gray-200" />
                    <button
                      onClick={() => handleDeleteDiscussion(discussion.id)}
                      className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition text-left"
                      disabled={deletingDiscussionId === discussion.id}
                    >
                      {deletingDiscussionId === discussion.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                      ) : (
                        <Trash2 className="w-4 h-4 text-red-600" />
                      )}
                      <span className="text-red-600 font-medium">Delete</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DiscussionList;

