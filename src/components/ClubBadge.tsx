import React from 'react';
import { Club } from '../types/football';
import { Shield } from 'lucide-react';

interface ClubBadgeProps {
  club: Club;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
}

export const ClubBadge: React.FC<ClubBadgeProps> = ({ club, size = 'md', showName = true }) => {
  const sizeClasses = {
    sm: 'w-10 h-10 text-xs',
    md: 'w-14 h-14 text-sm',
    lg: 'w-20 h-20 text-base',
  }[size];

  const iconSizes = {
    sm: 14,
    md: 20,
    lg: 28,
  }[size];

  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div
        className={`${sizeClasses} relative rounded-2xl flex items-center justify-center font-bold tracking-wider shadow-lg border border-white/10 transition-transform active:scale-95`}
        style={{
          background: `linear-gradient(135deg, ${club.primaryColor} 0%, ${club.secondaryColor || club.primaryColor} 100%)`,
          color: getContrastColor(club.primaryColor),
        }}
      >
        <span className="font-athletic font-extrabold tracking-widest drop-shadow-md">
          {club.shortName}
        </span>
        <div
          className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-slate-900 border border-white/10"
          title={club.league}
        >
          <Shield size={iconSizes * 0.5} className="text-emerald-400" />
        </div>
      </div>
      {showName && (
        <span className="mt-2 text-xs font-semibold text-slate-200 line-clamp-1 max-w-[80px]">
          {club.name}
        </span>
      )}
    </div>
  );
};

function getContrastColor(hexColor: string): string {
  if (!hexColor || hexColor === '#FFFFFF') return '#070D18';
  return '#FFFFFF';
}
