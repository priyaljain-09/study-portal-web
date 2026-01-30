import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../redux/hooks';
import Sidebar from '../layout/Sidebar';
import Header from '../layout/Header';
import { useCreateDiscussionMutation, useUpdateDiscussionMutation, useGetDiscussionByIdQuery } from '../../redux/api/discussionApi';
import RichTextEditor from '../editor/RichTextEditor';

const AddDiscussion = () => {
  const { subjectId, discussionId } = useParams<{ subjectId: string; discussionId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const userProfile = useAppSelector((state) => state.applicationData.userProfile);
  const userRole = useAppSelector((state) => state.applicationData.userRole) || localStorage.getItem('userRole') || 'student';

  // Get data from location state
  const { subjectName, classroomId, discussion: discussionFromState } = location.state || {};
  const isEditMode = !!discussionId || !!discussionFromState;

  // Fetch discussion data if we have discussionId but no discussion in state
  const { data: fetchedDiscussion } = useGetDiscussionByIdQuery(
    discussionId ? Number(discussionId) : 0,
    { skip: !discussionId || !!discussionFromState }
  );

  // Use discussion from state if available, otherwise use fetched discussion
  const discussion = discussionFromState || fetchedDiscussion;

  const [createDiscussion, { isLoading: isCreating }] = useCreateDiscussionMutation();
  const [updateDiscussion, { isLoading: isUpdating }] = useUpdateDiscussionMutation();

  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');

  // Update form when discussion data is available
  useEffect(() => {
    if (discussion) {
      setTitle(discussion.title || '');
      setContent(discussion.content || '');
    }
  }, [discussion]);

  const isSaving = isCreating || isUpdating;

  const userInitial = userProfile?.user?.first_name?.charAt(0) ||
    userProfile?.user?.username?.charAt(0) ||
    'S';

  // Helper function to get the correct route path based on user role
  const getRoutePath = (path: string) => {
    if (userRole === 'teacher' && classroomId) {
      return `/classroom/${classroomId}${path}`;
    }
    return path;
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert('Please enter a discussion title');
      return;
    }

    if (!content.trim()) {
      alert('Please enter discussion content');
      return;
    }

    try {
      if (isEditMode && (discussionId || discussion?.id)) {
        const id = discussionId ? Number(discussionId) : discussion.id;
        await updateDiscussion({
          discussionId: id,
          discussionData: {
            title: title.trim(),
            content: content.trim(),
          },
        }).unwrap();
      } else {
        await createDiscussion({
          subjectId: Number(subjectId),
          discussionData: {
            title: title.trim(),
            content: content.trim(),
            ...(classroomId && { classroom_id: classroomId }),
          },
        }).unwrap();
      }
      navigate(getRoutePath(`/subject/${subjectId}?tab=discussion`), { 
        state: { subjectName, classroomId } 
      });
    } catch (error) {
      console.error('Error saving discussion:', error);
      alert('Failed to save discussion. Please try again.');
    }
  };

  const handleBack = () => {
    navigate(getRoutePath(`/subject/${subjectId}?tab=discussion`), { 
      state: { subjectName, classroomId } 
    });
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activePath={`/subject/${subjectId}`} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          userInitial={userInitial}
          userName={userProfile?.user?.first_name || userProfile?.user?.username}
          onBackClick={handleBack}
        />

        <div className="flex-1 overflow-y-auto bg-white">
          <div className="p-8 max-w-4xl mx-auto">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {isEditMode ? 'Edit Discussion' : 'Create Discussion'}
                </h2>
                <p className="text-gray-600">
                  {isEditMode ? 'Update discussion details' : 'Start a new discussion'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discussion Title
                </label>
                <input
                  type="text"
                  placeholder="Enter discussion title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content
                </label>
                <RichTextEditor
                  value={content}
                  onChange={setContent}
                  placeholder="Write your discussion content here..."
                  height={400}
                  className="w-full"
                />
              </div>

              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={handleSave}
                  disabled={!title.trim() || !content.trim() || isSaving}
                  className={`w-full px-6 py-3 rounded-lg font-semibold text-white transition ${
                    !title.trim() || !content.trim() || isSaving
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-[#043276] hover:bg-[#043276]/90'
                  }`}
                >
                  {isSaving ? 'Saving...' : isEditMode ? 'Update Discussion' : 'Create Discussion'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddDiscussion;

