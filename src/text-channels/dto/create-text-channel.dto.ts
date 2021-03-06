import { IsString, IsUUID } from 'class-validator'

export class CreateTextChannelDto {

    @IsString()
        name: string

    @IsUUID()
        categoryId: string

    @IsUUID()
        userId: string

    @IsUUID()
        groupId: string

}