import { EnergyService } from '../energy.service';
import type { EnergyReading as EnergyReadingContract } from '../../../domain/contracts';

const reading: EnergyReadingContract = {
  deviceId: 'dev-1',
  timestamp: 1_700_000_000_000,
  watts: 500,
  kwhTotal: 10.5,
  source: 'simulation',
};

const makeQbMock = () => {
  const qb = {
    insert: jest.fn(),
    into: jest.fn(),
    values: jest.fn(),
    orIgnore: jest.fn(),
    execute: jest.fn().mockResolvedValue(undefined),
  };
  qb.insert.mockReturnValue(qb);
  qb.into.mockReturnValue(qb);
  qb.values.mockReturnValue(qb);
  qb.orIgnore.mockReturnValue(qb);
  return qb;
};

describe('EnergyService.upsertReading', () => {
  it('calls orIgnore so duplicate writes do not throw', async () => {
    const qb = makeQbMock();
    const readingRepo = { createQueryBuilder: jest.fn().mockReturnValue(qb) } as any;
    const service = new EnergyService(readingRepo, {} as any, {} as any);

    await service.upsertReading(reading);

    expect(qb.orIgnore).toHaveBeenCalled();
    expect(qb.execute).toHaveBeenCalledTimes(1);
  });

  it('is idempotent — calling twice does not throw', async () => {
    const qb = makeQbMock();
    const readingRepo = { createQueryBuilder: jest.fn().mockReturnValue(qb) } as any;
    const service = new EnergyService(readingRepo, {} as any, {} as any);

    await expect(service.upsertReading(reading)).resolves.toBeUndefined();
    await expect(service.upsertReading(reading)).resolves.toBeUndefined();
    expect(qb.execute).toHaveBeenCalledTimes(2);
  });
});
