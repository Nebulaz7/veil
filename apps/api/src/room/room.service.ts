import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateRoomDto } from './dto/create-room.dto';
import { PrismaService } from '../prisma/prisma.service';
@Injectable()
export class RoomService {
    constructor(private prisma: PrismaService) {}

    async createRoom(dto: CreateRoomDto, moderatorId: string): Promise<any> {
        const existing = await this.prisma.room.findUnique({ where: { slug: dto.slug } });
        if (existing) {
            throw new Error('Room with this slug already exists');
        }

        return this.prisma.room.create({
            data: {
                title: dto.title,
                slug: dto.slug,
                description: dto.description || '',
                moderatorId: moderatorId,
            }
        });
    }

    async findRoomBySlug(slug: string): Promise<any> {
        return this.prisma.room.findUnique({ where: { slug }, include: { moderator: true } });
    }

    async findRoomById(id: string): Promise<any> {
  return this.prisma.room.findUnique({ where: { id }, include: { moderator: true } });
}

    async findRoomsByUserId(userId: string) {
        try{
  return this.prisma.room.findMany({
    where: { moderatorId: userId },
    orderBy: { createdAt: 'desc' }
  });
}catch (err) {
    console.error('Error fetching rooms:', err);
    throw new InternalServerErrorException('Database temporarily unavailable');
  }}
    
}