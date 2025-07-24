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
