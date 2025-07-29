import React, { useState, useRef, useEffect } from "react";
import { BarChart3, Plus, X, AlertCircle } from "lucide-react";
import { Poll } from "../types";

// Use the existing PollOption interface from types
// No need to redefine it here

interface PollsListProps {
  polls: Poll[];
  onVote: (pollId: string, optionIndex: number) => void;
  onCreatePoll?: (poll: {
    question: string;
    options: { text: string }[];
  }) => void;
  // Add WebSocket and room props
  socket?: any;
  roomId: string;
  userId: string;
}

const PollsList: React.FC<PollsListProps> = ({
  polls,
  onVote,
  onCreatePoll,
  socket,
  roomId,
  userId,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [pollTitle, setPollTitle] = useState("");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [errors, setErrors] = useState<{
    title?: string;
    options?: string;
  }>({});
  // State to hold server polls
  const [serverPolls, setServerPolls] = useState<Poll[]>([]);
  // State to hold locally created polls before server sync
  const [localPolls, setLocalPolls] = useState<Poll[]>([]);
  // State to track which polls the user has already voted on
  const [votedPolls, setVotedPolls] = useState<string[]>([]);
  // State to store mapping of poll options to their server IDs
  const [pollOptionMapping, setPollOptionMapping] = useState<{
    [pollId: string]: { [optionIndex: number]: string };
  }>({});
  // State for WebSocket connection status
  const [isConnected, setIsConnected] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);

  // WebSocket event listeners
  useEffect(() => {
    if (!socket) return;

    // Check connection status
    setIsConnected(socket.connected);

    // Listen for new polls from other users
    const handleNewPoll = (poll: any) => {
      console.log("📊 New poll received:", poll);

      // Check if poll has options with IDs
      if (poll.options && Array.isArray(poll.options)) {
        // Create mapping for this new poll's options
        const optionMapping: { [optionIndex: number]: string } = {};

        // Log the structure to debug
        console.log("Poll options structure:", JSON.stringify(poll.options));

        poll.options.forEach((opt: any, index: number) => {
          // Different backends might have different property names
          const optionId = opt.id || opt._id || `${poll.id}-option-${index}`;
          optionMapping[index] = optionId;
          console.log(`Mapped option ${index} to ID ${optionId}`);

          // Check if current user has voted for this option in the new poll
          if (opt.votes && Array.isArray(opt.votes)) {
            const userVoted = opt.votes.some(
              (vote: any) => vote.voterId === userId || vote.userId === userId
            );
            if (userVoted) {
              setUserVoteChoices((prev) => ({ ...prev, [poll.id]: index }));
              setVotedPolls((prev) => {
                if (!prev.includes(poll.id)) {
                  return [...prev, poll.id];
                }
                return prev;
              });
              console.log(
                `User ${userId} voted for option ${index} in new poll ${poll.id}`
              );
            }
          }
        });

        // Update the mapping state immediately
        setPollOptionMapping((prev) => {
          const newMapping = {
            ...prev,
            [poll.id]: optionMapping,
          };
          console.log("Updated option mappings:", newMapping);
          return newMapping;
        });
      }

      // Remove from local polls if it exists and add to server polls
      setLocalPolls((prev) => prev.filter((p) => p.question !== poll.question));

      // Add to polls via parent component callback or update local state
      // Since we don't have direct access to polls state, we'll trigger a refresh
      requestActivePolls();
    };

    // Listen for active polls list
    const handleActivePollsList = (pollsData: any[]) => {
      console.log("📊 Active polls received:", pollsData);

      // Store option ID mappings for voting
      const newMappings: {
        [pollId: string]: { [optionIndex: number]: string };
      } = {};

      // Track user vote choices from server data
      const newUserVoteChoices: { [pollId: string]: number } = {};

      // Convert server polls format to component format
      const formattedPolls: Poll[] = pollsData.map((poll: any) => {
        // Create mapping for this poll's options
        const optionMapping: { [optionIndex: number]: string } = {};

        if (poll.options && Array.isArray(poll.options)) {
          poll.options.forEach((opt: any, index: number) => {
            // Try to get the option ID from different possible property names
            const optionId = opt.id || opt._id || `${poll.id}-option-${index}`;
            optionMapping[index] = optionId;
            console.log(
              `Poll ${poll.id}: Mapped option ${index} to ID ${optionId}`
            );

            // Check if current user has voted for this option
            if (opt.votes && Array.isArray(opt.votes)) {
              const userVoted = opt.votes.some(
                (vote: any) => vote.voterId === userId || vote.userId === userId
              );
              if (userVoted) {
                newUserVoteChoices[poll.id] = index;
                console.log(
                  `User ${userId} voted for option ${index} in poll ${poll.id}`
                );
              }
            }
          });
        }

        newMappings[poll.id] = optionMapping;

        return {
          id: poll.id,
          question: poll.question,
          options: poll.options.map((opt: any) => ({
            text: opt.text,
            votes: opt.votes?.length || 0,
            percentage: 0,
          })),
          totalVotes: poll.options.reduce(
            (total: number, opt: any) => total + (opt.votes?.length || 0),
            0
          ),
          timeLeft: poll.expiresAt
            ? calculateTimeLeft(poll.expiresAt)
            : "Expired",
        };
      });

      // Calculate percentages
      formattedPolls.forEach((poll) => {
        poll.options.forEach((option) => {
          option.percentage =
            poll.totalVotes > 0
              ? Math.round((option.votes / poll.totalVotes) * 100)
              : 0;
        });
      });

      // Update mappings, server polls state, and user vote choices from server data
      console.log("📊 Updating option mappings with:", newMappings);
      console.log("📊 Updating user vote choices with:", newUserVoteChoices);
      setPollOptionMapping((prev) => ({ ...prev, ...newMappings }));
      setServerPolls(formattedPolls);

      // Update user vote choices based on server data
      setUserVoteChoices((prev) => ({ ...prev, ...newUserVoteChoices }));

      // Update voted polls list
      const votedPollIds = Object.keys(newUserVoteChoices);
      setVotedPolls((prev) => {
        const updated = [...new Set([...prev, ...votedPollIds])];
        return updated;
      });
    };

    // Listen for poll votes
    const handlePollVoteAdded = (voteData: any) => {
      console.log("🗳️ Vote added:", voteData);
      // Refresh active polls to get updated vote counts
      requestActivePolls();
    };

    // Listen for vote confirmation
    const handleVoteConfirmed = (data: any) => {
      console.log("✅ Vote confirmed:", data);

      // Add poll to voted polls if not already there
      setVotedPolls((prev) => {
        if (!prev.includes(data.pollId)) {
          return [...prev, data.pollId];
        }
        return prev;
      });

      // Find which option index corresponds to the confirmed optionId
      const pollMapping = pollOptionMapping[data.pollId];
      if (pollMapping) {
        const optionIndex = Object.keys(pollMapping).find(
          (index) => pollMapping[parseInt(index)] === data.optionId
        );
        if (optionIndex !== undefined) {
          setUserVoteChoices((prev) => ({
            ...prev,
            [data.pollId]: parseInt(optionIndex),
          }));
          console.log(
            `Updated user choice for poll ${data.pollId} to option ${optionIndex}`
          );
        }
      }

      // Delay the polls refresh slightly to ensure the server has processed the vote
      setTimeout(() => {
        console.log("🔄 Refreshing polls after vote confirmation");
        requestActivePolls();
      }, 500);
    };

    // Listen for poll closure
    const handlePollClosed = (data: any) => {
      console.log("📊 Poll closed:", data);
      // Remove from active polls or mark as closed
      requestActivePolls();
    };

    // Listen for poll errors
    const handlePollError = (data: any) => {
      console.error("❌ Poll error:", data.message);

      // Check for specific error types and handle appropriately
      if (data.message.includes("not found")) {
        // The poll or option wasn't found - this might be a timing issue
        console.log(
          "⚠️ This appears to be a server-side issue with option handling"
        );

        // Delay the refresh slightly to give the server time to complete any pending operations
        setTimeout(() => {
          requestActivePolls();
        }, 1000);

        // Don't show an alert for this common error
        // It seems to happen after votes are actually recorded
      } else {
        // For other errors, show the original message
        alert(`Error: ${data.message}`);
      }
    };

    // Listen for connection status changes
    const handleConnect = () => {
      console.log("🟢 Socket connected");
      setIsConnected(true);
      // Request active polls when connected
      requestActivePolls();
    };

    const handleDisconnect = () => {
      console.log("🔴 Socket disconnected");
      setIsConnected(false);
    };

    // Add event listeners
    socket.on("newPoll", handleNewPoll);
    socket.on("activePollsList", handleActivePollsList);
    socket.on("pollVoteAdded", handlePollVoteAdded);
    socket.on("voteConfirmed", handleVoteConfirmed);
    socket.on("pollClosed", handlePollClosed);
    socket.on("pollError", handlePollError);
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    // Request active polls on mount
    requestActivePolls();

    // Cleanup listeners on unmount
    return () => {
      socket.off("newPoll", handleNewPoll);
      socket.off("activePollsList", handleActivePollsList);
      socket.off("pollVoteAdded", handlePollVoteAdded);
      socket.off("voteConfirmed", handleVoteConfirmed);
      socket.off("pollClosed", handlePollClosed);
      socket.off("pollError", handlePollError);
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, [socket, roomId]);

  // Helper function to calculate time left
  const calculateTimeLeft = (expiresAt: string): string => {
    const now = new Date().getTime();
    const expiry = new Date(expiresAt).getTime();
    const difference = expiry - now;

    if (difference <= 0) return "Expired";

    const minutes = Math.floor(difference / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // WebSocket function to request active polls
  const requestActivePolls = () => {
    if (socket && isConnected) {
      console.log("📊 Requesting active polls for room:", roomId);
      socket.emit("getActivePolls", { roomId });
    }
  };

  // WebSocket function to create a poll
  const createPollViaSocket = (pollData: {
    question: string;
    options: string[];
  }) => {
    if (!socket || !isConnected) {
      console.error("❌ Socket not connected");
      alert("Not connected to server. Please try again.");
      return;
    }

    console.log("📊 Creating poll via socket:", pollData);
    socket.emit("createPoll", {
      roomId,
      userId,
      name: pollData.question, // Using question as name for now
      question: pollData.question,
      options: pollData.options,
    });
  };

  // State to track votes in progress to prevent duplicate votes
  const [votesInProgress, setVotesInProgress] = useState<{
    [key: string]: boolean;
  }>({});

  // WebSocket function to vote on a poll with retry logic
  const voteOnPollViaSocket = (pollId: string, optionId: string) => {
    if (!socket || !isConnected) {
      console.error("❌ Socket not connected");
      alert("Not connected to server. Please try again.");
      return;
    }

    // Check if we're already voting on this poll
    const voteKey = `${pollId}-${optionId}`;
    if (votesInProgress[voteKey]) {
      console.log(
        "⚠️ Vote already in progress for this option, skipping duplicate"
      );
      return;
    }

    // Mark this vote as in progress
    setVotesInProgress((prev) => ({ ...prev, [voteKey]: true }));

    console.log("🗳️ Voting via socket:", { pollId, optionId });

    // Add a short delay to ensure poll is fully created on the server
    setTimeout(() => {
      socket.emit("votePoll", {
        roomId,
        pollId,
        optionId,
        userId,
      });

      // Clear the in-progress flag after a timeout
      setTimeout(() => {
        setVotesInProgress((prev) => {
          const updated = { ...prev };
          delete updated[voteKey];
          return updated;
        });
      }, 5000); // Allow 5 seconds before enabling re-voting
    }, 300); // 300ms delay before sending vote
  }; // Close modal when clicking outside
  const handleClickOutside = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      setShowModal(false);
    }
  };

  const handleAddOption = () => {
    setPollOptions([...pollOptions, ""]);
  };

  const handleRemoveOption = (index: number) => {
    if (pollOptions.length <= 2) {
      return; // Keep at least 2 options
    }
    const newOptions = [...pollOptions];
    newOptions.splice(index, 1);
    setPollOptions(newOptions);
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  const validateForm = () => {
    const newErrors: {
      title?: string;
      options?: string;
    } = {};

    // Validate title
    if (!pollTitle.trim()) {
      newErrors.title = "Poll title is required";
    }

    // Validate options
    const validOptions = pollOptions.filter((opt) => opt.trim() !== "");
    if (validOptions.length < 2) {
      newErrors.options = "At least 2 valid options are required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const filteredOptions = pollOptions
      .filter((opt) => opt.trim() !== "")
      .map((text) => text.trim());

    // Create poll via WebSocket instead of local state
    if (socket && isConnected) {
      createPollViaSocket({
        question: pollTitle.trim(),
        options: filteredOptions,
      });
    } else {
      // Fallback to local creation if socket not available
      const tempPoll: Poll = {
        id: `temp-${Date.now()}`,
        question: pollTitle,
        options: filteredOptions.map((text) => ({
          text,
          votes: 0,
          percentage: 0,
        })),
        totalVotes: 0,
        timeLeft: "2:00",
      };

      setLocalPolls((prev) => [tempPoll, ...prev]);

      if (onCreatePoll) {
        onCreatePoll({
          question: pollTitle,
          options: filteredOptions.map((text) => ({ text })),
        });
      }
    }

    // Close the modal and reset form
    setShowModal(false);
    setPollTitle("");
    setPollOptions(["", ""]);
    setErrors({});
  };

  const HandleCreateLivePoll = () => {
    // Reset form values
    setPollTitle("");
    setPollOptions(["", ""]);
    setErrors({});
    setShowModal(true);
  };

  // Add a new state to track which specific option each user voted for
  const [userVoteChoices, setUserVoteChoices] = useState<{
    [pollId: string]: number; // stores the option index the user voted for
  }>({});

  // Updated vote handler - using option mapping for server polls
  const handleLocalVote = (pollId: string, optionIndex: number) => {
    // Check if this is a local poll
    if (pollId.startsWith("temp-")) {
      // Handle local poll voting (existing logic)
      const alreadyVoted = votedPolls.includes(pollId);

      setLocalPolls((prevPolls) => {
        const updatedPolls = prevPolls.map((poll) => {
          if (poll.id === pollId) {
            const newOptions = [...poll.options];

            if (alreadyVoted) {
              for (let i = 0; i < newOptions.length; i++) {
                const option = newOptions[i];
                if (option && option.votes > 0) {
                  newOptions[i] = {
                    text: option.text,
                    votes: option.votes - 1,
                    percentage: option.percentage,
                  };
                  break;
                }
              }
            }

            const selectedOption = newOptions[optionIndex];
            if (selectedOption) {
              newOptions[optionIndex] = {
                ...selectedOption,
                votes: selectedOption.votes + 1,
              };

              const newTotalVotes = alreadyVoted
                ? poll.totalVotes
                : poll.totalVotes + 1;

              const updatedOptions = newOptions.map((opt) => ({
                ...opt,
                percentage:
                  newTotalVotes > 0
                    ? Math.round((opt.votes / newTotalVotes) * 100)
                    : 0,
              }));

              return {
                ...poll,
                options: updatedOptions,
                totalVotes: newTotalVotes,
              };
            }
          }
          return poll;
        });

        return updatedPolls;
      });

      if (!alreadyVoted) {
        setVotedPolls((prev) => [...prev, pollId]);
      }
    } else {
      // Handle server poll voting via WebSocket using mapping
      const optionMapping = pollOptionMapping[pollId];

      console.log("🗳️ Debug vote attempt:", {
        pollId,
        optionIndex,
        hasMapping: !!optionMapping,
        mapping: optionMapping,
        allMappings: pollOptionMapping,
      });

      if (optionMapping && optionMapping[optionIndex]) {
        const optionId = optionMapping[optionIndex];
        console.log("🗳️ Voting on server poll:", {
          pollId,
          optionIndex,
          optionId,
        });

        // Add this poll to voted polls optimistically to provide feedback
        setVotedPolls((prev) => {
          if (!prev.includes(pollId)) {
            return [...prev, pollId];
          }
          return prev;
        });

        // For both local and server polls, track the user's choice optimistically
        setUserVoteChoices((prev) => ({
          ...prev,
          [pollId]: optionIndex,
        }));

        // Send the vote to the server
        voteOnPollViaSocket(pollId, optionId);
      } else {
        console.warn("⚠️ No option mapping found for poll:", {
          pollId,
          optionIndex,
          availableMappings: Object.keys(pollOptionMapping),
          requestedMapping: optionMapping,
        });

        // Create a fallback option ID
        const fallbackOptionId = `${pollId}-option-${optionIndex}`;
        console.log("⚠️ Using fallback option ID:", fallbackOptionId);

        // Update mappings for future use
        setPollOptionMapping((prev) => ({
          ...prev,
          [pollId]: {
            ...(prev[pollId] || {}),
            [optionIndex]: fallbackOptionId,
          },
        }));

        // Try to vote with the fallback ID
        voteOnPollViaSocket(pollId, fallbackOptionId);

        // Also request polls again to rebuild mappings
        setTimeout(() => {
          console.log("🔄 Requesting fresh polls to rebuild mappings...");
          requestActivePolls();
        }, 800);
      }

      // Also call the original onVote handler if provided
      onVote(pollId, optionIndex);
    }
  };

  // Combine server polls with local polls for display
  const allPolls = React.useMemo(() => {
    // Filter out local polls that might have already been added from the server
    // based on question text matching
    const filteredLocalPolls = localPolls.filter(
      (localPoll) =>
        !serverPolls.some(
          (serverPoll) => serverPoll.question === localPoll.question
        ) && !polls.some((poll) => poll.question === localPoll.question)
    );

    // For parent props polls that might be server polls without mappings, try to create mappings
    polls.forEach((poll) => {
      if (!pollOptionMapping[poll.id]) {
        console.log("📊 Creating fallback mapping for parent poll:", poll.id);
        // This is a fallback - we'll generate option IDs based on text hash or index
        const optionMapping: { [optionIndex: number]: string } = {};
        poll.options.forEach((opt, index) => {
          // Use a simple hash of the option text as ID (fallback)
          optionMapping[index] = `option-${poll.id}-${index}`;
        });
        setPollOptionMapping((prev) => ({
          ...prev,
          [poll.id]: optionMapping,
        }));
      }
    });

    // Combine all polls: server polls first, then local polls, then parent polls
    return [...serverPolls, ...filteredLocalPolls, ...polls];
  }, [serverPolls, localPolls, polls]);

  // For debugging
  React.useEffect(() => {
    console.log(`Total polls: ${allPolls.length}`);
  }, [allPolls]);

  return (
    <div className="space-y-4 sm:space-y-6 pb-4 sm:pb-0">
      {/* Connection status indicator */}
      {socket && (
        <div
          className={`text-xs px-2 py-1 rounded ${
            isConnected
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {isConnected ? "🟢 Connected" : "🔴 Disconnected"}
        </div>
      )}

      {showModal && (
        <div
          className="fixed inset-0 bg-white bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={handleClickOutside}
        >
          <div
            ref={modalRef}
            className="bg-white rounded-lg w-full max-w-md p-5 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Create Live Poll {socket && !isConnected && "(Offline Mode)"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            {/* Poll Title */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Poll Title
              </label>
              <input
                type="text"
                value={pollTitle}
                onChange={(e) => setPollTitle(e.target.value)}
                placeholder="Enter your question here"
                className={`w-full px-3 text-black py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${errors.title ? "border-red-500" : "border-gray-300"}`}
              />
              {errors.title && (
                <p className="mt-1 text-xs text-red-600 flex items-center">
                  <AlertCircle size={12} className="mr-1" />
                  {errors.title}
                </p>
              )}
            </div>

            {/* Poll Options */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Poll Options
              </label>
              {errors.options && (
                <p className="mb-2 text-xs text-red-600 flex items-center">
                  <AlertCircle size={12} className="mr-1" />
                  {errors.options}
                </p>
              )}

              <div className="space-y-2">
                {pollOptions.map((option, index) => (
                  <div key={index} className="flex items-center">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) =>
                        handleOptionChange(index, e.target.value)
                      }
                      placeholder={`Option ${index + 1}`}
                      className="flex-grow px-3 py-2 border text-black border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <button
                      onClick={() => handleRemoveOption(index)}
                      disabled={pollOptions.length <= 2}
                      className="ml-2 text-gray-500 hover:text-red-600 disabled:text-gray-300 disabled:cursor-not-allowed"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={handleAddOption}
                className="mt-2 text-sm text-purple-600 hover:text-purple-800 flex items-center"
              >
                <Plus size={16} className="mr-1" />
                Add Option
              </button>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={socket && !isConnected}
                className={`px-4 py-2 rounded-md text-white ${
                  socket && !isConnected
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-purple-600 hover:bg-purple-700"
                }`}
              >
                Create Poll
              </button>
            </div>
          </div>
        </div>
      )}

      {allPolls.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-center px-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
            <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
          </div>
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
            No polls available
          </h3>
          <button
            onClick={() => HandleCreateLivePoll()}
            className="px-4 py-2 cursor-pointer bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Create Live Poll
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-semibold text-gray-800">Live Polls</h2>
            <button
              onClick={() => HandleCreateLivePoll()}
              className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center"
            >
              <Plus size={16} className="mr-1" />
              New Poll
            </button>
          </div>

          {/* Info message about changing votes */}
          {(localPolls.length > 0 || serverPolls.length > 0) && (
            <div className="mb-3 text-sm text-purple-700 bg-purple-50 p-2 rounded">
              <span>
                {localPolls.length > 0 &&
                  `You have ${localPolls.length} new poll(s) waiting to be synchronized`}
                {localPolls.length > 0 && serverPolls.length > 0 && " • "}
                {serverPolls.length > 0 &&
                  `${serverPolls.length} active server poll(s)`}
                {votedPolls.length > 0 &&
                  ` • You can change your vote by selecting a different option`}
              </span>
            </div>
          )}
          {allPolls.map((poll) => (
            <div
              key={poll.id}
              className="bg-gray-50 border p-4 sm:p-6 rounded-lg"
            >
              <div className="flex flex-col sm:flex-row sm:justify-between mb-3 sm:mb-4">
                <h3 className="text-black text-base sm:text-lg font-semibold mb-2 sm:mb-0 pr-0 sm:pr-4">
                  {poll.question}
                </h3>
                <div className="text-xs sm:text-sm text-left sm:text-right flex-shrink-0">
                  <div className="text-gray-600">{poll.totalVotes} votes</div>
                  {poll.timeLeft && (
                    <div className="text-purple-600 font-medium">
                      {poll.timeLeft}
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2 sm:space-y-3">
                {poll.options.map((opt, index) => {
                  const hasVoted = votedPolls.includes(poll.id);
                  const isUserChoice = userVoteChoices[poll.id] === index; // This user's specific choice
                  const hasAnyVotes = opt.votes > 0; // Whether this option has any votes

                  return (
                    <div key={index}>
                      <button
                        onClick={() => handleLocalVote(poll.id, index)}
                        disabled={
                          votesInProgress[
                            `${poll.id}-${pollOptionMapping?.[poll.id]?.[index] || `${poll.id}-option-${index}`}`
                          ]
                        }
                        className={`w-full text-left border p-2 sm:p-3 rounded transition-colors ${
                          isUserChoice
                            ? "bg-purple-50 border-purple-300" // Only highlight user's choice
                            : hasVoted
                              ? "bg-gray-50 hover:bg-gray-100"
                              : "hover:bg-gray-100"
                        } ${votesInProgress[`${poll.id}-${pollOptionMapping?.[poll.id]?.[index] || `${poll.id}-option-${index}`}`] ? "opacity-70 cursor-not-allowed" : ""}`}
                      >
                        <div className="flex justify-between text-xs sm:text-sm mb-1">
                          <span
                            className={`font-medium break-words pr-2 ${
                              isUserChoice ? "text-purple-800" : "text-gray-800"
                            }`}
                          >
                            {opt.text}
                            {isUserChoice && (
                              <span className="ml-2 text-purple-600 text-xs">
                                (Your Choice)
                              </span>
                            )}
                            {votesInProgress[
                              `${poll.id}-${pollOptionMapping?.[poll.id]?.[index] || `${poll.id}-option-${index}`}`
                            ] && (
                              <span className="ml-2 text-gray-500 text-xs">
                                (Voting...)
                              </span>
                            )}
                          </span>
                          <span className="text-purple-600 font-medium flex-shrink-0">
                            {opt.percentage}%
                          </span>
                        </div>
                        <div className="bg-gray-200 h-1.5 sm:h-2 rounded-full">
                          <div
                            className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
                              isUserChoice ? "bg-purple-600" : "bg-gray-400"
                            }`}
                            style={{ width: `${opt.percentage}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {opt.votes} votes
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PollsList;
