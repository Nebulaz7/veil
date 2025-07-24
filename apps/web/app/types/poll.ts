export interface Poll {
  id: string;
  name: string;
  slug: string;
  status: "active" | "upcoming" | "past";
  responses: number;
  createdAt: string | Date;
  description?: string;
}

export type QuestionType =
  | "multiple-choice"
  | "single-choice"
  | "text"
  | "rating"
  | "audience-qa";

export interface Question {
  id: string;
  pollId: string;
  text: string;
  type: QuestionType;
  options?: string[];
  required: boolean;
  order: number;
  maxLength?: number;
  maxRating?: number;
  isHidden?: boolean;
}

export interface AudienceQuestion {
  id: string;
  questionId: string;
  text: string;
  authorName: string;
  authorId?: string;
  timestamp: Date;
  upvotes: number;
  isAnswered: boolean;
  isHidden?: boolean;
  replies: AudienceReply[];
}

export interface AudienceReply {
  id: string;
  audienceQuestionId: string;
  text: string;
  authorName: string; 
  authorId: string;
  timestamp: Date;
  isOfficial: boolean;
}
export interface Response {
  id: string;
  questionId: string;
  pollId: string;
  userId?: string;
  answerText?: string;
  answerOptions?: string[];
  answerRating?: number;
  timestamp: Date;
  sessionId: string;
}

export interface LivePollSession {
  id: string;
  pollId: string;
  startedAt: Date;
  endedAt?: Date;
  activeParticipants: number;
  totalResponses: number;
}

export interface PollParticipant {
  id: string;
  sessionId: string;
  pollId: string;
  joinedAt: Date;
  leftAt?: Date;
  device: string;
  ipAddress?: string;
  userId?: string; // If authenticated
}
