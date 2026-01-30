import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../redux/hooks';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import {
  useFetchSubmissionDetailQuery,
  useUpdateQuestionMarksMutation,
} from '../redux/api/gradesApi';
import { Save } from 'lucide-react';
import HTMLContentViewer from '../components/HTMLContentViewer';

interface QuestionMark {
  question_id: number;
  question_text: string;
  question_type: string;
  max_marks: number;
  marks_obtained: number | null;
  is_auto_graded: boolean;
  answer?: string;
}

interface SubmissionDetail {
  student_name: string;
  enrollment_number: string;
  roll_number: string;
  assignment_title: string;
  assignment_total_marks: number;
  submission_date: string;
  question_marks_breakdown: QuestionMark[];
  answers?: { [key: string]: string };
  feedback?: string;
}

const StudentSubmissionDetail = () => {
  const { subjectId, assignmentId, submissionId, classroomId: classroomIdParam } = useParams<{
    subjectId: string;
    assignmentId: string;
    submissionId: string;
    classroomId?: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();
  const userProfile = useAppSelector((state) => state.applicationData.userProfile);

  // Get data from location state
  const { assignment, course, courseColor, classroomId: classroomIdFromState, subjectName } = location.state || {};
  const classroomId = classroomIdParam ? Number(classroomIdParam) : classroomIdFromState;

  const { data: submissionDetail, isLoading } = useFetchSubmissionDetailQuery(Number(submissionId), {
    skip: !submissionId,
  });

  const [updateQuestionMarks, { isLoading: isSaving }] = useUpdateQuestionMarksMutation();

  const [questionMarks, setQuestionMarks] = useState<{ [key: number]: string }>({});
  const [isEditing, setIsEditing] = useState(false);

  const userInitial = userProfile?.user?.first_name?.charAt(0) ||
    userProfile?.user?.username?.charAt(0) ||
    'T';

  // Helper function to get the correct route path
  const getRoutePath = (path: string) => {
    if (classroomId) {
      return `/classroom/${classroomId}${path}`;
    }
    return path;
  };

  const handleBack = () => {
    navigate(getRoutePath(`/subject/${subjectId}/assignment/${assignmentId}/grades`), {
      state: { assignment, course, courseColor, subjectName, classroomId }
    });
  };

  // Initialize question marks from submission detail
  useEffect(() => {
    if (submissionDetail?.question_marks_breakdown) {
      const initialMarks: { [key: number]: string } = {};
      submissionDetail.question_marks_breakdown.forEach((q: QuestionMark) => {
        if (q.marks_obtained !== null && q.marks_obtained !== undefined) {
          initialMarks[q.question_id] = q.marks_obtained.toString();
        } else {
          initialMarks[q.question_id] = '';
        }
      });
      setQuestionMarks(initialMarks);
    }
  }, [submissionDetail]);

  const handleMarkChange = (questionId: number, value: string) => {
    const numericValue = value.replace(/[^0-9.]/g, '');
    setQuestionMarks(prev => ({
      ...prev,
      [questionId]: numericValue,
    }));
  };

  const handleSaveMarks = async () => {
    if (!submissionDetail) return;

    try {
      const validationErrors: string[] = [];
      const questionsToSend: Array<{ question_id: number; marks: string }> = [];

      submissionDetail.question_marks_breakdown.forEach((q: QuestionMark) => {
        // Skip auto-graded questions
        if (q.is_auto_graded) {
          return;
        }

        const enteredMarks = questionMarks[q.question_id];
        const originalMarks = q.marks_obtained !== null && q.marks_obtained !== undefined
          ? q.marks_obtained.toString()
          : '';

        const enteredMarksTrimmed = enteredMarks !== undefined && enteredMarks !== null
          ? enteredMarks.trim()
          : '';

        // Skip if marks haven't changed
        if (enteredMarksTrimmed === originalMarks) {
          return;
        }

        // If marks were cleared, skip
        if (enteredMarksTrimmed === '') {
          return;
        }

        const marksNum = parseFloat(enteredMarksTrimmed);

        if (isNaN(marksNum)) {
          validationErrors.push(`Question ${q.question_id}: Invalid marks format`);
          return;
        }

        if (marksNum < 0) {
          validationErrors.push(`Question ${q.question_id}: Marks cannot be negative`);
          return;
        }

        if (marksNum > q.max_marks) {
          const questionPreview = q.question_text.substring(0, 30);
          validationErrors.push(`Question "${questionPreview}...": Marks cannot exceed ${q.max_marks}`);
          return;
        }

        questionsToSend.push({
          question_id: q.question_id,
          marks: marksNum.toString(),
        });
      });

      if (validationErrors.length > 0) {
        alert(validationErrors.join('\n'));
        return;
      }

      if (questionsToSend.length === 0) {
        alert('No changes to save');
        return;
      }

      await updateQuestionMarks({
        submissionId: Number(submissionId),
        questions: questionsToSend,
      }).unwrap();

      setIsEditing(false);
    } catch (error) {
      // Error toast is handled by the API
      console.error('Error saving marks:', error);
    }
  };

  const calculateTotalMarks = () => {
    if (!submissionDetail) return 0;
    let total = 0;
    submissionDetail.question_marks_breakdown.forEach((q: QuestionMark) => {
      const marks = questionMarks[q.question_id];
      if (marks) {
        const marksNum = parseFloat(marks);
        if (!isNaN(marksNum)) {
          total += marksNum;
        }
      }
    });
    return total;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (isLoading && !submissionDetail) {
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
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
              <p className="text-gray-600 text-sm font-medium">Loading submission details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!submissionDetail) {
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
            <div className="text-center">
              <p className="text-gray-500 text-lg">No submission details found</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const submissionData = submissionDetail as SubmissionDetail;

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activePath={`/subject/${subjectId}`} />

      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <Header
          userInitial={userInitial}
          userName={userProfile?.user?.first_name || userProfile?.user?.username}
          onBackClick={handleBack}
        />

        {/* Main Content - Scrollable */}
        <div className="flex-1 overflow-y-auto bg-white" style={{ paddingBottom: '100px' }}>
          <div className="p-8">
            {/* Student Info Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {submissionData.student_name}
              </h1>
              <p className="text-gray-600">
                {submissionData.enrollment_number} • Roll: {submissionData.roll_number}
              </p>
            </div>

            {/* Assignment Info Card */}
            <div className="bg-gray-50 rounded-xl p-5 mb-6 border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {submissionData.assignment_title}
              </h2>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Marks:</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {calculateTotalMarks().toFixed(2)} / {submissionData.assignment_total_marks}
                  </span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span>Submitted: {formatDate(submissionData.submission_date)}</span>
                </div>
              </div>
            </div>

            {/* Questions Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Question-wise Marks</h3>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-[#043276] text-white text-sm font-semibold rounded-lg hover:bg-[#043276]/90 transition"
                  >
                    Edit Marks
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSaveMarks}
                      disabled={isSaving}
                      className={`flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 text-sm font-semibold rounded-lg hover:bg-green-200 transition ${
                        isSaving ? 'opacity-70 cursor-not-allowed' : ''
                      }`}
                    >
                      {isSaving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-green-700/30 border-t-green-700 rounded-full animate-spin"></div>
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>Save</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        // Reset to original marks
                        if (submissionData.question_marks_breakdown) {
                          const initialMarks: { [key: number]: string } = {};
                          submissionData.question_marks_breakdown.forEach((q: QuestionMark) => {
                            if (q.marks_obtained !== null && q.marks_obtained !== undefined) {
                              initialMarks[q.question_id] = q.marks_obtained.toString();
                            } else {
                              initialMarks[q.question_id] = '';
                            }
                          });
                          setQuestionMarks(initialMarks);
                        }
                      }}
                      disabled={isSaving}
                      className="px-4 py-2 bg-red-100 text-red-700 text-sm font-semibold rounded-lg hover:bg-red-200 transition"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {/* Questions List */}
              <div className="space-y-4">
                {submissionData.question_marks_breakdown.map((question: QuestionMark, index: number) => {
                  const studentAnswer = submissionData.answers?.[question.question_id.toString()] ||
                    question.answer ||
                    'No answer provided';

                  return (
                    <div key={question.question_id} className="bg-white rounded-lg p-5 border border-gray-200">
                      {/* Question Header */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-blue-600">
                          Question {index + 1}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded">
                            {question.question_type.toUpperCase()}
                          </span>
                          {question.is_auto_graded && (
                            <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded">
                              Auto
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Question Text */}
                      <div className="mb-4">
                        <HTMLContentViewer
                          html={question.question_text || '<p>No question text</p>'}
                          textColor="#111827"
                        />
                      </div>

                      {/* Student Answer */}
                      <div className="mb-4 pb-4 border-b border-gray-200">
                        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                          Student's Answer:
                        </p>
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                          <p className="text-sm text-gray-900 whitespace-pre-wrap">
                            {studentAnswer}
                          </p>
                        </div>
                      </div>

                      {/* Marks */}
                      <div className="flex items-center justify-between">
                        {isEditing && !question.is_auto_graded ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={questionMarks[question.question_id] || ''}
                              onChange={(e) => handleMarkChange(question.question_id, e.target.value)}
                              className="w-20 px-3 py-2 border-2 border-blue-600 rounded-lg text-base font-semibold text-gray-900 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="0"
                              maxLength={10}
                            />
                            <span className="text-sm text-gray-600">/ {question.max_marks}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-semibold text-gray-900">
                              {question.marks_obtained !== null && question.marks_obtained !== undefined
                                ? question.marks_obtained
                                : '--'}
                            </span>
                            <span className="text-sm text-gray-600">/ {question.max_marks}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Feedback Section */}
            {submissionData.feedback && (
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Feedback</h3>
                <HTMLContentViewer
                  html={submissionData.feedback}
                  textColor="#6B7280"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentSubmissionDetail;

