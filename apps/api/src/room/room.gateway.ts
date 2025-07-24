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

    // Update the last message time for this user
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
    @MessageBody() data: { roomId: string; questionId: string },
  ) {
    const updated = this.questionStore.upvoteQuestion(data.roomId, data.questionId);
    if (updated) {
      this.server.to(data.roomId).emit('questionUpdated', updated);
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
