"use client";

import React, { useState } from "react";
import { Poll } from "../../types/poll";

interface CreatePollModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreatePoll: (poll: Omit<Poll, "id" | "createdAt" | "responses">) => void;
}

const CreatePollModal: React.FC<CreatePollModalProps> = ({
  isOpen,
  onClose,
  onCreatePoll,
}) => {
  const [pollName, setPollName] = useState("");
  const [formError, setFormError] = useState("");

  const handleClose = () => {
    setPollName("");
    setFormError("");
    onClose();
  };

  const handleSubmit = async () => {
    if (!pollName.trim()) {
      setFormError("Please enter a poll name");
      return;
    }

    const generateCode = () => {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let slug = "";
      for (let i = 0; i < 6; i++) {
        slug += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return slug;
    };

    const slug = generateCode().toLowerCase();
    const status: "active" | "upcoming" | "past" = "upcoming";

    try {
      const token = localStorage.getItem("auth_token");

      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/rooms`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: pollName,
          slug: slug,
          description: "",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to create room");
      }

      onCreatePoll({
        name: pollName,
        slug: slug,
        status,
      });

      handleClose();
    } catch (err: any) {
      setFormError(err.message || "Failed to create room");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4 text-center sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={handleClose}></div>

        <div className="relative bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-lg sm:w-full z-50">
          <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <p className="text-sm text-gray-500 mb-4">Enter a name for your poll below.</p>

            <div>
              <label htmlFor="poll-name" className="block text-sm font-medium text-gray-700">
                Give your Poll a name
              </label>
              <input
                type="text"
                id="poll-name"
                className="mt-1 block w-full px-3 py-2 border text-black border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                placeholder="E.g., Team Retrospective"
                value={pollName}
                onChange={(e) => {
                  setPollName(e.target.value);
                  setFormError("");
                }}
              />
            </div>

            <div className="mt-4 appearance-none px-6 py-2 font-heading rounded-[8px] w-[70%] text-sm bg-amber-400/10 border border-amber-400/20 focus-visible:bg-white/20 backdrop-blur-sm">
              <p className="text-xs text-amber-400">Anyone with the code or link can participate</p>
            </div>

            {formError && (
              <div className="mt-3 text-sm text-red-600">{formError}</div>
            )}
          </div>

          <div className="px-4 py-3 bg-gray-50 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className="w-full inline-flex justify-center cursor-pointer rounded-md border border-transparent shadow-sm px-4 py-2 bg-purple-600 text-base font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={handleSubmit}
            >
              Create Poll
            </button>

            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center cursor-pointer rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={handleClose}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePollModal;
