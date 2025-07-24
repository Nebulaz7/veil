"use client";

import React from "react";
import DashboardSidenav from "./components/DashboardSidenav";
import DashboardNav from "./components/DashboardNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Top Navigation */}
      <DashboardNav />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <DashboardSidenav />

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-6 bg-gray-50">{children}</main>
      </div>
    </div>
  );
}
