"use client";

import React from "react";
import { Poll } from "../../types/poll";
import PollItem from "./PollItem";

interface PollsListProps {
  polls: Poll[];
  selectedPolls: string[];
  onToggleSelect: (pollId: string) => void;
}

const PollsList: React.FC<PollsListProps> = ({
  polls,
  selectedPolls,
  onToggleSelect,
}) => {
  if (polls.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">
          No polls found. Create your first poll to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="w-10 px-4 py-3">
              <span className="sr-only">Select</span>
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Poll
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell"
            >
              Code
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell"
            >
              Responses
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell"
            >
              Date Range
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {polls.map((poll) => (
            <PollItem
              key={poll.id}
              poll={poll}
              isSelected={selectedPolls.includes(poll.id)}
              onToggleSelect={onToggleSelect}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PollsList;
