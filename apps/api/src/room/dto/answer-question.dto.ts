import { IsString } from 'class-validator';

export class AnswerQuestionDto {
  @IsString()
  roomId: string;

  @IsString()
  questionId: string;

  @IsString()
  answer: string;

  @IsString()
  moderatorId: string;
}
