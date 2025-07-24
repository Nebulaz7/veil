import { IsString, Length, Matches, IsNotEmpty, IsUUID } from 'class-validator';

export class JoinRoomDto {
    @IsString()
    @IsNotEmpty()
    @Length(3, 30)
    @Matches(/^[a-zA-Z0-9][a-zA-Z0-9_-]*[a-zA-Z0-9]$/, {
      message: 'Username must start and end with alphanumeric characters and can only contain letters, numbers, underscores, and dashes',
    })
    @Matches(/^(?!.*[<>'"&]).*$/, {
      message: 'Username cannot contain HTML characters (<, >, ", \', &)',
    })
    username: string;
}

