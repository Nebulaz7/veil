import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateTempUserDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsUUID()
  @IsNotEmpty()
  roomId: string;
}