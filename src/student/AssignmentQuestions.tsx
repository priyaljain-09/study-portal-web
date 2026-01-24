import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../redux/hooks';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { useGetStudentAssignmentQuestionsQuery, useSubmitStudentAssignmentMutation } from '../redux/api/assignmentApi';
import { Circle, CheckCircle2 } from 'lucide-react';

const AssignmentQuestions = () => {
  const { subjectId, assignmentId } = useParams<{ subjectId: string; assignmentId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const userProfile = useAppSelector((state) => state.applicationData.userProfile);

  // Get data from location state
  const { courseColor, course } = location.state || {};

  const { data: studentAssignmentQuestions, isLoading } = useGetStudentAssignmentQuestionsQuery(Number(assignmentId), {
    skip: !assignmentId,
  });

  const [submitAssignment, { isLoading: isSubmitting }] = useSubmitStudentAssignmentMutation();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});

  const userInitial = userProfile?.user?.first_name?.charAt(0) ||
    userProfile?.user?.username?.charAt(0) ||
    'S';

  const questions = studentAssignmentQuestions?.questions || [];

  const handleMCQSelect = (questionId: number, optionId: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionId.toString(),
    }));
  };

  const handleTextChange = (questionId: number, text: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: text,
    }));
  };

  const handleSubmit = async () => {
    if (!studentAssignmentQuestions || !questions || questions.length === 0) {
      alert('Error: Questions not loaded. Please try again.');
      return;
    }

    // Check if all questions are answered
    const unansweredQuestions = questions.filter((q: any) => {
      const answer = answers[q.id];
      if (!answer) return true;
      // For text questions, check if trimmed answer is empty
      if (q.question_type === 'text' && typeof answer === 'string') {
        return answer.trim() === '';
      }
      return false;
    });

    if (unansweredQuestions.length > 0) {
      alert(
        `Incomplete Answers\nPlease answer all ${questions.length} questions before submitting.`
      );
      return;
    }

    const payload = questions.map((q: any) => {
      const answer = answers[q.id];
      const questionType = q.question_type;

      // For MCQ questions, answer should be number (option_id)
      // For text questions, answer should be string (trimmed)
      let formattedAnswer: string | number;
      if (questionType === 'mcq') {
        // Convert option_id to number
        formattedAnswer = parseInt(answer, 10);
        if (isNaN(formattedAnswer)) {
          throw new Error(`Invalid answer format for MCQ question ${q.id}`);
        }
      } else {
        // Text question - trim and keep as string
        formattedAnswer = typeof answer === 'string' ? answer.trim() : String(answer).trim();
      }

      return {
        question_id: q.id,
        answer: formattedAnswer,
      };
    });

    try {
      await submitAssignment({
        assignmentId: Number(assignmentId),
        subjectId: Number(subjectId),
        answers: payload,
      }).unwrap();

      // Navigate to submission success page
      navigate(`/subject/${subjectId}/assignment/${assignmentId}/submit`, {
        state: {
          assignmentId: assignmentId,
          color: courseColor,
          course: course || { id: Number(subjectId), title: 'Assignment' },
        }
      });
    } catch (error) {
      // Error toast is handled by the API
    }
  };

  const handleNext = () => {
    if (questions && currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar activePath={`/subject/${subjectId}`} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header
            userInitial={userInitial}
            userName={userProfile?.user?.first_name || userProfile?.user?.username}
            onBackClick={() => navigate(`/subject/${subjectId}/assignment/${assignmentId}`)}
          />
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!studentAssignmentQuestions || !questions || questions.length === 0) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar activePath={`/subject/${subjectId}`} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header
            userInitial={userInitial}
            userName={userProfile?.user?.first_name || userProfile?.user?.username}
            onBackClick={() => navigate(`/subject/${subjectId}/assignment/${assignmentId}`)}
          />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-500 text-lg">Assignment questions not found.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const progressPercentage = ((currentQuestionIndex + 1) / totalQuestions) * 100;
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;

  // Strip HTML tags from question text for display
  const getQuestionText = (html: string) => {
    if (!html) return '';
    return html.replace(/<[^>]+>/g, '').trim();
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activePath={`/subject/${subjectId}`} />

      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <Header
          userInitial={userInitial}
          userName={userProfile?.user?.first_name || userProfile?.user?.username}
          onBackClick={() => navigate(`/subject/${subjectId}/assignment/${assignmentId}`)}
        />

        {/* Main Content - Scrollable */}
        <div className="flex-1 overflow-y-auto bg-white" style={{ paddingBottom: '100px' }}>
          <div className="p-4 max-w-4xl mx-auto">
            {/* Progress Section */}
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-900 mb-2">
                Question {currentQuestionIndex + 1}/{totalQuestions}
              </p>
              <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-gray-400 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            {/* Question Block */}
            {currentQuestion && (
              <div className="mb-6">
                <h2 className="text-xl font-medium text-gray-900 mb-6">
                  {currentQuestionIndex + 1}. {getQuestionText(currentQuestion.question_text || '')}
                </h2>

                {/* MCQ Options */}
                {currentQuestion.question_type === 'mcq' && currentQuestion.options && (
                  <div className="space-y-5 ml-2.5">
                    {currentQuestion.options.map((option: any) => (
                      <button
                        key={option.id}
                        onClick={() => handleMCQSelect(currentQuestion.id, option.id)}
                        className="w-full flex items-center gap-2"
                      >
                        {answers[currentQuestion.id] === option.id.toString() ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        )}
                        <span className="text-sm text-gray-700 text-left">
                          {option.text}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Text Input */}
                {currentQuestion.question_type === 'text' && (
                  <textarea
                    className="w-full min-h-[150px] p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-y text-sm"
                    placeholder="Type your answer here"
                    value={answers[currentQuestion.id] || ''}
                    onChange={(e) => handleTextChange(currentQuestion.id, e.target.value)}
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Fixed Bottom Navigation Bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-4 z-10 shadow-lg">
          <div className="max-w-4xl mx-auto">
            {isLastQuestion ? (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`w-full py-3.5 rounded-lg font-semibold text-white transition ${
                  isSubmitting
                    ? 'bg-purple-400 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-700'
                }`}
                style={{ backgroundColor: isSubmitting ? undefined : courseColor || '#8B5CF6' }}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Submitting...</span>
                  </div>
                ) : (
                  'Submit'
                )}
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="w-full py-3.5 rounded-lg font-semibold bg-blue-100 text-gray-900 hover:bg-blue-200 transition"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignmentQuestions;

