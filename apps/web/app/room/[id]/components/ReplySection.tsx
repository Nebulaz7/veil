import React from "react";
import { SendHorizonal, Clock } from "lucide-react";
import { Reply } from "../types";

interface ReplySectionProps {
  questionId: string;
  replies: Reply[];
  replyInput: string;
  onReplyInputChange: (questionId: string, value: string) => void;
  onSubmitReply: (questionId: string) => void;
  isSubmitting: boolean;
  rateLimitRemaining: number;
}

const ReplySection: React.FC<ReplySectionProps> = ({
  questionId,
  replies,
  replyInput,
  onReplyInputChange,
  onSubmitReply,
  isSubmitting,
  rateLimitRemaining,
}) => {
  return (
    <div className="mt-4 space-y-3">
      {/* Existing replies */}
      {replies && replies.length > 0 && (
        <div className="space-y-2">
          {replies.map((reply) => (
            <div
              key={reply.id}
              className="bg-white border text-black border-gray-200 p-3 rounded-lg ml-4"
            >
              <div className="flex items-center space-x-2 mb-1">
                <span className="font-medium text-xs sm:text-sm text-gray-700">
                  {reply.user}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-black break-words">
                {reply.content}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Reply input */}
      <div className="ml-4">
        <div className="flex items-center space-x-2 bg-white border border-gray-300 rounded-lg focus-within:border-purple-500 transition-colors">
          <input
            type="text"
            value={replyInput || ""}
            onChange={(e) => onReplyInputChange(questionId, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSubmitReply(questionId);
              }
            }}
            placeholder={
              rateLimitRemaining > 0
                ? `Please wait ${rateLimitRemaining}s...`
                : "Write a reply..."
            }
            disabled={isSubmitting || rateLimitRemaining > 0}
            className="flex-1 p-2 sm:p-3 bg-transparent border-none rounded-lg focus:outline-none placeholder-gray-500 text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
          />
          <button
            onClick={() => onSubmitReply(questionId)}
            disabled={
              !replyInput?.trim() || isSubmitting || rateLimitRemaining > 0
            }
            className="flex items-center justify-center w-8 h-8 text-white bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 disabled:cursor-not-allowed rounded-full transition-colors mr-2"
          >
            {isSubmitting ? (
              <svg
                className="w-3 h-3 animate-spin"
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
            ) : (
              <SendHorizonal className="w-3 h-3" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReplySection;
