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
  const [activePollsCount, setActivePollsCount] = useState(0);

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

  // Helper function to calculate time left
  const calculateTimeLeft = (expiresAt: string): string => {
    const now = new Date().getTime();
    const expiry = new Date(expiresAt).getTime();
    const difference = expiry - now;

    if (difference <= 0) return "Expired";

    const minutes = Math.floor(difference / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (!roomId) return;

    const userId = localStorage.getItem("temp_userId") ?? "guest";
    const isModerator = localStorage.getItem("is_moderator") === "true";
    
    // Join room
    socket.emit("joinRoom", {
      roomId: roomId,
      userId: userId,
      role: isModerator ? "moderator" : "user",
    });

    // Request initial data
    socket.emit("getQuestions", { roomId });
    socket.emit("getActivePolls", { roomId });

    // Question event handlers
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

    // Optimized poll event handlers - minimal processing
    const handleNewPoll = (poll: any) => {
      console.log('📊 New poll received in RoomClient:', poll.id);
      // Just update the count, let PollsList handle the actual poll data
      setActivePollsCount(prev => prev + 1);
    };

    const handleActivePollsList = (pollsData: any[]) => {
      console.log('📊 Active polls count updated:', pollsData.length);
      setActivePollsCount(pollsData.length);
      
      // Keep minimal poll data for parent component if needed
      const simplifiedPolls: Poll[] = pollsData.map((poll: any) => ({
        id: poll.id,
        question: poll.question,
        options: poll.options.map((opt: any) => ({
          text: opt.text,
          votes: opt.votes?.length || 0,
          percentage: 0
        })),
        totalVotes: poll.options.reduce((total: number, opt: any) => total + (opt.votes?.length || 0), 0),
        timeLeft: poll.expiresAt ? calculateTimeLeft(poll.expiresAt) : "Expired"
      }));

      // Calculate percentages
      simplifiedPolls.forEach(poll => {
        poll.options.forEach(option => {
          option.percentage = poll.totalVotes > 0 
            ? Math.round((option.votes / poll.totalVotes) * 100) 
            : 0;
        });
      });

      setPolls(simplifiedPolls);
    };

    const handlePollClosed = (data: any) => {
      console.log('📊 Poll closed in RoomClient:', data.pollId);
      setActivePollsCount(prev => Math.max(0, prev - 1));
      setPolls(prev => prev.filter(poll => poll.id !== data.pollId));
    };

    const handleRateLimitError = (data: {
      message: string;
      remainingTime: number;
    }) => {
      setRateLimitMessage(data.message);
      setRateLimitRemaining(data.remainingTime);
    };

    // Register all event listeners
    socket.on("newQuestion", handleNewQuestion);
    socket.on("questionsList", handleQuestionsList);
    socket.on("questionReplied", handleQuestionReplied);
    socket.on("questionUpdated", handleQuestionUpdated);
    socket.on("upvoteResponse", handleUpvoteResponse);
    socket.on("rateLimitError", handleRateLimitError);

    // Simplified poll event listeners - only what's needed for the parent
    socket.on("newPoll", handleNewPoll);
    socket.on("activePollsList", handleActivePollsList);
    socket.on("pollClosed", handlePollClosed);

    // Fetch user count (keep HTTP for this as it's not real-time critical)
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

    fetchUserCount();

    // Cleanup function
    return () => {
      socket.off("newQuestion", handleNewQuestion);
      socket.off("questionsList", handleQuestionsList);
      socket.off("questionReplied", handleQuestionReplied);
      socket.off("questionUpdated", handleQuestionUpdated);
      socket.off("upvoteResponse", handleUpvoteResponse);
      socket.off("rateLimitError", handleRateLimitError);

      // Remove poll event listeners
      socket.off("newPoll", handleNewPoll);
      socket.off("activePollsList", handleActivePollsList);
      socket.off("pollClosed", handlePollClosed);
    };
  }, [roomId, calculateTimeLeft]);

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

  const handleLike = (questionId: string) => {
    if (!socket) return;
    socket.emit("upvoteQuestion", { roomId, questionId, userId });
  };

  // Simplified vote handler - let PollsList handle the details
  const handleVote = (pollId: string, optionIndex: number) => {
    console.log('🗳️ Vote handled by parent:', { pollId, optionIndex });
    // The actual voting is handled by the PollsList component
  };

  // Simplified poll creation handler
  const handleCreatePoll = (poll: { question: string; options: { text: string }[] }) => {
    console.log('📊 Poll creation handled by parent:', poll.question);
    // The actual poll creation is handled by the PollsList component
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <RoomHeader 
        userCount={userCount} 
        onLeaveRoom={HandleLeaveRoom}
        activePollsCount={activePollsCount}
      />

      <div className="max-w-4xl mx-auto p-2 sm:p-4">
        {/* Tabs */}
        <TabNavigation 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
          activePollsCount={activePollsCount}
        />

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
            polls={[]} // Empty array - PollsList manages its own polls
            onVote={handleVote}
            onCreatePoll={handleCreatePoll}
            socket={socket}
            roomId={roomId}
            userId={userId}
          />
        )}
      </div>
    </div>
  );
};

export default RoomClient;