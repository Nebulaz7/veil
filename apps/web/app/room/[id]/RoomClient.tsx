"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { socket } from "../../lib/socket";
import {
  SendHorizonal,
  MessageSquare,
  BarChart3,
  Users,
  ThumbsUp,
  Clock,
  LogOut,
  AlertCircle,
} from "lucide-react";

interface Question {
  id: string;
  user: string;
  question: string;
  timestamp: string;
  upvotes: number;
  answered: boolean;
  answer?: string;
}

interface PollOption {
  text: string;
  votes: number;
  percentage: number;
}

interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  totalVotes: number;
  timeLeft: string;
}

interface Props {
  roomId: string;
}

const RoomClient = () => {
  const params = useParams();
  const roomId = params?.id as string;
  const [isRoomLoading, setIsRoomLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("qa");
  const [newQuestion, setNewQuestion] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [rateLimitRemaining, setRateLimitRemaining] = useState(0);
  const [rateLimitMessage, setRateLimitMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const rateLimitIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToTop = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToTop();
  }, [questions]);

  // Rate limit countdown effect
  useEffect(() => {
    if (rateLimitRemaining > 0) {
      rateLimitIntervalRef.current = setInterval(() => {
        setRateLimitRemaining((prev) => {
          if (prev <= 1) {
            setRateLimitMessage("");
            if (rateLimitIntervalRef.current) {
              clearInterval(rateLimitIntervalRef.current);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (rateLimitIntervalRef.current) {
        clearInterval(rateLimitIntervalRef.current);
      }
    };
  }, [rateLimitRemaining]);

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        if (!token) return;

        const res = await fetch(
          `https://veil-1qpe.onrender.com/rooms/${roomId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const room = await res.json();
        setIsRoomLoading(false);
      } catch (err) {
        console.error("Error fetching room:", err);
      }
    };

    fetchRoom();
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;

    const userId = localStorage.getItem("temp_userId") ?? "guest";
    const isModerator = localStorage.getItem("is_moderator") === "true";
    socket.emit("joinRoom", {
      roomId: roomId,
      userId: userId,
      role: isModerator ? "moderator" : "user",
    });

    socket.emit("getQuestions", roomId);
    
    const handleNewQuestion = (question: Question) => {
      setQuestions((prev) => [question, ...prev]);
    };

    const handleRateLimitError = (data: { message: string; remainingTime: number }) => {
      setRateLimitMessage(data.message);
      setRateLimitRemaining(data.remainingTime);
    };

    socket.on("newQuestion", handleNewQuestion);
    socket.on("rateLimitError", handleRateLimitError);

    const fetchPolls = async () => {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(
        `https://veil-1qpe.onrender.com/rooms/${roomId}/polls`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await res.json();
      setPolls(data);
    };
    fetchPolls();

    return () => {
      socket.off("newQuestion", handleNewQuestion);
      socket.off("rateLimitError", handleRateLimitError);
    };
  }, [roomId]);

  const handleImproveAi = async () => {
    // Check if there's text to improve
    if (!newQuestion.trim()) {
      alert("Please enter a question first before improving it with AI.");
      return;
    }

    const APIKEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    // Check if API key exists
    if (!APIKEY) {
      console.error("Gemini API key not found");
      alert(
        "AI service is not configured. Please check your environment variables."
      );
      return;
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${APIKEY}`;

    // Set loading state
    setIsLoading(true);

    try {
      const prompt = `Please improve this question to make it clearer, more professional, and engaging for a Q&A session. Keep it concise but comprehensive. Original question: "${newQuestion}"

    Instructions:
    - Make it more specific and actionable
    - Ensure proper grammar and structure
    - Keep the original intent and meaning
    - Make it suitable for a professional setting
    - Only return the improved question, nothing else
    - Make the improved question to be less than 200 characters`;

      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 200,
          topK: 40,
          topP: 0.95,
        },
      };

      console.log("Enhancing question with AI...");

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `API request failed: ${response.status} ${response.statusText}. ${errorData.error?.message || ""}`
        );
      }

      const data = await response.json();

      // Extract the improved text from the response
      if (
        data.candidates &&
        data.candidates[0] &&
        data.candidates[0].content &&
        data.candidates[0].content.parts[0]
      ) {
        const improvedQuestion =
          data.candidates[0].content.parts[0].text.trim();

        // Remove any quotes that might be added by the AI
        const cleanedQuestion = improvedQuestion.replace(/^["']|["']$/g, "");

        // Update the input with the improved question
        setNewQuestion(cleanedQuestion);

        console.log("Question improved successfully!");
      } else {
        throw new Error("Unexpected response format from AI service");
      }
    } catch (error: unknown) {
      console.error("Error improving question with AI:", error);

      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // Handle different types of errors
      if (errorMessage.includes("API request failed")) {
        alert(
          "Failed to connect to AI service. Please check your internet connection and try again."
        );
      } else if (errorMessage.includes("API key")) {
        alert("Invalid API key. Please check your configuration.");
      } else if (errorMessage.includes("quota")) {
        alert("AI service quota exceeded. Please try again later.");
      } else {
        alert(
          "Failed to improve question with AI. Please try again or submit your original question."
        );
      }
    } finally {
      // Reset loading state
      setIsLoading(false);
    }
  };

  const handleSubmitQuestion = () => {
    if (!newQuestion.trim() || !roomId || isRoomLoading || rateLimitRemaining > 0) {
      if (rateLimitRemaining > 0) {
        console.warn("Rate limited - please wait");
      } else {
        console.warn("Missing question or roomId");
      }
      return;
    }

    const userId = localStorage.getItem("temp_userId");
    const username = localStorage.getItem("temp_username");

    socket.emit("askQuestion", {
      roomId,
      userId: userId ?? "anonymous",
      question: newQuestion,
    });

    setNewQuestion("");
  };

  useEffect(() => {
  if (!roomId) return;

  const handleQuestionUpdated = (updatedQuestion: Question) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === updatedQuestion.id
          ? { ...q, upvotes: updatedQuestion.upvotes || 0 }
          : q
      )
    );
  };

  socket.on("questionUpdated", handleQuestionUpdated);

  return () => {
    socket.off("questionUpdated", handleQuestionUpdated);
  };
}, [roomId]);

const handleLike = (questionId: string) => {
  if (!socket) return;
  socket.emit('upvoteQuestion', { roomId, questionId });
};

  const handleVote = async (pollId: string, optionIndex: number) => {
    const token = localStorage.getItem("auth_token");

    try {
      await fetch(`https://veil-1qpe.onrender.com/polls/${pollId}/vote`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ optionIndex }),
      });

      // re-fetch poll results
      const res = await fetch(
        `https://veil-1qpe.onrender.com/rooms/${roomId}/polls`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const updated = await res.json();
      setPolls(updated);
    } catch (err) {
      console.error("Vote failed:", err);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-[#EAD9FF] text-purple-600 p-3 sm:p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Veil</h1>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4 text-xs sm:text-sm">
            <div className="hidden sm:flex items-center space-x-1">
              <span className="text-sm sm:text-lg md:text-xl text-black">
                Product Review Session
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <Users className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Live</span>
            </div>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <div>
              <button className="btn bg-red-600 text-white rounded-[25px] border-none px-2 py-1 sm:px-4 sm:py-[1px] hover:bg-red-700 text-xs sm:text-sm">
                <LogOut className="w-3 h-3 sm:w-4 sm:h-4 inline" />
                <span className="hidden sm:inline ml-1">Leave room</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-2 sm:p-4">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-4 sm:mb-6">
          <nav className="flex space-x-4 sm:space-x-8 justify-center">
            <button
              onClick={() => setActiveTab("qa")}
              className={`flex items-center cursor-pointer space-x-1 sm:space-x-2 py-2 px-1 border-b-2 font-medium text-xs sm:text-sm ${activeTab === "qa" ? "border-purple-500 text-purple-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
            >
              <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Q&A</span>
            </button>
            <button
              onClick={() => setActiveTab("polls")}
              className={`flex items-center cursor-pointer space-x-1 sm:space-x-2 py-2 px-1 border-b-2 font-medium text-xs sm:text-sm ${activeTab === "polls" ? "border-purple-500 text-purple-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
            >
              <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Polls</span>
            </button>
          </nav>
        </div>

        {/* QA Tab */}
        {activeTab === "qa" && (
          <>
            {/* Fixed input section at bottom */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2 sm:p-4 shadow-lg z-50">
              <div className="max-w-4xl mx-auto">
                {/* Rate limit notification */}
                {rateLimitRemaining > 0 && (
                  <div className="mb-3 p-2 sm:p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-amber-800">
                        {rateLimitMessage}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 text-amber-700">
                      <Clock className="w-3 h-3" />
                      <span className="text-sm font-medium tabular-nums">
                        {rateLimitRemaining}s
                      </span>
                    </div>
                  </div>
                )}

                <div className="relative">
                  {/* Main input container */}
                  <div className={`flex items-center bg-gray-50 border rounded-xl sm:rounded-2xl focus-within:bg-white transition-all duration-200 ${
                    rateLimitRemaining > 0 
                      ? 'border-amber-300 focus-within:border-amber-400' 
                      : 'border-gray-300 focus-within:border-purple-500'
                  }`}>
                    <textarea
                      value={newQuestion}
                      onChange={(e) => setNewQuestion(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSubmitQuestion();
                        }
                      }}
                      placeholder={
                        rateLimitRemaining > 0 
                          ? `Please wait ${rateLimitRemaining}s before sending another question...`
                          : "Ask your question..."
                      }
                      disabled={isRoomLoading || rateLimitRemaining > 0}
                      rows={1}
                      className="flex-1 p-2 sm:p-4 pr-16 sm:pr-24 bg-transparent border-none rounded-xl sm:rounded-2xl focus:outline-none placeholder-gray-500 text-gray-900 resize-none overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                      style={{
                        minHeight: "44px",
                        maxHeight: "120px",
                      }}
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = "auto";
                        target.style.height = target.scrollHeight + "px";
                      }}
                    />

                    {/* Button container inside input */}
                    <div className="flex items-center space-x-1 sm:space-x-2 pr-2 sm:pr-3">
                      {/* Enhance with AI button */}
                      <button
                        onClick={handleImproveAi}
                        disabled={
                          isRoomLoading || isLoading || !newQuestion.trim() || rateLimitRemaining > 0
                        }
                        className="flex cursor-pointer items-center space-x-1 px-2 py-1 sm:px-3 sm:py-1.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-medium rounded-full hover:from-blue-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                      >
                        {isLoading ? (
                          <>
                            <svg
                              className="w-2 h-2 sm:w-3 sm:h-3 animate-spin"
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
                            <span className="hidden sm:inline">
                              Improving...
                            </span>
                          </>
                        ) : (
                          <>
                            <svg
                              className="w-2 h-2 sm:w-3 sm:h-3"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                            </svg>
                            <span className="hidden sm:inline">Improve</span>
                          </>
                        )}
                      </button>

                      {/* Send button */}
                      <button
                        onClick={handleSubmitQuestion}
                        disabled={isRoomLoading || !newQuestion.trim() || rateLimitRemaining > 0}
                        className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 text-white rounded-full transition-all duration-200 shadow-sm ${
                          rateLimitRemaining > 0
                            ? 'bg-amber-400 cursor-not-allowed'
                            : 'bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 disabled:cursor-not-allowed'
                        }`}
                      >
                        {rateLimitRemaining > 0 ? (
                          <span className="text-xs font-medium tabular-nums">{rateLimitRemaining}</span>
                        ) : (
                          <SendHorizonal className="w-3 h-3 sm:w-4 sm:h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Questions list */}
            <div className="space-y-3 sm:space-y-4 pb-20 sm:pb-24">
              <div ref={messagesEndRef} />
              {questions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-center px-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                    <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                  </div>
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                    No questions yet
                  </h3>
                  <p className="text-gray-500 max-w-sm text-sm sm:text-base">
                    Be the first to ask a question! Your question will appear
                    here once submitted.
                  </p>
                </div>
              ) : (
                questions.map((q) => (
                  <div
                    key={q.id}
                    className="bg-gray-50 border p-3 sm:p-4 rounded-lg"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <span className="font-medium text-sm sm:text-base truncate">
                          {q.user}
                        </span>
                        <div className="text-xs sm:text-sm text-gray-500 flex items-center space-x-1">
                          <Clock className="w-2 h-2 sm:w-3 sm:h-3 flex-shrink-0" />
                          <span className="truncate">{q.timestamp}</span>
                        </div>
                      </div>
                      {q.answered && (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex-shrink-0 ml-2">
                          Answered
                        </span>
                      )}
                    </div>
                    <p className="text-gray-800 mb-3 text-sm sm:text-base break-words">
                      {q.question}
                    </p>
                    {q.answer && (
                      <div className="bg-white border-l-4 border-purple-500 p-2 sm:p-3 rounded mb-2">
                        <p className="text-xs sm:text-sm text-gray-700 font-medium">
                          Answer:
                        </p>
                        <p className="text-sm sm:text-base break-words">
                          {q.answer}
                        </p>
                      </div>
                    )}
                    <button
                      onClick={() => handleLike(q.id)}
                      className="text-xs sm:text-sm text-gray-600 hover:text-purple-600 flex items-center space-x-2"
                    >
                      <ThumbsUp className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>{q.upvotes}</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* Polls Tab */}
        {activeTab === "polls" && (
          <div className="space-y-4 sm:space-y-6 pb-4 sm:pb-0">
            {polls.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-center px-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                  <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                </div>
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                  No polls available
                </h3>
                <p className="text-gray-500 max-w-sm text-sm sm:text-base">
                  There are no active polls at the moment. Check back later for
                  new polls to participate in!
                </p>
              </div>
            ) : (
              polls.map((poll) => (
                <div
                  key={poll.id}
                  className="bg-gray-50 border p-4 sm:p-6 rounded-lg"
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between mb-3 sm:mb-4">
                    <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-0 pr-0 sm:pr-4">
                      {poll.question}
                    </h3>
                    <div className="text-xs sm:text-sm text-left sm:text-right flex-shrink-0">
                      <div className="text-gray-600">
                        {poll.totalVotes} votes
                      </div>
                      <div className="text-purple-600 font-medium">
                        Time left: {poll.timeLeft}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 sm:space-y-3">
                    {poll.options.map((opt, index) => (
                      <div key={index}>
                        <button
                          onClick={() => handleVote(poll.id, index)}
                          className="w-full text-left border p-2 sm:p-3 rounded hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex justify-between text-xs sm:text-sm mb-1">
                            <span className="font-medium text-gray-800 break-words pr-2">
                              {opt.text}
                            </span>
                            <span className="text-purple-600 font-medium flex-shrink-0">
                              {opt.percentage}%
                            </span>
                          </div>
                          <div className="bg-gray-200 h-1.5 sm:h-2 rounded-full">
                            <div
                              className="bg-purple-600 h-1.5 sm:h-2 rounded-full transition-all duration-300"
                              style={{ width: `${opt.percentage}%` }}
                            />
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {opt.votes} votes
                          </div>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomClient;
