import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { UserFromRequest } from 'src/auth/types/request-response'

export const SocketIoCurrentUser = createParamDecorator(
    (data: unknown, ctx: ExecutionContext): UserFromRequest => {
        const req = ctx.switchToWs().getClient().handshake
        return req.user
    }
)