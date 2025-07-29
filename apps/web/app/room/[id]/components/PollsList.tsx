import React, { useState, useRef, useEffect } from "react";
import { BarChart3, Plus, X, AlertCircle } from "lucide-react";
import { Poll } from "../types";

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
  // State to hold locally created polls before server sync
  const [localPolls, setLocalPolls] = useState<Poll[]>([]);
  // State to track which polls the user has already voted on
  const [votedPolls, setVotedPolls] = useState<string[]>([]);
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
      console.log('📊 New poll received:', poll);
      // Convert server poll format to component format if needed
      const formattedPoll: Poll = {
        id: poll.id,
        question: poll.question,
        options: poll.options.map((opt: any) => ({
          text: opt.text,
          votes: 0,
          percentage: 0
        })),
        totalVotes: 0,
        timeLeft: poll.expiresAt ? calculateTimeLeft(poll.expiresAt) : "2:00"
      };
      
      // Remove from local polls if it exists and add to server polls
      setLocalPolls(prev => prev.filter(p => p.question !== poll.question));
    };

    // Listen for poll votes
    const handlePollVoteAdded = (voteData: any) => {
      console.log('🗳️ Vote added:', voteData);
      // Update poll vote counts - this would typically update the polls prop
      // You might want to call a parent function to update the polls state
    };

    // Listen for vote confirmation
    const handleVoteConfirmed = (data: any) => {
      console.log('✅ Vote confirmed:', data);
      // Add poll to voted polls if not already there
      setVotedPolls(prev => {
        if (!prev.includes(data.pollId)) {
          return [...prev, data.pollId];
        }
        return prev;
      });
    };

    // Listen for poll closure
    const handlePollClosed = (data: any) => {
      console.log('📊 Poll closed:', data);
      // Handle poll closure - maybe show a notification or update UI
    };

    // Listen for rate limit errors
    const handleRateLimitError = (data: any) => {
      console.warn('⏰ Rate limit error:', data.message);
      alert(data.message); // You might want to use a proper notification system
    };

    // Listen for poll errors
    const handlePollError = (data: any) => {
      console.error('❌ Poll error:', data.message);
      alert(data.message); // You might want to use a proper notification system
    };

    // Listen for connection status changes
    const handleConnect = () => {
      console.log('🟢 Socket connected');
      setIsConnected(true);
      // Request active polls when connected
      requestActivePolls();
    };

    const handleDisconnect = () => {
      console.log('🔴 Socket disconnected');
      setIsConnected(false);
    };

    // Add event listeners
    socket.on('newPoll', handleNewPoll);
    socket.on('pollVoteAdded', handlePollVoteAdded);
    socket.on('voteConfirmed', handleVoteConfirmed);
    socket.on('pollClosed', handlePollClosed);
    socket.on('rateLimitError', handleRateLimitError);
    socket.on('pollError', handlePollError);
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    // Request active polls on mount
    requestActivePolls();

    // Cleanup listeners on unmount
    return () => {
      socket.off('newPoll', handleNewPoll);
      socket.off('pollVoteAdded', handlePollVoteAdded);
      socket.off('voteConfirmed', handleVoteConfirmed);
      socket.off('pollClosed', handlePollClosed);
      socket.off('rateLimitError', handleRateLimitError);
      socket.off('pollError', handlePollError);
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
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
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // WebSocket function to request active polls
  const requestActivePolls = () => {
    if (socket && isConnected) {
      console.log('📊 Requesting active polls for room:', roomId);
      socket.emit('getActivePolls', { roomId });
    }
  };

  // WebSocket function to create a poll
  const createPollViaSocket = (pollData: { question: string; options: string[] }) => {
    if (!socket || !isConnected) {
      console.error('❌ Socket not connected');
      alert('Not connected to server. Please try again.');
      return;
    }

    console.log('📊 Creating poll via socket:', pollData);
    socket.emit('createPoll', {
      roomId,
      userId,
      name: pollData.question, // Using question as name for now
      question: pollData.question,
      options: pollData.options
    });
  };

  // WebSocket function to vote on a poll
  const voteOnPollViaSocket = (pollId: string, optionId: string) => {
    if (!socket || !isConnected) {
      console.error('❌ Socket not connected');
      alert('Not connected to server. Please try again.');
      return;
    }

    console.log('🗳️ Voting via socket:', { pollId, optionId });
    socket.emit('votePoll', {
      roomId,
      pollId,
      optionId,
      userId
    });
  };

  // Close modal when clicking outside
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
        options: filteredOptions
      });
    } else {
      // Fallback to local creation if socket not available
      const tempPoll: Poll = {
        id: `temp-${Date.now()}`,
        question: pollTitle,
        options: filteredOptions.map(text => ({ text, votes: 0, percentage: 0 })),
        totalVotes: 0,
        timeLeft: "2:00",
      };

      setLocalPolls((prev) => [tempPoll, ...prev]);

      if (onCreatePoll) {
        onCreatePoll({
          question: pollTitle,
          options: filteredOptions.map(text => ({ text })),
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

  // Updated vote handler to use WebSocket
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
      // Handle server poll voting via WebSocket
      const poll = polls.find(p => p.id === pollId);
      if (poll && poll.options[optionIndex]) {
        // For server polls, we need to send the actual option ID
        // Assuming the option has an ID field, or we use the index
        const optionId = poll.options[optionIndex].id || `option-${optionIndex}`;
        voteOnPollViaSocket(pollId, optionId);
      }

      // Also call the original onVote handler if provided
      onVote(pollId, optionIndex);
    }
  };

  // Combine server polls with local polls for display
  const allPolls = React.useMemo(() => {
    const filteredLocalPolls = localPolls.filter(
      (localPoll) => !polls.some((poll) => poll.question === localPoll.question)
    );

    return [...filteredLocalPolls, ...polls];
  }, [polls, localPolls]);

  // For debugging
  React.useEffect(() => {
    console.log(`Total polls: ${allPolls.length}`);
  }, [allPolls]);

  return (
    <div className="space-y-4 sm:space-y-6 pb-4 sm:pb-0">
      {/* Connection status indicator */}
      {socket && (
        <div className={`text-xs px-2 py-1 rounded ${
          isConnected 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
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
                Create Live Poll {socket && !isConnected && '(Offline Mode)'}
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
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-700'
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
          {localPolls.length > 0 && (
            <div className="mb-3 text-sm text-purple-700 bg-purple-50 p-2 rounded">
              <span>
                You have {localPolls.length} new poll(s) waiting to be
                synchronized
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
                  const isSelected = opt.votes > 0;

                  return (
                    <div key={index}>
                      <button
                        onClick={() => handleLocalVote(poll.id, index)}
                        className={`w-full text-left border p-2 sm:p-3 rounded transition-colors ${
                          isSelected
                            ? "bg-purple-50 border-purple-300"
                            : hasVoted
                              ? "bg-gray-50 hover:bg-gray-100"
                              : "hover:bg-gray-100"
                        }`}
                      >
                        <div className="flex justify-between text-xs sm:text-sm mb-1">
                          <span
                            className={`font-medium break-words pr-2 ${
                              isSelected ? "text-purple-800" : "text-gray-800"
                            }`}
                          >
                            {opt.text}
                            {isSelected && (
                              <span className="ml-2 text-purple-600 text-xs">
                                (Selected)
                              </span>
                            )}
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
