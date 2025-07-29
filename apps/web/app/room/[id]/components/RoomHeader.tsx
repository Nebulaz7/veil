import React from 'react';
import { Users, BarChart3, LogOut } from 'lucide-react';

interface RoomHeaderProps {
  userCount: number;
  activePollsCount?: number;
  onLeaveRoom: () => void;
}

const RoomHeader: React.FC<RoomHeaderProps> = ({ 
  userCount, 
  activePollsCount = 0, 
  onLeaveRoom 
}) => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left side - Room info */}
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold text-gray-900">
              Q&A Room
            </h1>
            
            {/* Stats */}
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              {/* User count */}
              <div className="flex items-center space-x-1">
                <Users size={16} className="text-blue-500" />
                <span>{userCount} participant{userCount !== 1 ? 's' : ''}</span>
              </div>
              
              {/* Active polls count */}
              {activePollsCount > 0 && (
                <div className="flex items-center space-x-1">
                  <BarChart3 size={16} className="text-purple-500" />
                  <span>{activePollsCount} active poll{activePollsCount !== 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onLeaveRoom}
              className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Leave Room</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default RoomHeader;
