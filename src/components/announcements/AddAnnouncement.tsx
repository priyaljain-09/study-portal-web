import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../redux/hooks';
import Sidebar from '../layout/Sidebar';
import Header from '../layout/Header';
import { useCreateAnnouncementMutation, useUpdateAnnouncementMutation, useGetAnnouncementByIdQuery } from '../../redux/api/announcementApi';
import RichTextEditor from '../editor/RichTextEditor';

const AddAnnouncement = () => {
  const { subjectId, announcementId } = useParams<{ subjectId: string; announcementId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const userProfile = useAppSelector((state) => state.applicationData.userProfile);
  const userRole = useAppSelector((state) => state.applicationData.userRole) || localStorage.getItem('userRole') || 'student';

  // Get data from location state
  const { subjectName, classroomId, announcement: announcementFromState } = location.state || {};
  const isEditMode = !!announcementId || !!announcementFromState;

  // Fetch announcement data if we have announcementId but no announcement in state
  const { data: fetchedAnnouncement, isLoading: isLoadingAnnouncement } = useGetAnnouncementByIdQuery(
    announcementId ? Number(announcementId) : 0,
    { skip: !announcementId || !!announcementFromState }
  );

  // Use announcement from state if available, otherwise use fetched announcement
  const announcement = announcementFromState || fetchedAnnouncement;

  const [createAnnouncement, { isLoading: isCreating }] = useCreateAnnouncementMutation();
  const [updateAnnouncement, { isLoading: isUpdating }] = useUpdateAnnouncementMutation();

  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');

  // Update form when announcement data is available
  useEffect(() => {
    if (announcement) {
      setTitle(announcement.title || '');
      setContent(announcement.content || '');
    }
  }, [announcement]);

  const isSaving = isCreating || isUpdating;

  const userInitial = userProfile?.user?.first_name?.charAt(0) ||
    userProfile?.user?.username?.charAt(0) ||
    'T';

  // Helper function to get the correct route path based on user role
  const getRoutePath = (path: string) => {
    if (userRole === 'teacher' && classroomId) {
      return `/classroom/${classroomId}${path}`;
    }
    return path;
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert('Please enter an announcement title');
      return;
    }

    if (!content.trim()) {
      alert('Please enter announcement content');
      return;
    }

    if (!classroomId && userRole === 'teacher') {
      alert('Classroom information is missing');
      return;
    }

    try {
      if (isEditMode && (announcementId || announcement?.id)) {
        const id = announcementId ? Number(announcementId) : announcement.id;
        await updateAnnouncement({
          announcementId: id,
          announcementData: {
            title: title.trim(),
            content: content.trim(),
          },
        }).unwrap();
      } else {
        await createAnnouncement({
          classroomId: classroomId!,
          subjectId: Number(subjectId),
          announcementData: {
            title: title.trim(),
            content: content.trim(),
          },
        }).unwrap();
      }
      navigate(getRoutePath(`/subject/${subjectId}?tab=announcement`), { 
        state: { subjectName, classroomId } 
      });
    } catch (error) {
      console.error('Error saving announcement:', error);
      alert('Failed to save announcement. Please try again.');
    }
  };

  const handleBack = () => {
    navigate(getRoutePath(`/subject/${subjectId}?tab=announcement`), { 
      state: { subjectName, classroomId } 
    });
  };

  // Show loading state while fetching announcement data
  if (isEditMode && isLoadingAnnouncement && !announcement) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar activePath={`/subject/${subjectId}`} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header
            userInitial={userInitial}
            userName={userProfile?.user?.first_name || userProfile?.user?.username}
            onBackClick={handleBack}
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
                  {isEditMode ? 'Edit Announcement' : 'Create Announcement'}
                </h2>
                <p className="text-gray-600">
                  {isEditMode ? 'Update announcement details' : 'Create a new announcement'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Announcement Title
                </label>
                <input
                  type="text"
                  placeholder="Enter announcement title..."
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
                  placeholder="Write your announcement content here..."
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
                  {isSaving ? 'Saving...' : isEditMode ? 'Update Announcement' : 'Create Announcement'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddAnnouncement;

