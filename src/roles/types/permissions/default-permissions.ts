import { RolePermissionsListClass } from './role-permissions-list.class'
import { ForcedPermissionLevel } from '../permission-level'

export const DefaultRolePermissions: RolePermissionsListClass = {
    manageGroup: ForcedPermissionLevel.NOT_ALOWED,
    manageTextChannels: ForcedPermissionLevel.NOT_ALOWED,
    manageCategories: ForcedPermissionLevel.NOT_ALOWED,
    manageRoles: ForcedPermissionLevel.NOT_ALOWED,
    manageEvents: ForcedPermissionLevel.NOT_ALOWED,
    manageEmojis: ForcedPermissionLevel.NOT_ALOWED,
    readAuditLog: ForcedPermissionLevel.NOT_ALOWED,
    banUsers: ForcedPermissionLevel.NOT_ALOWED,
    inviteUsers: ForcedPermissionLevel.ALOWED,
    viewTextChannels: ForcedPermissionLevel.ALOWED,
    readMessages: ForcedPermissionLevel.ALOWED,
    writeMessages: ForcedPermissionLevel.ALOWED,
    deleteMessages: ForcedPermissionLevel.NOT_ALOWED,
    embedLinks: ForcedPermissionLevel.ALOWED,
    embedFiles: ForcedPermissionLevel.ALOWED,
    addReactions: ForcedPermissionLevel.ALOWED,
    useEmojis: ForcedPermissionLevel.ALOWED,
    useExternalEmojis: ForcedPermissionLevel.ALOWED,
    mentionDefaultRoles: ForcedPermissionLevel.ALOWED,
    mentionCustomRoles: ForcedPermissionLevel.ALOWED,
    voiceConnect: ForcedPermissionLevel.ALOWED,
    voiceSpeak: ForcedPermissionLevel.ALOWED,
    streamVideo: ForcedPermissionLevel.ALOWED,
    muteMembers: ForcedPermissionLevel.NOT_ALOWED,
    deafenMembers: ForcedPermissionLevel.NOT_ALOWED,
    moveMembers: ForcedPermissionLevel.NOT_ALOWED,
}