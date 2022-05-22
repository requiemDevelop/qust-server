import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import { StandardGroupLayouts } from 'src/layouts/types/standard-group-layouts'
import { CreateGroupDto } from './dto/create-group.dto'
import { LayoutsService } from '../layouts/layouts.service'
import { Group } from './models/groups.model'
import { AddUserToGroupDto } from './dto/add-user-to-group.dto'
import { GroupUser } from './models/group-user.model'
import { Category } from 'src/categories/models/categories.model'
import { TextChannel } from 'src/text-channels/models/text-channels.model'


@Injectable()
export class GroupsService {

    constructor(
        private layoutsService: LayoutsService,
        @InjectModel(Group) private groupRepository: typeof Group,
        @InjectModel(GroupUser) private groupUserRepository: typeof GroupUser,
    ) {}

    async getGroupById(groupId: string, includeCategoriesAndChannels?: boolean): Promise<Group> {
        const group: Group =
            includeCategoriesAndChannels
                ?
                await this.groupRepository.findByPk(groupId,
                    { include: [ { model: Category, include: [ TextChannel ] } ] }
                )
                :
                await this.groupRepository.findByPk(groupId)
        return group
    }

    async getGroupsIdsByUserId(userId: string): Promise<string[]> {
        return (await this.groupUserRepository.findAll({ where: { userId } })).map(row => row.groupId)
    }

    async isUserGroupParticipant(userId: string, groupId: string): Promise<boolean> {
        return !!await this.groupUserRepository.findOne({ where: { userId, groupId } })
    }

    async createGroup(dto: CreateGroupDto): Promise<Group> {
        const group: Group = await this.groupRepository.create(dto)
        await this.layoutsService.createRolesCategoriesAndTextChannelsByLayout({
            groupId: group.id,
            groupLayout: StandardGroupLayouts[dto.layout || 'DEFAULT']
        })
        return group
    }

    // async deleteGroup

    async addUserToGroup(dto: AddUserToGroupDto): Promise<GroupUser> {
        const groupUser: GroupUser = await this.groupUserRepository.create(dto)
        return groupUser
    }

}