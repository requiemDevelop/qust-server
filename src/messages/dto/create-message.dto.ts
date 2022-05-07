import { IsUUID, IsString, MaxLength, MinLength } from 'class-validator'

export class CreateMessageDto {

    @IsUUID()
        userId: string

    @IsString()
    @MinLength(4)
    @MaxLength(25)
        username: string

    @IsString()
        text: string

}