import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { QuestionStoreService } from './question-store.service';
import { Logger, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { IsString, IsArray, ArrayMinSize, ArrayMaxSize, IsNotEmpty, IsUUID, IsIn } from 'class-validator';

// DTOs for validation
export class JoinRoomDto {
  @IsString()
  @IsNotEmpty()
  roomId: string;

  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsIn(['moderator', 'user'])
  role: 'moderator' | 'user';
}

export class AskQuestionDto {
  @IsString()
  @IsNotEmpty()
  roomId: string;

  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  question: string;
}

export class CreatePollDto {
  @IsString()
  @IsNotEmpty()
  roomId: string;

  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  question: string;

  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(10)
  @IsString({ each: true })
  options: string[];
}

export class VotePollDto {
  @IsString()
  @IsNotEmpty()
  roomId: string;

  @IsUUID()
  pollId: string;

  @IsUUID()
  optionId: string;

  @IsString()
  @IsNotEmpty()
  userId: string;
}

interface PollData {
  id: string;
  name: string;
  question: string;
  status: 'active' | 'closed';
  roomId: string;
  createdBy: string;
  createdAt: string;
  expiresAt: string;
  options: {
    id: string;
    text: string;
    votes: string[]; // Array of user IDs who voted for this option
  }[];
}

@WebSocketGateway({
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  },
})
export class RoomGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RoomGateway.name);

  // Rate limiting
  private userLastMessageTime = new Map<string, number>();
  private readonly RATE_LIMIT_MS = 60000; // 60 seconds
  private readonly QUESTION_RATE_LIMIT_MS = 30000; // 30 seconds for questions
  private readonly POLL_RATE_LIMIT_MS = 120000; // 2 minutes for polls

  // Poll management
  private pollTimers = new Map<string, NodeJS.Timeout>();
  private activePollsStore = new Map<string, Map<string, PollData>>(); // roomId -> pollId -> pollData
  private readonly POLL_DURATION_MS = 120000; // 2 minutes

  // User tracking
  private roomUsers = new Map<string, Set<string>>(); // roomId -> Set of userIds

  constructor(private readonly questionStore: QuestionStoreService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    this.logger.log(`Total clients: ${this.server.sockets.sockets.size}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.logger.log(`Total clients: ${this.server.sockets.sockets.size}`);
    
    // Clean up user data
    if (client.data.userId && client.data.roomId) {
      const roomUsers = this.roomUsers.get(client.data.roomId);
      if (roomUsers) {
        roomUsers.delete(client.data.userId);
        if (roomUsers.size === 0) {
          this.roomUsers.delete(client.data.roomId);
        }
      }
      this.userLastMessageTime.delete(client.data.userId);
    }
  }

  private validateRoomMembership(client: Socket, roomId: string): boolean {
    return client.data.roomId === roomId;
  }

  private validateModeratorPermission(client: Socket): boolean {
    return client.data.role === 'moderator';
  }

  private checkRateLimit(userId: string, rateLimitMs: number = this.RATE_LIMIT_MS): { allowed: boolean; remainingTime?: number } {
    const now = Date.now();
    const lastMessageTime = this.userLastMessageTime.get(userId);
    
    if (lastMessageTime && (now - lastMessageTime) < rateLimitMs) {
      const remainingTime = Math.ceil((rateLimitMs - (now - lastMessageTime)) / 1000);
      return { allowed: false, remainingTime };
    }
    
    return { allowed: true };
  }

  private sanitizeInput(input: string, maxLength: number = 500): string {
    return input.trim().substring(0, maxLength);
  }

  @SubscribeMessage('joinRoom')
  @UsePipes(new ValidationPipe({ transform: true }))
  handleJoinRoom(
    @MessageBody() data: JoinRoomDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      this.logger.log(`${data.role} joining room: ${data.roomId}`);

      // Validate and sanitize
      const roomId = this.sanitizeInput(data.roomId, 100);
      const userId = this.sanitizeInput(data.userId, 100);

      client.join(roomId);
      client.data.role = data.role;
      client.data.userId = userId;
      client.data.roomId = roomId;

      // Track room membership
      if (!this.roomUsers.has(roomId)) {
        this.roomUsers.set(roomId, new Set());
      }
      this.roomUsers.get(roomId)!.add(userId);

      this.server.to(roomId).emit('userJoined', {
        userId: userId,
        role: data.role,
      });

      this.logger.log(`${data.role} ${userId} joined room: ${roomId}`);

      // Send current room state to the new user
      client.emit('joinRoomSuccess', {
        roomId,
        userId,
        role: data.role,
      });

    } catch (error) {
      this.logger.error(`Error in joinRoom: ${error.message}`);
      client.emit('joinRoomError', { message: 'Failed to join room' });
    }
  }

  @SubscribeMessage('askQuestion')
  @UsePipes(new ValidationPipe({ transform: true }))
  handleAskQuestion(
    @MessageBody() data: AskQuestionDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      // Validate room membership
      if (!this.validateRoomMembership(client, data.roomId)) {
        client.emit('questionError', { message: 'You are not a member of this room' });
        return;
      }

      // Check rate limit
      const rateCheck = this.checkRateLimit(data.userId, this.QUESTION_RATE_LIMIT_MS);
      if (!rateCheck.allowed) {
        client.emit('rateLimitError', { 
          message: `Please wait ${rateCheck.remainingTime} seconds before asking another question.`,
          remainingTime: rateCheck.remainingTime
        });
        return;
      }

      // Validate and sanitize question
      const question = this.sanitizeInput(data.question, 1000);
      if (question.length < 5) {
        client.emit('questionError', { message: 'Question must be at least 5 characters long' });
        return;
      }

      this.userLastMessageTime.set(data.userId, Date.now());

      const newQuestion = {
        id: uuidv4(),
        userId: data.userId,
        roomId: data.roomId,
        question: question,
        timestamp: Date.now(),
      };

      this.questionStore.addQuestion(data.roomId, newQuestion);
      this.server.to(data.roomId).emit('newQuestion', newQuestion);

      this.logger.log(`Question added by ${data.userId} in room ${data.roomId}`);

    } catch (error) {
      this.logger.error(`Error in askQuestion: ${error.message}`);
      client.emit('questionError', { message: 'Failed to submit question' });
    }
  }

  @SubscribeMessage('createPoll')
  @UsePipes(new ValidationPipe({ transform: true }))
  handleCreatePoll(
    @MessageBody() data: CreatePollDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      // Validate room membership
      if (!this.validateRoomMembership(client, data.roomId)) {
        client.emit('pollError', { message: 'You are not a member of this room' });
        return;
      }

      // Check rate limit
      const rateCheck = this.checkRateLimit(data.userId, this.POLL_RATE_LIMIT_MS);
      if (!rateCheck.allowed) {
        client.emit('rateLimitError', { 
          message: `Please wait ${rateCheck.remainingTime} seconds before creating another poll.`,
          remainingTime: rateCheck.remainingTime
        });
        return;
      }

      // Sanitize inputs
      const name = this.sanitizeInput(data.name, 200);
      const question = this.sanitizeInput(data.question, 500);
      const options = data.options
        .map(opt => this.sanitizeInput(opt, 200))
        .filter(opt => opt.length > 0);

      // Validate sanitized data
      if (options.length < 2 || options.length > 10) {
        client.emit('pollError', { 
          message: 'Poll must have between 2 and 10 non-empty options.'
        });
        return;
      }

      if (question.length < 5) {
        client.emit('pollError', { message: 'Poll question must be at least 5 characters long' });
        return;
      }

      this.userLastMessageTime.set(data.userId, Date.now());

      const pollId = uuidv4();
      const now = Date.now();
      
      const newPoll: PollData = {
        id: pollId,
        name: name,
        question: question,
        status: 'active',
        roomId: data.roomId,
        createdBy: data.userId,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(now + this.POLL_DURATION_MS).toISOString(),
        options: options.map(optionText => ({
          id: uuidv4(),
          text: optionText,
          votes: []
        }))
      };

      // Store poll in memory
      if (!this.activePollsStore.has(data.roomId)) {
        this.activePollsStore.set(data.roomId, new Map());
      }
      this.activePollsStore.get(data.roomId)!.set(pollId, newPoll);

      // Set up auto-close timer
      const timer = setTimeout(() => {
        this.closePoll(data.roomId, pollId);
      }, this.POLL_DURATION_MS);

      this.pollTimers.set(pollId, timer);

      // Emit to all users in the room
      this.server.to(data.roomId).emit('newPoll', newPoll);
      this.logger.log(`Poll created: ${pollId} in room: ${data.roomId}`);

    } catch (error) {
      this.logger.error(`Error in createPoll: ${error.message}`);
      client.emit('pollError', { message: 'Failed to create poll' });
    }
  }

  @SubscribeMessage('votePoll')
  @UsePipes(new ValidationPipe({ transform: true }))
  handleVotePoll(
    @MessageBody() data: VotePollDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      // Validate room membership
      if (!this.validateRoomMembership(client, data.roomId)) {
        client.emit('pollError', { message: 'You are not a member of this room' });
        return;
      }

      // Get the poll
      const roomPolls = this.activePollsStore.get(data.roomId);
      if (!roomPolls) {
        client.emit('pollError', { message: 'No active polls in this room' });
        return;
      }

      const poll = roomPolls.get(data.pollId);
      if (!poll) {
        client.emit('pollError', { message: 'Poll not found' });
        return;
      }

      if (poll.status !== 'active') {
        client.emit('pollError', { message: 'This poll is no longer active' });
        return;
      }

      // Find the option
      const optionIndex = poll.options.findIndex(opt => opt.id === data.optionId);
      if (optionIndex === -1) {
        client.emit('pollError', { message: 'Poll option not found' });
        return;
      }

      const option = poll.options[optionIndex];

      // Remove user's previous vote from all options
      poll.options.forEach(opt => {
        const userVoteIndex = opt.votes.indexOf(data.userId);
        if (userVoteIndex > -1) {
          opt.votes.splice(userVoteIndex, 1);
        }
      });

      // Add user's vote to the selected option
      option.votes.push(data.userId);

      // Update the stored poll
      roomPolls.set(data.pollId, poll);

      const voteData = {
        pollId: data.pollId,
        optionId: data.optionId,
        voterId: data.userId,
        timestamp: new Date().toISOString(),
        updatedPoll: poll
      };

      // Emit to all users in the room
      this.server.to(data.roomId).emit('pollVoteAdded', voteData);
      
      // Send confirmation to voter
      client.emit('voteConfirmed', { 
        pollId: data.pollId, 
        optionId: data.optionId 
      });

      this.logger.log(`Vote cast: User ${data.userId} voted for option ${data.optionId} in poll ${data.pollId}`);

    } catch (error) {
      this.logger.error(`Error in votePoll: ${error.message}`);
      client.emit('pollError', { message: 'Failed to cast vote' });
    }
  }

  @SubscribeMessage('getActivePolls')
  handleGetActivePolls(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      if (!data || typeof data !== 'object' || typeof data.roomId !== 'string') {
        this.logger.warn('Invalid getActivePolls payload:', data);
        client.emit('pollError', { message: 'Invalid request format' });
        return;
      }

      // Validate room membership
      if (!this.validateRoomMembership(client, data.roomId)) {
        client.emit('pollError', { message: 'You are not a member of this room' });
        return;
      }

      this.logger.log(`Get active polls request for room: ${data.roomId}`);
      
      const roomPolls = this.activePollsStore.get(data.roomId);
      const activePolls = roomPolls ? Array.from(roomPolls.values()).filter(poll => poll.status === 'active') : [];
      
      client.emit('activePollsList', activePolls);

    } catch (error) {
      this.logger.error(`Error in getActivePolls: ${error.message}`);
      client.emit('pollError', { message: 'Failed to fetch active polls' });
    }
  }

  @SubscribeMessage('closePoll')
  handleClosePoll(
    @MessageBody() data: { roomId: string; pollId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      // Validate room membership
      if (!this.validateRoomMembership(client, data.roomId)) {
        client.emit('pollError', { message: 'You are not a member of this room' });
        return;
      }

      // Get the poll to check creator or moderator permission
      const roomPolls = this.activePollsStore.get(data.roomId);
      const poll = roomPolls?.get(data.pollId);

      if (!poll) {
        client.emit('pollError', { message: 'Poll not found' });
        return;
      }

      // Only allow moderators or poll creators to manually close polls
      if (!this.validateModeratorPermission(client) && poll.createdBy !== client.data.userId) {
        client.emit('pollError', { 
          message: 'Only moderators or poll creators can manually close polls.' 
        });
        return;
      }

      this.closePoll(data.roomId, data.pollId);

    } catch (error) {
      this.logger.error(`Error in closePoll: ${error.message}`);
      client.emit('pollError', { message: 'Failed to close poll' });
    }
  }

  private closePoll(roomId: string, pollId: string) {
    try {
      // Clear the timer if it exists
      const timer = this.pollTimers.get(pollId);
      if (timer) {
        clearTimeout(timer);
        this.pollTimers.delete(pollId);
      }

      // Update poll status
      const roomPolls = this.activePollsStore.get(roomId);
      if (roomPolls) {
        const poll = roomPolls.get(pollId);
        if (poll) {
          poll.status = 'closed';
          roomPolls.set(pollId, poll);
        }
      }

      // Emit the closure to all room participants
      this.server.to(roomId).emit('pollClosed', { 
        pollId,
        closedAt: new Date().toISOString()
      });

      this.logger.log(`Poll closed: ${pollId} in room: ${roomId}`);

    } catch (error) {
      this.logger.error(`Error closing poll ${pollId}: ${error.message}`);
    }
  }

  // Question-related handlers with improved validation
  @SubscribeMessage('replyToQuestion')
  handleReplyToQuestion(
    @MessageBody() data: { roomId: string; questionId: string; content: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      // Validate room membership
      if (!this.validateRoomMembership(client, data.roomId)) {
        client.emit('questionError', { message: 'You are not a member of this room' });
        return;
      }

      // Only moderators can reply to questions
      if (!this.validateModeratorPermission(client)) {
        client.emit('questionError', { message: 'Only moderators can reply to questions' });
        return;
      }

      const content = this.sanitizeInput(data.content, 2000);
      if (content.length < 1) {
        client.emit('questionError', { message: 'Reply content cannot be empty' });
        return;
      }

      const updated = this.questionStore.answerQuestion(
        data.roomId,
        data.questionId,
        content,
      );

      if (updated) {
        this.server.to(data.roomId).emit('questionReplied', updated);
      } else {
        client.emit('questionError', { message: 'Question not found or could not be updated' });
      }

    } catch (error) {
      this.logger.error(`Error in replyToQuestion: ${error.message}`);
      client.emit('questionError', { message: 'Failed to reply to question' });
    }
  }

  @SubscribeMessage('getQuestions')
  handleGetQuestions(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      if (!data || typeof data !== 'object' || typeof data.roomId !== 'string') {
        this.logger.warn('Invalid getQuestions payload:', data);
        client.emit('questionError', { message: 'Invalid request format' });
        return;
      }

      // Validate room membership
      if (!this.validateRoomMembership(client, data.roomId)) {
        client.emit('questionError', { message: 'You are not a member of this room' });
        return;
      }

      this.logger.log(`Get questions request for room: ${data.roomId}`);
      const questions = this.questionStore.getQuestions(data.roomId);
      client.emit('questionsList', questions);

    } catch (error) {
      this.logger.error(`Error in getQuestions: ${error.message}`);
      client.emit('questionError', { message: 'Failed to fetch questions' });
    }
  }

  @SubscribeMessage('upvoteQuestion')
  handleUpvoteQuestion(
    @MessageBody() data: { roomId: string; questionId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      // Validate room membership
      if (!this.validateRoomMembership(client, data.roomId)) {
        client.emit('questionError', { message: 'You are not a member of this room' });
        return;
      }

      const userId = data.userId || client.data.userId;
      
      const result = this.questionStore.upvoteQuestion(data.roomId, data.questionId);
      if (result) {
        this.server.to(data.roomId).emit('questionUpdated', result);
        client.emit('upvoteResponse', { 
          success: true, 
          message: 'Question upvoted successfully' 
        });
      } else {
        client.emit('upvoteResponse', { 
          success: false, 
          message: 'Failed to upvote question or already upvoted' 
        });
      }

    } catch (error) {
      this.logger.error(`Error in upvoteQuestion: ${error.message}`);
      client.emit('questionError', { message: 'Failed to upvote question' });
    }
  }

  @SubscribeMessage('toggleAnswered')
  handleToggleAnswered(
    @MessageBody() data: { roomId: string; questionId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      // Validate room membership and moderator permission
      if (!this.validateRoomMembership(client, data.roomId)) {
        client.emit('questionError', { message: 'You are not a member of this room' });
        return;
      }

      if (!this.validateModeratorPermission(client)) {
        client.emit('questionError', { message: 'Only moderators can toggle question status' });
        return;
      }

      const updated = this.questionStore.toggleAnswered(data.roomId, data.questionId);
      if (updated) {
        this.server.to(data.roomId).emit('questionUpdated', updated);
      } else {
        client.emit('questionError', { message: 'Question not found' });
      }

    } catch (error) {
      this.logger.error(`Error in toggleAnswered: ${error.message}`);
      client.emit('questionError', { message: 'Failed to toggle question status' });
    }
  }

  @SubscribeMessage('toggleHidden')
  handleToggleHidden(
    @MessageBody() data: { roomId: string; questionId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      // Validate room membership and moderator permission
      if (!this.validateRoomMembership(client, data.roomId)) {
        client.emit('questionError', { message: 'You are not a member of this room' });
        return;
      }

      if (!this.validateModeratorPermission(client)) {
        client.emit('questionError', { message: 'Only moderators can hide/unhide questions' });
        return;
      }

      const updated = this.questionStore.toggleHidden(data.roomId, data.questionId);
      if (updated) {
        this.server.to(data.roomId).emit('questionUpdated', updated);
      } else {
        client.emit('questionError', { message: 'Question not found' });
      }

    } catch (error) {
      this.logger.error(`Error in toggleHidden: ${error.message}`);
      client.emit('questionError', { message: 'Failed to toggle question visibility' });
    }
  }

  @SubscribeMessage('deleteQuestion')
  handleDeleteQuestion(
    @MessageBody() data: { roomId: string; questionId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      // Validate room membership and moderator permission
      if (!this.validateRoomMembership(client, data.roomId)) {
        client.emit('questionError', { message: 'You are not a member of this room' });
        return;
      }

      if (!this.validateModeratorPermission(client)) {
        client.emit('questionError', { message: 'Only moderators can delete questions' });
        return;
      }

      const deleted = this.questionStore.deleteQuestion(data.roomId, data.questionId);
      if (deleted) {
        this.server.to(data.roomId).emit('questionDeleted', data.questionId);
      } else {
        client.emit('questionError', { message: 'Question not found' });
      }

    } catch (error) {
      this.logger.error(`Error in deleteQuestion: ${error.message}`);
      client.emit('questionError', { message: 'Failed to delete question' });
    }
  }
}