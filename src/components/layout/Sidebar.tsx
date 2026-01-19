import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../redux/hooks';
import { logout } from '../../redux/slices/applicationSlice';
import { Home, Calendar, User, Settings, LogOut, BookOpen } from 'lucide-react';

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path?: string;
  onClick?: () => void;
}

interface SidebarProps {
  activePath?: string;
  className?: string;
}

const Sidebar = ({ activePath = '/dashboard', className = '' }: SidebarProps) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const navItems: NavItem[] = [
    { label: 'Dashboard', icon: Home, path: '/dashboard' },
    { label: 'My Courses', icon: BookOpen, path: '/courses' },
    { label: 'Calendar', icon: Calendar, path: '/calendar' },
    { label: 'Profile', icon: User, path: '/profile' },
    { label: 'Settings', icon: Settings, path: '/settings' },
  ];

  const handleNavClick = (item: NavItem) => {
    if (item.onClick) {
      item.onClick();
    } else if (item.path) {
      navigate(item.path);
    }
  };

  return (
    <div className={`w-64 bg-gradient-to-b from-purple-600 to-blue-600 text-white flex flex-col h-screen ${className}`}>
      {/* Logo/Brand */}
      <div className="p-6">
        <h1 className="text-2xl font-bold">EduHub</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4">
        <p className="text-xs font-semibold text-purple-200 uppercase tracking-wider mb-3 px-3">Navigation</p>
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
