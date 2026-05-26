import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Inject, OnModuleDestroy } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { Redis } from 'ioredis';
import { REDIS_CLIENT } from '../../infrastructure/redis/redis.module';

interface LiveMessage {
  userId: string;
  reading: unknown;
}

interface AlertMessage {
  userId: string;
  anomaly: unknown;
}

@WebSocketGateway({
  cors: { origin: '*', credentials: false },
  transports: ['websocket', 'polling'],
})
export class EnergyGateway
  implements OnGatewayInit, OnGatewayDisconnect, OnModuleDestroy
{
  @WebSocketServer()
  private readonly server!: Server;

  private subscriber!: Redis;

  constructor(
    @Inject(REDIS_CLIENT)
    private readonly redis: Redis,
    private readonly jwtService: JwtService,
  ) {}

  afterInit(): void {
    // BullMQ and publish share the main Redis connection.
    // Subscribe needs a dedicated connection — ioredis cannot do both on one connection.
    this.subscriber = this.redis.duplicate();

    this.subscriber.subscribe('energy.live', 'energy.alerts', (err) => {
      if (err) console.error('[Gateway] Redis subscribe error:', err.message);
    });

    this.subscriber.on('message', (channel: string, message: string) => {
      try {
        if (channel === 'energy.live') {
          const { userId, reading } = JSON.parse(message) as LiveMessage;
          this.server.to(`user:${userId}`).emit('energy.update', reading);
        } else if (channel === 'energy.alerts') {
          const { userId, anomaly } = JSON.parse(message) as AlertMessage;
          this.server.to(`user:${userId}`).emit('alert', anomaly);
        }
      } catch {
        // malformed Redis message — ignore
      }
    });
  }

  handleDisconnect(client: Socket): void {
    for (const room of [...client.rooms]) void client.leave(room);
  }

  async onModuleDestroy(): Promise<void> {
    await this.subscriber.quit();
  }

  @SubscribeMessage('join')
  async handleJoin(
    @MessageBody() data: { token: string },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    try {
      const payload = this.jwtService.verify<{ sub: string }>(data.token);
      await client.join(`user:${payload.sub}`);
      client.emit('joined', { room: `user:${payload.sub}` });
    } catch {
      client.emit('error', { message: 'Invalid token' });
      client.disconnect();
    }
  }
}
