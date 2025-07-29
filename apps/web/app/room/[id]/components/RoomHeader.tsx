import React from "react";
import { Users, LogOut } from "lucide-react";

interface RoomHeaderProps {
  userCount: number;
  onLeaveRoom: () => void;
}

const RoomHeader: React.FC<RoomHeaderProps> = ({ userCount, onLeaveRoom }) => {
  return (
    <div className="bg-[#EAD9FF] text-purple-600 p-3 sm:p-4">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <h1 className="text-sm sm:text-lg md:text-xl text-black">Q&A Room</h1>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-4 text-xs sm:text-sm">
          {/* <div className="hidden sm:flex items-center space-x-1">
            <span className="text-sm sm:text-lg md:text-xl text-black">
              Q&A Room
            </span>
          </div> */}
          <div className="flex items-center space-x-1">
            <Users className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm font-medium">{userCount}</span>
            <span className="hidden sm:inline">Live</span>
          </div>
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <div className="flex items-center space-x-6">
            <button
              onClick={onLeaveRoom}
              className="btn text-red-600 bg-none rounded-[25px] border-none px-2 py-1 sm:px-4 sm:py-[1px] hover:text-red-700 text-xs sm:text-sm"
            >
              <LogOut className="w-3 h-3 sm:w-4 sm:h-4 inline" />
              <span className="hidden sm:inline ml-1">Leave room</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomHeader;
