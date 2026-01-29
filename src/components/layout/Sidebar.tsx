import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { logout } from '../../redux/slices/applicationSlice';
import { Home, Calendar, User, Settings, LogOut, MessageCircle, CheckSquare } from 'lucide-react';

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path?: string;
  onClick?: () => void;
}

interface SidebarProps {
  activePath?: string;
  className?: string;
  onNavigate?: () => void;
}

const Sidebar = ({ activePath = '/dashboard', className = '', onNavigate }: SidebarProps) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const userRole = useAppSelector((state) => state.applicationData.userRole) || localStorage.getItem('userRole');

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const navItems: NavItem[] = [
    { label: 'Dashboard', icon: Home, path: '/dashboard' },
    { label: 'Calendar', icon: Calendar, path: '/calendar' },
    { label: 'Chat', icon: MessageCircle, path: '/chat' },
    ...(userRole === 'student' ? [{ label: 'To-Do', icon: CheckSquare, path: '/todo' }] : []),
    { label: 'Profile', icon: User, path: '/profile' },
    { label: 'Settings', icon: Settings, path: '/settings' },
  ];

  const handleNavClick = (item: NavItem) => {
    if (item.onClick) {
      item.onClick();
    } else if (item.path) {
      navigate(item.path);
      if (onNavigate) {
        onNavigate();
      }
    }
  };

  return (
    <div
      className={`w-64 text-white flex flex-col h-screen bg-primary ${className}`}
    >
      {/* Logo/Brand */}
      <div className="p-6">
        <h1 className="text-2xl font-bold">Strov</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const isActive = activePath === item.path;
            const IconComponent = item.icon;
            return (
              <li key={item.label}>
                <button
                  onClick={() => handleNavClick(item)}
                  className={`
                    flex items-center w-full px-3 py-2.5 rounded-lg transition
                    ${isActive
                      ? 'bg-white text-black bg-opacity-20'
                      : 'hover:bg-white hover:text-black hover:bg-opacity-10'
                    }
                  `}
                >
                  <IconComponent className="mr-3 h-5 w-5" />
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-purple-500">
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-3 py-2.5 rounded-lg hover:bg-white hover:bg-opacity-10 transition"
        >
          <LogOut className="mr-3 h-5 w-5 rotate-180" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
