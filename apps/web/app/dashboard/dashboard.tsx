"use client";

import React, { useState, useEffect } from "react";
import ActivityTable, { ActivityItem } from "./components/ActivityTable";
import Link from "next/link";

const Dashboard = () => {
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);
  const [totalActivePolls, setTotalActivePolls] = useState(0);
  const [totalResponses, setTotalResponses] = useState(0);
  const [completedPolls, setCompletedPolls] = useState(0);

  useEffect(() => {
    const fetchDashboardData = async () => {
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

        // 2. Process rooms data and fetch user counts
        const activitiesWithUserCounts = await Promise.all(
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

              // Format the data for ActivityTable
              return {
                id: room.id,
                name: room.title,
                status: "Active", // You can determine status based on your business logic
                responses: userCount,
                lastActivity: room.createdAt
                  ? formatTimeAgo(new Date(room.createdAt))
                  : "Unknown",
              };
            } catch (userErr) {
              console.error(
                `Failed to fetch users for room ${room.id}`,
                userErr
              );

              return {
                id: room.id,
                name: room.title,
                status: "Active",
                responses: 0,
                lastActivity: room.createdAt
                  ? formatTimeAgo(new Date(room.createdAt))
                  : "Unknown",
              };
            }
          })
        );

        // 3. Calculate stats
        const activePolls = activitiesWithUserCounts.filter(
          (activity) => activity.status === "Active"
        ).length;

        const totalResponsesCount = activitiesWithUserCounts.reduce(
          (sum, activity) => sum + activity.responses,
          0
        );

        // For completed polls, you might want to implement different logic
        // based on your business requirements
        const completed = activitiesWithUserCounts.filter(
          (activity) => activity.status === "Closed"
        ).length;

        // 4. Update state
        setRecentActivities(activitiesWithUserCounts);
        setTotalActivePolls(activePolls);
        setTotalResponses(totalResponsesCount);
        setCompletedPolls(completed);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      }
    };

    fetchDashboardData();
  }, []);

  // Helper function to format time ago
  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) {
      return "Less than 1 hour ago";
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours === 1 ? "" : "s"} ago`;
    } else {
      return `${diffInDays} day${diffInDays === 1 ? "" : "s"} ago`;
    }
  };

  return (
    <div>
      <h1 className="text-2xl text-black font-bold mb-4">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Stats Cards */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium mb-2 text-gray-700">
            Active Polls
          </h2>
          <p className="text-3xl font-bold text-purple-600">
            {totalActivePolls}
          </p>
          <div className="mt-4">
            <Link
              href="/dashboard/polls"
              className="text-sm text-purple-600 hover:underline"
            >
              View all polls →
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium mb-2 text-gray-700">
            Total Responses
          </h2>
          <p className="text-3xl font-bold text-purple-600">{totalResponses}</p>
          <div className="mt-4">
            <Link
              href="/dashboard/analytics"
              className="text-sm text-purple-600 hover:underline"
            >
              View analytics →
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium mb-2 text-gray-700">
            Completed Polls
          </h2>
          <p className="text-3xl font-bold text-purple-600">{completedPolls}</p>
        </div>
      </div>

      {/* Recent Activity Table Component */}
      <ActivityTable activities={recentActivities} />
    </div>
  );
};

export default Dashboard;
