"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Users, ArrowRight, Check, AlertCircle } from "lucide-react";

export const LoadingSpinner = () => (
  <svg
    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
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
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);

// Mock SVG components - replace with your actual imports
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

const TwitterIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const JoinIcon = () => <ArrowRight className="w-4 h-4" />;

const GetStarted = () => {
  const [userName, setUserName] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const joinRoom = async (slug: string, userName: string) => {
    const backend = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (!backend) throw new Error("Backend URL not configured");

    const res = await fetch(`${backend}/user/room/${slug}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: userName }),
    });

    if (!res.ok) {
      let msg = "Unable to join room";
      try {
        const err = await res.json();
        if (err?.message) msg = err.message;
      } catch {}
      throw new Error(msg);
    }

    return res.json();
  };

  const setTempUser = async (_username: string, _roomId: string) =>
    Promise.resolve();

  // auth flows for moderator
  const handleAuthGoogle = () => {
    window.location.href = "https://veil-1qpe.onrender.com/auth/google";
    router.push("/client-handler");
  };
  const handleAuthTwitter = () => {
    window.location.href = "https://veil-1qpe.onrender.com/auth/twitter";
    router.push("/client-handler");
  };

  const handleJoinRoom = async () => {
    const cleanName = userName.trim();
    const cleanSlug = slug.trim().toLowerCase();

    if (!cleanName || !cleanSlug) {
      setError("Please enter both your name and room code.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await joinRoom(cleanSlug, cleanName);

      if (!response?.user?.roomId) {
        throw new Error("Invalid response from server.");
      }

      const { token, user } = response;
      localStorage.setItem("temp_userId", user.id);
      localStorage.setItem("temp_username", user.username);
      localStorage.setItem("temp_room_id", user.roomId);
      if (token) {
        localStorage.setItem("auth_token", token);
      }

      await setTempUser(user.username, user.roomId);

      console.log("Joining room:", { cleanSlug, cleanName, user });

      router.push(`/room/${user.roomId}`);
    } catch (err: any) {
      console.error("Join room failed:", err);
      setError(
        err?.message ||
          "Failed to join room. Check the room code and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-semibold text-gray-900 mb-3">
            Get Started with Veil
          </h1>
          <p className="text-gray-600 text-lg">
            Join a room or host your own interactive polling session
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Join as participant */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-md">
            {/* Card header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Join as participant
                </h2>
                <p className="text-sm text-gray-500">No account needed</p>
              </div>
            </div>

            {/* Form fields */}
            <div className="space-y-5 mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200 hover:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Room Code
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Enter room code"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full px-4 py-3 pr-24 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200 hover:bg-gray-100"
                  />
                  <button
                    onClick={handleJoinRoom}
                    disabled={loading}
                    className="absolute right-2 top-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all duration-200 hover:from-purple-600 hover:to-purple-700 hover:shadow-lg hover:shadow-purple-500/25 disabled:opacity-70 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                  >
                    {loading ? (
                      <>
                        <LoadingSpinner />
                        <span className="text-sm">Joining...</span>
                      </>
                    ) : (
                      <>
                        <span className="text-sm">Join</span>
                        <JoinIcon />
                      </>
                    )}
                  </button>
                </div>
                {error && (
                  <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                )}
              </div>
            </div>

            {/* Features list */}
            <div className="bg-gray-50 rounded-xl p-5">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                What to expect
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  Interactive polling experience
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  Real-time responses
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  Anonymous participation
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  Multiple question formats
                </li>
              </ul>
            </div>
          </div>

          {/* Host a room */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-md">
            {/* Card header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Host a room
                </h2>
                <p className="text-sm text-gray-500">
                  Sign in to create and manage polls
                </p>
              </div>
            </div>

            {/* Auth buttons */}
            <div className="space-y-4 mb-8">
              <button
                onClick={handleAuthGoogle}
                className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 font-medium transition-all duration-200 hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500/20"
              >
                <GoogleIcon />
                Continue with Google
              </button>

              <button
                onClick={handleAuthTwitter}
                className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-black text-white rounded-xl font-medium transition-all duration-200 hover:bg-gray-800 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500/20"
              >
                <TwitterIcon />
                Continue with X
              </button>
            </div>

            {/* Host benefits */}
            <div className="bg-blue-50 rounded-xl p-5">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Check className="w-4 h-4 text-blue-500" />
                Host benefits
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                  Create custom polls
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                  View detailed analytics
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                  Export results
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                  Moderate responses
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="text-gray-500">
            Need help?{" "}
            <a
              href="#"
              className="text-purple-600 hover:text-purple-700 font-medium transition-colors"
            >
              Contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default GetStarted;
