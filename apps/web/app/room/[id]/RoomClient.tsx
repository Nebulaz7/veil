"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { socket } from "../../lib/socket";

// Import types
import { Question, Reply, Poll } from "./types";

// Import components
import RoomHeader from "./components/RoomHeader";
import TabNavigation from "./components/TabNavigation";
import QuestionInput from "./components/QuestionInput";
import QuestionsList from "./components/QuestionsList";
import PollsList from "./components/PollsList";

interface Props {
  roomId: string;
}

const RoomClient = () => {
  const params = useParams();
  const roomId = params?.id as string;
  const userId =
    typeof window !== "undefined"
      ? (localStorage.getItem("temp_userId") ?? "anonymous")
      : "anonymous";
  const username =
    typeof window !== "undefined"
      ? (localStorage.getItem("temp_username") ?? "Anonymous")
      : "Anonymous";

  const [isRoomLoading, setIsRoomLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("qa");
  const [newQuestion, setNewQuestion] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [rateLimitRemaining, setRateLimitRemaining] = useState(0);
  const [rateLimitMessage, setRateLimitMessage] = useState("");
  const [userCount, setUserCount] = useState(0);

  const HandleLeaveRoom = () => {
    if (!roomId) return;

    // Emit leave room event
    socket.emit("leaveRoom", { roomId, userId });

    // Clear local storage
    localStorage.removeItem("temp_userId");
    localStorage.removeItem("temp_username");

    // Redirect to home page
    window.location.href = "/";
  };

  // Reply states
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(
    new Set()
  );
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [isSubmittingReply, setIsSubmittingReply] = useState<
    Record<string, boolean>
  >({});

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

    const handleQuestionsList = (questionsList: Question[]) => {
      setQuestions(questionsList);
    };

    const handleQuestionReplied = (updatedQuestion: Question) => {
      setQuestions((prev) =>
        prev.map((q) => (q.id === updatedQuestion.id ? updatedQuestion : q))
      );
    };

    const handleRateLimitError = (data: {
      message: string;
      remainingTime: number;
    }) => {
      setRateLimitMessage(data.message);
      setRateLimitRemaining(data.remainingTime);
    };

    socket.on("newQuestion", handleNewQuestion);
    socket.on("questionsList", handleQuestionsList);
    socket.on("questionReplied", handleQuestionReplied);
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

    const fetchUserCount = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        if (!token) {
          console.error("No auth token found");
          return;
        }

        const countRes = await fetch(
          `https://veil-1qpe.onrender.com/user/room/${roomId}/no`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!countRes.ok) {
          throw new Error(`Failed to fetch user count for room ${roomId}`);
        }

        const countData = await countRes.json();

        if (typeof countData === "number") {
          setUserCount(countData);
        } else {
          console.warn("Unexpected count response:", countData);
          setUserCount(0);
        }
      } catch (err) {
        console.error("Error fetching user count:", err);
        setUserCount(0);
      }
    };

    fetchPolls();
    fetchUserCount();

    return () => {
      socket.off("newQuestion", handleNewQuestion);
      socket.off("questionsList", handleQuestionsList);
      socket.off("questionReplied", handleQuestionReplied);
      socket.off("rateLimitError", handleRateLimitError);
    };
  }, [roomId]);

  // Toggle expanded state for a question
  const toggleQuestionExpanded = (questionId: string) => {
    setExpandedQuestions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  // Handle reply input change
  const handleReplyInputChange = (questionId: string, value: string) => {
    setReplyInputs((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  // Submit reply
  const handleSubmitReply = async (questionId: string) => {
    const replyContent = replyInputs[questionId]?.trim();
    if (
      !replyContent ||
      isSubmittingReply[questionId] ||
      rateLimitRemaining > 0
    ) {
      return;
    }

    setIsSubmittingReply((prev) => ({ ...prev, [questionId]: true }));

    try {
      socket.emit("replyToQuestion", {
        roomId,
        questionId,
        content: replyContent,
      });

      // Clear the input
      setReplyInputs((prev) => ({
        ...prev,
        [questionId]: "",
      }));
    } catch (error) {
      console.error("Error submitting reply:", error);
    } finally {
      setIsSubmittingReply((prev) => ({ ...prev, [questionId]: false }));
    }
  };

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
    if (
      !newQuestion.trim() ||
      !roomId ||
      isRoomLoading ||
      rateLimitRemaining > 0
    ) {
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
            ? {
                ...q,
                upvotes: updatedQuestion.upvotes || 0,
                upvotedBy: updatedQuestion.upvotedBy || [],
              }
            : q
        )
      );
    };

    const handleUpvoteResponse = (response: {
      success: boolean;
      message: string;
    }) => {
      if (!response.success) {
        console.log(response.message);
      }
    };

    socket.on("questionUpdated", handleQuestionUpdated);
    socket.on("upvoteResponse", handleUpvoteResponse);

    return () => {
      socket.off("questionUpdated", handleQuestionUpdated);
      socket.off("upvoteResponse", handleUpvoteResponse);
    };
  }, [roomId]);

  const handleLike = (questionId: string) => {
    if (!socket) return;
    socket.emit("upvoteQuestion", { roomId, questionId });
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
      <RoomHeader userCount={userCount} onLeaveRoom={HandleLeaveRoom} />

      <div className="max-w-4xl mx-auto p-2 sm:p-4">
        {/* Tabs */}
        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

        {/* QA Tab */}
        {activeTab === "qa" && (
          <>
            {/* Question Input */}
            <QuestionInput
              newQuestion={newQuestion}
              onQuestionChange={setNewQuestion}
              onSubmitQuestion={handleSubmitQuestion}
              onImproveAi={handleImproveAi}
              isRoomLoading={isRoomLoading}
              isLoading={isLoading}
              rateLimitRemaining={rateLimitRemaining}
              rateLimitMessage={rateLimitMessage}
            />

            {/* Questions List */}
            <QuestionsList
              questions={questions}
              userId={userId}
              expandedQuestions={expandedQuestions}
              replyInputs={replyInputs}
              isSubmittingReply={isSubmittingReply}
              rateLimitRemaining={rateLimitRemaining}
              onToggleQuestionExpanded={toggleQuestionExpanded}
              onReplyInputChange={handleReplyInputChange}
              onSubmitReply={handleSubmitReply}
              onLike={handleLike}
              messagesEndRef={messagesEndRef}
            />
          </>
        )}

        {/* Polls Tab */}
        {activeTab === "polls" && (
             <PollsList
               polls={serverPolls}
               onVote={handleVote}
               onCreatePoll={handleCreatePoll}
               socket={socketInstance}
               roomId={roomId}
               userId={userId}
            />
        )}
      </div>
    </div>
  );
};
export default RoomClient;
