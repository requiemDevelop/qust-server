import { Body, Controller, Delete, NotFoundException, Param, Post, Put, UseGuards } from '@nestjs/common'
import { CurrentUser } from 'src/auth/decorators/current-user.decorator'
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard'
import { UserFromRequest } from 'src/auth/types/request-response'
import { Message } from 'src/messages/models/messages.model'
import { TextChannelMessageService } from 'src/messages/text-channel-message.service'
import { RequiredGroupPermissions } from 'src/permissions/decorators/required-group-permissions.decorator'
import { CategoryPermissionsGuard } from 'src/permissions/guards/category-permissions.guard'
import { GroupPermissionsGuard } from 'src/permissions/guards/group-permissions.guard'
import { RolePermissionsEnum } from 'src/permissions/types/permissions/role-permissions.enum'
import { TextChannel } from './models/text-channels.model'
import { TextChannelsService } from './text-channels.service'


@Controller('/text-channels')
export class TextChannelsController {

    constructor(
        private textChannelsService: TextChannelsService,
        private textChannelMessageService: TextChannelMessageService,
    ) {}

    @Post('/')
    @RequiredGroupPermissions([ RolePermissionsEnum.manageCategoriesAndChannels ])
    @UseGuards(JwtAuthGuard, GroupPermissionsGuard)
    async createTextChannel(
        @CurrentUser() user: UserFromRequest,
        @Body() dto: { name: string, categoryId: string, groupId: string }
    ): Promise<TextChannel> {
        const channel: TextChannel =
            await this.textChannelsService.createTextChannel({ ...dto, userId: user.id })
        return channel
    }

    @Put('/:textChannelIdId')
    @UseGuards(JwtAuthGuard, CategoryPermissionsGuard)
    async updateTextChannel(
        @CurrentUser() user: UserFromRequest,
        @Param('textChannelId') textChannelId: string,
        @Body() { name }: { name: string }
    ): Promise<TextChannel> {
        const channel: TextChannel = await this.textChannelsService.getTextChannelById(textChannelId)
        if (!channel)
            throw new NotFoundException({ message: 'Text channel not found' })
        const updatedChannel: TextChannel =
            await this.textChannelsService.updateTextChannel({ userId: user.id, name, channel })
        return updatedChannel
    }

    @Delete('/:textChannelIdId')
    @UseGuards(JwtAuthGuard, CategoryPermissionsGuard)
    async deleteTextChannel(
        @CurrentUser() user: UserFromRequest,
        @Param('textChannelId') textChannelId: string,
    ): Promise<TextChannel> {
        const channel: TextChannel = await this.textChannelsService.getTextChannelById(textChannelId)
        if (!channel)
            throw new NotFoundException({ message: 'Text channel not found' })
        await this.textChannelsService.deleteTextChannel({ userId: user.id, channel })
        return channel
    }

    @Post('/:textChannelId/messages')
    @UseGuards(JwtAuthGuard)
    async sendMessageToTextChannel(
        @Param('textChannelId') textChannelId: string,
        @CurrentUser() user: UserFromRequest,
        @Body() { text }: { text: string }
    ): Promise<Message> {
        if (!await this.textChannelsService.getTextChannelById(textChannelId))
            throw new NotFoundException({ message: 'Text channel not found' })
        const message: Message = await this.textChannelMessageService.sendMessageToTextChannel({
            userId: user.id,
            username: user.username,
            textChannelId,
            text
        })
        return message
    }

}