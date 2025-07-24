// poll.controller.ts
import { Controller, Get, Post, Param, Body, NotFoundException } from '@nestjs/common';
import { PollService } from './poll.service';

@Controller('rooms/:slug/polls')
export class PollController {
  constructor(private pollService: PollService) {}

  @Get()
  async getPolls(@Param('slug') slug: string) {
    try {
      return await this.pollService.getPollsByRoomSlug(slug);
    } catch {
      throw new NotFoundException('Room not found');
    }
  }

  @Post()
  async createPoll(
    @Param('slug') slug: string,
    @Body() body: { name: string; status: string; question: string }
  ) {
    try {
      return await this.pollService.createPollForRoom(slug, body);
    } catch {
      throw new NotFoundException('Room not found');
    }
  }
}
