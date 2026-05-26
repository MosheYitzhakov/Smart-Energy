import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TariffConfig } from './tariff-config.entity';
import { UpsertTariffDto } from './dto/upsert-tariff.dto';

const DEFAULTS = {
  peakRate: 0.65,
  offPeakRate: 0.48,
  peakStart: 17,
  peakEnd: 22,
};

type TariffData = typeof DEFAULTS;

@Injectable()
export class TariffsService {
  constructor(
    @InjectRepository(TariffConfig)
    private readonly repo: Repository<TariffConfig>,
  ) {}

  async get(userId: string): Promise<TariffData> {
    const existing = await this.repo.findOne({ where: { userId } });
    return existing ? this.coerce(existing) : { ...DEFAULTS };
  }

  async upsert(userId: string, dto: UpsertTariffDto): Promise<TariffData> {
    const existing = await this.repo.findOne({ where: { userId } });
    if (existing) {
      this.repo.merge(existing, dto);
      return this.coerce(await this.repo.save(existing));
    }
    return this.coerce(
      await this.repo.save(this.repo.create({ userId, ...dto })),
    );
  }

  /** PostgreSQL DECIMAL columns come back as strings — coerce to number. */
  private coerce(cfg: TariffConfig): TariffData {
    return {
      peakRate: Number(cfg.peakRate),
      offPeakRate: Number(cfg.offPeakRate),
      peakStart: Number(cfg.peakStart),
      peakEnd: Number(cfg.peakEnd),
    };
  }
}
