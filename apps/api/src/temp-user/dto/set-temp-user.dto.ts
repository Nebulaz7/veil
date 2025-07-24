import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class SetTempUserDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsUUID()
  @IsNotEmpty()
  roomId: string;
}
