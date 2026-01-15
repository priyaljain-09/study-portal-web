import { useAppSelector } from '../redux/hooks';
import { useLocation } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';

const Dashboard = () => {
  const location = useLocation();
  const userProfile = useAppSelector((state) => state.applicationData.userProfile);
  const [viewMode] = useState<'grid' | 'list'>('grid');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const subjects = [
    { id: 1, name: 'Mathematics', time: 'Today, 10:30 AM', icon: '📐', color: 'blue', due: 2 },
    { id: 2, name: 'Literature', time: 'Today, 3:30 PM', icon: '📖', color: 'pink', due: 0 },
    { id: 3, name: 'Architecture', time: 'Thursday, 1:00 PM', icon: '🏛️', color: 'green', due: 0 },
    { id: 4, name: 'Environmental Science', time: 'Friday, 2:00 PM', icon: '🌿', color: 'green', due: 0 },
  ];

  const announcements = [
    { id: 1, title: 'Mid-term Exams Sched...', time: '2 hours ago', urgent: true },
    { id: 2, title: 'Library Hours Extended', time: '1 day ago', urgent: false },
    { id: 3, title: 'Guest Lecture on AI', time: '3 days ago', urgent: false },
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      purple: 'bg-purple-100 text-purple-600',
      pink: 'bg-pink-100 text-pink-600',
      gray: 'bg-gray-100 text-gray-600',
      orange: 'bg-orange-100 text-orange-600',
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
    };
    return colors[color] || colors.blue;
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

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const currentDate = getCurrentDate();
  const isCurrentMonth = currentMonth.getMonth() === new Date().getMonth() && currentMonth.getFullYear() === new Date().getFullYear();

  const calendarDays = [];
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const userInitial = userProfile?.user?.first_name?.charAt(0) ||
    userProfile?.user?.username?.charAt(0) ||
    'P';

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
        <div className="flex-1 overflow-y-auto">
          <div className="p-8">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-black mb-2">My Subjects</h1>
              <p className="text-gray-600">Good morning, {userProfile?.user?.first_name || userProfile?.user?.username || 'Student'}.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Subjects Section */}
              <div className="lg:col-span-2">
                <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 gap-6' : 'grid-cols-1 gap-4'}`}>
                  {subjects.map((subject) => (
                    <div
                      key={subject.id}
                      className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition cursor-pointer"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className={`w-12 h-12 ${getColorClasses(subject.color)} rounded-lg flex items-center justify-center text-2xl`}>
                          {subject.icon}
                        </div>
                        {subject.due > 0 && (
                          <span className="bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
                            {subject.due} due
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{subject.name}</h3>
                      <p className="text-gray-600 text-sm">{subject.time}</p>
                    </div>
                  ))}
                  {/* Empty subject cards */}
                  <div className="bg-white rounded-xl shadow-md p-6 border-2 border-dashed border-gray-300 flex items-center justify-center min-h-[150px]">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-2xl">
                      📐
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-md p-6 border-2 border-dashed border-gray-300 flex items-center justify-center min-h-[150px]">
                    <div className="w-12 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center text-2xl">
                      🌿
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Sidebar */}
              <div className="space-y-6">
                {/* Calendar */}
                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Calendar</h2>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => navigateMonth('prev')}
                        className="p-1 hover:bg-gray-100 rounded transition"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => navigateMonth('next')}
                        className="p-1 hover:bg-gray-100 rounded transition"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="text-center mb-4">
                    <p className="text-lg font-semibold text-gray-900">
                      {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                    </p>
                  </div>
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {daysOfWeek.map((day) => (
                      <div key={day} className="text-center text-xs font-semibold text-gray-600 py-2">
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((day, index) => (
                      <div
                        key={index}
                        className={`text-center text-sm py-2 rounded ${day === null
                            ? 'text-gray-300'
                            : day === currentDate && isCurrentMonth
                              ? 'bg-purple-600 text-white font-semibold'
                              : 'text-gray-700 hover:bg-gray-100 cursor-pointer'
                          }`}
                      >
                        {day}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Announcements */}
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Announcements</h2>
                  <div className="space-y-4">
                    {announcements.map((announcement) => (
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
                            {announcement.urgent && (
                              <span className="ml-2 bg-red-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                                Urgent
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{announcement.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
