import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../redux/hooks';
import { useGetNotificationsQuery, useMarkNotificationAsReadMutation } from '../redux/api/notificationsApi';
import { markAsRead } from '../redux/slices/notificationsSlice';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { Bell } from 'lucide-react';

const Notifications = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const userProfile = useAppSelector((state) => state.applicationData.userProfile);
  const { data: notificationsData, isLoading, refetch } = useGetNotificationsQuery({});
  const [markAsReadMutation] = useMarkNotificationAsReadMutation();

  const userInitial =
    userProfile?.user?.first_name?.charAt(0) ||
    userProfile?.user?.username?.charAt(0) ||
    'S';

  useEffect(() => {
    refetch();
  }, [refetch]);

  const handleBack = () => {
    navigate('/dashboard');
  };

  const handleNotificationClick = async (notificationId: number) => {
    try {
      await markAsReadMutation(notificationId);
      dispatch(markAsRead(notificationId));
    } catch (error) {
      // Error handled by mutation
    }
  };

  const notifications = notificationsData?.results || [];

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activePath="/notifications" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          userInitial={userInitial}
          userName={userProfile?.user?.first_name || userProfile?.user?.username}
          onBackClick={handleBack}
        />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <Bell className="w-6 h-6 text-gray-700" />
              <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500 text-lg">No notifications</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification.id)}
                    className={`p-6 hover:bg-gray-50 cursor-pointer transition ${
                      !notification.is_read ? 'bg-[#043276]/10' : ''
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`flex-shrink-0 w-3 h-3 rounded-full mt-2 ${
                        !notification.is_read ? 'bg-[#043276]' : 'bg-transparent'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{notification.title}</h3>
                          <span className="text-xs text-gray-400">
                            {new Date(notification.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-gray-600">{notification.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Notifications;

