import type { CandidateId, PowerType } from '../core/types';

export interface GiftMapping {
  giftId: string;
  name: string;
  diamondCost: number;
  power: PowerType;
  candidateBenefited: CandidateId;
  description: string;
  isAvailableInRegion: boolean;
}

export const DEFAULT_GIFT_MAP: GiftMapping[] = [
  {
    giftId: 'rose',
    name: 'Rosa',
    diamondCost: 1,
    power: 'impulse',
    candidateBenefited: 'lula',
    description: 'Impulso de velocidade para Lula',
    isAvailableInRegion: true,
  },
  {
    giftId: 'white_rose',
    name: 'Rosa Branca',
    diamondCost: 1,
    power: 'impulse',
    candidateBenefited: 'flavio',
    description: 'Impulso de velocidade para Flavio',
    isAvailableInRegion: true,
  },
  {
    giftId: 'banana',
    name: 'Banana',
    diamondCost: 5,
    power: 'slip',
    candidateBenefited: 'lula', // Beneficia Lula fazendo Flavio escorregar
    description: 'Faz Flavio escorregar e perder velocidade',
    isAvailableInRegion: true,
  },
  {
    giftId: 'dinosaur',
    name: 'Dinossauro',
    diamondCost: 5,
    power: 'slip',
    candidateBenefited: 'flavio', // Beneficia Flavio fazendo Lula escorregar
    description: 'Faz Lula escorregar e perder velocidade',
    isAvailableInRegion: true,
  },
  {
    giftId: 'donut',
    name: 'Donut',
    diamondCost: 30,
    power: 'superStart',
    candidateBenefited: 'lula',
    description: 'Super arrancada para Lula',
    isAvailableInRegion: true,
  },
  {
    giftId: 'capybara',
    name: 'Capivara',
    diamondCost: 30,
    power: 'superStart',
    candidateBenefited: 'flavio',
    description: 'Super arrancada para Flavio',
    isAvailableInRegion: true,
  },
  {
    giftId: 'confetti',
    name: 'Confete',
    diamondCost: 100,
    power: 'trip',
    candidateBenefited: 'lula',
    description: 'Tropeço em Flavio + escudo protetor para Lula',
    isAvailableInRegion: true,
  },
  {
    giftId: 'balloons',
    name: 'Balões',
    diamondCost: 100,
    power: 'trip',
    candidateBenefited: 'flavio',
    description: 'Tropeço em Lula + escudo protetor para Flavio',
    isAvailableInRegion: true,
  },
];

class GiftRegistry {
  private map: Map<string, GiftMapping> = new Map();

  constructor(initial: GiftMapping[] = DEFAULT_GIFT_MAP) {
    this.load(initial);
  }

  public load(list: GiftMapping[]): void {
    this.map.clear();
    for (const item of list) {
      this.map.set(item.giftId, { ...item });
    }
  }

  public get(giftId: string): GiftMapping | undefined {
    return this.map.get(giftId);
  }

  public list(): GiftMapping[] {
    return Array.from(this.map.values());
  }

  public update(giftId: string, partial: Partial<Omit<GiftMapping, 'giftId'>>): boolean {
    const existing = this.map.get(giftId);
    if (!existing) return false;
    this.map.set(giftId, { ...existing, ...partial });
    return true;
  }

  public addOrUpdate(item: GiftMapping): void {
    this.map.set(item.giftId, { ...item });
  }

  public reset(): void {
    this.load(DEFAULT_GIFT_MAP);
  }
}

export const giftRegistry = new GiftRegistry();
