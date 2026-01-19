import { useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '../redux/hooks';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { fetchTeacherDashboardSubjects } from '../redux/slices/dashboard';
import { SUBJECT_COLORS, SUBJECT_ICONS } from '../constants/subjects';
import { Grid3x3, List } from 'lucide-react';

interface ClassItem {
  classroom_id: number;
  classroom_name: string;
  subject_id: number;
  subject_name: string;
}

const TeacherDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const userProfile = useAppSelector((state) => state.applicationData.userProfile);
  const dashboardData = useAppSelector((state) => state.dashboard.teacherDashboardData) as any;
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    dispatch(fetchTeacherDashboardSubjects());
  }, [dispatch]);

  // Get classes array directly from API response
  const classes: ClassItem[] = dashboardData?.classes || [];
  const announcements = dashboardData?.announcements || [];
  const pendingAssignments = dashboardData?.pending_assignments || [];

  const getSubjectColor = (index: number): { borderColor: string; bgColor: string } => {
    const color = SUBJECT_COLORS[index % SUBJECT_COLORS.length];
    return {
      borderColor: color,
      bgColor: color,
    };
  };

  const getSubjectIcon = (index: number) => {
    const IconComponent = SUBJECT_ICONS[index % SUBJECT_ICONS.length];
    return <IconComponent className="w-8 h-8" />;
  };

  const handleClassClick = (classItem: ClassItem) => {
    navigate(`/subject/${classItem.subject_id}`, {
      state: {
        subjectName: classItem.subject_name,
        classroomId: classItem.classroom_id,
      }
    });
  };

  const userInitial = userProfile?.user?.first_name?.charAt(0) ||
    userProfile?.user?.username?.charAt(0) ||
    'T';

  // Calculate statistics
  const totalClasses = classes.length;
  const totalPendingGrading = pendingAssignments.reduce((sum, assignment) => {
    const submitted = assignment.submitted_count || 0;
    const total = assignment.total_count || 0;
    return sum + (total - submitted);
  }, 0);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar activePath={location.pathname} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header
          userInitial={userInitial}
          userName={userProfile?.user?.first_name || userProfile?.user?.username}
        />

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto bg-white">
          <div className="p-8">
            {/* Page Header */}
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">My Classes</h1>
                <p className="text-gray-600">
                  Welcome back, {userProfile?.user?.first_name || userProfile?.user?.username || 'Teacher'}.
                </p>
              </div>
              {/* View Toggle */}
              <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded transition ${
                    viewMode === 'grid'
                      ? 'bg-white text-purple-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Grid3x3 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded transition ${
                    viewMode === 'list'
                      ? 'bg-white text-purple-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium mb-1">Total Classes</p>
                    <p className="text-3xl font-bold text-gray-900">{totalClasses}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium mb-1">Pending Grading</p>
                    <p className="text-3xl font-bold text-gray-900">{totalPendingGrading}</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Classes Section */}
              <div className="lg:col-span-2">
                {classes.length > 0 ? (
                  <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 gap-6' : 'grid-cols-1 gap-4'}`}>
                    {classes.map((classItem, index) => {
                      const colors = getSubjectColor(index);
                      
                      return (
                        <div
                          key={`${classItem.classroom_id}-${classItem.subject_id}`}
                          onClick={() => handleClassClick(classItem)}
                          className="bg-white rounded-lg shadow-sm border-t-4 hover:shadow-md transition cursor-pointer overflow-hidden"
                          style={{ borderTopColor: colors.borderColor }}
                        >
                          <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                              <div 
                                className="w-16 h-16 rounded-lg flex items-center justify-center text-white shadow-sm"
                                style={{ backgroundColor: colors.bgColor }}
                              >
                                {getSubjectIcon(index)}
                              </div>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">{classItem.subject_name}</h3>
                            <p className="text-gray-600 text-sm">{classItem.classroom_name}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-white rounded-xl shadow-md p-12 text-center">
                    <p className="text-gray-500 text-lg">No classes assigned yet.</p>
                  </div>
                )}

                {/* Pending Assignments */}
                {pendingAssignments.length > 0 && (
                  <div className="mt-8 bg-white rounded-xl shadow-md p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Pending Assignments</h2>
                    <div className="space-y-3">
                      {pendingAssignments.slice(0, 5).map((assignment: any) => {
                        const submitted = assignment.submitted_count || 0;
                        const total = assignment.total_count || 0;
                        const pending = total - submitted;
                        return (
                          <div key={assignment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{assignment.title}</p>
                              <p className="text-sm text-gray-500">{assignment.subject_name} - {assignment.classroom_name}</p>
                              <div className="mt-2 flex items-center space-x-2">
                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-blue-600 h-2 rounded-full"
                                    style={{ width: `${total > 0 ? (submitted / total) * 100 : 0}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs text-gray-600">
                                  {submitted}/{total}
                                </span>
                              </div>
                            </div>
                            <div className="text-right ml-4">
                              <p className="text-sm font-medium text-gray-700">
                                {new Date(assignment.due_date).toLocaleDateString()}
                              </p>
                              {pending > 0 && (
                                <p className="text-xs text-red-600 font-medium">{pending} pending</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Sidebar */}
              <div className="space-y-6">
                {/* Announcements */}
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Announcements</h2>
                  {announcements.length > 0 ? (
                    <div className="space-y-4">
                      {announcements.map((announcement: any) => (
                        <div key={announcement.id} className="flex items-start space-x-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {announcement.title}
                              </p>
                              {announcement.is_urgent && (
                                <span className="ml-2 bg-red-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                                  Urgent
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(announcement.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No announcements at the moment.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
