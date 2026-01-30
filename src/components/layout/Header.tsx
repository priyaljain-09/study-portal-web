import { useState, useEffect } from 'react';
import { Search, Bell, Menu, ArrowLeft } from 'lucide-react';
import { useAppSelector } from '../../redux/hooks';
import { useGetUnreadCountQuery } from '../../redux/api/notificationsApi';
import { setUnreadCount } from '../../redux/slices/notificationsSlice';
import { useAppDispatch } from '../../redux/hooks';
import NotificationDropdown from '../notifications/NotificationDropdown';

interface HeaderProps {
  userName?: string;
  userInitial?: string;
  onMenuClick?: () => void;
  onBackClick?: () => void;
  className?: string;
}

const Header = ({ userInitial = 'S', onMenuClick, onBackClick, className = '' }: HeaderProps) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const dispatch = useAppDispatch();
  const { data: unreadCount } = useGetUnreadCountQuery();
  const notificationUnreadCount = useAppSelector((state) => state.notifications.unreadCount);

  useEffect(() => {
    if (unreadCount !== undefined) {
      dispatch(setUnreadCount(unreadCount));
    }
  }, [unreadCount, dispatch]);

  const displayUnreadCount = notificationUnreadCount || unreadCount || 0;

  return (
    <header className={`bg-white text-black p-4 flex items-center ${onBackClick || onMenuClick ? 'justify-between' : 'justify-end'} ${className} relative`}>
      {(onBackClick || onMenuClick) && (
        <div className="flex items-center gap-2">
          {onMenuClick && (
            <button
              onClick={onMenuClick}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
              title="Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          {onBackClick && (
            <button
              onClick={onBackClick}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
        </div>
      )}
      <div className="flex items-center space-x-4">
        <button className="p-2 hover:bg-gray-100 rounded-lg transition">
          <Search className="w-5 h-5" />
        </button>
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 hover:bg-gray-100 rounded-lg transition relative"
          >
            <Bell className="w-5 h-5" />
            {displayUnreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </button>
          <NotificationDropdown
            isOpen={showNotifications}
            onClose={() => setShowNotifications(false)}
          />
        </div>
        <div className="w-10 h-10 bg-[#043276] rounded-full flex items-center justify-center text-white font-semibold">
          {userInitial.toUpperCase()}
        </div>
      </div>
    </header>
  );
};

export default Header;

