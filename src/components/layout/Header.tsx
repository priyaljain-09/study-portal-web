import { Search, Bell, Menu } from 'lucide-react';

interface HeaderProps {
  userName?: string;
  userInitial?: string;
  onMenuClick?: () => void;
  className?: string;
}

const Header = ({ userInitial = 'P', onMenuClick, className = '' }: HeaderProps) => {
  return (
    <header className={`bg-white text-black p-4 flex items-center justify-end ${className}`}>      
      <div className="flex items-center space-x-4">
        <button className="p-2 hover:bg-green-700 rounded-lg transition">
          <Search className="w-5 h-5" />
        </button>
        <button className="p-2 hover:bg-green-700 rounded-lg transition relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
          {userInitial}
        </div>
        <button 
          onClick={onMenuClick}
          className="p-2 hover:bg-green-700 rounded-lg transition lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};

export default Header;

