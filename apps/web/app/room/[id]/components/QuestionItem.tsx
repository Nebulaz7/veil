import React from "react";
import { ThumbsUp, Clock, Reply, ChevronDown, ChevronUp } from "lucide-react";
import { Question } from "../types";
import ReplySection from "./ReplySection";

interface QuestionItemProps {
  question: Question;
  userId: string;
  expandedQuestions: Set<string>;
  replyInputs: Record<string, string>;
  isSubmittingReply: Record<string, boolean>;
  rateLimitRemaining: number;
  onToggleQuestionExpanded: (questionId: string) => void;
  onReplyInputChange: (questionId: string, value: string) => void;
  onSubmitReply: (questionId: string) => void;
  onLike: (questionId: string) => void;
}

const QuestionItem: React.FC<QuestionItemProps> = ({
  question,
  userId,
  expandedQuestions,
  replyInputs,
  isSubmittingReply,
  rateLimitRemaining,
  onToggleQuestionExpanded,
  onReplyInputChange,
  onSubmitReply,
  onLike,
}) => {
  return (
    <div className="bg-gray-50 border p-3 sm:p-4 rounded-lg">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          <span className="font-medium text-sm sm:text-base truncate">
            {question.user}
          </span>
          <div className="text-xs sm:text-sm text-gray-500 flex items-center space-x-1">
            <Clock className="w-2 h-2 sm:w-3 sm:h-3 flex-shrink-0" />
            <span className="truncate">{question.timestamp}</span>
          </div>
        </div>
        {question.answered && (
          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex-shrink-0 ml-2">
            Answered
          </span>
        )}
      </div>
      <p className="text-gray-800 mb-3 text-sm sm:text-base break-words">
        {question.question}
      </p>
      {question.answer && (
        <div className="bg-white border-l-4 border-purple-500 p-2 sm:p-3 rounded mb-2">
          <p className="text-xs sm:text-sm text-gray-700 font-medium">
            Answer:
          </p>
          <p className="text-sm sm:text-base text-black break-words">
            {question.answer}
          </p>
        </div>
      )}

      {/* Action buttons row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => onLike(question.id)}
            className={`text-xs sm:text-sm flex items-center space-x-2 transition-colors ${
              question.upvotedBy?.includes(userId)
                ? "text-purple-600"
                : "text-gray-600 hover:text-purple-600"
            }`}
            disabled={question.upvotedBy?.includes(userId)}
          >
            <ThumbsUp
              className={`w-3 h-3 sm:w-4 sm:h-4 ${
                question.upvotedBy?.includes(userId) ? "fill-current" : ""
              }`}
            />
            <span>{question.upvotes || 0}</span>
          </button>

          <button
            onClick={() => onToggleQuestionExpanded(question.id)}
            className="text-xs sm:text-sm flex items-center space-x-1 text-gray-600 hover:text-purple-600 transition-colors"
          >
            <Reply className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>Reply</span>
            {expandedQuestions.has(question.id) ? (
              <ChevronUp className="w-3 h-3 sm:w-4 sm:h-4" />
            ) : (
              <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
            )}
          </button>
        </div>

        {question.replies && question.replies.length > 0 && (
          <span className="text-xs text-gray-500">
            {question.replies.length}{" "}
            {question.replies.length === 1 ? "reply" : "replies"}
          </span>
        )}
      </div>

      {/* Expanded replies section */}
      {expandedQuestions.has(question.id) && (
        <ReplySection
          questionId={question.id}
          replies={question.replies || []}
          replyInput={replyInputs[question.id] || ""}
          onReplyInputChange={onReplyInputChange}
          onSubmitReply={onSubmitReply}
          isSubmitting={isSubmittingReply[question.id] || false}
          rateLimitRemaining={rateLimitRemaining}
        />
      )}
    </div>
  );
};

export default QuestionItem;
