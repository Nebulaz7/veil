"use client";

import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// Sample data for the charts
const activityData = [
  { date: "Jul 1", polls: 2, responses: 5 },
  { date: "Jul 3", polls: 1, responses: 12 },
  { date: "Jul 5", polls: 0, responses: 4 },
  { date: "Jul 7", polls: 3, responses: 23 },
  { date: "Jul 9", polls: 1, responses: 7 },
  { date: "Jul 11", polls: 0, responses: 2 },
  { date: "Jul 13", polls: 2, responses: 16 },
  { date: "Jul 15", polls: 1, responses: 9 },
  { date: "Jul 17", polls: 4, responses: 31 },
  { date: "Jul 19", polls: 0, responses: 5 },
];

const engagementData = [
  { name: "Questions", value: 12 },
  { name: "Votes", value: 67 },
  { name: "Comments", value: 25 },
];

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042"];

interface OverviewCardProps {
  title: string;
  value: string | number;
  description?: string;
  className?: string;
}

const OverviewCard: React.FC<OverviewCardProps> = ({
  title,
  value,
  description,
  className = "",
}) => {
  return (
    <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
      {description && (
        <p className="mt-1 text-xs text-gray-500">{description}</p>
      )}
    </div>
  );
};

interface TimeRangeOption {
  label: string;
  value: string;
}

const AnalyticsSection: React.FC = () => {
  const [timeRange, setTimeRange] = useState<string>("30d");

  const timeRangeOptions: TimeRangeOption[] = [
    { label: "Last 7 days", value: "7d" },
    { label: "Last 30 days", value: "30d" },
    { label: "Last 90 days", value: "90d" },
    { label: "All time", value: "all" },
  ];

  // Metrics data
  const analyticsData = {
    activePolls: 1,
    engagementScore: 2,
    createdPolls: 1,
    questions: 0,
    upvotes: 0,
    downvotes: 0,
    anonymousRate: 0,
    pollVotes: 2,
    pollsWithResponses: 2,
    votesPerPoll: 1,
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Analytics</h2>
          <p className="text-gray-600 mt-1">
            Track engagement and activity across your polls
          </p>
        </div>

        <div className="mt-4 md:mt-0 flex items-center space-x-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="block w-full md:w-auto px-3 text-black cursor-pointer py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
          >
            {timeRangeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <button className="inline-flex items-center cursor-pointer px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Export
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <OverviewCard title="Active Polls" value={analyticsData.activePolls} />
        <OverviewCard
          title="Engagement Score"
          value={analyticsData.engagementScore}
          description="Average engagement per poll"
        />
        <OverviewCard
          title="Created Polls"
          value={analyticsData.createdPolls}
        />
        <OverviewCard title="Questions" value={analyticsData.questions} />
        <OverviewCard
          title="Upvotes / Downvotes"
          value={`${analyticsData.upvotes} / ${analyticsData.downvotes}`}
        />
        <OverviewCard
          title="Anonymous Rate"
          value={`${analyticsData.anonymousRate}%`}
          description="Percentage of anonymous responses"
        />
        <OverviewCard title="Poll Votes" value={analyticsData.pollVotes} />
        <OverviewCard
          title="Polls with Responses"
          value={analyticsData.pollsWithResponses}
        />
        <OverviewCard
          title="Votes per Poll"
          value={analyticsData.votesPerPoll}
          description="Average votes per poll"
        />
        <OverviewCard
          title="Participation Rate"
          value="67%"
          description="Of target audience"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Activity Over Time Chart */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            Activity Over Time
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={activityData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="polls"
                  stroke="#8884d8"
                  name="Polls Created"
                />
                <Line
                  type="monotone"
                  dataKey="responses"
                  stroke="#82ca9d"
                  name="Responses"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Engagement Distribution Chart */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            Engagement Distribution
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={engagementData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {engagementData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Poll Performance Chart */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            Poll Performance
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { name: "Team Meeting", responses: 24 },
                  { name: "Product Launch", responses: 18 },
                  { name: "Customer Survey", responses: 32 },
                  { name: "Feature Feedback", responses: 12 },
                  { name: "Company Event", responses: 27 },
                ]}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="responses" fill="#8884d8" name="Responses" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Response Rate Over Time */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            Response Rate Over Time
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={[
                  { date: "Jul 1", rate: 45 },
                  { date: "Jul 4", rate: 52 },
                  { date: "Jul 7", rate: 48 },
                  { date: "Jul 10", rate: 61 },
                  { date: "Jul 13", rate: 57 },
                  { date: "Jul 16", rate: 64 },
                  { date: "Jul 19", rate: 67 },
                ]}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis unit="%" />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="rate"
                  stroke="#ff7300"
                  name="Response Rate"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Metrics Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden mt-8">
        <h3 className="text-lg font-medium text-gray-800 p-4 border-b">
          Detailed Poll Metrics
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Poll Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Created
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Responses
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Completion Rate
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Avg. Time Spent
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Team Meeting Feedback
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  Jul 15, 2025
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  24
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  92%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  3m 12s
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Product Launch Survey
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  Jul 16, 2025
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  18
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  78%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  4m 45s
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Customer Satisfaction
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  Jul 10, 2025
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  32
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  85%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  2m 58s
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsSection;
