import React from "react";
import { MessageSquare } from "lucide-react";
import { Question } from "../types";
import QuestionItem from "./QuestionItem";

interface QuestionsListProps {
  questions: Question[];
  userId: string;
  expandedQuestions: Set<string>;
  replyInputs: Record<string, string>;
  isSubmittingReply: Record<string, boolean>;
  rateLimitRemaining: number;
  onToggleQuestionExpanded: (questionId: string) => void;
  onReplyInputChange: (questionId: string, value: string) => void;
  onSubmitReply: (questionId: string) => void;
  onLike: (questionId: string) => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

const QuestionsList: React.FC<QuestionsListProps> = ({
  questions,
  userId,
  expandedQuestions,
  replyInputs,
  isSubmittingReply,
  rateLimitRemaining,
  onToggleQuestionExpanded,
  onReplyInputChange,
  onSubmitReply,
  onLike,
  messagesEndRef,
}) => {
  return (
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
            Be the first to ask a question! Your question will appear here once
            submitted.
          </p>
        </div>
      ) : (
        questions.map((question) => (
          <QuestionItem
            key={question.id}
            question={question}
            userId={userId}
            expandedQuestions={expandedQuestions}
            replyInputs={replyInputs}
            isSubmittingReply={isSubmittingReply}
            rateLimitRemaining={rateLimitRemaining}
            onToggleQuestionExpanded={onToggleQuestionExpanded}
            onReplyInputChange={onReplyInputChange}
            onSubmitReply={onSubmitReply}
            onLike={onLike}
          />
        ))
      )}
    </div>
  );
};

export default QuestionsList;
