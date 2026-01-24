import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../redux/hooks';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { Users, Calendar, FileText, Award, CheckCircle2, XCircle } from 'lucide-react';

interface Grade {
  id: number;
  student_id: number;
  student_name: string;
  enrollment_number: string;
  roll_number: string;
  status: string;
  is_submitted: boolean;
  marks_obtained: string | null;
  submission_date: string | null;
}

interface Assignment {
  id: number;
  title: string;
  classroom: string;
  due_date: string;
  total_marks: number;
  grades?: Grade[];
}

interface Course {
  id: number;
  title: string;
  color: string;
}

const AssignmentGrades = () => {
  const { subjectId, assignmentId, classroomId: classroomIdParam } = useParams<{
    subjectId: string;
    assignmentId: string;
    classroomId?: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();
  const userProfile = useAppSelector((state) => state.applicationData.userProfile);
  const isLoading = useAppSelector((state) => state.applicationData.isLoading);

  // Get data from location state
  const { assignment, course, courseColor, classroomId: classroomIdFromState, subjectName } = location.state || {};
  const classroomId = classroomIdParam ? Number(classroomIdParam) : classroomIdFromState;

  const [grades] = useState<Grade[]>((assignment as Assignment)?.grades || []);

  const userInitial = userProfile?.user?.first_name?.charAt(0) ||
    userProfile?.user?.username?.charAt(0) ||
    'S';

  // Helper function to get the correct route path based on user role
  const getRoutePath = (path: string) => {
    if (classroomId) {
      return `/classroom/${classroomId}${path}`;
    }
    return path;
  };

  const handleBack = () => {
    navigate(getRoutePath(`/subject/${subjectId}?tab=grades`), {
      state: { subjectName, classroomId, courseColor }
    });
  };

  const handleStudentPress = (grade: Grade) => {
    if (grade.is_submitted) {
      navigate(getRoutePath(`/subject/${subjectId}/assignment/${assignmentId}/submission/${grade.id}`), {
        state: {
          submissionId: grade.id,
          assignment: {
            id: (assignment as Assignment)?.id,
            title: (assignment as Assignment)?.title,
            total_marks: (assignment as Assignment)?.total_marks,
          },
          course: course as Course,
          courseColor,
          subjectName,
          classroomId,
        },
      });
    }
  };

  const handleEditPress = (grade: Grade, e: React.MouseEvent) => {
    e.stopPropagation();
    if (grade.is_submitted) {
      navigate(getRoutePath(`/subject/${subjectId}/assignment/${assignmentId}/submission/${grade.id}`), {
        state: {
          submissionId: grade.id,
          assignment: {
            id: (assignment as Assignment)?.id,
            title: (assignment as Assignment)?.title,
            total_marks: (assignment as Assignment)?.total_marks,
          },
          course: course as Course,
          courseColor,
          subjectName,
          classroomId,
        },
      });
    }
  };

  const assignmentData = assignment as Assignment;

  const submittedCount = grades.filter(g => g.is_submitted).length;
  const gradedCount = grades.filter(
    g => g.marks_obtained !== null && g.marks_obtained !== undefined
  ).length;

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
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

  if (!assignmentData) {
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
              <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Assignment not found.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
            {/* Banner/Icon Section */}
            <div className="mb-6">
              <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Award className="w-8 h-8 text-purple-600" />
              </div>
            </div>

            {/* Assignment Title */}
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {assignmentData.title || 'Assignment Grades'}
            </h1>
            
            {/* Stats */}
            <p className="text-gray-600 mb-6">
              {submittedCount} submitted • {gradedCount} graded
            </p>

            {/* Assignment Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center mb-2">
                  <Users className="w-5 h-5 text-gray-600 mr-2" />
                  <p className="text-sm text-gray-600">Classroom</p>
                </div>
                <p className="text-base font-semibold text-gray-900">
                  {assignmentData.classroom}
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center mb-2">
                  <Calendar className="w-5 h-5 text-gray-600 mr-2" />
                  <p className="text-sm text-gray-600">Due Date</p>
                </div>
                <p className="text-base font-semibold text-gray-900">
                  {formatDate(assignmentData.due_date)}
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center mb-2">
                  <FileText className="w-5 h-5 text-gray-600 mr-2" />
                  <p className="text-sm text-gray-600">Total Marks</p>
                </div>
                <p className="text-base font-semibold text-gray-900">
                  {assignmentData.total_marks} Marks
                </p>
              </div>
            </div>

            {/* Students List */}
            {grades.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No students found for this assignment.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {grades.map((grade) => (
                  <div
                    key={grade.id}
                    onClick={() => handleStudentPress(grade)}
                    className={`
                      bg-white rounded-lg p-4 border border-gray-200 
                      ${grade.is_submitted 
                        ? 'hover:border-purple-300 hover:shadow-md cursor-pointer transition-all' 
                        : 'opacity-75 cursor-not-allowed'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between">
                      {/* Student Info */}
                      <div className="flex-1 min-w-0 mr-4">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-base font-semibold text-gray-900">
                            {grade.student_name}
                          </h3>
                          {grade.is_submitted ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          Roll: {grade.roll_number} • Enrollment: {grade.enrollment_number}
                        </p>
                        {grade.is_submitted && grade.submission_date ? (
                          <p className="text-xs text-green-600 font-medium mt-1">
                            Submitted: {formatDate(grade.submission_date)}
                          </p>
                        ) : (
                          <p className="text-xs text-red-600 font-medium mt-1">
                            Not submitted
                          </p>
                        )}
                      </div>

                      {/* Grade Display */}
                      <div className="flex-shrink-0 flex flex-col items-end">
                        <div className="text-right mb-2">
                          <span className="text-lg font-semibold text-gray-900">
                            {grade.marks_obtained !== null && grade.marks_obtained !== undefined
                              ? grade.marks_obtained
                              : '--'}
                          </span>
                          <span className="text-sm text-gray-500 ml-1">
                            / {assignmentData.total_marks}
                          </span>
                        </div>
                        {grade.is_submitted && (
                          <button
                            onClick={(e) => handleEditPress(grade, e)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md transition-colors"
                          >
                            Edit
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignmentGrades;

