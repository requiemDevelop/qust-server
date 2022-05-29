import { Injectable } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { InjectModel } from '@nestjs/sequelize'
import { Includeable } from 'sequelize/types'
import { SendChatMessageDto } from './dto/send-chat-message.dto'
import { InternalChatsMessageSentEvent } from './events/internal-chats.message-sent.event'
import { MessagesService } from './messages.service'
import { ChatMessage } from './models/chat-message.model'
import { Message } from './models/messages.model'


@Injectable()
export class ChatMessageService {

    constructor(
        private messageService: MessagesService,
        private eventEmitter: EventEmitter2,
        @InjectModel(ChatMessage) private chatMessageRepository: typeof ChatMessage,
    ) {}

    async getChatMessageRow(messageId: string): Promise<ChatMessage> {
        const row: ChatMessage = await this.chatMessageRepository.findOne({ where: { messageId } })
        return row
    }

    async getMessagesFromChat(
        chatId: string,
        include?: Includeable | Includeable[],
        limit?: number,
        offset?: number,
    ): Promise<Message[]> {
        const messagesIds: string[] =
            (await this.chatMessageRepository.findAll({ where: { chatId } })).map(row => row.messageId)
        const messages: Message[] =
            await this.messageService.getMessagesByIds(messagesIds, include, limit, offset)
        return messages
    }

    async sendMessageToChat(dto: SendChatMessageDto): Promise<Message> {
        const message: Message = await this.messageService.createMessage({ ...dto })
        await this.chatMessageRepository.create({ messageId: message.id, chatId: dto.chatId })
        this.eventEmitter.emit(
            'internal-chats.message-sent',
            new InternalChatsMessageSentEvent({ message, chatId: dto.chatId })
        )
        return message
    }

}