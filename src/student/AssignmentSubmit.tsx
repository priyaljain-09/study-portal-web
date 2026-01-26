import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../redux/hooks';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { ClipboardList } from 'lucide-react';

const AssignmentSubmit = () => {
  const { subjectId, classroomId: classroomIdParam } = useParams<{ 
    subjectId: string; 
    classroomId?: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();
  const userProfile = useAppSelector((state) => state.applicationData.userProfile);
  const userRole = useAppSelector((state) => state.applicationData.userRole) || localStorage.getItem('userRole') || 'student';

  // Get data from location state
  const { course, classroomId: classroomIdFromState } = location.state || {};
  
  // Get classroomId from URL params or location state
  const classroomId = classroomIdParam ? Number(classroomIdParam) : classroomIdFromState;

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

  const handleBackToAssignments = () => {
    navigate(getRoutePath(`/subject/${subjectId}?tab=assignment`), {
      state: {
        subjectName: course?.title,
        classroomId,
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
          onBackClick={handleBackToAssignments}
        />

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto bg-white">
          <div className="flex items-center justify-center min-h-full px-5 py-12">
            <div className="max-w-2xl w-full text-center">
              {/* Heading */}
              <h2 className="text-base font-semibold text-gray-900 mb-2">
                Submission
              </h2>

              {/* Title */}
              <h1 className="text-2xl font-bold text-gray-900 mb-3">
                Assignment Submitted
              </h1>

              {/* Description */}
              <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto leading-relaxed px-4">
                Your assignment has been successfully submitted. You can view your
                submission in the assignments list.
              </p>

              {/* Illustration/Icon */}
              <div className="flex justify-center mb-10">
                <div className="w-[280px] h-[180px] bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg flex items-center justify-center">
                  <ClipboardList className="w-32 h-32 text-purple-600 opacity-50" />
                </div>
              </div>

              {/* Back Button */}
              <div className="px-5 pb-10">
                <button
                  onClick={handleBackToAssignments}
                  className="w-full py-3.5 px-5 rounded-full font-semibold text-base bg-blue-100 text-gray-900 hover:bg-blue-200 transition min-h-[50px]"
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




