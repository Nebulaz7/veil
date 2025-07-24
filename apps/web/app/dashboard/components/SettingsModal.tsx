"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, Moon, Sun, Bell, Zap, Info } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Sample settings data
  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: false,
    language: "english",
    autoJoin: true,
    soundEffects: true,
    performance: "medium", // Added performance setting
  });

  // Handle toggle changes
  const handleToggleChange = (setting: string) => {
    setSettings({
      ...settings,
      [setting]: !settings[setting as keyof typeof settings],
    });
  };

  // Handle select changes
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSettings({
      ...settings,
      [name]: value,
    });
  };

  // Handle dark mode toggle
  const handleDarkModeToggle = () => {
    setSettings({
      ...settings,
      darkMode: !settings.darkMode,
    });
  };

  // Handle notifications toggle
  const handleNotificationsToggle = () => {
    setSettings({
      ...settings,
      notifications: !settings.notifications,
    });
  };

  // Handle performance change
  const handlePerformanceChange = (level: string) => {
    setSettings({
      ...settings,
      performance: level,
    });
  };

  // Save settings
  const saveSettings = () => {
    // Save settings logic would go here
    console.log("Saving settings:", settings);

    // Show success notification
    // alert("Settings updated successfully!");
    // onClose();
  };

  // Handle clicking outside to close
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        ref={modalRef}
        className="bg-white backdrop-blur-md border border-sky-900/30 rounded-lg w-full max-w-md p-6 shadow-2xl shadow-blue-900/20 transform transition-all animate-fade-in"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-black">Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 cursor-pointer hover:text-black transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6 mb-6">
          {/* Dark Mode Setting */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {settings.darkMode ? (
                <Moon size={18} className="text-indigo-400" />
              ) : (
                <Sun size={18} className="text-yellow-400" />
              )}
              <div>
                <p className="text-black font-medium">Dark Mode</p>
                <p className="text-xs text-gray-400">
                  Toggle between light and dark theme
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              {/* <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.darkMode}
                onChange={handleDarkModeToggle}
              />
              <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div> */}
              <p className="text-[10px] p-1 text-red-600 border-red-600 border-solid border-[1.5px] rounded-full cursor-not-allowed">
                Coming soon
              </p>
            </label>
          </div>

          {/* Notification Setting */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell size={18} className="text-purple-600" />
              <div>
                <p className="text-black font-medium">Notifications</p>
                <p className="text-xs text-gray-400">
                  Receive updates and alerts
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.notifications}
                onChange={handleNotificationsToggle}
              />
              <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          {/* Performance Setting */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <Zap size={18} className="text-yellow-400" />
              <div>
                <p className="text-black font-medium">Performance Mode</p>
                <p className="text-xs text-gray-400">
                  Adjust animation intensity
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handlePerformanceChange("low")}
                className={`py-2 border-[2px] rounded-md text-sm cursor-pointer ${
                  settings.performance === "low"
                    ? "bg-purple-600 text-white border-purple-600"
                    : "bg-white border-purple-600 text-black hover:bg-purple-700 hover:text-white"
                }`}
              >
                Low
              </button>
              <button
                onClick={() => handlePerformanceChange("medium")}
                className={`py-2 border-[2px] rounded-md text-sm cursor-pointer ${
                  settings.performance === "medium"
                    ? "bg-purple-600 text-white border-purple-600"
                    : "bg-white border-purple-600 text-black hover:bg-purple-700 hover:text-white"
                }`}
              >
                Medium
              </button>
              <button
                onClick={() => handlePerformanceChange("high")}
                className={`py-2 border-[2px] rounded-md text-sm cursor-pointer ${
                  settings.performance === "high"
                    ? "bg-purple-600 text-white border-purple-600"
                    : "bg-white border-purple-600 text-black hover:bg-purple-700 hover:text-white"
                }`}
              >
                High
              </button>
            </div>
          </div>

          {/* Info Section */}
          <div className="flex items-start gap-3 p-3 bg-purple-950/30 rounded-md border border-purple-900/30">
            <Info size={18} className="text-purple-800 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-white">
              Higher performance settings may use more system resources. For the
              best experience, adjust based on your device capabilities.
            </p>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 cursor-pointer rounded-md border border-purple-700 text-black hover:bg-purple-600 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={saveSettings}
            className="btn cursor-not-allowed px-4 py-2 rounded-md  bg-gray-600/80 hover:bg-gray-600/80 text-white transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
