import React from 'react';

interface AvatarProps {
  label: string;
  size?: number;
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({ label, size = 40, className = '' }) => {
  // Predefined palette of attractive colors
  const colorPalette = [
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#F59E0B', // Amber
    '#10B981', // Emerald
    '#3B82F6', // Blue
    '#EF4444', // Red
    '#06B6D4', // Cyan
    '#84CC16', // Lime
    '#F97316', // Orange
    '#6366F1', // Indigo
    '#14B8A6', // Teal
    '#A855F7', // Violet
    '#F43F5E', // Rose
    '#0EA5E9', // Sky
    '#22C55E', // Green
    '#EAB308', // Yellow
  ];

  // Get initials from label
  const getInitials = (name: string): string => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 1).toUpperCase();
  };

  // Generate a consistent color index based on the label
  const getColorIndex = (name: string): number => {
    if (!name) return 0;
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) % colorPalette.length;
  };

  const initials = getInitials(label);
  const backgroundColor = colorPalette[getColorIndex(label)];

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

