import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../redux/hooks';
import { useGetNotificationsQuery, useMarkNotificationAsReadMutation } from '../../redux/api/notificationsApi';
import { markAsRead } from '../../redux/slices/notificationsSlice';
import { Bell, X } from 'lucide-react';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationDropdown = ({ isOpen, onClose }: NotificationDropdownProps) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { data: notificationsData, refetch, isLoading } = useGetNotificationsQuery(
    { limit: 8 },
    {
      skip: !isOpen,
      refetchOnMountOrArgChange: true,
    }
  );
  const [markAsReadMutation] = useMarkNotificationAsReadMutation();
  const notifications = useAppSelector((state) => state.notifications.notifications);

  useEffect(() => {
    if (isOpen) {
      refetch();
    }
  }, [isOpen, refetch]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleNotificationClick = async (notificationId: number) => {
    try {
      await markAsReadMutation(notificationId);
      dispatch(markAsRead(notificationId));
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleSeeAll = () => {
    onClose();
    navigate('/notifications');
  };

  const displayNotifications = notificationsData?.results?.slice(0, 8) || notifications.slice(0, 8);

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[500px] flex flex-col"
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded-full transition"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p>Loading notifications...</p>
          </div>
        ) : displayNotifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No notifications</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {displayNotifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification.id)}
                className={`p-4 hover:bg-gray-50 cursor-pointer transition ${
                  !notification.is_read ? 'bg-primary/10' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                    !notification.is_read ? 'bg-primary' : 'bg-transparent'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{notification.title}</p>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{notification.message}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(notification.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {displayNotifications.length > 0 && (
        <div className="border-t border-gray-200 p-3">
          <button
            onClick={handleSeeAll}
            className="w-full text-center text-sm font-medium text-blue-600 hover:text-blue-700 transition"
          >
            See all notifications
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;

