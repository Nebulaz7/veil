import React from "react";
import ActivityTable, { ActivityItem } from "./components/ActivityTable";
import Link from "next/link";

const Dashboard = () => {
  const recentActivities: ActivityItem[] = [
    {
      id: "1",
      name: "Product Feedback Survey",
      status: "Active",
      responses: 142,
      lastActivity: "1 hour ago",
    },
    {
      id: "2",
      name: "Team Meeting Feedback",
      status: "Active",
      responses: 36,
      lastActivity: "3 hours ago",
    },
    {
      id: "3",
      name: "Customer Satisfaction",
      status: "Closed",
      responses: 214,
      lastActivity: "2 days ago",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl text-black font-bold mb-4">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Stats Cards */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium mb-2 text-gray-700">
            Active Polls
          </h2>
          <p className="text-3xl font-bold text-purple-600">12</p>
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
          <p className="text-3xl font-bold text-purple-600">846</p>
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
          <p className="text-3xl font-bold text-purple-600">28</p>
        </div>
      </div>

      {/* Recent Activity Table Component */}
      <ActivityTable activities={recentActivities} />
    </div>
  );
};

export default Dashboard;
