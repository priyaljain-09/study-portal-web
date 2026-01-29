import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../redux/hooks';
import Sidebar from '../layout/Sidebar';
import Header from '../layout/Header';
import { useCreateSyllabusItemMutation, useUpdateSyllabusItemMutation } from '../../redux/api/syllabusApi';
import RichTextEditor from '../editor/RichTextEditor';

const AddSyllabus = () => {
  const { subjectId, syllabusItemId } = useParams<{ subjectId: string; syllabusItemId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const userProfile = useAppSelector((state) => state.applicationData.userProfile);
  const userRole = useAppSelector((state) => state.applicationData.userRole) || localStorage.getItem('userRole') || 'student';
  
  const [createSyllabusItem, { isLoading: isCreating }] = useCreateSyllabusItemMutation();
  const [updateSyllabusItem, { isLoading: isUpdating }] = useUpdateSyllabusItemMutation();
  const isLoading = isCreating || isUpdating;

  // Get data from location state
  const { subjectName, classroomId, syllabusData, isEditMode: isEditModeFromState } = location.state || {};
  const isEditMode = !!syllabusItemId || !!isEditModeFromState || !!syllabusData;

  const [chapterName, setChapterName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [assessmentName, setAssessmentName] = useState<string>('');
  const [order, setOrder] = useState<number>(0);

  // Update form when syllabus data is available
  useEffect(() => {
    if (syllabusData) {
      setChapterName(syllabusData.chapter_name || '');
      setDescription(syllabusData.description || '');
      setAssessmentName(syllabusData.assessment_name || '');
      setOrder(syllabusData.order || 0);
    }
  }, [syllabusData]);

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
    if (!chapterName.trim()) {
      alert('Please enter a chapter name');
      return;
    }

    if (!classroomId && userRole === 'teacher') {
      alert('Classroom information is missing');
      return;
    }

    try {
      const syllabusDataToSave = {
        chapter_name: chapterName.trim(),
        description: description.trim(),
        assessment_name: assessmentName.trim(),
        order: order || 0,
      };

      if (isEditMode && syllabusItemId) {
        await updateSyllabusItem({
          syllabusItemId: Number(syllabusItemId),
          syllabusData: syllabusDataToSave,
        }).unwrap();
      } else if (classroomId) {
        await createSyllabusItem({
          classroomId,
          subjectId: Number(subjectId),
          syllabusData: syllabusDataToSave,
        }).unwrap();
      } else {
        alert('Classroom information is required');
        return;
      }

      navigate(getRoutePath(`/subject/${subjectId}?tab=syllabus`), { 
        state: { subjectName, classroomId } 
      });
    } catch (error) {
      console.error('Error saving syllabus:', error);
      // Error toast is handled by baseQueryWithReauth
    }
  };

  const handleBack = () => {
    navigate(getRoutePath(`/subject/${subjectId}?tab=syllabus`), { 
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
                  {isEditMode ? 'Edit Syllabus Item' : 'Add Syllabus Item'}
                </h2>
                <p className="text-gray-600">
                  {isEditMode ? 'Update syllabus item details' : 'Create a new syllabus item'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chapter Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter chapter name"
                  value={chapterName}
                  onChange={(e) => setChapterName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <RichTextEditor
                  value={description}
                  onChange={setDescription}
                  placeholder="Write description here..."
                  height={300}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assessment Name
                </label>
                <input
                  type="text"
                  placeholder="Enter assessment name"
                  value={assessmentName}
                  onChange={(e) => setAssessmentName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Order
                </label>
                <input
                  type="number"
                  placeholder="Enter order number"
                  value={order}
                  onChange={(e) => setOrder(parseInt(e.target.value, 10) || 0)}
                  min="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Order determines the sequence of syllabus items (lower numbers appear first)
                </p>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={handleSave}
                  disabled={!chapterName.trim() || isLoading}
                  className={`w-full px-6 py-3 rounded-lg font-semibold text-white transition ${
                    !chapterName.trim() || isLoading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-primary hover:bg-primary/90'
                  }`}
                >
                  {isLoading ? 'Saving...' : isEditMode ? 'Update Syllabus Item' : 'Save Syllabus Item'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddSyllabus;

