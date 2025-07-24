import { Injectable } from '@nestjs/common';

interface Question {
  id: string;
  userId: string;
  roomId: string;
  question: string;
  answer?: string;
  timestamp: number;
  isAnswered?: boolean;
  isHidden?: boolean;
  upvotes?: number;
}

@Injectable()
export class QuestionStoreService {
  private questions: Record<string, Question[]> = {};

  addQuestion(roomId: string, question: Question) {
    if (!this.questions[roomId]) this.questions[roomId] = [];
    this.questions[roomId].push(question);
  }

  getQuestions(roomId: string): Question[] {
    return this.questions[roomId] || [];
  }

  answerQuestion(roomId: string, questionId: string, answer: string): Question | null {
    const roomQuestions = this.questions[roomId];
    if (!roomQuestions) return null;

    const q = roomQuestions.find(q => q.id === questionId);
    if (!q) return null;

    q.answer = answer;
    return q;
  }

    upvoteQuestion(roomId: string, questionId: string): Question | null {
    const roomQuestions = this.questions[roomId];
    if (!roomQuestions) {
      console.log(`Room ${roomId} not found`);
      return null;
    }

    const q = roomQuestions.find(q => q.id === questionId);
    if (!q) {
      console.log(`Question ${questionId} not found in room ${roomId}`);
      return null;
    }

    q.upvotes = (q.upvotes || 0) + 1;
    console.log(`Upvoted question ${questionId} in room ${roomId}. New count: ${q.upvotes}`);
    return q;
  }

  toggleAnswered(roomId: string, questionId: string): Question | null {
    const roomQuestions = this.questions[roomId];
    if (!roomQuestions) {
      console.log(`Room ${roomId} not found`);
      return null;
    }

    const q = roomQuestions.find(q => q.id === questionId);
    if (!q) {
      console.log(`Question ${questionId} not found in room ${roomId}`);
      return null;
    }

    q.isAnswered = !q.isAnswered;
    console.log(`Toggled answered status for question ${questionId} in room ${roomId}. New status: ${q.isAnswered}`);
    return q;
  }

  toggleHidden(roomId: string, questionId: string): Question | null {
    const roomQuestions = this.questions[roomId];
    if (!roomQuestions) {
      console.log(`Room ${roomId} not found`);
      return null;
    }

    const q = roomQuestions.find(q => q.id === questionId);
    if (!q) {
      console.log(`Question ${questionId} not found in room ${roomId}`);
      return null;
    }

    q.isHidden = !q.isHidden;
    console.log(`Toggled hidden status for question ${questionId} in room ${roomId}. New status: ${q.isHidden}`);
    return q;
  }

  deleteQuestion(roomId: string, questionId: string): boolean {
    const roomQuestions = this.questions[roomId];
    if (!roomQuestions) {
      console.log(`Room ${roomId} not found`);
      return false;
    }

    const initialLength = roomQuestions.length;
    this.questions[roomId] = roomQuestions.filter(q => q.id !== questionId);
    
    const deleted = this.questions[roomId].length < initialLength;
    if (deleted) {
      console.log(`Deleted question ${questionId} from room ${roomId}`);
    } else {
      console.log(`Question ${questionId} not found in room ${roomId}`);
    }
    
    return deleted;
  }

  roomExists(roomId: string): boolean {
    return !!this.questions[roomId];
  }

  getQuestionCount(roomId: string): number {
    return this.questions[roomId]?.length || 0;
  }
}
