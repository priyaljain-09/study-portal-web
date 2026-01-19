import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../redux/hooks';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { CheckCircle2, ClipboardList } from 'lucide-react';

const AssignmentSubmit = () => {
  const { subjectId, assignmentId } = useParams<{ subjectId: string; assignmentId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const userProfile = useAppSelector((state) => state.applicationData.userProfile);

  // Get data from location state
  const { course, courseColor } = location.state || {};

  const userInitial = userProfile?.user?.first_name?.charAt(0) ||
    userProfile?.user?.username?.charAt(0) ||
    'S';

  const handleBackToAssignments = () => {
    navigate(`/subject/${subjectId}`, {
      state: {
        subjectName: course?.title,
        classroomId: course?.classroomId,
      }
    });
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activePath={`/subject/${subjectId}`} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header
          userInitial={userInitial}
          userName={userProfile?.user?.first_name || userProfile?.user?.username}
          onBackClick={() => navigate(`/subject/${subjectId}`)}
        />

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto bg-white">
          <div className="flex items-center justify-center min-h-full px-8 py-12">
            <div className="max-w-2xl w-full text-center">
              {/* Success Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-16 h-16 text-green-600" />
                </div>
              </div>

              {/* Heading */}
              <h2 className="text-base font-semibold text-gray-900 mb-2">
                Submission
              </h2>

              {/* Title */}
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Assignment Submitted
              </h1>

              {/* Description */}
              <p className="text-base text-gray-600 mb-12 max-w-md mx-auto leading-relaxed">
                Your assignment has been successfully submitted. You can view your
                submission in the assignments list.
              </p>

              {/* Illustration/Icon */}
              <div className="flex justify-center mb-12">
                <div className="w-72 h-48 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg flex items-center justify-center">
                  <ClipboardList className="w-32 h-32 text-purple-600 opacity-50" />
                </div>
              </div>

              {/* Back Button */}
              <div className="flex justify-center">
                <button
                  onClick={handleBackToAssignments}
                  className="px-8 py-4 bg-blue-100 text-gray-900 rounded-full font-semibold text-base hover:bg-blue-200 transition shadow-sm min-w-[200px]"
                >
                  Back to Assignments
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignmentSubmit;




