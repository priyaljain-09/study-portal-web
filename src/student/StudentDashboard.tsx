import { useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '../redux/hooks';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { fetchDashboardSubject } from '../redux/slices/dashboard';
import type { StudentDashboardData, Subject } from '../types/dashboard';
import { Grid3x3, List, ChevronLeft, ChevronRight, Bell } from 'lucide-react';
import { SUBJECT_COLORS, SUBJECT_ICONS } from '../constants/subjects';

const StudentDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const userProfile = useAppSelector((state) => state.applicationData.userProfile);
  const dashboardData = useAppSelector((state) => state.dashboard.allSubjects) as StudentDashboardData;
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    dispatch(fetchDashboardSubject());
  }, [dispatch]);

  const subjects: Subject[] = dashboardData?.subjects || [];
  const announcements = dashboardData?.announcements || [];

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

  const formatClassTime = (dateString?: string, timeString?: string) => {
    if (!dateString && !timeString) return null;
    
    try {
      const now = new Date();
      const classDate = dateString ? new Date(dateString) : null;
      
      if (classDate) {
        const diffTime = classDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
          return `Today, ${timeString || 'TBA'}`;
        } else if (diffDays === 1) {
          return `Tomorrow, ${timeString || 'TBA'}`;
        } else if (diffDays > 1 && diffDays < 7) {
          const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          return `${dayNames[classDate.getDay()]}, ${timeString || 'TBA'}`;
        } else {
          return `${classDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}, ${timeString || 'TBA'}`;
        }
      }
      
      return timeString || null;
    } catch {
      return timeString || dateString || null;
    }
  };

  const getCurrentDate = () => {
    return new Date().getDate();
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + (direction === 'next' ? 1 : -1), 1));
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return date.toLocaleDateString();
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const currentDate = getCurrentDate();
  const isCurrentMonth = currentMonth.getMonth() === new Date().getMonth() && currentMonth.getFullYear() === new Date().getFullYear();

  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const userInitial = userProfile?.user?.first_name?.charAt(0) ||
    userProfile?.user?.username?.charAt(0) ||
    'S';

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
                <h1 className="text-4xl font-bold text-gray-900 mb-2">My Subjects</h1>
                <p className="text-gray-600">
                  Good morning, {userProfile?.user?.first_name || userProfile?.user?.last_name || userProfile?.user?.username || 'Student'}.
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Subjects Section */}
              <div className="lg:col-span-2">
                {subjects.length > 0 ? (
                  <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 gap-6' : 'grid-cols-1 gap-4'}`}>
                    {subjects.map((subject, index) => {
                      const colors = getSubjectColor(index);
                      const classTime = subject.upcoming_classes && subject.upcoming_classes.length > 0
                        ? formatClassTime(subject.upcoming_classes[0].date, subject.upcoming_classes[0].time)
                        : null;
                      
                      return (
                        <div
                          key={subject.id}
                          onClick={() => navigate(`/subject/${subject.id}`, { state: { subjectName: subject.name } })}
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
                              {subject.due_assignments && subject.due_assignments > 0 && (
                                <span className="bg-red-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                                  {subject.due_assignments} due
                                </span>
                              )}
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">{subject.name}</h3>
                            {classTime && (
                              <p className="text-gray-600 text-sm">{classTime}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-white rounded-xl shadow-md p-12 text-center">
                    <p className="text-gray-500 text-lg">No subjects enrolled yet.</p>
                  </div>
                )}
              </div>

              {/* Right Sidebar */}
              <div className="space-y-6">
                {/* Calendar */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Calendar</h2>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => navigateMonth('prev')}
                        className="p-1.5 hover:bg-gray-100 rounded transition"
                      >
                        <ChevronLeft className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => navigateMonth('next')}
                        className="p-1.5 hover:bg-gray-100 rounded transition"
                      >
                        <ChevronRight className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </div>
                  <div className="text-center mb-4">
                    <p className="text-base font-semibold text-gray-900">
                      {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                    </p>
                  </div>
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {daysOfWeek.map((day) => (
                      <div key={day} className="text-center text-xs font-semibold text-gray-500 py-2">
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((day, index) => (
                      <div
                        key={index}
                        className={`text-center text-sm py-2 rounded transition ${
                          day === null
                            ? 'text-transparent'
                            : day === currentDate && isCurrentMonth
                              ? 'bg-purple-600 text-white font-semibold rounded-full'
                              : 'text-gray-700 hover:bg-gray-100 cursor-pointer rounded-full'
                        }`}
                      >
                        {day}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Announcements */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Announcements</h2>
                  {announcements.length > 0 ? (
                    <div className="space-y-4">
                      {announcements.map((announcement) => (
                        <div key={announcement.id} className="flex items-start space-x-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <Bell className="w-4 h-4 text-purple-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {announcement.title}
                              </p>
                              {announcement.is_urgent && (
                                <span className="ml-2 bg-red-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0">
                                  Urgent
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">{formatTimeAgo(announcement.created_at)}</p>
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

export default StudentDashboard;
