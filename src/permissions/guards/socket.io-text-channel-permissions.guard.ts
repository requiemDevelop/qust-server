import { Injectable, CanActivate, ExecutionContext, forwardRef, Inject } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Request } from 'src/auth/types/request-response'
import { PERMISSIONS_KEY } from '../decorators/required-permissions.decorator'
import { PermissionsService } from '../permissions.service'
import { RoleTextChannelPermissionsEnum } from '../types/permissions/role-text-channel-permissions.enum'

@Injectable()
export class TextChannelPermissionsGuard implements CanActivate {

    constructor(
        private reflector: Reflector,
        @Inject(forwardRef(() => PermissionsService)) private permissionsService: PermissionsService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredPermissions = this.reflector.getAllAndOverride<RoleTextChannelPermissionsEnum[]>(
            PERMISSIONS_KEY,
            [
                context.getHandler(),
                context.getClass(),
            ]
        )
        if (!requiredPermissions) return true
        const req: Request = context.switchToWs().getClient().handshake
        return await this.permissionsService.doesUserHavePermissionsInTextChannel({
            userId: req.user.id,
            channelId: req.params.channelId,
            requiredPermissions
        })
    }
}