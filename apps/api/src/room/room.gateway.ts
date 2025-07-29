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

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class RoomGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Add this Map to track user message timestamps
  private userLastMessageTime = new Map<string, number>();
  private readonly RATE_LIMIT_MS = 60000; // 60 seconds

  // Poll management
  private pollTimers = new Map<string, NodeJS.Timeout>();
  private readonly POLL_DURATION_MS = 120000; // 2 minutes

  constructor(private readonly questionStore: QuestionStoreService) {}

  handleConnection(client: Socket) {
    console.log(`🟢 Client connected: ${client.id}`);
    console.log(`📊 Total clients: ${this.server.sockets.sockets.size}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`🔴 Client disconnected: ${client.id}`);
    console.log(`📊 Total clients: ${this.server.sockets.sockets.size}`);
    
    // Clean up user rate limit data when they disconnect
    if (client.data.userId) {
      this.userLastMessageTime.delete(client.data.userId);
    }
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody() data: { roomId: string; userId: string; role: 'moderator' | 'user' },
    @ConnectedSocket() client: Socket,
  ) {
    console.log(`📝 ${data.role} joining room:`, data);

    client.join(data.roomId);
    client.data.role = data.role;
    client.data.userId = data.userId;

    this.server.to(data.roomId).emit('userJoined', {
      userId: data.userId,
      role: data.role,
    });

    console.log(`✅ ${data.role} ${data.userId} joined room: ${data.roomId}`);
  }

  @SubscribeMessage('askQuestion')
  handleAskQuestion(
    @MessageBody()
    data: { roomId: string; userId: string; question: string },
    @ConnectedSocket() client: Socket,
  ) {
    // Check rate limit
    const now = Date.now();
    const lastMessageTime = this.userLastMessageTime.get(data.userId);
    
    if (lastMessageTime && (now - lastMessageTime) < this.RATE_LIMIT_MS) {
      const remainingTime = Math.ceil((this.RATE_LIMIT_MS - (now - lastMessageTime)) / 1000);
      client.emit('rateLimitError', { 
        message: `Please wait ${remainingTime} seconds before sending another question.`,
        remainingTime 
      });
      return;
    }

    this.userLastMessageTime.set(data.userId, now);

    const newQuestion = {
      id: uuidv4(),
      userId: data.userId,
      roomId: data.roomId,
      question: data.question,
      timestamp: Date.now(),
    };

    this.questionStore.addQuestion(data.roomId, newQuestion);
    this.server.to(data.roomId).emit('newQuestion', newQuestion);
  }

  @SubscribeMessage('createPoll')
  handleCreatePoll(
    @MessageBody()
    data: { 
      roomId: string; 
      userId: string; 
      name: string;
      question: string; 
      options: string[] 
    },
    @ConnectedSocket() client: Socket,
  ) {
    // Check rate limit (same as questions)
    const now = Date.now();
    const lastMessageTime = this.userLastMessageTime.get(data.userId);
    
    if (lastMessageTime && (now - lastMessageTime) < this.RATE_LIMIT_MS) {
      const remainingTime = Math.ceil((this.RATE_LIMIT_MS - (now - lastMessageTime)) / 1000);
      client.emit('rateLimitError', { 
        message: `Please wait ${remainingTime} seconds before creating another poll.`,
        remainingTime 
      });
      return;
    }

    // Validate poll data
    if (!data.options || data.options.length < 2 || data.options.length > 10) {
      client.emit('pollError', { 
        message: 'Poll must have between 2 and 10 options.'
      });
      return;
    }

    this.userLastMessageTime.set(data.userId, now);

    const pollId = uuidv4();
    const newPoll = {
      id: pollId,
      name: data.name,
      question: data.question,
      status: 'active',
      roomId: data.roomId,
      createdBy: data.userId,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(now + this.POLL_DURATION_MS).toISOString(),
      options: data.options.map(optionText => ({
        id: uuidv4(),
        text: optionText,
        votes: []
      }))
    };

    // Set up auto-close timer
    const timer = setTimeout(() => {
      this.closePoll(data.roomId, pollId);
    }, this.POLL_DURATION_MS);

    this.pollTimers.set(pollId, timer);

    // Emit to all users in the room
    this.server.to(data.roomId).emit('newPoll', newPoll);
    console.log(`📊 Poll created: ${pollId} in room: ${data.roomId}`);
  }

  @SubscribeMessage('votePoll')
  handleVotePoll(
    @MessageBody()
    data: { roomId: string; pollId: string; optionId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    // Here you would typically interact with your database through a service
    // For now, I'll emit the vote event
    const voteData = {
      pollId: data.pollId,
      optionId: data.optionId,
      voterId: data.userId,
      timestamp: new Date().toISOString()
    };

    // Emit to all users in the room
    this.server.to(data.roomId).emit('pollVoteAdded', voteData);
    
    // Send confirmation to voter
    client.emit('voteConfirmed', { 
      pollId: data.pollId, 
      optionId: data.optionId 
    });

    console.log(`🗳️ Vote cast: User ${data.userId} voted for option ${data.optionId} in poll ${data.pollId}`);
  }

  @SubscribeMessage('getActivePolls')
  handleGetActivePolls(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (!data || typeof data !== 'object' || typeof data.roomId !== 'string') {
      console.warn('❌ Invalid getActivePolls payload:', data);
      return;
    }

    console.log(`📊 Get active polls request:`, data);
    // Here you would fetch from your database service
    // For now, sending empty array - you'll replace this with actual service call
    client.emit('activePollsList', []);
  }

  @SubscribeMessage('closePoll')
  handleClosePoll(
    @MessageBody() data: { roomId: string; pollId: string },
    @ConnectedSocket() client: Socket,
  ) {
    // Only allow moderators or poll creators to manually close polls
    if (client.data.role !== 'moderator') {
      client.emit('pollError', { 
        message: 'Only moderators can manually close polls.' 
      });
      return;
    }

    this.closePoll(data.roomId, data.pollId);
  }

  private closePoll(roomId: string, pollId: string) {
    // Clear the timer if it exists
    const timer = this.pollTimers.get(pollId);
    if (timer) {
      clearTimeout(timer);
      this.pollTimers.delete(pollId);
    }

    // Here you would update the poll status in the database to 'closed'
    // Then emit the closure to all room participants
    this.server.to(roomId).emit('pollClosed', { 
      pollId,
      closedAt: new Date().toISOString()
    });

    console.log(`📊 Poll closed: ${pollId} in room: ${roomId}`);
  }

@SubscribeMessage('replyToQuestion')
handleReplyToQuestion(
  @MessageBody() data: { roomId: string; questionId: string; content: string },
  @ConnectedSocket() client: Socket,
) {
  const updated = this.questionStore.answerQuestion(
    data.roomId,
    data.questionId,
    data.content,
  );

  if (updated) {
    this.server.to(data.roomId).emit('questionReplied', updated);
  }
}

@SubscribeMessage('getQuestions')
handleGetQuestions(
  @MessageBody() data: { roomId: string },
  @ConnectedSocket() client: Socket,
) {
  if (!data || typeof data !== 'object' || typeof data.roomId !== 'string') {
    console.warn('❌ Invalid getQuestions payload:', data);
    return;
  }

  console.log(`📋 Valid Get questions request:`, data);
  const questions = this.questionStore.getQuestions(data.roomId);
  client.emit('questionsList', questions);
}

@SubscribeMessage('upvoteQuestion')
handleUpvoteQuestion(
  @MessageBody() data: { roomId: string; questionId: string; userId: string },
  @ConnectedSocket() client: Socket,
) {
  const userId = data.userId || client.id;
  
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
      message: 'Failed to upvote question' 
    });
  }
}

  @SubscribeMessage('toggleAnswered')
  handleToggleAnswered(
    @MessageBody() data: { roomId: string; questionId: string },
  ) {
    const updated = this.questionStore.toggleAnswered(data.roomId, data.questionId);
    if (updated) {
      this.server.to(data.roomId).emit('questionUpdated', updated);
    }
  }

  @SubscribeMessage('toggleHidden')
  handleToggleHidden(
    @MessageBody() data: { roomId: string; questionId: string },
  ) {
    const updated = this.questionStore.toggleHidden(data.roomId, data.questionId);
    if (updated) {
      this.server.to(data.roomId).emit('questionUpdated', updated);
    }
  }

  @SubscribeMessage('deleteQuestion')
  handleDeleteQuestion(
    @MessageBody() data: { roomId: string; questionId: string },
  ) {
    const deleted = this.questionStore.deleteQuestion(data.roomId, data.questionId);
    if (deleted) {
      this.server.to(data.roomId).emit('questionDeleted', data.questionId);
    }
  }
}
