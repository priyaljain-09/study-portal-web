import { useAppSelector } from './redux/hooks';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Avatar from './components/Avatar';
import { User, Mail, GraduationCap, BookOpen, Award } from 'lucide-react';

const Profile = () => {
  const userProfile = useAppSelector((state) => state.applicationData.userProfile);
  const isLoading = useAppSelector((state) => state.applicationData.isLoading);

  const userInitial =
    userProfile?.user?.first_name?.charAt(0) ||
    userProfile?.user?.username?.charAt(0) ||
    'U';

  const userName = userProfile?.user?.first_name || userProfile?.user?.username || 'User';
  const userEmail = userProfile?.user?.email || '';
  const userRole = userProfile?.user?.role || '';
  const teacherProfile = userProfile?.teacher_profile;
  const studentProfile = userProfile?.student_profile;

  if (isLoading && !userProfile) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar activePath="/profile" />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header
            userInitial={userInitial}
            userName={userName}
          />
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
              <p className="text-gray-600 text-sm font-medium">Loading profile...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar activePath="/profile" />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header
            userInitial={userInitial}
            userName={userName}
          />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-500 text-lg">No profile data available</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activePath="/profile" />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header
          userInitial={userInitial}
          userName={userName}
        />

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto bg-white">
          <div className="max-w-4xl mx-auto p-8">
            {/* Profile Header Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-8 mb-6 shadow-sm">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <Avatar label={userProfile.user?.username || 'U'} size={80} />
                </div>
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {userProfile.user?.username || 'User'}
                  </h1>
                  <div className="flex items-center gap-4 text-gray-600">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span className="text-sm">{userProfile.user?.email || 'No email'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span className="text-sm capitalize">{userRole || 'No role'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Teacher Profile Section */}
            {teacherProfile && (
              <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-purple-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Teacher Profile</h2>
                </div>

                <div className="space-y-6">
                  {/* Qualification */}
                  {teacherProfile.qualification && (
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Award className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-500 mb-1">Qualification</p>
                        <p className="text-base text-gray-900">{teacherProfile.qualification}</p>
                      </div>
                    </div>
                  )}

                  {/* Class Teacher Of */}
                  {teacherProfile.class_teacher_of && teacherProfile.class_teacher_of.length > 0 && (
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-500 mb-3">Class Teacher Of</p>
                        <div className="flex flex-wrap gap-3">
                          {teacherProfile.class_teacher_of.map((classItem: any) => (
                            <div
                              key={classItem.id}
                              className="px-4 py-2 bg-purple-50 border border-purple-200 rounded-lg"
                            >
                              <p className="text-sm font-semibold text-purple-900">
                                {classItem.name}
                                {classItem.section && (
                                  <span className="text-purple-600 ml-1">({classItem.section})</span>
                                )}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Student Profile Section */}
            {studentProfile && (
              <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Student Profile</h2>
                </div>
                <div className="text-gray-600">
                  <p>Student profile information will be displayed here.</p>
                </div>
              </div>
            )}

            {/* User Info Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Account Information</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-500">User ID</span>
                  <span className="text-sm text-gray-900">{userProfile.user?.id || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-500">Username</span>
                  <span className="text-sm text-gray-900">{userProfile.user?.username || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-500">Email</span>
                  <span className="text-sm text-gray-900">{userProfile.user?.email || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-sm font-medium text-gray-500">Role</span>
                  <span className="text-sm text-gray-900 capitalize">{userRole || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

