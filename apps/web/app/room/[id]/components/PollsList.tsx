import React, { useState, useRef } from "react";
import { BarChart3, Plus, X, AlertCircle } from "lucide-react";
import { Poll } from "../types";

interface PollsListProps {
  polls: Poll[];
  onVote: (pollId: string, optionIndex: number) => void;
  onCreatePoll?: (poll: {
    question: string;
    options: { text: string }[];
  }) => void;
}

const PollsList: React.FC<PollsListProps> = ({
  polls,
  onVote,
  onCreatePoll,
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

  const modalRef = useRef<HTMLDivElement>(null);

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
      .map((text) => ({ text, votes: 0, percentage: 0 }));

    // Generate a temporary unique ID for the local poll
    const tempPoll: Poll = {
      id: `temp-${Date.now()}`,
      question: pollTitle,
      options: filteredOptions,
      totalVotes: 0,
      timeLeft: "", // No time limit
    };

    // Add the new poll to local state - use the spread operator with previous polls
    setLocalPolls((prev) => {
      const updatedPolls = [tempPoll, ...prev];
      return updatedPolls;
    });

    if (onCreatePoll) {
      // Still send to parent component for server processing
      onCreatePoll({
        question: pollTitle,
        options: filteredOptions.map(({ text }) => ({ text })),
      });
    }

    // Close the modal
    setShowModal(false);

    // Reset form for next use
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

  // Local handler for voting on polls - only for temporary polls
  const handleLocalVote = (pollId: string, optionIndex: number) => {
    // Check if this is a local poll
    if (pollId.startsWith("temp-")) {
      // Check if user has already voted on this poll
      const alreadyVoted = votedPolls.includes(pollId);

      setLocalPolls((prevPolls) => {
        const updatedPolls = prevPolls.map((poll) => {
          if (poll.id === pollId) {
            // Create a copy of the options
            const newOptions = [...poll.options];

            // If already voted, we need to remove the previous vote
            if (alreadyVoted) {
              // Find the option that was previously voted on and decrement its votes
              for (let i = 0; i < newOptions.length; i++) {
                const option = newOptions[i];
                // Assume a user voted for the option with a non-zero vote count
                if (option && option.votes > 0) {
                  newOptions[i] = {
                    text: option.text, // Preserve the text property
                    votes: option.votes - 1,
                    percentage: option.percentage, // Preserve percentage, will be recalculated later
                  };
                  break; // Only remove one vote
                }
              }
            }

            // Get the selected option
            const selectedOption = newOptions[optionIndex];

            if (selectedOption) {
              // Increment vote count for the selected option
              newOptions[optionIndex] = {
                ...selectedOption,
                votes: selectedOption.votes + 1,
              };

              // Calculate new total votes (stays the same if changing vote)
              const newTotalVotes = alreadyVoted
                ? poll.totalVotes
                : poll.totalVotes + 1;

              // Recalculate percentages for all options
              const updatedOptions = newOptions.map((opt) => ({
                ...opt,
                percentage:
                  newTotalVotes > 0
                    ? Math.round((opt.votes / newTotalVotes) * 100)
                    : 0,
              }));

              // Return updated poll
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

      // If not already voted, add to voted polls
      if (!alreadyVoted) {
        setVotedPolls((prev) => [...prev, pollId]);
      }
      // If already voted, no need to update votedPolls
    } else {
      // If it's a server poll, call the parent handler
      // Check if already voted on this poll
      const alreadyVoted = votedPolls.includes(pollId);

      // Call the parent handler
      onVote(pollId, optionIndex);

      // If not already voted, add to voted polls
      if (!alreadyVoted) {
        setVotedPolls((prev) => [...prev, pollId]);
      }
    }
  }; // Combine server polls with local polls for display
  const allPolls = React.useMemo(() => {
    // Filter out local polls that might have already been added from the server
    // based on question text matching
    const filteredLocalPolls = localPolls.filter(
      (localPoll) => !polls.some((poll) => poll.question === localPoll.question)
    );

    // Add the local polls first, then the server polls
    return [...filteredLocalPolls, ...polls];
  }, [polls, localPolls]);

  // For debugging
  React.useEffect(() => {
    // Log poll updates for development purposes
    console.log(`Total polls: ${allPolls.length}`);
  }, [allPolls]);

  return (
    <div className="space-y-4 sm:space-y-6 pb-4 sm:pb-0">
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
                Create Live Poll
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
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
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
                </div>
              </div>
              <div className="space-y-2 sm:space-y-3">
                {poll.options.map((opt, index) => {
                  const hasVoted = votedPolls.includes(poll.id);
                  const isSelected = opt.votes > 0; // Check if this option has votes

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
