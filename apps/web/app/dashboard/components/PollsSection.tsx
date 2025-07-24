"use client";

import React, { useState, useEffect } from "react";
import PollsList from "./PollsList";
import PollsHeader from "./PollsHeader";
import CreatePollModal from "./CreatePollModal";
import { Poll } from "../../types/poll";

const PollsSection: React.FC = () => {
  const [polls, setPolls] = useState<Poll[]>([]);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedPolls, setSelectedPolls] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "past">(
    "all"
  );
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchPolls = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        if (!token) {
          console.error("No auth token found");
          return;
        }

        // 1. Fetch all rooms
        const res = await fetch("https://veil-1qpe.onrender.com/rooms", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error("Failed to fetch rooms");
        }

        const rooms = await res.json();

        const pollsWithUserCounts = await Promise.all(
          rooms.map(async (room: any) => {
            try {
              let userCount = 0;

              try {
                const countRes = await fetch(
                  `https://veil-1qpe.onrender.com/user/room/${room.id}/no`,
                  {
                    headers: {
                      Authorization: `Bearer ${token}`,
                    },
                  }
                );

                if (!countRes.ok) {
                  throw new Error(
                    `Failed to fetch user count for room ${room.id}`
                  );
                }

                const countData = await countRes.json();

                if (typeof countData === "number") {
                  userCount = countData;
                } else {
                  console.warn("Unexpected count response:", countData);
                }
              } catch (err) {
                console.error("Error fetching user count:", err);
              }

              return {
                id: room.id,
                name: room.title,
                slug: room.slug,
                description: room.description,
                createdAt: room.createdAt
                  ? new Date(room.createdAt)
                  : new Date(),
                responses: userCount,
                status: "active",
              };
            } catch (userErr) {
              console.error(
                `Failed to fetch users for room ${room.id}`,
                userErr
              );

              return {
                id: room.id,
                name: room.title,
                slug: room.slug,
                description: room.description,
                createdAt: room.createdAt
                  ? new Date(room.createdAt)
                  : new Date(),
                responses: 0,
                status: "active",
              };
            }
          })
        );

        // 3. Update state
        setPolls(pollsWithUserCounts);
      } catch (err) {
        console.error("Error fetching polls:", err);
      }
    };

    fetchPolls();
  }, []);
  // Filter polls based on status and search query
  const filteredPolls = polls.filter((poll) => {
    // Filter by status
    if (filterStatus === "active" && poll.status === "past") {
      return false;
    }
    if (filterStatus === "past" && poll.status !== "past") {
      return false;
    }

    // Filter by search query
    if (
      searchQuery &&
      !poll.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }

    return true;
  });

  // Toggle poll selection
  const togglePollSelection = (pollId: string) => {
    if (selectedPolls.includes(pollId)) {
      setSelectedPolls(selectedPolls.filter((id) => id !== pollId));
    } else {
      setSelectedPolls([...selectedPolls, pollId]);
    }
  };

  // Select all polls
  const selectAllPolls = () => {
    if (selectedPolls.length === filteredPolls.length) {
      setSelectedPolls([]);
    } else {
      setSelectedPolls(filteredPolls.map((poll) => poll.id));
    }
  };

  // Delete selected polls
  const deleteSelectedPolls = () => {
    setPolls(polls.filter((poll) => !selectedPolls.includes(poll.id)));
    setSelectedPolls([]);
  };

  // Create a new poll
  const handleCreatePoll = (
    newPoll: Omit<Poll, "id" | "createdAt" | "responses">
  ) => {
    const poll: Poll = {
      ...newPoll,
      id: `poll-${Date.now()}`,
      createdAt: new Date(),
      responses: 0,
    };
    setPolls([poll, ...polls]);
    setIsCreateModalOpen(false);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <PollsHeader
        onCreatePoll={() => setIsCreateModalOpen(true)}
        onDeleteSelected={deleteSelectedPolls}
        onSelectAll={selectAllPolls}
        selectedCount={selectedPolls.length}
        totalCount={filteredPolls.length}
        onFilterChange={setFilterStatus}
        currentFilter={filterStatus}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <PollsList
        polls={filteredPolls}
        selectedPolls={selectedPolls}
        onToggleSelect={togglePollSelection}
      />

      <CreatePollModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreatePoll={handleCreatePoll}
      />
    </div>
  );
};

export default PollsSection;
