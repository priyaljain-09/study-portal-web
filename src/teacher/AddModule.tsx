import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../redux/hooks';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { 
  useCreateModuleMutation, 
  useCreateChapterMutation, 
  useUpdateChapterMutation,
  useUploadMaterialMutation 
} from '../redux/api/moduleApi';
import { ArrowLeft, Plus, FileText } from 'lucide-react';
import RichTextEditor from '../components/editor/RichTextEditor';

interface Section {
  title: string;
  description: string;
  saved?: boolean; // Track if section has been saved to API
}

const AddModule = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const userProfile = useAppSelector((state) => state.applicationData.userProfile);

  // Get data from location state
  const { module, subjectName, classroomId } = location.state || {};
  const chapterId = location.state?.chapterId;
  const chapterData = location.state?.chapterData;
  const isEditMode = location.state?.isEditMode || false;
  const existingModuleId = module?.id;

  const [createModule, { isLoading: isCreatingModule }] = useCreateModuleMutation();
  const [createChapter, { isLoading: isCreatingChapter }] = useCreateChapterMutation();
  const [updateChapter, { isLoading: isUpdatingChapter }] = useUpdateChapterMutation();
  const [uploadMaterial, { isLoading: isUploadingMaterial }] = useUploadMaterialMutation();

  const [currentStep, setCurrentStep] = useState<number>(isEditMode || existingModuleId ? 1 : 0);
  const [moduleName, setModuleName] = useState<string>(module?.name || '');
  const [sections, setSections] = useState<Section[]>([]);
  const [moduleId, setModuleId] = useState<number | null>(existingModuleId || null);
  const [savedSteps, setSavedSteps] = useState<Set<number>>(new Set()); // Track which steps have been saved to API
  const [currentSectionTitle, setCurrentSectionTitle] = useState<string>(
    isEditMode && chapterData ? chapterData.name : ''
  );
  const [currentSectionDescription, setCurrentSectionDescription] = useState<string>(
    isEditMode && chapterData ? chapterData.description || '' : ''
  );

  const isSaving = isCreatingModule || isCreatingChapter || isUpdatingChapter;

  const userInitial = userProfile?.user?.first_name?.charAt(0) ||
    userProfile?.user?.username?.charAt(0) ||
    'T';

  // Helper function to get the correct route path based on classroomId
  const getRoutePath = (path: string) => {
    if (classroomId) {
      return `/classroom/${classroomId}${path}`;
    }
    return path;
  };

  const createModuleAPI = async (): Promise<number | null> => {
    if (moduleId) return moduleId;

    if (!moduleName.trim()) {
      alert('Please enter a module name');
      return null;
    }

    if (!classroomId || !subjectId) {
      alert('Missing classroom or subject information');
      return null;
    }

    try {
      const response = await createModule({
        moduleData: { name: moduleName },
        classId: classroomId,
        subjectId: Number(subjectId),
      }).unwrap();

      if (response && response.id) {
        setModuleId(response.id);
        return response.id;
      }
      return null;
    } catch (error) {
      console.error('Error creating module:', error);
      return null;
    }
  };

  const createSectionAPI = async (sectionTitle: string, sectionDescription: string, moduleId: number): Promise<boolean> => {
    try {
      const response = await createChapter({
        chapterData: {
          name: sectionTitle,
          description: sectionDescription,
        },
        moduleId,
      }).unwrap();

      if (response && (response.id || response.name)) {
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error creating chapter:', error);
      return false;
    }
  };

  const handleAddSection = async (): Promise<void> => {
    if (currentStep === 0) {
      const newModuleId = await createModuleAPI();
      if (newModuleId) {
        setCurrentStep(1);
      }
    } else {
      if (!currentSectionTitle.trim()) {
        alert('Please enter a section title');
        return;
      }

      if (moduleId) {
        // Save current section to API when clicking "Add Next Section"
        const success = await createSectionAPI(currentSectionTitle, currentSectionDescription, moduleId);
        if (success) {
          // Mark current step as saved
          setSavedSteps(prev => new Set(prev).add(currentStep));
          // Mark as saved since it was saved to API
          const newSection: Section = {
            title: currentSectionTitle,
            description: currentSectionDescription,
            saved: true, // Mark as already saved
          };
          setSections(prev => [...prev, newSection]);
          setCurrentSectionTitle('');
          setCurrentSectionDescription('');
          setCurrentStep(prev => prev + 1);
        }
      } else {
        // Module doesn't exist yet, just store locally (will be saved later)
        const newSection: Section = {
          title: currentSectionTitle,
          description: currentSectionDescription,
          saved: false, // Not saved yet
        };
        setSections(prev => [...prev, newSection]);
        setCurrentSectionTitle('');
        setCurrentSectionDescription('');
        setCurrentStep(prev => prev + 1);
      }
    }
  };

  const handleSaveModule = async (): Promise<void> => {
    if (isEditMode && chapterId) {
      if (!currentSectionTitle.trim()) {
        alert('Please enter a chapter title');
        return;
      }

      try {
        await updateChapter({
          chapterId,
          chapterData: {
            name: currentSectionTitle.trim(),
            description: currentSectionDescription,
          },
        }).unwrap();
        navigate(getRoutePath(`/subject/${subjectId}`), { state: { subjectName, classroomId } });
        return;
      } catch (error) {
        console.error('Error updating chapter:', error);
        return;
      }
    }

    if (currentStep === 0) {
      if (!moduleName.trim()) {
        alert('Please enter a module name');
        return;
      }

      const newModuleId = await createModuleAPI();
      if (newModuleId) {
        navigate(getRoutePath(`/subject/${subjectId}`), { state: { subjectName, classroomId } });
      }
      return;
    }

    let finalModuleId = moduleId;
    
    // Create module if it doesn't exist
    if (!finalModuleId) {
      finalModuleId = await createModuleAPI();
      if (!finalModuleId) {
        return;
      }
    }

    // Save current section if there's content and it hasn't been saved yet
    // Check if current step was already saved when clicking "Add Next Section"
    if (currentSectionTitle.trim() && !savedSteps.has(currentStep)) {
      await createSectionAPI(currentSectionTitle, currentSectionDescription, finalModuleId);
      // Mark this step as saved
      setSavedSteps(prev => new Set(prev).add(currentStep));
    }

    // Save only unsaved sections from the sections array
    // These are sections that were added when moduleId didn't exist yet
    if (sections.length > 0 && finalModuleId) {
      const unsavedSections = sections.filter(section => !section.saved);
      for (const section of unsavedSections) {
        await createSectionAPI(section.title, section.description, finalModuleId);
        // Mark as saved in the array
        setSections(prev => prev.map(s => 
          s.title === section.title && s.description === section.description && !s.saved
            ? { ...s, saved: true }
            : s
        ));
      }
    }

    navigate(`/subject/${subjectId}`, { state: { subjectName, classroomId } });
  };

  const handleFileUpload = async (): Promise<void> => {
    if (!moduleId) {
      const newModuleId = await createModuleAPI();
      if (!newModuleId) return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.doc,.docx,.txt,.ppt,.pptx';
    input.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file && moduleId) {
        try {
          await uploadMaterial({ moduleId, file }).unwrap();
          alert('File uploaded successfully!');
        } catch (error) {
          console.error('Error uploading material:', error);
          alert('Failed to upload material. Please try again.');
        }
      }
    };
    input.click();
  };

  const goBack = (): void => {
    if (isEditMode || existingModuleId) {
      navigate(`/subject/${subjectId}`, { state: { subjectName, classroomId } });
      return;
    }

    if (currentStep > 0) {
      if (currentSectionTitle || currentSectionDescription) {
        const newSection: Section = {
          title: currentSectionTitle,
          description: currentSectionDescription,
        };
        setSections(prev => {
          const updated = [...prev];
          updated[currentStep - 1] = newSection;
          return updated;
        });
      }
      setCurrentStep(prev => prev - 1);

      if (currentStep > 1 && sections[currentStep - 2]) {
        setCurrentSectionTitle(sections[currentStep - 2].title);
        setCurrentSectionDescription(sections[currentStep - 2].description);
      } else {
        setCurrentSectionTitle('');
        setCurrentSectionDescription('');
      }
    } else {
      navigate(`/subject/${subjectId}`, { state: { subjectName, classroomId } });
    }
  };

  const renderModuleInfoScreen = () => {
    if (existingModuleId) return null;

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Module</h2>
          <p className="text-gray-600">Enter basic module information</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Module Name
          </label>
          <input
            type="text"
            placeholder="Module Name (e.g., Algebra)"
            value={moduleName}
            onChange={(e) => setModuleName(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        <div className="flex flex-col space-y-3">
          <button
            onClick={async () => {
              const newModuleId = await createModuleAPI();
              if (newModuleId) {
                setCurrentStep(1);
              }
            }}
            disabled={!moduleName.trim() || isCreatingModule}
            className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-semibold transition ${
              !moduleName.trim() || isCreatingModule
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-purple-600 text-white hover:bg-purple-700'
            }`}
          >
            <Plus className="w-5 h-5" />
            <span>Add Section</span>
          </button>

          <button
            onClick={handleFileUpload}
            disabled={!moduleName.trim()}
            className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-semibold transition ${
              !moduleName.trim()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            <FileText className="w-5 h-5" />
            <span>Add Material (File)</span>
          </button>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <button
            onClick={handleSaveModule}
            disabled={!moduleName.trim() || isCreatingModule}
            className={`w-full px-6 py-3 rounded-lg font-semibold text-white transition ${
              !moduleName.trim() || isCreatingModule
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-700'
            }`}
          >
            {isCreatingModule ? 'Saving...' : 'Save Module'}
          </button>
        </div>
      </div>
    );
  };

  const renderSectionScreen = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {isEditMode ? 'Edit Chapter' : existingModuleId ? 'Add Chapter' : `Section ${currentStep}`}
        </h2>
        <p className="text-gray-600">
          {isEditMode ? 'Update chapter details' : existingModuleId ? 'Add a new chapter to this module' : 'Add section details'}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {isEditMode || existingModuleId ? 'Chapter Title' : `Section ${currentStep} Title`}
        </label>
        <input
          type="text"
          placeholder={isEditMode || existingModuleId ? 'Chapter Title (e.g., Overview)' : `Section ${currentStep} Title (e.g., Overview)`}
          value={currentSectionTitle}
          onChange={(e) => setCurrentSectionTitle(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Content
        </label>
        <RichTextEditor
          value={currentSectionDescription}
          onChange={setCurrentSectionDescription}
          placeholder="Write your content here..."
          height={400}
          className="w-full"
        />
      </div>

      {!isEditMode && (
        <div className="flex items-center justify-between">
          <button
            onClick={handleAddSection}
            disabled={!currentSectionTitle.trim()}
            className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-semibold transition ${
              !currentSectionTitle.trim()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-purple-600 text-white hover:bg-purple-700'
            }`}
          >
            <span>Add Next Section</span>
            <ArrowLeft className="w-5 h-5 rotate-180" />
          </button>

          {sections.length > 0 && (
            <p className="text-sm text-gray-600">
              {sections.length} section{sections.length > 1 ? 's' : ''} added
            </p>
          )}
        </div>
      )}

      <div className="pt-4 border-t border-gray-200">
        <button
          onClick={handleSaveModule}
          disabled={!currentSectionTitle.trim() || isSaving}
          className={`w-full px-6 py-3 rounded-lg font-semibold text-white transition ${
            !currentSectionTitle.trim() || isSaving
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-purple-600 hover:bg-purple-700'
          }`}
        >
          {isSaving ? 'Saving...' : isEditMode ? 'Save Chapter' : 'Save Module'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activePath={`/subject/${subjectId}`} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          userInitial={userInitial}
          userName={userProfile?.user?.first_name || userProfile?.user?.username}
          onBackClick={goBack}
        />

        <div className="flex-1 overflow-y-auto bg-white">
          <div className="p-8 max-w-4xl mx-auto">
            {currentStep === 0 && !existingModuleId ? renderModuleInfoScreen() : renderSectionScreen()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddModule;

