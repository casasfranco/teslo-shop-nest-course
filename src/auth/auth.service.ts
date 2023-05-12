import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';

import { CreateUserDto, LoginUserDto } from './dto';
import { User } from './entities/user.entity';
import { JwtPayload } from './interfaces';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtServive: JwtService,
  ) {}
  async create(createUserDto: CreateUserDto) {
    try {
      const { password, ...userData } = createUserDto;

      const user = this.userRepository.create({
        ...userData,
        password: bcrypt.hashSync(password, 10),
      });

      await this.userRepository.save(user);
      delete user.password;

      return { ...user, token: this.getJwtToken({ id: user.id }) };
    } catch (error) {
      this.handleDBErrors(error);
    }
  }

  async login(loginUserDto: LoginUserDto) {
    const { email, password } = loginUserDto;
    const user = await this.userRepository.findOne({
      where: { email },
      select: { email: true, password: true, id: true },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid email/passsword');
    }
    if (!bcrypt.compareSync(password, user.password)) {
      throw new UnauthorizedException('Invalid email/password');
    }

    return { ...user, token: this.getJwtToken({ id: user.id }) };
  }

  async checkAuthStatus(user: User) {
    return { ...user, token: this.getJwtToken({ id: user.id }) };
  }

  private getJwtToken(payload: JwtPayload) {
    return this.jwtServive.sign(payload);
  }

  private handleDBErrors(error: any): never {
    if (error.code === '23505') throw new BadRequestException(error.detail);
    console.log(error);
    throw new InternalServerErrorException('Please check server logs  ');
  }
}
