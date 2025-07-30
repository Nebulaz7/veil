export interface Question {
  id: string;
  question: string;
  timestamp: string;
  upvotes: number;
  answered: boolean;
  answer?: string;
  upvotedBy?: string[];
  replies?: Reply[];
}

export interface Reply {
  id: string;
  user: string;
  content: string;
  timestamp: string;
}

export interface PollOption {
  text: string;
  votes: number;
  percentage: number;
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  totalVotes: number;
  timeLeft: string;
}
