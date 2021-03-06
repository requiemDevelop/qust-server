import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import { CreateCategoriesAndRolesByLayoutsDto } from 'src/categories/dto/create-categories-and-roles-layout.dto'
import { Category } from 'src/categories/models/categories.model'
import { CategoryRolePermissions } from 'src/categories/models/category-role-permissions.model'
import { GroupAuditLog } from 'src/group-audit-logs/models/group-audit-logs.model'
import { GroupBlacklist } from 'src/group-blacklists/models/group-blacklists.model'
import { RolePermissions } from 'src/permissions/models/role-permissions.model'
import { Role } from 'src/roles/models/roles.model'
import { TextChannelRolePermissions } from 'src/text-channels/models/text-channel-role-permissions.model'
import { TextChannel } from 'src/text-channels/models/text-channels.model'
import { CategoryLayout, RoleLayout } from './types/group-layout.class'


@Injectable()
export class LayoutsService {

    constructor(
        @InjectModel(GroupBlacklist) private blacklistRepository: typeof GroupBlacklist,
        @InjectModel(GroupAuditLog) private auditLogRepository: typeof GroupAuditLog,
        @InjectModel(Role) private roleRepository: typeof Role,
        @InjectModel(RolePermissions) private rolePermissionsRepository: typeof RolePermissions,
        @InjectModel(Category) private categoryRepository: typeof Category,
        @InjectModel(CategoryRolePermissions)
            private categoryPermissionsRepository: typeof CategoryRolePermissions,
        @InjectModel(TextChannel) private textChannelRepository: typeof TextChannel,
        @InjectModel(TextChannelRolePermissions)
            private channelPermissionsRepository: typeof TextChannelRolePermissions,
    ) {}

    private async createGroupBlacklist(groupId: string): Promise<GroupBlacklist> {
        return await this.blacklistRepository.create({ groupId })
    }

    private async createGroupAuditLog(groupId: string): Promise<GroupAuditLog> {
        return await this.auditLogRepository.create({ groupId })
    }

    async createBlacklistRolesCategoriesAndTextChannelsByLayout(
        { groupId, groupLayout }: CreateCategoriesAndRolesByLayoutsDto
    ): Promise<void> {

        await this.createGroupBlacklist(groupId)
        await this.createGroupAuditLog(groupId)

        if (!groupLayout.roleLayouts)
            groupLayout.roleLayouts = [ { name: 'everyone' } ]
        else if (!groupLayout.roleLayouts.find(layout => layout.name === 'everyone'))
            groupLayout.roleLayouts.push({ name: 'everyone' })

        const roles: Role[] = await this.createRolesByRoleLayouts(
            groupLayout.roleLayouts,
            groupId
        )
        await this.createRoleGroupPermissionsByRoleLayouts(
            groupLayout.roleLayouts,
            roles
        )

        const categories: Category[] = await this.createCategoryByCategoryLayouts(
            groupLayout.categoryLayouts,
            groupId
        )
        await this.createRoleCategoryPermissionsByCategoryLayouts(
            groupLayout.categoryLayouts,
            roles,
            categories
        )

        const channels: TextChannel[] = await this.createChannelsByCategoryLayouts(
            groupLayout.categoryLayouts,
            categories
        )
        await this.createRoleTextChannelPermissionsByCategoryLayouts(
            groupLayout.categoryLayouts,
            roles,
            channels
        )

        return
    }

    private async createRolesByRoleLayouts(
        roleLayouts: RoleLayout[],
        groupId: string
    ): Promise<Role[]> {
        const roles: Role[] =
            await this.roleRepository.bulkCreate(roleLayouts.map(roleLayout => ({
                name: roleLayout.name,
                groupId
            })))
        return roles
    }

    private async createRoleGroupPermissionsByRoleLayouts(
        roleLayouts: RoleLayout[],
        roles: Role[]
    ): Promise<RolePermissions[]> {
        const permissionsRows: RolePermissions[] =
            await this.rolePermissionsRepository.bulkCreate(roleLayouts.map(roleLayout => (
                { roleId: roles.find(role => role.name === roleLayout.name).id }
            )), { validate: true })
        return permissionsRows
    }

    private async createCategoryByCategoryLayouts(
        categoryLayouts: CategoryLayout[],
        groupId: string
    ): Promise<Category[]> {
        const categories: Category[] =
            await this.categoryRepository.bulkCreate(categoryLayouts.map(categoryLayout => ({
                name: categoryLayout.name,
                groupId
            })), { validate: true })
        return categories
    }

    private async createRoleCategoryPermissionsByCategoryLayouts(
        categoryLayouts: CategoryLayout[],
        roles: Role[],
        categories: Category[]
    ): Promise<CategoryRolePermissions[]> {
        const permissionsRows: CategoryRolePermissions[] =
            await this.categoryPermissionsRepository.bulkCreate([].concat(
                ...categoryLayouts.map((categoryLayout, categoryIndex) => {
                    return categoryLayout.permissionsOfRoles?.map(roleWithPermissions => ({
                        roleId: roles.find(role => role.name === roleWithPermissions.roleName).id,
                        categoryId: categories[categoryIndex].id,
                        ...roleWithPermissions.permissions
                    }))
                })
            ).filter(value => value), { validate: true })
        return permissionsRows
    }

    private async createChannelsByCategoryLayouts(
        categoryLayouts: CategoryLayout[],
        categories: Category[]
    ): Promise<TextChannel[]> {
        const channels: TextChannel[] =
            await this.textChannelRepository.bulkCreate([].concat(
                ...categoryLayouts.map((categoryLayout, categoryIndex) => {
                    return categoryLayout.channelLayouts.map(channelLayout => ({
                        name: channelLayout.name,
                        categoryId: categories[categoryIndex].id
                    }))
                })
            ), { validate: true })
        return channels
    }

    private async createRoleTextChannelPermissionsByCategoryLayouts(
        categoryLayouts: CategoryLayout[],
        roles: Role[],
        channels: TextChannel[]
    ): Promise<TextChannelRolePermissions[]> {
        const permissionsRows: TextChannelRolePermissions[] =
            await this.channelPermissionsRepository.bulkCreate([].concat(...[].concat(
                ...categoryLayouts.map(categoryLayout => {
                    return categoryLayout.channelLayouts.map((channelLayout, channelIndex) => {
                        return channelLayout.permissionsOfRoles?.map(roleWithPermissions => ({
                            roleId: roles.find(role => role.name === roleWithPermissions.roleName).id,
                            textChannelId: channels[channelIndex].id,
                            ...roleWithPermissions.permissions
                        }))
                    })
                })
            ).filter(value => value)), { validate: true })
        return permissionsRows
    }

}