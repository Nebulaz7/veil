"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, Mail, Calendar } from "lucide-react";
import { fetchProfile } from '../../lib/api';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Profile {
  email: string;
  name: string;
  picture: string;
  createdAt: string;
}


const AccountModal: React.FC<AccountModalProps> = ({ isOpen, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

    useEffect(() => {
    fetchProfile()
      .then(data => setProfile(data))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose]);

  // Handle ESC key to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleEsc);
    }

    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen, onClose]);

  // Get user initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  };

  // Generate avatar URL from name
  const generateAvatarUrl = (name: string) => {
    // This would typically call an avatar service like UI Avatars
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=af1aff&color=fff`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        ref={modalRef}
        className="bg-white text-black backdrop-blur-md border border-purple-900/30 rounded-lg w-full max-w-md p-6 shadow-2xl shadow-blue-900/20 transform transition-all animate-fade-in"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-black">Account</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-black cursor-pointer transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <span className="animate-spin text-purple-400 mb-4">
              <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                ></path>
              </svg>
            </span>
            <p className="text-gray-400 text-sm">Loading user data...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
              <X className="w-8 h-8 text-red-400" />
            </div>
            <p className="text-red-400 text-sm text-center mb-4">
              Failed to load user data
            </p>
            <p className="text-gray-500 text-xs text-center">{error}</p>
          </div>
        ) : profile ? (
          <>
            <div className="flex flex-col items-center mb-6">
              <div className="relative">
                {!avatarError ? (
                  <img
                    src={profile.picture}
                    alt={profile.name}
                    className="w-24 h-24 rounded-full object-cover border-2  border-purple-500/30"
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-purple-600 flex items-center justify-center text-white text-2xl font-semibold border-2 border-purple-500/30">
                    {getInitials(profile.name)}
                  </div>
                )}
              </div>

              <div className="mt-4 text-center">
                <h3 className="text-lg font-semibold text-black">
                  {profile.name}
                </h3>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-3 px-4 py-3 rounded-md bg-purple-600 border border-purple-900/30">
                <Mail size={18} className="text-purple-800" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white">Email</p>
                  <p className="text-sm text-white truncate">
                    {profile.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 px-4 py-3 rounded-md bg-purple-600 border border-purple-900/30">
                <Calendar size={18} className="text-purple-800" />
                <div>
                  <p className="text-xs text-white">Joined</p>
                  <p className="text-sm text-white">{profile.createdAt}</p>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default AccountModal;
