import { Injectable, CanActivate, ExecutionContext, Inject } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Request } from 'src/auth/types/request-response'
import { TEXTCHANNEL_PERMISSIONS_KEY } from '../decorators/required-text-channel-permissions.decorator'
import { PermissionsService } from '../permissions.service'
import { RoleTextChannelPermissionsEnum } from '../types/permissions/role-text-channel-permissions.enum'

@Injectable()
export class TextChannelPermissionsGuard implements CanActivate {

    constructor(
        @Inject(Reflector) private reflector: Reflector,
        @Inject(PermissionsService) private permissionsService: PermissionsService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredPermissions = this.reflector.getAllAndOverride<RoleTextChannelPermissionsEnum[]>(
            TEXTCHANNEL_PERMISSIONS_KEY,
            [
                context.getHandler(),
                context.getClass(),
            ]
        )
        if (!requiredPermissions) return true
        const req: Request = context.switchToHttp().getRequest()
        return await this.permissionsService.doesUserHavePermissionsInTextChannel({
            userId: req.user.id,
            textChannelId: req.params.textChannelId,
            requiredPermissions: requiredPermissions || []
        })
    }
}