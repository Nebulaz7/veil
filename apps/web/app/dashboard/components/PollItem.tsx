"use client";

import React, { useState, useEffect } from "react";
import { Poll } from "../../types/poll";
import { useRouter } from "next/navigation";

interface PollItemProps {
  poll: Poll;
  isSelected: boolean;
  onToggleSelect: (pollId: string) => void;
}

const PollItem: React.FC<PollItemProps> = ({
  poll,
  isSelected,
  onToggleSelect,
}) => {
  const [showCopiedMessage, setShowCopiedMessage] = useState<
    "link" | "slug" | null
  >(null);
  const router = useRouter();

  // Format date range
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const copyToClipboard = (type: "link" | "slug", value: string) => {
    navigator.clipboard.writeText(
      type === "link" ? `${window.location.origin}/polls/${poll.slug}` : value
    );
    setShowCopiedMessage(type);
    setTimeout(() => setShowCopiedMessage(null), 2000);
  };
// Updated handlePollClick in PollItem
const handlePollClick = async () => {
  try {
    // Generate temp user data like regular users do
    const generateTempUser = () => {
      const tempId = Math.random().toString(36).substr(2, 9);
      const tempUsername = `Moderator_${tempId}`;
      return { tempId, tempUsername };
    };

    // Check if temp user data already exists, if not create it
    let tempUserId = localStorage.getItem("temp_userId");
    let tempUsername = localStorage.getItem("temp_username");

    if (!tempUserId || !tempUsername) {
      const { tempId, tempUsername: generatedUsername } = generateTempUser();
      tempUserId = tempId;
      tempUsername = generatedUsername;
      
      localStorage.setItem("temp_userId", tempUserId);
      localStorage.setItem("temp_username", tempUsername);
    }

    localStorage.setItem("is_moderator", "true");
    
    console.log("Temp user data:", { tempUserId, tempUsername });
    console.log("Navigating to:", `/room/${poll.id}`);

    router.push(`/room/${poll.id}`);

  } catch (err) {
    console.error("Error accessing room:", err);
  }
};
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
            Active
          </span>
        );
      case "upcoming":
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
            Upcoming
          </span>
        );
      case "past":
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
            Past
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-4">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(poll.id)}
          className="h-4 w-4 cursor-pointer bg-purple-600 focus:ring-purple-500 border-gray-300 rounded"
        />
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center">
          <div>
            <div
              className="text-sm font-medium underline decoration-solid decoration-gray-600 decoration-thickness-[0.5px] text-gray-900 cursor-pointer hover:text-purple-600 hover:decoration-purple-600"
              onClick={handlePollClick}
            >
              {poll.name}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {getStatusBadge(poll.status)}
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-4 hidden md:table-cell">
        <div className="flex items-center">
          <div className="text-sm font-medium text-gray-900">{poll.slug}</div>
          <button
            className="ml-2 cursor-pointer text-gray-400 hover:text-gray-600"
            onClick={() => copyToClipboard("slug", poll.slug)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
              />
            </svg>
          </button>
          {showCopiedMessage === "slug" && (
            <span className="ml-2 text-xs text-green-600">Copied!</span>
          )}
        </div>
      </td>
      <td className="px-4 py-4 hidden sm:table-cell">
        <div className="text-sm text-gray-900">{poll.responses}</div>
      </td>
      <td className="px-4 py-4 hidden lg:table-cell">
        <div className="text-sm text-gray-900">
          {poll.createdAt ? formatDate(new Date(poll.createdAt)) : "—"}
        </div>
      </td>
      <td className="px-4 py-4 text-right text-sm font-medium">
        <div className="flex justify-end space-x-2">
          <button
            className="text-purple-600 cursor-pointer hover:text-purple-900"
            onClick={() => copyToClipboard("link", "")}
          >
            <span className="sr-only">Copy Link</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
          </button>
          <button className="text-blue-600 cursor-pointer hover:text-blue-900">
            <span className="sr-only">Edit</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
          {showCopiedMessage === "link" && (
            <span className="ml-2 text-xs text-green-600">Link copied!</span>
          )}
        </div>
      </td>
    </tr>
  );
};

export default PollItem;