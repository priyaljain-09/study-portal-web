import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../redux/hooks';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import Avatar from '../components/Avatar';
import { Mail, Phone, MessageCircle, GraduationCap, Users } from 'lucide-react';

const PersonDetail = () => {
  const { subjectId, classroomId: classroomIdParam } = useParams<{ 
    subjectId: string; 
    personId: string; 
    classroomId?: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();
  const userProfile = useAppSelector((state) => state.applicationData.userProfile);
  const userRole = useAppSelector((state) => state.applicationData.userRole) || localStorage.getItem('userRole') || 'student';

  // Get person data from location state
  const { person, classroomId: classroomIdFromState, subjectName } = location.state || {};
  
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

  const handleBack = () => {
    navigate(getRoutePath(`/subject/${subjectId}?tab=people`), {
      state: { subjectName, classroomId }
    });
  };

  const handleContact = (type: 'email' | 'phone' | 'message') => {
    if (!person) return;

    if (type === 'email') {
      const emailUrl = `mailto:${person.email}`;
      window.open(emailUrl, '_blank');
    } else if (type === 'phone' && person.phone) {
      const phoneUrl = `tel:${person.phone}`;
      window.open(phoneUrl, '_blank');
    } else if (type === 'message') {
      // Implement message functionality if needed
      console.log('Message functionality not implemented yet');
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'teacher':
        return 'Teacher';
      case 'assistant':
        return 'Teaching Assistant';
      default:
        return 'Student';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'teacher':
        return <GraduationCap className="w-5 h-5 text-purple-600" />;
      case 'assistant':
        return <Users className="w-5 h-5 text-cyan-600" />;
      default:
        return <Users className="w-5 h-5 text-gray-600" />;
    }
  };

  if (!person) {
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
              <p className="text-gray-500 text-lg">Person not found</p>
              <button
                onClick={handleBack}
                className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activePath={`/subject/${subjectId}`} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          userInitial={userInitial}
          userName={userProfile?.user?.first_name || userProfile?.user?.username}
          onBackClick={handleBack}
        />

        <div className="flex-1 overflow-y-auto bg-white">
          <div className="p-8">
            {/* Person Header Section */}
            <div className="flex items-start gap-6 mb-8">
              {/* Avatar */}
              <div className="flex-shrink-0">
                {person.avatar ? (
                  <img
                    src={person.avatar}
                    alt={person.name}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  <Avatar label={person.name} size={80} />
                )}
              </div>

              {/* Name and Role Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold text-gray-900">{person.name}</h1>
                  <div className="flex items-center gap-2">
                    {getRoleIcon(person.role)}
                    <span className="text-base font-semibold text-gray-700">
                      {getRoleLabel(person.role)}
                    </span>
                  </div>
                </div>
                {person.department && (
                  <p className="text-sm text-gray-600 mb-1">{person.department}</p>
                )}
                <p className="text-sm text-gray-500">{person.email}</p>
              </div>

              {/* Contact Actions */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <button
                  onClick={() => handleContact('email')}
                  className="p-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
                  title="Send Email"
                >
                  <Mail className="w-5 h-5" />
                </button>
                {person.phone && (
                  <button
                    onClick={() => handleContact('phone')}
                    className="p-3 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition"
                    title="Call"
                  >
                    <Phone className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={() => handleContact('message')}
                  className="p-3 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition"
                  title="Message"
                >
                  <MessageCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Information Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Contact Information Card */}
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Email</label>
                    <p className="text-base text-gray-900 mt-1 break-all">{person.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Phone</label>
                    <p className="text-base text-gray-900 mt-1">{person.phone || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Academic Information Card */}
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Academic Information</h2>
                <div className="space-y-4">
                  {person.enrollment_number && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Enrollment Number</label>
                      <p className="text-base text-gray-900 mt-1">{person.enrollment_number}</p>
                    </div>
                  )}
                  {person.roll_number && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Roll Number</label>
                      <p className="text-base text-gray-900 mt-1">{person.roll_number}</p>
                    </div>
                  )}
                  {person.grade && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Grade</label>
                      <p className="text-base text-gray-900 mt-1">{person.grade}</p>
                    </div>
                  )}
                  {!person.enrollment_number && !person.roll_number && !person.grade && (
                    <p className="text-sm text-gray-500">No academic information available</p>
                  )}
                </div>
              </div>

              {/* Additional Information Card */}
              {(person.qualification || person.department) && (
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 md:col-span-2">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {person.qualification && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Qualification</label>
                        <p className="text-base text-gray-900 mt-1">{person.qualification}</p>
                      </div>
                    )}
                    {person.department && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Department</label>
                        <p className="text-base text-gray-900 mt-1">{person.department}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonDetail;

