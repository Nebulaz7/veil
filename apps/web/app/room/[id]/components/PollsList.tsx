import React, { useState, useRef, useEffect, useCallback } from "react";
import { BarChart3, Plus, X, AlertCircle } from "lucide-react";
import { Poll } from "../types";
import _ from "lodash";

interface PollsListProps {
  polls: Poll[];
  onVote: (pollId: string, optionIndex: number) => void;
  onCreatePoll?: (poll: {
    question: string;
    options: { text: string }[];
  }) => void;
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
  
  // Single source of truth for polls - only use server polls
  const [serverPolls, setServerPolls] = useState<Poll[]>([]);
  // Track user votes with option IDs
  const [userVotes, setUserVotes] = useState<{[pollId: string]: string}>({});
  // Store mapping of poll options to their server IDs
  const [pollOptionMapping, setPollOptionMapping] = useState<{
    [pollId: string]: { [optionIndex: number]: string }
  }>({});
  // WebSocket connection status
  const [isConnected, setIsConnected] = useState(false);
  // Track if we're creating a poll to prevent duplicates
  const [isCreatingPoll, setIsCreatingPoll] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);

  // Helper function to calculate time left
  const calculateTimeLeft = useCallback((expiresAt: string): string => {
    const now = new Date().getTime();
    const expiry = new Date(expiresAt).getTime();
    const difference = expiry - now;

    if (difference <= 0) return "Expired";

    const minutes = Math.floor(difference / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  // Optimized function to request active polls (no debouncing needed)
  const requestActivePolls = useCallback(() => {
    if (socket && isConnected) {
      console.log('📊 Requesting active polls for room:', roomId);
      socket.emit('getActivePolls', { roomId });
    }
  }, [socket, isConnected, roomId]);

  // WebSocket function to create a poll
  const createPollViaSocket = useCallback((pollData: { question: string; options: string[] }) => {
    if (!socket || !isConnected) {
      console.error('❌ Socket not connected');
      return;
    }

    if (isCreatingPoll) {
      console.log('📊 Already creating a poll, skipping...');
      return;
    }

    setIsCreatingPoll(true);
    console.log('📊 Creating poll via socket:', pollData);
    
    socket.emit('createPoll', {
      roomId,
      userId,
      name: pollData.question,
      question: pollData.question,
      options: pollData.options
    });
  }, [socket, isConnected, roomId, userId, isCreatingPoll]);

  // WebSocket function to vote on a poll
  const voteOnPollViaSocket = useCallback((pollId: string, optionId: string) => {
    if (!socket || !isConnected) {
      console.error('❌ Socket not connected');
      return;
    }

    console.log('🗳️ Voting via socket:', { pollId, optionId });
    socket.emit('votePoll', {
      roomId,
      pollId,
      optionId,
      userId
    });
  }, [socket, isConnected, roomId, userId]);

  // WebSocket event listeners
  useEffect(() => {
    if (!socket) return;

    // Check connection status
    setIsConnected(socket.connected);

    // Listen for new polls from other users
    const handleNewPoll = (poll: any) => {
      console.log('📊 New poll received:', poll);
      setIsCreatingPoll(false); // Reset creating state
      
      // Create mapping for this new poll's options
      const optionMapping: { [optionIndex: number]: string } = {};
      poll.options.forEach((opt: any, index: number) => {
        optionMapping[index] = opt.id;
      });
      
      // Update the mapping state
      setPollOptionMapping(prev => ({
        ...prev,
        [poll.id]: optionMapping
      }));
      
      // Check if current user has voted on any option
      const newUserVotes: { [pollId: string]: string } = {};
      poll.options.forEach((opt: any) => {
        if (opt.votes && opt.votes.includes(userId)) {
          newUserVotes[poll.id] = opt.id;
        }
      });

      const formattedPoll = {
        id: poll.id,
        question: poll.question,
        options: poll.options.map((opt: any) => ({
          text: opt.text,
          votes: opt.votes?.length || 0,
          percentage: 0
        })),
        totalVotes: poll.options.reduce((total: number, opt: any) => total + (opt.votes?.length || 0), 0),
        timeLeft: poll.expiresAt ? calculateTimeLeft(poll.expiresAt) : "Expired"
      };

      // Calculate percentages
      formattedPoll.options.forEach((option: any) => {
        option.percentage = formattedPoll.totalVotes > 0 
          ? Math.round((option.votes / formattedPoll.totalVotes) * 100) 
          : 0;
      });

      // Update states
      setUserVotes(prev => ({ ...prev, ...newUserVotes }));
      setServerPolls(prev => {
        // Remove any existing poll with the same ID to prevent duplicates
        const filtered = prev.filter(p => p.id !== poll.id);
        return [formattedPoll, ...filtered];
      });
    };

    // Listen for active polls list
    const handleActivePollsList = (pollsData: any[]) => {
      console.log('📊 Active polls received:', pollsData.length, 'polls');
      
      // Store option ID mappings for voting
      const newMappings: { [pollId: string]: { [optionIndex: number]: string } } = {};
      const newUserVotes: { [pollId: string]: string } = {};
      
      // Convert server polls format to component format
      const formattedPolls: Poll[] = pollsData.map((poll: any) => {
        // Create mapping for this poll's options
        const optionMapping: { [optionIndex: number]: string } = {};
        poll.options.forEach((opt: any, index: number) => {
          optionMapping[index] = opt.id;
          
          // Check if current user has voted on this option
          if (opt.votes && opt.votes.includes(userId)) {
            newUserVotes[poll.id] = opt.id;
          }
        });
        newMappings[poll.id] = optionMapping;

        const totalVotes = poll.options.reduce((total: number, opt: any) => total + (opt.votes?.length || 0), 0);

        return {
          id: poll.id,
          question: poll.question,
          options: poll.options.map((opt: any) => ({
            text: opt.text,
            votes: opt.votes?.length || 0,
            percentage: totalVotes > 0 ? Math.round(((opt.votes?.length || 0) / totalVotes) * 100) : 0
          })),
          totalVotes,
          timeLeft: poll.expiresAt ? calculateTimeLeft(poll.expiresAt) : "Expired"
        };
      });

      // Update all states at once
      setPollOptionMapping(prev => ({ ...prev, ...newMappings }));
      setUserVotes(prev => ({ ...prev, ...newUserVotes }));
      setServerPolls(formattedPolls);
    };

    // Listen for vote confirmation - only update user vote tracking
    const handleVoteConfirmed = (data: any) => {
      console.log('✅ Vote confirmed:', data);
      setUserVotes(prev => ({
        ...prev,
        [data.pollId]: data.optionId
      }));
      // Request fresh data only once
      setTimeout(() => requestActivePolls(), 500);
    };

    // Listen for poll closure
    const handlePollClosed = (data: any) => {
      console.log('📊 Poll closed:', data);
      setServerPolls(prev => prev.filter(poll => poll.id !== data.pollId));
    };

    // Listen for connection status changes
    const handleConnect = () => {
      console.log('🟢 Socket connected');
      setIsConnected(true);
      requestActivePolls();
    };

    const handleDisconnect = () => {
      console.log('🔴 Socket disconnected');
      setIsConnected(false);
    };

    // Add event listeners
    socket.on('newPoll', handleNewPoll);
    socket.on('activePollsList', handleActivePollsList);
    socket.on('voteConfirmed', handleVoteConfirmed);
    socket.on('pollClosed', handlePollClosed);
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    // Request active polls on mount
    requestActivePolls();

    // Cleanup listeners on unmount
    return () => {
      socket.off('newPoll', handleNewPoll);
      socket.off('activePollsList', handleActivePollsList);
      socket.off('voteConfirmed', handleVoteConfirmed);
      socket.off('pollClosed', handlePollClosed);
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, [socket, roomId, userId, requestActivePolls, calculateTimeLeft]);

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
    if (!validateForm() || isCreatingPoll) return;

    const filteredOptions = pollOptions
      .filter((opt) => opt.trim() !== "")
      .map((text) => text.trim());

    // Create poll via WebSocket
    if (socket && isConnected) {
      createPollViaSocket({
        question: pollTitle.trim(),
        options: filteredOptions
      });
    } else if (onCreatePoll) {
      // Fallback to parent handler
      onCreatePoll({
        question: pollTitle,
        options: filteredOptions.map(text => ({ text })),
      });
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

  // Optimized vote handler
  const handleLocalVote = (pollId: string, optionIndex: number) => {
    const optionMapping = pollOptionMapping[pollId];
    
    if (optionMapping && optionMapping[optionIndex]) {
      const optionId = optionMapping[optionIndex];
      console.log('🗳️ Voting on poll:', { pollId, optionIndex, optionId });
      
      voteOnPollViaSocket(pollId, optionId);
      onVote(pollId, optionIndex);
    } else {
      console.error('❌ No option mapping found for poll:', pollId);
      // Try to refresh polls to get mappings
      requestActivePolls();
    }
  };

  // Use only server polls - ignore parent polls to prevent duplication
  const displayPolls = serverPolls;

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
                Create Live Poll {!isConnected && '(Offline Mode)'}
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
                disabled={isCreatingPoll || (!isConnected && !onCreatePoll)}
                className={`px-4 py-2 rounded-md text-white ${
                  isCreatingPoll || (!isConnected && !onCreatePoll)
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-700'
                }`}
              >
                {isCreatingPoll ? 'Creating...' : 'Create Poll'}
              </button>
            </div>
          </div>
        </div>
      )}

      {displayPolls.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-center px-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
            <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
          </div>
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
            No polls available
          </h3>
          <button
            onClick={HandleCreateLivePoll}
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
              onClick={HandleCreateLivePoll}
              className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center"
            >
              <Plus size={16} className="mr-1" />
              New Poll
            </button>
          </div>

          {/* Info message about voting */}
          {displayPolls.length > 0 && (
            <div className="mb-3 text-sm text-purple-700 bg-purple-50 p-2 rounded">
              <span>
                {displayPolls.length} active poll(s) • You can change your vote by selecting a different option
              </span>
            </div>
          )}
          
          {displayPolls.map((poll) => {
            const userVotedOptionId = userVotes[poll.id];
            const hasUserVoted = !!userVotedOptionId;
            
            return (
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
                    // Check if this option's ID matches user's vote
                    const optionMapping = pollOptionMapping[poll.id];
                    const optionId = optionMapping ? optionMapping[index] : `option-${index}`;
                    const isSelected = userVotedOptionId === optionId;

                    return (
                      <div key={index}>
                        <button
                          onClick={() => handleLocalVote(poll.id, index)}
                          className={`w-full text-left border p-2 sm:p-3 rounded transition-colors ${
                            isSelected
                              ? "bg-purple-50 border-purple-300"
                              : hasUserVoted
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
                                  (Your Vote)
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
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PollsList;