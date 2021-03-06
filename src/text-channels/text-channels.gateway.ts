
import { UseGuards } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import {
    ConnectedSocket,
    MessageBody, SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { SocketIoCurrentUser } from 'src/auth/decorators/socket.io-current-user.decorator'
import { SocketIoJwtAuthGuard } from 'src/auth/guards/socket.io-jwt.guard'
import { UserFromRequest } from 'src/auth/types/request-response'
import { InternalTextChannelsMessageSentEvent } from 'src/messages/events/internal-text-channels.message-sent.event'
import { MessageContent } from 'src/messages/models/message-content.model'
import { Message } from 'src/messages/models/messages.model'
import { TextChannelMessageService } from 'src/messages/text-channel-message.service'
import { SocketIoRequiredTextChannelPermissions } from 'src/permissions/decorators/socketio-required-text-channel-permissions.decorator'
import { SocketIoCategoryPermissionsGuard } from 'src/permissions/guards/socket.io-category-permissions.guard'
import { SocketIoTextChannelPermissionsGuard } from 'src/permissions/guards/socket.io-text-channel-permissions.guard'
import { RoleTextChannelPermissionsEnum } from 'src/permissions/types/permissions/role-text-channel-permissions.enum'
import { InternalRolesCudEvent } from 'src/roles/events/internal-roles.CUD.event'
import { SocketIoService } from 'src/socketio/socketio.service'
import { UsersService } from 'src/users/users.service'
import { CreateTextChannelDto } from './dto/create-text-channel.dto'
import { InternalTextChannelUsersCudEvent } from './events/internal-text-channel-users.CUD.event'
import { InternalTextChannelsCudEvent } from './events/internal-text-channels.CUD.event'
import { TextChannel } from './models/text-channels.model'
import { TextChannelsService } from './text-channels.service'


@WebSocketGateway(8080, { cors: { origin: '*' }, namespace: '/text-channels' })
export class TextChannelsGateway {

    constructor(
        private textChannelsService: TextChannelsService,
        private textChannelMessageService: TextChannelMessageService,
        private socketIoService: SocketIoService,
        private usersService: UsersService,
    ) {}

    @WebSocketServer()
        server: Server

    @SubscribeMessage('connect-to-text-channel')
    @UseGuards(SocketIoJwtAuthGuard, SocketIoTextChannelPermissionsGuard)
    async connectToTextChannel(
        @SocketIoCurrentUser() user: UserFromRequest,
        @ConnectedSocket() socket: Socket,
        @MessageBody() { textChannelId }: { textChannelId: string },
    ): Promise<void> {
        socket.join(textChannelId)
        socket.emit('200', textChannelId)
    }

    @SubscribeMessage('get-messages-from-text-channel')
    @UseGuards(SocketIoJwtAuthGuard, SocketIoTextChannelPermissionsGuard)
    async getMessagesFromTextChannel(
        @ConnectedSocket() socket: Socket,
        @MessageBody() { textChannelId, offset }: { textChannelId: string, offset: number }
    ): Promise<void> {
        if (!socket.rooms.has('text-channel:' + textChannelId)) {
            socket.emit('400', 'You are not connected to text channel')
            return
        }
        const messages: Message[] = await this.textChannelMessageService.getMessagesFromTextChannel(
            textChannelId, MessageContent, 30, offset
        )
        socket.emit('200', messages)
    }

    @SubscribeMessage('send-message')
    @SocketIoRequiredTextChannelPermissions([ RoleTextChannelPermissionsEnum.deleteMessages ])
    @UseGuards(SocketIoJwtAuthGuard, SocketIoTextChannelPermissionsGuard)
    async sendMessageToTextChannel(
        @ConnectedSocket() socket: Socket,
        @SocketIoCurrentUser() user: UserFromRequest,
        @MessageBody() dto: { textChannelId: string, text: string }
    ): Promise<void> {
        if (!socket.rooms.has('text-channel:' + dto.textChannelId)) {
            socket.emit('400', 'You are not connected to text channel')
            return
        }
        const message: Message = await this.textChannelMessageService.
            sendMessageToTextChannel({
                userId: user.id,
                username: user.username,
                ...dto
            })
        socket.emit('200', message)
    }

    @SubscribeMessage('create-text-channel')
    @UseGuards(SocketIoJwtAuthGuard, SocketIoCategoryPermissionsGuard)
    async createTextChannel(
        @ConnectedSocket() socket: Socket,
        @MessageBody() dto: CreateTextChannelDto
    ): Promise<void> {
        const channel: TextChannel = await this.textChannelsService.createTextChannel(dto)
        socket.emit('200', channel)
    }

    @SubscribeMessage('update-text-channel')
    @UseGuards(SocketIoJwtAuthGuard, SocketIoCategoryPermissionsGuard)
    async updateTextChannel(
        @SocketIoCurrentUser() user: UserFromRequest,
        @ConnectedSocket() socket: Socket,
        @MessageBody() { name, textChannelId }: { name: string, textChannelId: string }
    ): Promise<void> {
        if (!socket.rooms.has('text-channel:' + textChannelId)) {
            socket.emit('400', 'You are not connected to text channel')
            return
        }
        const channel: TextChannel = await this.textChannelsService.getTextChannelById(textChannelId)
        if (!channel) {
            socket.emit('404', 'Text channel not found')
            return
        }
        await this.textChannelsService.updateTextChannel({ userId: user.id, name, channel })
        socket.emit('200', channel)
    }

    @SubscribeMessage('delete-text-channel')
    @UseGuards(SocketIoJwtAuthGuard, SocketIoCategoryPermissionsGuard)
    async deleteTextChannel(
        @SocketIoCurrentUser() user: UserFromRequest,
        @ConnectedSocket() socket: Socket,
        @MessageBody() { textChannelId }: { textChannelId: string }
    ): Promise<void> {
        if (!socket.rooms.has('text-channel:' + textChannelId)) {
            socket.emit('400', 'You are not connected to text channel')
            return
        }
        const channel: TextChannel = await this.textChannelsService.getTextChannelById(textChannelId)
        if (!channel) {
            socket.emit('404', 'Text channel not found')
            return
        }
        await this.textChannelsService.deleteTextChannel({ userId: user.id, channel })
        socket.emit('200', channel)
    }

    @OnEvent('internal-text-channels.message-sent')
    async sendMessageFromTextChannelToSockets(event: InternalTextChannelsMessageSentEvent): Promise<void> {
        this.server
            .to('text-channel:' + event.textChannelId)
            .emit('text-channel-message', event.message)
    }

    @OnEvent('internal-text-channels.created')
    @OnEvent('internal-text-channels.updated')
    @OnEvent('internal-text-channels.deleted')
    async onTextChannelCudEvents(event: InternalTextChannelsCudEvent): Promise<void> {
        this.server
            .to('group:' + event.groupId)
            .emit(`text-channel-${event.action}d`, event.channel)
    }

    @OnEvent('internal-text-channel-users.created')
    @OnEvent('internal-text-channel-users.updated')
    @OnEvent('internal-text-channel-users.deleted')
    async onTextChannelUsersCudEvents(event: InternalTextChannelUsersCudEvent): Promise<void> {
        this.server
            .to('text-channel:' + event.textChannelId)
            .emit(`text-channel-${event.action}d`, event.usersIds)
    }

    @OnEvent('internal-roles.created')
    @OnEvent('internal-roles.updated')
    @OnEvent('internal-roles.deleted')
    async onRolesCudEvents(event: InternalRolesCudEvent): Promise<void> {
        const sockets = await this.server.fetchSockets()
        const clients = await this.socketIoService.getClients()
        const groupUsersIds: string[] = await this.usersService.getUsersIdsByGroupId(event.groupId)
        const clientsWithChannelsIds = await Promise.all(clients
            .filter(client => groupUsersIds.some(groupUserId => groupUserId === client.userId))
            .map(async client => ({
                client,
                textChannelsIds: await this.textChannelsService.getAllowedToViewTextChannelsIdsByUserId(
                    client.userId
                )
            }))
        )
        clientsWithChannelsIds.forEach(clientWithChannels => {
            const socket = sockets.find(socket => socket.id === clientWithChannels.client.socketId)
            socket.emit('new-allowed-text-channels', clientWithChannels.textChannelsIds)
        })
    }

    // @OnEvent('internal-roles.added')
    // @OnEvent('internal-roles.removed')

}