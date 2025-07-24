"use client";

import React, { useState, useEffect, useRef } from "react";
import { Poll } from "../../types/poll";
import { useRouter } from "next/navigation";
import {
  Share,
  Share2,
  Copy,
  Download,
  QrCode,
  ExternalLink,
} from "lucide-react";
import QRCode from "react-qr-code";

interface PollItemProps {
  poll: Poll;
  isSelected: boolean;
  onToggleSelect: (pollId: string) => void;
}

const PollItem: React.FC<PollItemProps> = ({
  poll,
  isSelected,
  onToggleSelect,
}) => {
  const [showCopiedMessage, setShowCopiedMessage] = useState<
    "link" | "slug" | "qr" | null
  >(null);
  const [showShareDropdown, setShowShareDropdown] = useState(false);
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const qrCodeRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowShareDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Format date range
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const pollUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/room/${poll.id}`;

  const copyToClipboard = (type: "link" | "slug" | "qr", value?: string) => {
    const textToCopy =
      type === "link" ? pollUrl : type === "slug" ? poll.slug : value || "";
    navigator.clipboard.writeText(textToCopy);
    setShowCopiedMessage(type);
    setTimeout(() => setShowCopiedMessage(null), 2000);
  };

  const downloadQRCode = () => {
    if (qrCodeRef.current) {
      const svg = qrCodeRef.current.querySelector("svg");
      if (svg) {
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();

        canvas.width = 256;
        canvas.height = 256;

        img.onload = () => {
          if (ctx) {
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);

            const link = document.createElement("a");
            link.download = `qr-code-${poll.slug}.png`;
            link.href = canvas.toDataURL();
            link.click();
          }
        };

        img.src = "data:image/svg+xml;base64," + btoa(svgData);
      }
    }
  };

  const copyQRCode = async () => {
    if (qrCodeRef.current) {
      const svg = qrCodeRef.current.querySelector("svg");
      if (svg) {
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();

        canvas.width = 256;
        canvas.height = 256;

        img.onload = async () => {
          if (ctx) {
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);

            canvas.toBlob(async (blob) => {
              if (blob) {
                try {
                  await navigator.clipboard.write([
                    new ClipboardItem({ "image/png": blob }),
                  ]);
                  copyToClipboard("qr");
                } catch (err) {
                  console.error("Failed to copy QR code:", err);
                }
              }
            });
          }
        };

        img.src = "data:image/svg+xml;base64," + btoa(svgData);
      }
    }
  };

  // Updated handlePollClick in PollItem
  const handlePollClick = async () => {
    try {
      // Generate temp user data like regular users do
      const generateTempUser = () => {
        const tempId = Math.random().toString(36).substr(2, 9);
        const tempUsername = `Moderator_${tempId}`;
        return { tempId, tempUsername };
      };

      // Check if temp user data already exists, if not create it
      let tempUserId = localStorage.getItem("temp_userId");
      let tempUsername = localStorage.getItem("temp_username");

      if (!tempUserId || !tempUsername) {
        const { tempId, tempUsername: generatedUsername } = generateTempUser();
        tempUserId = tempId;
        tempUsername = generatedUsername;

        localStorage.setItem("temp_userId", tempUserId);
        localStorage.setItem("temp_username", tempUsername);
      }

      localStorage.setItem("is_moderator", "true");

      console.log("Temp user data:", { tempUserId, tempUsername });
      console.log("Navigating to:", `/room/${poll.id}`);

      router.push(`/room/${poll.id}`);
    } catch (err) {
      console.error("Error accessing room:", err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
            Active
          </span>
        );
      case "upcoming":
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
            Upcoming
          </span>
        );
      case "past":
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
            Past
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-4">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(poll.id)}
          className="h-4 w-4 cursor-pointer bg-purple-600 focus:ring-purple-500 border-gray-300 rounded"
        />
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center">
          <div>
            <div
              className="text-sm font-medium underline decoration-solid decoration-gray-600 decoration-thickness-[0.5px] text-gray-900 cursor-pointer hover:text-purple-600 hover:decoration-purple-600"
              onClick={handlePollClick}
            >
              {poll.name}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {getStatusBadge(poll.status)}
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-4 hidden md:table-cell">
        <div className="flex items-center">
          <div className="text-sm font-medium text-gray-900">{poll.slug}</div>
          <button
            className="ml-2 cursor-pointer text-gray-400 hover:text-gray-600"
            onClick={() => copyToClipboard("slug", poll.slug)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
              />
            </svg>
          </button>
          {showCopiedMessage === "slug" && (
            <span className="ml-2 text-xs text-green-600">Copied!</span>
          )}
        </div>
      </td>
      <td className="px-4 py-4 hidden sm:table-cell">
        <div className="text-sm text-gray-900">{poll.responses}</div>
      </td>
      <td className="px-4 py-4 hidden lg:table-cell">
        <div className="text-sm text-gray-900">
          {poll.createdAt ? formatDate(new Date(poll.createdAt)) : "—"}
        </div>
      </td>
      <td className="px-4 py-4 text-right text-sm font-medium">
        <div className="flex justify-end space-x-2">
          <button
            className="text-purple-600 cursor-pointer hover:text-purple-900"
            onClick={() => copyToClipboard("link", "")}
          >
            <span className="sr-only">Copy Link</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
          </button>

          {/* Share button with dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              className="text-blue-600 cursor-pointer hover:text-blue-900 transition-colors"
              onClick={() => setShowShareDropdown(!showShareDropdown)}
            >
              <Share2 className="h-5 w-5" />
            </button>

            {/* Share dropdown */}
            {showShareDropdown && (
              <div className="absolute right-0 top-8 z-50 w-80 sm:w-96 bg-white rounded-lg shadow-lg border border-gray-200 p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Share Poll
                  </h3>
                  <button
                    onClick={() => setShowShareDropdown(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                {/* Copy Link Section */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Poll URL
                  </label>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 px-3 py-2 bg-gray-50 rounded-md text-sm text-gray-900 border border-gray-200 overflow-hidden">
                      <div className="truncate">{pollUrl}</div>
                    </div>
                    <button
                      onClick={() => copyToClipboard("link")}
                      className="flex items-center space-x-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors text-sm font-medium"
                    >
                      <Copy className="w-4 h-4" />
                      <span className="hidden sm:inline">Copy</span>
                    </button>
                  </div>
                  {showCopiedMessage === "link" && (
                    <p className="text-xs text-green-600 mt-1 flex items-center">
                      <svg
                        className="w-3 h-3 mr-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Link copied to clipboard!
                    </p>
                  )}
                </div>

                {/* QR Code Section */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    QR Code
                  </label>

                  {/* QR Code Display */}
                  <div className="flex flex-col sm:flex-row sm:items-start space-y-3 sm:space-y-0 sm:space-x-4">
                    <div className="flex-shrink-0 self-center sm:self-start">
                      <div
                        ref={qrCodeRef}
                        className="p-3 bg-white rounded-lg border border-gray-200 inline-block"
                      >
                        <QRCode
                          value={pollUrl}
                          size={120}
                          style={{
                            height: "auto",
                            maxWidth: "100%",
                            width: "100%",
                          }}
                          viewBox="0 0 256 256"
                        />
                      </div>
                    </div>

                    {/* QR Code Actions */}
                    <div className="flex-1 space-y-2">
                      <button
                        onClick={downloadQRCode}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors text-sm font-medium"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download QR Code</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => {
                      window.open(pollUrl, "_blank");
                      setShowShareDropdown(false);
                    }}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors text-sm font-medium"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Open Poll in New Tab</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
};

export default PollItem;
