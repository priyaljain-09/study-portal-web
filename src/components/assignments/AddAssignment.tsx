import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../redux/hooks';
import Sidebar from '../layout/Sidebar';
import Header from '../layout/Header';
import { 
  useCreateTeacherAssignmentMutation, 
  useUpdateTeacherAssignmentMutation,
  useGetTeacherAssignmentByIdQuery,
  useGetAssignmentQuestionsQuery,
  useCreateAssignmentQuestionMutation,
  useUpdateAssignmentQuestionMutation,
  useDeleteAssignmentQuestionMutation,
  useDeleteAssignmentOptionMutation,
} from '../../redux/api/assignmentApi';
import RichTextEditor from '../editor/RichTextEditor';
import QuestionForm from './QuestionForm';
import QuestionCard from './QuestionCard';
import { Plus } from 'lucide-react';

interface MCQOption {
  id?: number;
  text: string;
  is_correct: boolean;
}

interface Question {
  id?: number;
  question_text: string;
  question_type: 'text' | 'mcq';
  mark?: number;
  options?: MCQOption[];
  order?: number;
}

const AddAssignment = () => {
  const { subjectId, assignmentId } = useParams<{ subjectId: string; assignmentId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const userProfile = useAppSelector((state) => state.applicationData.userProfile);
  const userRole = useAppSelector((state) => state.applicationData.userRole) || localStorage.getItem('userRole') || 'student';

  // Get data from location state
  const { subjectName, classroomId, assignment: assignmentFromState } = location.state || {};
  const isEditMode = !!assignmentId || !!assignmentFromState;

  // Fetch assignment data if we have assignmentId but no assignment in state
  const { data: fetchedAssignment, isLoading: isLoadingAssignment } = useGetTeacherAssignmentByIdQuery(
    assignmentId ? Number(assignmentId) : 0,
    { skip: !assignmentId || !!assignmentFromState }
  );

  // Use assignment from state if available, otherwise use fetched assignment
  const assignment = assignmentFromState || fetchedAssignment;

  const [createAssignment, { isLoading: isCreating }] = useCreateTeacherAssignmentMutation();
  const [updateAssignment, { isLoading: isUpdating }] = useUpdateTeacherAssignmentMutation();
  const [createQuestion] = useCreateAssignmentQuestionMutation();
  const [updateQuestion] = useUpdateAssignmentQuestionMutation();
  const [deleteQuestion] = useDeleteAssignmentQuestionMutation();
  const [deleteOption] = useDeleteAssignmentOptionMutation();

  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [assignmentType, setAssignmentType] = useState<string>('file');
  const [totalMarks, setTotalMarks] = useState<number>(0);
  const [dueDate, setDueDate] = useState<string>('');
  const [currentAssignmentId, setCurrentAssignmentId] = useState<number | null>(
    assignmentId ? Number(assignmentId) : null
  );
  const [questions, setQuestions] = useState<Question[]>([]);
  const [savingQuestionIndex, setSavingQuestionIndex] = useState<number | null>(null);

  // Fetch questions if assignment ID exists
  const { data: assignmentQuestions = [], refetch: refetchQuestions } = useGetAssignmentQuestionsQuery(
    currentAssignmentId || 0,
    { skip: !currentAssignmentId }
  );

  // Update form when assignment data is available
  useEffect(() => {
    if (assignment) {
      setTitle(assignment.title || '');
      setDescription(assignment.description || '');
      setAssignmentType(assignment.assignment_type || 'file');
      setTotalMarks(assignment.total_marks || 0);
      if (assignment.due_date) {
        // Format date for date input (YYYY-MM-DD)
        const date = new Date(assignment.due_date);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        setDueDate(`${year}-${month}-${day}`);
      }
      if (assignment.id) {
        setCurrentAssignmentId(assignment.id);
      }
    }
  }, [assignment]);

  const isSaving = isCreating || isUpdating;
  const isLoading = isLoadingAssignment;

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
      alert('Please enter an assignment title');
      return;
    }

    if (!classroomId && userRole === 'teacher') {
      alert('Classroom information is missing');
      return;
    }

    if (!dueDate) {
      alert('Please select a due date');
      return;
    }

    if (totalMarks <= 0) {
      alert('Please enter a valid total marks (greater than 0)');
      return;
    }

    try {
      // Date input already provides YYYY-MM-DD format, use it directly
      const assignmentData = {
        title: title.trim(),
        description: description.trim(),
        assignment_type: assignmentType,
        total_marks: totalMarks,
        due_date: dueDate, // Already in YYYY-MM-DD format from date input
      };

      if (isEditMode && assignmentId) {
        await updateAssignment({
          assignmentId: Number(assignmentId),
          assignmentData,
        }).unwrap();
        setCurrentAssignmentId(Number(assignmentId));
      } else if (classroomId) {
        const result = await createAssignment({
          classroomId,
          subjectId: Number(subjectId),
          assignmentData,
        }).unwrap();
        if (result?.id) {
          setCurrentAssignmentId(result.id);
        } else {
          return;
        }
      } else {
        alert('Classroom information is required');
        return;
      }

      // Don't navigate away - stay on page to allow adding questions
      // Only navigate if user explicitly wants to go back
    } catch (error) {
      console.error('Error saving assignment:', error);
      // Error toast is handled by baseQueryWithReauth
    }
  };

  // Question management handlers
  const handleAddQuestion = () => {
    const newOrder = assignmentQuestions.length + questions.length + 1;
    const newQuestion: Question = {
      question_text: '',
      question_type: 'text',
      mark: 1,
      order: newOrder,
      options: undefined,
    };
    setQuestions([...questions, newQuestion]);
  };

  const handleUpdateQuestion = (index: number, field: string, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const handleQuestionTypeChange = (index: number, type: 'text' | 'mcq') => {
    const updated = [...questions];
    updated[index] = {
      ...updated[index],
      question_type: type,
    };
    
    if (type === 'mcq') {
      if (!updated[index].options || updated[index].options.length === 0) {
        updated[index].options = [
          { text: '', is_correct: false },
          { text: '', is_correct: false },
        ];
      }
    } else {
      updated[index].options = undefined;
    }
    
    setQuestions(updated);
  };

  const handleAddOption = (questionIndex: number) => {
    const updated = [...questions];
    if (!updated[questionIndex].options) {
      updated[questionIndex].options = [];
    }
    updated[questionIndex].options!.push({ text: '', is_correct: false });
    setQuestions(updated);
  };

  const handleUpdateOption = (
    questionIndex: number,
    optionIndex: number,
    field: 'text' | 'is_correct',
    value: string | boolean,
  ) => {
    const updated = [...questions];
    if (!updated[questionIndex].options) {
      updated[questionIndex].options = [];
    }
    
    const option = updated[questionIndex].options![optionIndex];
    updated[questionIndex].options![optionIndex] = {
      ...option,
      [field]: value,
    };
    
    setQuestions(updated);
  };

  const handleToggleCorrect = (questionIndex: number, optionIndex: number) => {
    const updated = [...questions];
    const option = updated[questionIndex].options![optionIndex];
    
    updated[questionIndex].options![optionIndex] = {
      ...updated[questionIndex].options![optionIndex],
      is_correct: !option.is_correct,
    };
    
    setQuestions(updated);
  };

  const handleRemoveOption = async (questionIndex: number, optionIndex: number) => {
    const question = questions[questionIndex];
    const option = question.options?.[optionIndex];
    
    if (option?.id) {
      if (!window.confirm('Are you sure you want to delete this option?')) {
        return;
      }
      
      try {
        await deleteOption(option.id).unwrap();
        const updated = [...questions];
        if (updated[questionIndex].options) {
          updated[questionIndex].options = updated[questionIndex].options!.filter(
            (_, i) => i !== optionIndex,
          );
        }
        setQuestions(updated);
        refetchQuestions();
      } catch (error) {
        console.error('Error deleting option:', error);
      }
    } else {
      const updated = [...questions];
      if (updated[questionIndex].options) {
        updated[questionIndex].options = updated[questionIndex].options!.filter(
          (_, i) => i !== optionIndex,
        );
      }
      setQuestions(updated);
    }
  };

  const handleSaveQuestion = async (index: number) => {
    const question = questions[index];
    
    if (!question.question_text.trim()) {
      alert('Please enter question text');
      return;
    }

    if (!question.mark || question.mark <= 0) {
      alert('Please enter valid marks (greater than 0)');
      return;
    }

    if (question.question_type === 'mcq') {
      if (!question.options || question.options.length < 2) {
        alert('MCQ questions must have at least 2 options');
        return;
      }
      const hasText = question.options.some(opt => opt.text.trim());
      if (!hasText) {
        alert('Please fill in at least one option');
        return;
      }
    }

    if (!currentAssignmentId) {
      alert('Please save the assignment first before adding questions');
      return;
    }

    setSavingQuestionIndex(index);
    try {
      const questionPayload: any = {
        question_text: question.question_text.trim(),
        question_type: question.question_type,
        mark: question.mark,
        order: question.order || assignmentQuestions.length + index + 1,
      };

      if (question.question_type === 'mcq' && question.options) {
        questionPayload.options = question.options.map(opt => ({
          text: opt.text.trim(),
          is_correct: opt.is_correct,
        }));
      }

      if (question.id) {
        await updateQuestion({
          questionId: question.id,
          questionData: questionPayload,
        }).unwrap();
      } else {
        await createQuestion({
          assignmentId: currentAssignmentId,
          questionData: questionPayload,
        }).unwrap();
      }

      closeQuestionEditor(index);
      refetchQuestions();
    } catch (error) {
      console.error('Error saving question:', error);
    } finally {
      setSavingQuestionIndex(null);
    }
  };

  const closeQuestionEditor = (index: number) => {
    const updated = questions.filter((_, i) => i !== index);
    setQuestions(updated);
  };

  const handleCloseQuestionForm = (question: Question) => {
    const questionIndex = questions.findIndex(q => q === question);
    if (questionIndex !== -1) {
      closeQuestionEditor(questionIndex);
    }
  };

  const handleEditQuestion = (questionToEdit: Question) => {
    const updated = [...questions, questionToEdit];
    setQuestions(updated);
  };

  const handleDeleteQuestion = async (question: Question) => {
    if (!question.id) return;
    
    if (!window.confirm('Are you sure you want to delete this question?')) {
      return;
    }

    try {
      await deleteQuestion(question.id).unwrap();
      refetchQuestions();
    } catch (error) {
      console.error('Error deleting question:', error);
    }
  };

  const handleBack = () => {
    navigate(getRoutePath(`/subject/${subjectId}?tab=assignment`), {
      state: { subjectName, classroomId }
    });
  };

  if (isLoading) {
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
                  {isEditMode ? 'Edit Assignment' : 'Create Assignment'}
                </h2>
                <p className="text-gray-600">
                  {isEditMode ? 'Update assignment details' : 'Create a new assignment'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assignment Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter assignment title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
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
                  placeholder="Write assignment description here..."
                  height={300}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assignment Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={assignmentType}
                  onChange={(e) => setAssignmentType(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="file">File Upload</option>
                  <option value="mixed">Mixed (Questions + File Upload)</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  File Upload: Students submit files. Mixed: Students answer questions and can upload files.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Marks <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Enter total marks"
                    value={totalMarks || ''}
                    onChange={(e) => setTotalMarks(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Due Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={handleSave}
                  disabled={!title.trim() || !dueDate || totalMarks <= 0 || isSaving}
                  className={`w-full px-6 py-3 rounded-lg font-semibold text-white transition ${
                    !title.trim() || !dueDate || totalMarks <= 0 || isSaving
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-purple-600 hover:bg-purple-700'
                  }`}
                >
                  {isSaving 
                    ? 'Saving...' 
                    : currentAssignmentId || isEditMode 
                      ? 'Update Assignment' 
                      : 'Save Assignment'}
                </button>
              </div>
            </div>

            {/* Questions Section - Only show if assignment is saved */}
            {currentAssignmentId && (
              <div className="mt-8 pt-8 border-t border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Questions</h3>
                  <button
                    onClick={handleAddQuestion}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Add Question</span>
                  </button>
                </div>

                {questions.length === 0 && assignmentQuestions.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-500 text-sm">
                      No questions yet. Add your first question.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Display existing questions */}
                    {assignmentQuestions.map((q: any, index: number) => {
                      const isBeingEdited = questions.some(
                        localQ => localQ.id === q.id,
                      );
                      if (isBeingEdited) return null;

                      return (
                        <QuestionCard
                          key={q.id}
                          question={q}
                          questionNumber={index + 1}
                          onEdit={handleEditQuestion}
                          onDelete={handleDeleteQuestion}
                        />
                      );
                    })}

                    {/* Display questions being edited/created */}
                    {questions.map((question, index) => {
                      const questionNumber = assignmentQuestions.length + index + 1;
                      return (
                        <QuestionForm
                          key={index}
                          question={question}
                          questionNumber={questionNumber}
                          onUpdate={(field, value) => handleUpdateQuestion(index, field, value)}
                          onTypeChange={(type) => handleQuestionTypeChange(index, type)}
                          onAddOption={() => handleAddOption(index)}
                          onUpdateOption={(optIndex, field, value) =>
                            handleUpdateOption(index, optIndex, field, value)
                          }
                          onRemoveOption={(optIndex) => handleRemoveOption(index, optIndex)}
                          onToggleCorrect={(optIndex) => handleToggleCorrect(index, optIndex)}
                          onClose={() => handleCloseQuestionForm(question)}
                          onSave={() => handleSaveQuestion(index)}
                          isSaving={savingQuestionIndex === index}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddAssignment;

