import { IsString } from 'class-validator';

export class AskQuestionDto {
  @IsString()
  roomId: string;

  @IsString()
  userId: string;

  @IsString()
  question: string;
}
