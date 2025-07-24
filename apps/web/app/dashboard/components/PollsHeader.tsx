"use client";

import React from "react";

interface PollsHeaderProps {
  onCreatePoll: () => void;
  onDeleteSelected: () => void;
  onSelectAll: () => void;
  selectedCount: number;
  totalCount: number;
  onFilterChange: (filter: "all" | "active" | "past") => void;
  currentFilter: "all" | "active" | "past";
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const PollsHeader: React.FC<PollsHeaderProps> = ({
  onCreatePoll,
  onDeleteSelected,
  onSelectAll,
  selectedCount,
  totalCount,
  onFilterChange,
  currentFilter,
  searchQuery,
  onSearchChange,
}) => {
  return (
    <div className="mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">
          My Polls
        </h2>
        <button
          onClick={onCreatePoll}
          className="px-4 py-2 cursor-pointer bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Create New Poll
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mt-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search polls..."
            className="w-full px-4 py-2 border text-black border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className="flex space-x-2">
          <select
            className="px-4 py-2 border text-black border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            value={currentFilter}
            onChange={(e) => onFilterChange(e.target.value as any)}
          >
            <option value="all">All Polls</option>
            <option value="active">Active & Upcoming</option>
            <option value="past">Past</option>
          </select>
        </div>
      </div>

      {selectedCount > 0 && (
        <div className="flex items-center justify-between mt-4 p-2 bg-gray-100 rounded-lg">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={selectedCount === totalCount && totalCount > 0}
              onChange={onSelectAll}
              className="mr-2 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-600">
              {selectedCount} of {totalCount} selected
            </span>
          </div>
          <button
            onClick={onDeleteSelected}
            className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
          >
            Delete Selected
          </button>
        </div>
      )}
    </div>
  );
};

export default PollsHeader;
