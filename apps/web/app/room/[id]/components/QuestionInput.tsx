import React from "react";
import { SendHorizonal, AlertCircle, Clock } from "lucide-react";

interface QuestionInputProps {
  newQuestion: string;
  onQuestionChange: (question: string) => void;
  onSubmitQuestion: () => void;
  onImproveAi: () => void;
  isRoomLoading: boolean;
  isLoading: boolean; // For AI improvement
  rateLimitRemaining: number;
  rateLimitMessage: string;
}

const QuestionInput: React.FC<QuestionInputProps> = ({
  newQuestion,
  onQuestionChange,
  onSubmitQuestion,
  onImproveAi,
  isRoomLoading,
  isLoading,
  rateLimitRemaining,
  rateLimitMessage,
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2 sm:p-4 shadow-lg z-50">
      <div className="max-w-4xl mx-auto">
        {/* Rate limit notification */}
        {rateLimitRemaining > 0 && (
          <div className="mb-3 p-2 sm:p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-amber-800">{rateLimitMessage}</p>
            </div>
            <div className="flex items-center space-x-2 text-amber-700">
              <Clock className="w-3 h-3" />
              <span className="text-sm font-medium tabular-nums">
                {rateLimitRemaining}s
              </span>
            </div>
          </div>
        )}

        <div className="relative">
          {/* Main input container */}
          <div
            className={`flex items-center bg-gray-50 border rounded-xl sm:rounded-2xl focus-within:bg-white transition-all duration-200 ${
              rateLimitRemaining > 0
                ? "border-amber-300 focus-within:border-amber-400"
                : "border-gray-300 focus-within:border-purple-500"
            }`}
          >
            <textarea
              value={newQuestion}
              onChange={(e) => onQuestionChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSubmitQuestion();
                }
              }}
              placeholder={
                rateLimitRemaining > 0
                  ? `Please wait ${rateLimitRemaining}s before sending another question...`
                  : "Ask your question..."
              }
              disabled={isRoomLoading || rateLimitRemaining > 0}
              rows={1}
              className="flex-1 p-2 sm:p-4 pr-16 sm:pr-24 bg-transparent border-none rounded-xl sm:rounded-2xl focus:outline-none placeholder-gray-500 text-gray-900 resize-none overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              style={{
                minHeight: "44px",
                maxHeight: "120px",
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = target.scrollHeight + "px";
              }}
            />

            {/* Button container inside input */}
            <div className="flex items-center space-x-1 sm:space-x-2 pr-2 sm:pr-3">
              {/* Enhance with AI button */}
              <button
                onClick={onImproveAi}
                disabled={
                  isRoomLoading ||
                  isLoading ||
                  !newQuestion.trim() ||
                  rateLimitRemaining > 0
                }
                className="flex cursor-pointer items-center space-x-1 px-2 py-1 sm:px-3 sm:py-1.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-medium rounded-full hover:from-blue-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
              >
                {isLoading ? (
                  <>
                    <svg
                      className="w-2 h-2 sm:w-3 sm:h-3 animate-spin"
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
                    <span className="hidden sm:inline">Improving...</span>
                  </>
                ) : (
                  <>
                    <svg
                      className="w-2 h-2 sm:w-3 sm:h-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                    </svg>
                    <span className="hidden sm:inline">Improve</span>
                  </>
                )}
              </button>

              {/* Send button */}
              <button
                onClick={onSubmitQuestion}
                disabled={
                  isRoomLoading || !newQuestion.trim() || rateLimitRemaining > 0
                }
                className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 text-white rounded-full transition-all duration-200 shadow-sm ${
                  rateLimitRemaining > 0
                    ? "bg-amber-400 cursor-not-allowed"
                    : "bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 disabled:cursor-not-allowed"
                }`}
              >
                {rateLimitRemaining > 0 ? (
                  <span className="text-xs font-medium tabular-nums">
                    {rateLimitRemaining}
                  </span>
                ) : (
                  <SendHorizonal className="w-3 h-3 sm:w-4 sm:h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionInput;
