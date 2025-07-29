import React from "react";
import { MessageSquare, BarChart3 } from "lucide-react";

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  onTabChange,
}) => {
  return (
    <div className="border-b border-gray-200 mb-4 sm:mb-6">
      <nav className="flex space-x-4 sm:space-x-8 justify-center">
        <button
          onClick={() => onTabChange("qa")}
          className={`flex items-center cursor-pointer space-x-1 sm:space-x-2 py-2 px-1 border-b-2 font-medium text-xs sm:text-sm ${activeTab === "qa" ? "border-purple-500 text-purple-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
        >
          <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4" />
          <span>Q&A</span>
        </button>
        <button
          onClick={() => onTabChange("polls")}
          className={`flex items-center cursor-pointer space-x-1 sm:space-x-2 py-2 px-1 border-b-2 font-medium text-xs sm:text-sm ${activeTab === "polls" ? "border-purple-500 text-purple-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
        >
          <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4" />
          <span>Polls</span>
        </button>
      </nav>
    </div>
  );
};

export default TabNavigation;
