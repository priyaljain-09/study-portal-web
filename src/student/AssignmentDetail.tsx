import { useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../redux/hooks';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { useGetAssignmentByIdQuery } from '../redux/api/assignmentApi';
import HTMLContentViewer from '../components/HTMLContentViewer';
import { ClipboardList, Upload, FileText } from 'lucide-react';

const AssignmentDetail = () => {
  const { subjectId, assignmentId } = useParams<{ subjectId: string; assignmentId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const userProfile = useAppSelector((state) => state.applicationData.userProfile);
  const userRole = useAppSelector((state) => state.applicationData.userRole) || localStorage.getItem('userRole') || 'student';

  // Get data from location state
  const { assignment, subjectName, courseColor, course } = location.state || {};

  const { data: assignmentDetail, isLoading } = useGetAssignmentByIdQuery(Number(assignmentId), {
    skip: !assignmentId,
  });

  const userInitial = userProfile?.user?.first_name?.charAt(0) ||
    userProfile?.user?.username?.charAt(0) ||
    'S';

  // Use assignmentDetail if available, otherwise fall back to assignment from state
  const assignmentData = assignmentDetail || assignment;

  // Memoize HTML content to prevent unnecessary re-renders
  const htmlContent = useMemo(() => {
    return assignmentData?.description || '<p>No description available.</p>';
  }, [assignmentData?.description]);

  const handleAssessment = () => {
    if (assignmentData?.questions?.length > 0) {
      navigate(`/subject/${subjectId}/assignment/${assignmentId}/questions`, {
        state: {
          assignmentId: assignmentData.id,
          color: courseColor,
          course: course,
          assignment: assignmentData,
        }
      });
    } else {
      alert('Assessment Not Ready\nThe assessment is currently not available. Please check back later.');
    }
  };

  const handleUploadFile = () => {
    // TODO: Implement file upload functionality
    alert('File upload functionality - to be implemented');
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar activePath={`/subject/${subjectId}`} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header
            userInitial={userInitial}
            userName={userProfile?.user?.first_name || userProfile?.user?.username}
            onBackClick={() => navigate(`/subject/${subjectId}`)}
          />
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!assignmentData) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar activePath={`/subject/${subjectId}`} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header
            userInitial={userInitial}
            userName={userProfile?.user?.first_name || userProfile?.user?.username}
            onBackClick={() => navigate(`/subject/${subjectId}`)}
          />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <ClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Assignment not found.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isMixedType = assignmentData.assignment_type === 'mixed';
  const hasQuestions = assignmentData?.questions?.length > 0;

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activePath={`/subject/${subjectId}`} />

      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <Header
          userInitial={userInitial}
          userName={userProfile?.user?.first_name || userProfile?.user?.username}
          onBackClick={() => navigate(`/subject/${subjectId}`)}
        />

        {/* Main Content - Scrollable */}
        <div className="flex-1 overflow-y-auto bg-white" style={{ paddingBottom: '100px' }}>
          <div className="p-8">
            {/* Banner/Icon Section */}
            <div className="mb-6">
              <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-purple-600" />
              </div>
            </div>

            {/* Assignment Title */}
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
              {assignmentData.title || 'Assignment'}
            </h1>

            {/* Assignment Description */}
            <div className="mb-8">
              <HTMLContentViewer
                html={htmlContent}
                textColor="#444"
              />
            </div>

            {/* Assignment Info */}
            {assignmentData.due_date && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Due Date</p>
                <p className="text-base font-semibold text-gray-900">
                  {new Date(assignmentData.due_date).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  })}
                </p>
              </div>
            )}

            {assignmentData.total_marks && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Total Marks</p>
                <p className="text-base font-semibold text-gray-900">
                  {assignmentData.total_marks} Marks
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Fixed Bottom Action Bar */}
        {userRole === 'student' && (
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-8 py-4 z-10 shadow-lg">
            <div className="max-w-4xl mx-auto">
              {isMixedType ? (
                <button
                  onClick={handleAssessment}
                  disabled={!hasQuestions}
                  className={`w-full py-4 px-6 rounded-lg font-semibold text-base transition ${
                    hasQuestions
                      ? 'bg-blue-100 text-gray-900 hover:bg-blue-200'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <ClipboardList className="w-5 h-5" />
                    <span>Take Assessment</span>
                  </div>
                </button>
              ) : (
                <button
                  onClick={handleUploadFile}
                  className="w-full py-4 px-6 rounded-lg font-semibold text-base bg-blue-600 text-white hover:bg-blue-700 transition shadow-md"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Upload className="w-5 h-5" />
                    <span>Upload File</span>
                  </div>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignmentDetail;




