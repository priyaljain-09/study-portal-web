import { useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../redux/hooks';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { useGetAnnouncementByIdQuery } from '../redux/api/announcementApi';
import HTMLContentViewer from '../components/HTMLContentViewer';
import Avatar from '../components/Avatar';

const formatDate = (isoDate: string | undefined): string => {
  if (!isoDate) return 'Invalid date';

  const date = new Date(isoDate);
  if (isNaN(date.getTime())) return 'Invalid date';

  const options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  };

  return new Intl.DateTimeFormat('en-GB', options)
    .format(date)
    .replace(',', ' at');
};

const AnnouncementDetail = () => {
  const { subjectId, announcementId } = useParams<{ subjectId: string; announcementId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const userProfile = useAppSelector((state) => state.applicationData.userProfile);
  const userRole = useAppSelector((state) => state.applicationData.userRole) || localStorage.getItem('userRole') || 'student';

  const { data: announcementDetail = {}, isLoading } = useGetAnnouncementByIdQuery(Number(announcementId), {
    skip: !announcementId,
  });

  const userInitial = userProfile?.user?.first_name?.charAt(0) ||
    userProfile?.user?.username?.charAt(0) ||
    'S';

  // Memoize HTML content to prevent unnecessary re-renders of HtmlContentViewer
  const htmlContent = useMemo(() => {
    return announcementDetail?.message || '<p>No announcement content available.</p>';
  }, [announcementDetail?.message]);

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar activePath={`/subject/${subjectId}`} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header
            userInitial={userInitial}
            userName={userProfile?.user?.first_name || userProfile?.user?.username}
            onBackClick={() => {
              const getRoutePath = (path: string) => {
                if (userRole === 'teacher' && location.state?.classroomId) {
                  return `/classroom/${location.state.classroomId}${path}`;
                }
                return path;
              };
              navigate(`${getRoutePath(`/subject/${subjectId}`)}?tab=announcement`);
            }}
          />
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
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
          onBackClick={() => navigate(`/subject/${subjectId}`)}
        />

        <div className="flex-1 overflow-y-auto bg-white">
          <div className="p-8">
            {/* Author Info */}
            <div className="flex items-center gap-5 mb-4">
              <Avatar label={announcementDetail?.teacher_name || ''} size={50} />
              <div>
                <p className="text-base font-semibold text-blue-700">
                  {announcementDetail?.teacher_name}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {announcementDetail?.teacher_role?.toUpperCase()} | Posted {formatDate(announcementDetail?.created_at)}
                </p>
              </div>
            </div>

            {/* Announcement Title */}
            <h1 className="text-2xl font-bold text-gray-900 mt-4 mb-4">
              {announcementDetail?.title}
            </h1>

            {/* Announcement Content */}
            <HTMLContentViewer
              html={htmlContent}
              textColor="#444"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementDetail;

