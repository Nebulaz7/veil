"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";

// Svgs import
import ProfileIcon from "./svg/ProfileIcon";
import SettingsIcon from "./svg/SettingsIcon";
import Signout from "./svg/Signout";

// Modals import
import AccountModal from "./AccountModal";
import SettingsModal from "./SettingsModal";
import SignoutModal from "./SignoutModal";

const DashboardNav = () => {
  // Modal state
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isSignoutModalOpen, setIsSignoutModalOpen] = useState(false);

  return (
    <div>
      <div className="navbar bg-stone-100 text-black shadow-sm">
        <div className="flex-1">
          <Link
            href="/dashboard"
            className="btn text-purple-600 btn-ghost text-xl"
          >
            Veil
          </Link>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search"
            className="input border-[2px] border-gray-500 rounded-full input-bordered w-24 md:w-auto"
          />
          <div className="dropdown dropdown-end">
            <div
              tabIndex={0}
              role="button"
              className="btn btn-ghost btn-circle avatar"
            >
              <div className="w-10 rounded-full">
                <Image
                  alt="User Avatar"
                  src="/avatar.svg"
                  width={40}
                  height={40}
                />
              </div>
            </div>
            <ul
              tabIndex={0}
              className="menu menu-sm dropdown-content bg-white text-gray-900 rounded-[15px] z-50 mt-3 w-52 p-2 shadow"
            >
              <li>
                <button
                  onClick={() => setIsAccountModalOpen(true)}
                  className="text-[14px] hover:text-purple-700"
                >
                  <span className="pl-0 flex items-center gap-2">
                    <ProfileIcon />
                  </span>
                  Account
                </button>
              </li>
              <div className="my-1 border-t border-gray-200"></div>
              <li>
                <button
                  onClick={() => setIsSettingsModalOpen(true)}
                  className="text-[14px] hover:text-purple-700"
                >
                  <span className="flex items-center gap-2">
                    <SettingsIcon />
                  </span>
                  Settings
                </button>
              </li>
              <div className="my-1 border-t border-gray-200"></div>
              <li>
                <button
                  onClick={() => setIsSignoutModalOpen(true)}
                  className="text-[14px] hover:text-red-700"
                >
                  <span className="flex items-center gap-2">
                    <Signout />
                  </span>
                  Signout
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
      />
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
      <SignoutModal
        isOpen={isSignoutModalOpen}
        onClose={() => setIsSignoutModalOpen(false)}
      />
    </div>
  );
};

export default DashboardNav;
