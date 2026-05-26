import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device } from './device.entity';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';

@Injectable()
export class DevicesService {
  constructor(
    @InjectRepository(Device)
    private readonly deviceRepo: Repository<Device>,
  ) {}

  findAll(userId: string): Promise<Device[]> {
    return this.deviceRepo.find({ where: { userId }, order: { createdAt: 'ASC' } });
  }

  async findOne(id: string, userId: string): Promise<Device> {
    const device = await this.deviceRepo.findOne({ where: { id } });
    if (!device) throw new NotFoundException('Device not found');
    if (device.userId !== userId) throw new ForbiddenException();
    return device;
  }

  async create(userId: string, dto: CreateDeviceDto): Promise<Device> {
    const device = this.deviceRepo.create({ ...dto, userId });
    return this.deviceRepo.save(device);
  }

  async update(id: string, userId: string, dto: UpdateDeviceDto): Promise<Device> {
    const device = await this.findOne(id, userId);
    Object.assign(device, dto);
    return this.deviceRepo.save(device);
  }

  async remove(id: string, userId: string): Promise<void> {
    const device = await this.findOne(id, userId);
    await this.deviceRepo.remove(device);
  }
}
