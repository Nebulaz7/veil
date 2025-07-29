import React from 'react';
import { MessageSquare, BarChart3 } from 'lucide-react';

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  activePollsCount?: number;
}

const TabNavigation: React.FC<TabNavigationProps> = ({ 
  activeTab, 
  onTabChange, 
  activePollsCount = 0 
}) => {
  const tabs = [
    {
      id: 'qa',
      label: 'Q&A',
      icon: MessageSquare,
      count: null
    },
    {
      id: 'polls',
      label: 'Polls',
      icon: BarChart3,
      count: activePollsCount
    }
  ];

  return (
    <div className="mb-6">
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              
              {/* Show count badge if there are active polls */}
              {tab.count !== null && tab.count > 0 && (
                <span className={`inline-flex items-center justify-center px-2 py-1 text-xs font-bold rounded-full ${
                  isActive 
                    ? 'bg-purple-100 text-purple-800' 
                    : 'bg-purple-500 text-white'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TabNavigation;
