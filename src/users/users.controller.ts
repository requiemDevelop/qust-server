import {
    Body,
    Controller,
    Delete,
    ForbiddenException,
    Get,
    NotFoundException,
    Param,
    Post,
    Put,
    UseGuards,
} from '@nestjs/common'
import { isAdmin } from 'src/utils/isAdmin.decorator'
import { UsersService } from './users.service'
import { User } from './models/users.model'
import { UpdateUserDto } from './dto/update-user.dto'
import { CurrentUser } from 'src/utils/current-user.decorator'
import { CreateUserDto } from './dto/create-user.dto'
import { AdminGuard } from 'src/auth/guards/admin.guard'


@Controller('/users')
export class UsersController {

    constructor(
        private usersService: UsersService,
    ) {}

    @Get('/')
    async getAllUsers(): Promise<User[]> {
        const users: User[] = await this.usersService.getAllUsers()
        return users
    }

    @Get('/:id')
    async getUserById(
        @Param('id') authorId: number,
    ): Promise<User> {
        const user: User = await this.usersService.getUserById(authorId)
        if (user)
            return user
        throw new NotFoundException({ message: 'User not found' })
    }

    @Post('/')
    @isAdmin()
    @UseGuards(AuthGuard, AdminGuard)
    async createUser(
        @Body() dto: CreateUserDto,
    ): Promise<User> {
        const user: User = await this.usersService.createUser(dto)
        return user
    }

    @Put('/:id')
    @UseGuards(AuthGuard)
    async updateUser(
        @Param('id') userId: number,
        @Body() dto: UpdateUserDto,
        @CurrentUser() { id, isAdmin },
    ): Promise<User> {
        if (!userId)
            userId = id
        const user: User = await this.usersService.getUserById(userId)
        if (!user) {
            throw new NotFoundException({ message: 'User does not exists' })
        }
        if (id !== userId && isAdmin) {
            throw new ForbiddenException({ message: 'You have no access' })
        }
        const updatedUser: User = await this.usersService.updateUser(userId, dto)
        return updatedUser
    }

    @Delete('/:id')
    @isAdmin()
    @UseGuards(AuthGuard, AdminGuard)
    async deleteUser(
        @Param('id') authorId: number,
    ): Promise<User> {
        const user: User = await this.usersService.deleteUser(authorId)
        return user
    }

}