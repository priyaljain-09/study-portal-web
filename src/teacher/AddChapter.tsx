import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../redux/hooks';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { useCreateChapterMutation, useUpdateChapterMutation } from '../redux/api/moduleApi';

const AddChapter = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const userProfile = useAppSelector((state) => state.applicationData.userProfile);

  // Get data from location state
  const { module, subjectName, classroomId, chapter, isEditMode } = location.state || {};

  const [createChapter, { isLoading: isCreating }] = useCreateChapterMutation();
  const [updateChapter, { isLoading: isUpdating }] = useUpdateChapterMutation();

  const [chapterTitle, setChapterTitle] = useState<string>(chapter?.name || '');
  const [chapterDescription, setChapterDescription] = useState<string>(chapter?.description || '');

  const isSaving = isCreating || isUpdating;

  const userInitial = userProfile?.user?.first_name?.charAt(0) ||
    userProfile?.user?.username?.charAt(0) ||
    'T';

  const handleSave = async () => {
    if (!chapterTitle.trim()) {
      alert('Please enter a chapter title');
      return;
    }

    if (!module?.id) {
      alert('Module information is missing');
      return;
    }

    try {
      if (isEditMode && chapter?.id) {
        await updateChapter({
          chapterId: chapter.id,
          chapterData: {
            name: chapterTitle.trim(),
            description: chapterDescription,
          },
        }).unwrap();
      } else {
        await createChapter({
          moduleId: module.id,
          chapterData: {
            name: chapterTitle.trim(),
            description: chapterDescription,
          },
        }).unwrap();
      }
      navigate(`/subject/${subjectId}`, { state: { subjectName, classroomId } });
    } catch (error) {
      console.error('Error saving chapter:', error);
      alert('Failed to save chapter. Please try again.');
    }
  };

  const handleBack = () => {
    navigate(`/subject/${subjectId}`, { state: { subjectName, classroomId } });
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
                  {isEditMode ? 'Edit Chapter' : 'Add Chapter'}
                </h2>
                <p className="text-gray-600">
                  {isEditMode ? 'Update chapter details' : 'Add a new chapter to this module'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chapter Title
                </label>
                <input
                  type="text"
                  placeholder="Chapter Title (e.g., Overview)"
                  value={chapterTitle}
                  onChange={(e) => setChapterTitle(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content
                </label>
                <textarea
                  placeholder="Write your content here. You can use HTML tags for formatting..."
                  value={chapterDescription}
                  onChange={(e) => setChapterDescription(e.target.value)}
                  rows={12}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-y font-mono text-sm"
                />
                <p className="mt-2 text-xs text-gray-500">
                  You can use HTML tags for formatting (e.g., &lt;p&gt;, &lt;h1&gt;, &lt;strong&gt;, etc.)
                </p>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={handleSave}
                  disabled={!chapterTitle.trim() || isSaving}
                  className={`w-full px-6 py-3 rounded-lg font-semibold text-white transition ${
                    !chapterTitle.trim() || isSaving
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-purple-600 hover:bg-purple-700'
                  }`}
                >
                  {isSaving ? 'Saving...' : isEditMode ? 'Update Chapter' : 'Create Chapter'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddChapter;



