import { IsString, MinLength, Length, IsOptional } from 'class-validator'

export class CreateRoomDto {
@IsString()
@MinLength(3)
title: string;

@IsString()
@Length(5, 8)
slug: string;

  @IsOptional()
  @IsString()
  description?: string;
}
