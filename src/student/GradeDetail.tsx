import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../redux/hooks';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { useFetchGradesByIdQuery } from '../redux/api/gradesApi';
import HTMLContentViewer from '../components/HTMLContentViewer';
import Avatar from '../components/Avatar';
import { Award, FileText, Calendar } from 'lucide-react';

const GradeDetail = () => {
  const { subjectId, gradeId } = useParams<{ subjectId: string; gradeId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const userProfile = useAppSelector((state) => state.applicationData.userProfile);
  
  // Get courseColor from location state or use default
  const courseColor = location.state?.courseColor || '#8B5CF6';
  const subjectName = location.state?.subjectName || 'Subject';

  const { data: gradesDetail, isLoading } = useFetchGradesByIdQuery(Number(gradeId), {
    skip: !gradeId,
  });

  const userInitial = userProfile?.user?.first_name?.charAt(0) ||
    userProfile?.user?.username?.charAt(0) ||
    'S';

  const handleBack = () => {
    navigate(`/subject/${subjectId}?tab=grades`, {
      state: { subjectName, courseColor }
    });
  };

  // Calculate progress
  const marks = gradesDetail?.marks_obtained ?? null;
  const total = gradesDetail?.assignment_totalmarks || 0;
  const progressPercentage = marks !== null && total > 0
    ? parseFloat(String(marks)) / total
    : 0;

  // Calculate circular progress
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - progressPercentage * circumference;

  // Get grade color based on percentage
  const getGradeColor = () => {
    if (!progressPercentage) return '#9CA3AF';
    if (progressPercentage >= 0.8) return '#10B981'; // Green
    if (progressPercentage >= 0.6) return '#3B82F6'; // Blue
    if (progressPercentage >= 0.4) return '#F59E0B'; // Orange
    return '#EF4444'; // Red
  };

  const gradeColor = getGradeColor();

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

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
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div 
                  className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"
                  style={{ borderTopColor: courseColor }}
                ></div>
              </div>
            ) : gradesDetail ? (
              <>
                {/* Grade Card */}
                <div className="bg-white rounded-2xl p-6 mb-6 shadow-md border border-gray-200">
                  <div className="flex items-center mb-6">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center mr-3"
                      style={{ backgroundColor: `${courseColor}15` }}
                    >
                      <Award className="w-6 h-6" style={{ color: courseColor }} />
                    </div>
                    <h2 className="text-base font-semibold text-gray-600">Your Score</h2>
                  </div>

                  <div className="flex flex-col items-center">
                    {/* Circular Progress */}
                    <div className="relative w-[140px] h-[140px] mb-5">
                      <svg
                        width="140"
                        height="140"
                        viewBox="0 0 100 100"
                        className="transform -rotate-90"
                      >
                        {/* Background circle */}
                        <circle
                          cx="50"
                          cy="50"
                          r={radius}
                          stroke="#E5E7EB"
                          strokeWidth="8"
                          fill="none"
                        />
                        {/* Progress circle */}
                        <circle
                          cx="50"
                          cy="50"
                          r={radius}
                          stroke={gradeColor}
                          strokeWidth="8"
                          strokeDasharray={circumference}
                          strokeDashoffset={strokeDashoffset}
                          strokeLinecap="round"
                          fill="none"
                          className="transition-all duration-500"
                        />
                      </svg>
                      {/* Score text in center */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className="flex items-baseline">
                          <span 
                            className="text-4xl font-bold leading-none"
                            style={{ color: gradeColor }}
                          >
                            {marks !== null ? marks : '--'}
                          </span>
                          <span className="text-lg font-medium text-gray-400 ml-1">
                            /{total}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Percentage */}
                    <div className="text-center">
                      <div 
                        className="text-3xl font-bold mb-1"
                        style={{ color: gradeColor }}
                      >
                        {Math.round(progressPercentage * 100)}%
                      </div>
                      <div className="text-sm font-medium text-gray-600">
                        of total marks
                      </div>
                    </div>
                  </div>
                </div>

                {/* Assignment Info Card */}
                <div className="bg-white rounded-2xl p-5 mb-6 shadow-md border border-gray-200">
                  <div className="flex items-center mb-4">
                    <FileText className="w-5 h-5 mr-2.5" style={{ color: courseColor }} />
                    <h3 className="text-lg font-bold text-gray-900">Assignment</h3>
                  </div>

                  <h4 className="text-2xl font-bold text-gray-900 mb-3">
                    {gradesDetail.assignment_title || 'Assignment'}
                  </h4>

                  <div className="mb-4">
                    <HTMLContentViewer
                      html={gradesDetail?.assignment_description || '<p>No description available</p>'}
                      textColor="#4B5563"
                    />
                  </div>

                  {/* Submission Date */}
                  {gradesDetail?.submission_date && (
                    <div className="flex items-center pt-4 mt-4 border-t border-gray-200">
                      <Calendar className="w-4 h-4 text-gray-500 mr-2" />
                      <span className="text-sm text-gray-600 font-medium">
                        Submitted on {formatDate(gradesDetail.submission_date)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Feedback Section - Only show if feedback exists */}
                {gradesDetail?.feedback && gradesDetail.feedback.trim() !== '' && (
                  <div className="bg-white rounded-2xl p-5 mb-6 shadow-md border border-gray-200">
                    <div className="flex items-center mb-4">
                      <Award className="w-5 h-5 mr-2.5" style={{ color: courseColor }} />
                      <h3 className="text-lg font-bold text-gray-900">Teacher Feedback</h3>
                    </div>

                    <div className="mt-2">
                      {/* Teacher Info */}
                      {gradesDetail?.teacher_name && (
                        <div className="flex items-center mb-4 pb-4 border-b border-gray-200">
                          <Avatar label={gradesDetail.teacher_name} size={40} />
                          <div className="ml-3 flex-1">
                            <div className="text-base font-semibold text-gray-900">
                              {gradesDetail.teacher_name}
                            </div>
                            <div className="text-sm text-gray-600">Instructor</div>
                          </div>
                        </div>
                      )}

                      {/* Feedback Text */}
                      <div className="mt-2">
                        <HTMLContentViewer
                          html={gradesDetail.feedback}
                          textColor="#1F2937"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="py-12 text-center">
                <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Grade not found.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GradeDetail;


