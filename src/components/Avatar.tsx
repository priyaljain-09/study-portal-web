import React from 'react';

interface AvatarProps {
  label: string;
  size?: number;
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({ label, size = 40, className = '' }) => {
  // Get initials from label
  const getInitials = (name: string): string => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const initials = getInitials(label);
  const backgroundColor = `hsl(${label.charCodeAt(0) % 360}, 70%, 50%)`;

  return (
    <div
      className={`rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        backgroundColor,
      }}
    >
      {initials}
    </div>
  );
};

export default Avatar;

