"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
// Icons for the sidebar items
import HomeIcon from "./svg/HomeIcon";
import PollIcon from "./svg/PollIcon";
import AnalyticsIcon from "./svg/AnalyticsIcon";
import SettingsIcon from "./svg/SettingsIcon";
import CollapseIcon from "./svg/CollapseIcon";
import ExpandIcon from "./svg/ExpandIcon";

// NavItem component for consistent styling
interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  isCollapsed: boolean;
  isActive?: boolean;
}

const NavItem = ({
  icon,
  label,
  href,
  isCollapsed,
  isActive = false,
}: NavItemProps) => {
  return (
    <li>
      <Link
        href={href}
        className={`
          flex items-center gap-3 px-2.5 py-3 rounded-lg transition-all duration-200
          ${
            isActive
              ? "bg-purple-100 text-purple-700"
              : "hover:bg-gray-100 text-gray-700"
          }
        `}
      >
        <div className="flex-shrink-0">{icon}</div>
        {!isCollapsed && (
          <span className="transition-opacity duration-200">{label}</span>
        )}
      </Link>
    </li>
  );
};

const DashboardSidenav = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div
      className={`
        bg-white h-screen transition-all duration-300 ease-in-out border-r border-gray-200
        ${isCollapsed ? "w-16" : "w-64"}
      `}
    >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
        {/* {!isCollapsed && (
          <div className="text-xl font-semibold text-purple-600">Veil</div>
        )} */}
        <button
          onClick={toggleSidebar}
          className="p-2 cursor-pointer rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ExpandIcon /> : <CollapseIcon />}
        </button>
      </div>

      {/* Sidebar Content */}
      <div className="overflow-y-auto h-[calc(100vh-4rem)]">
        <nav className="p-3">
          <ul className="space-y-1">
            <NavItem
              icon={<HomeIcon />}
              label="Dashboard"
              href="/dashboard"
              isCollapsed={isCollapsed}
              isActive={pathname === "/dashboard"}
            />
            <NavItem
              icon={<PollIcon />}
              label="My Polls"
              href="/dashboard/polls"
              isCollapsed={isCollapsed}
              isActive={
                pathname === "/dashboard/polls" ||
                pathname.startsWith("/dashboard/polls/")
              }
            />
            <NavItem
              icon={<AnalyticsIcon />}
              label="Analytics"
              href="/dashboard/analytics"
              isCollapsed={isCollapsed}
              isActive={pathname === "/dashboard/analytics"}
            />
            {/* Divider */}
            {/* <div className="my-4 border-t border-gray-200"></div>

            <NavItem
              icon={<SettingsIcon />}
              label="Settings"
              href="/dashboard/settings"
              isCollapsed={isCollapsed}
            /> */}
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default DashboardSidenav;
