import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { BarChart3, Plus, X, AlertCircle } from "lucide-react";
import { Poll } from "../types";

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

interface FormErrors {
  title?: string;
  options?: string;
}

interface UserVotes {
  [pollId: string]: string;
}

interface PollOptionMapping {
  [pollId: string]: { [optionIndex: number]: string };
}

const PollsList: React.FC<PollsListProps> = ({
  polls,
  onVote,
  onCreatePoll,
  socket,
  roomId,
  userId,
}) => {
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Form state
  const [pollTitle, setPollTitle] = useState("");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [errors, setErrors] = useState<FormErrors>({});

  // Poll state - simplified to only handle what parent doesn't
  const [userVotes, setUserVotes] = useState<UserVotes>({});
  const [pollOptionMapping, setPollOptionMapping] = useState<PollOptionMapping>({});

  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [isCreatingPoll, setIsCreatingPoll] = useState(false);

  // Helper function to calculate time left
  const calculateTimeLeft = useCallback((expiresAt: string): string => {
    const now = Date.now();
    const expiry = new Date(expiresAt).getTime();
    const difference = expiry - now;

    if (difference <= 0) return "Expired";

    const minutes = Math.floor(difference / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  // WebSocket functions
  const createPollViaSocket = useCallback((pollData: { question: string; options: string[] }) => {
    if (!socket?.connected || isCreatingPoll) {
      console.error('❌ Socket not connected or poll creation in progress');
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

    // Fallback timeout to reset creating state
    setTimeout(() => setIsCreatingPoll(false), 5000);
  }, [socket, isCreatingPoll, roomId, userId]);

  const voteOnPollViaSocket = useCallback((pollId: string, optionId: string) => {
    if (!socket?.connected) {
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
  }, [socket, roomId, userId]);

  // Process poll data from parent
  const processPollData = useCallback((pollData: Poll[]): {
    newMappings: PollOptionMapping;
    newUserVotes: UserVotes;
  } => {
    const newMappings: PollOptionMapping = {};
    const newUserVotes: UserVotes = {};
    
    // Since we're getting simplified Poll[] from parent, we need to reconstruct mappings
    pollData.forEach((poll) => {
      const optionMapping: { [optionIndex: number]: string } = {};
      
      poll.options.forEach((opt, index) => {
        // Generate consistent option IDs since parent doesn't provide them
        const optionId = `${poll.id}-option-${index}`;
        optionMapping[index] = optionId;
      });
      
      newMappings[poll.id] = optionMapping;
    });

    return { newMappings, newUserVotes };
  }, []);

  // Update mappings when polls change
  useEffect(() => {
    if (polls.length > 0) {
      const { newMappings } = processPollData(polls);
      setPollOptionMapping(newMappings);
    }
  }, [polls, processPollData]);

  // Simplified WebSocket event handlers - only handle events parent doesn't
  const handleVoteConfirmed = useCallback((data: any) => {
    console.log('✅ Vote confirmed:', data);
    setUserVotes(prev => ({ ...prev, [data.pollId]: data.optionId }));
  }, []);

  const handleNewPoll = useCallback(() => {
    console.log('📊 New poll received - resetting creation state');
    setIsCreatingPoll(false);
  }, []);

  const handleConnect = useCallback(() => {
    console.log('🟢 Socket connected');
    setIsConnected(true);
  }, []);

  const handleDisconnect = useCallback(() => {
    console.log('🔴 Socket disconnected');
    setIsConnected(false);
  }, []);

  // Simplified WebSocket setup - only handle events not handled by parent
  useEffect(() => {
    if (!socket) return;

    let isMounted = true;
    
    // Set initial connection status
    if (isMounted) {
      setIsConnected(socket.connected);
    }

    // Only handle events that parent doesn't handle or that are specific to this component
    const handleVoteConfirmedWrapper = (data: any) => isMounted && handleVoteConfirmed(data);
    const handleNewPollWrapper = () => isMounted && handleNewPoll();
    const handleConnectWrapper = () => isMounted && handleConnect();
    const handleDisconnectWrapper = () => isMounted && handleDisconnect();

    socket.on('voteConfirmed', handleVoteConfirmedWrapper);
    socket.on('newPoll', handleNewPollWrapper);
    socket.on('connect', handleConnectWrapper);
    socket.on('disconnect', handleDisconnectWrapper);

    return () => {
      isMounted = false;
      socket.off('voteConfirmed', handleVoteConfirmedWrapper);
      socket.off('newPoll', handleNewPollWrapper);
      socket.off('connect', handleConnectWrapper);
      socket.off('disconnect', handleDisconnectWrapper);
    };
  }, [socket, handleVoteConfirmed, handleNewPoll, handleConnect, handleDisconnect]);

  // Form handlers
  const handleClickOutside = useCallback((e: React.PointerEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      setShowModal(false);
    }
  }, []);

  const handleAddOption = useCallback(() => {
    setPollOptions(prev => [...prev, ""]);
  }, []);

  const handleRemoveOption = useCallback((index: number) => {
    if (pollOptions.length <= 2) return;
    
    setPollOptions(prev => {
      const newOptions = [...prev];
      newOptions.splice(index, 1);
      return newOptions;
    });
  }, [pollOptions.length]);

  const handleOptionChange = useCallback((index: number, value: string) => {
    setPollOptions(prev => {
      const newOptions = [...prev];
      newOptions[index] = value;
      return newOptions;
    });
  }, []);

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!pollTitle.trim()) {
      newErrors.title = "Poll title is required";
    }

    const validOptions = pollOptions.filter(opt => opt.trim() !== "");
    if (validOptions.length < 2) {
      newErrors.options = "At least 2 valid options are required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [pollTitle, pollOptions]);

  const resetForm = useCallback(() => {
    setPollTitle("");
    setPollOptions(["", ""]);
    setErrors({});
  }, []);

  const handleSubmit = useCallback(() => {
    if (!validateForm() || isCreatingPoll) return;

    const filteredOptions = pollOptions
      .filter(opt => opt.trim() !== "")
      .map(text => text.trim());

    if (socket && isConnected) {
      createPollViaSocket({
        question: pollTitle.trim(),
        options: filteredOptions
      });
    } else if (onCreatePoll) {
      onCreatePoll({
        question: pollTitle,
        options: filteredOptions.map(text => ({ text })),
      });
    }

    setShowModal(false);
    resetForm();
  }, [validateForm, isCreatingPoll, pollOptions, socket, isConnected, 
      pollTitle, createPollViaSocket, onCreatePoll, resetForm]);

  const handleCreateLivePoll = useCallback(() => {
    resetForm();
    setShowModal(true);
  }, [resetForm]);

  // Optimized vote handler
  const handleLocalVote = useCallback((pollId: string, optionIndex: number) => {
    const optionMapping = pollOptionMapping[pollId];
    
    if (!optionMapping?.[optionIndex]) {
      console.error('❌ No option mapping found for poll:', pollId);
      return;
    }

    const optionId = optionMapping[optionIndex];
    console.log('🗳️ Voting on poll:', { pollId, optionIndex, optionId });
    
    // Optimistic update
    setUserVotes(prev => ({ ...prev, [pollId]: optionId }));
    
    voteOnPollViaSocket(pollId, optionId);
    onVote(pollId, optionIndex);
  }, [pollOptionMapping, voteOnPollViaSocket, onVote]);

  // Memoized computed values
  const connectionStatus = useMemo(() => (
    socket && (
      <div className={`text-xs px-2 py-1 rounded ${
        isConnected 
          ? 'bg-green-100 text-green-800' 
          : 'bg-red-100 text-red-800'
      }`}>
        {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
      </div>
    )
  ), [socket, isConnected]);

  const modalTitle = useMemo(() => 
    `Create Live Poll ${!isConnected ? '(Offline Mode)' : ''}`,
    [isConnected]
  );

  // Render methods
  const renderPollOption = useCallback((poll: Poll, opt: any, index: number) => {
    const optionMapping = pollOptionMapping[poll.id];
    const optionId = optionMapping?.[index] ?? `option-${index}`;
    const userVotedOptionId = userVotes[poll.id];
    const isSelected = userVotedOptionId === optionId;
    const hasUserVoted = !!userVotedOptionId;

    return (
      <div key={`${poll.id}-${index}`}>
        <button
          onClick={() => handleLocalVote(poll.id, index)}
          className={`w-full text-left border p-2 sm:p-3 rounded transition-colors ${
            isSelected
              ? "bg-purple-50 border-purple-300"
              : hasUserVoted
                ? "bg-gray-50 hover:bg-gray-100"
                : "hover:bg-gray-100"
          }`}
          aria-label={`Vote for ${opt.text}`}
        >
          <div className="flex justify-between text-xs sm:text-sm mb-1">
            <span className={`font-medium break-words pr-2 ${
              isSelected ? "text-purple-800" : "text-gray-800"
            }`}>
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
  }, [pollOptionMapping, userVotes, handleLocalVote]);

  if (polls.length === 0) {
    return (
      <div className="space-y-4 sm:space-y-6 pb-4 sm:pb-0">
        {connectionStatus}
        <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-center px-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
            <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
          </div>
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
            No polls available
          </h3>
          <button
            onClick={handleCreateLivePoll}
            className="px-4 py-2 cursor-pointer bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Create Live Poll
          </button>
        </div>

        {/* Create Poll Modal */}
        {showModal && (
          <div
            className="fixed inset-0 bg-white bg-opacity-50 z-50 flex items-center justify-center p-4"
            onPointerDown={handleClickOutside}
          >
            <div
              ref={modalRef}
              className="bg-white rounded-lg w-full max-w-md p-5 max-h-[90vh] overflow-y-auto"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {modalTitle}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                  aria-label="Close modal"
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
                  className={`w-full px-3 text-black py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    errors.title ? "border-red-500" : "border-gray-300"
                  }`}
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
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        placeholder={`Option ${index + 1}`}
                        className="flex-grow px-3 py-2 border text-black border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <button
                        onClick={() => handleRemoveOption(index)}
                        disabled={pollOptions.length <= 2}
                        className="ml-2 text-gray-500 hover:text-red-600 disabled:text-gray-300 disabled:cursor-not-allowed"
                        aria-label={`Remove option ${index + 1}`}
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
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 pb-4 sm:pb-0">
      {connectionStatus}

      {/* Create Poll Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-white bg-opacity-50 z-50 flex items-center justify-center p-4"
          onPointerDown={handleClickOutside}
        >
          <div
            ref={modalRef}
            className="bg-white rounded-lg w-full max-w-md p-5 max-h-[90vh] overflow-y-auto"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {modalTitle}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close modal"
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
                className={`w-full px-3 text-black py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.title ? "border-red-500" : "border-gray-300"
                }`}
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
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      className="flex-grow px-3 py-2 border text-black border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <button
                      onClick={() => handleRemoveOption(index)}
                      disabled={pollOptions.length <= 2}
                      className="ml-2 text-gray-500 hover:text-red-600 disabled:text-gray-300 disabled:cursor-not-allowed"
                      aria-label={`Remove option ${index + 1}`}
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

      <div className="space-y-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-semibold text-gray-800">Live Polls</h2>
          <button
            onClick={handleCreateLivePoll}
            className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center"
          >
            <Plus size={16} className="mr-1" />
            New Poll
          </button>
        </div>

        {/* Info message about voting */}
        <div className="mb-3 text-sm text-purple-700 bg-purple-50 p-2 rounded">
          <span>
            {polls.length} active poll(s) • You can change your vote by selecting a different option
          </span>
        </div>
        
        {polls.map((poll) => (
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
              {poll.options.map((opt, index) => 
                renderPollOption(poll, opt, index)
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PollsList;
