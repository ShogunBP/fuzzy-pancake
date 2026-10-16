import { describe, expect, it } from 'vitest';
import { DEFAULT_GIFT_MAP, giftRegistry } from './gifts';

describe('GiftRegistry', () => {
  it('carrega o mapa padrão de presentes por giftId com custo e efeito', () => {
    const gifts = giftRegistry.list();
    expect(gifts.length).toBe(DEFAULT_GIFT_MAP.length);

    const rose = giftRegistry.get('rose');
    expect(rose).toBeDefined();
    expect(rose?.candidateBenefited).toBe('lula');
    expect(rose?.power).toBe('impulse');
    expect(rose?.diamondCost).toBe(1);

    const banana = giftRegistry.get('banana');
    expect(banana?.power).toBe('slip');
    expect(banana?.candidateBenefited).toBe('lula');
  });

  it('permite atualizar propriedades de um presente por giftId', () => {
    giftRegistry.update('rose', { diamondCost: 2 });
    expect(giftRegistry.get('rose')?.diamondCost).toBe(2);

    // Restaura default
    giftRegistry.update('rose', { diamondCost: 1 });
    expect(giftRegistry.get('rose')?.diamondCost).toBe(1);
  });

  it('permite adicionar ou resetar presentes para o mapa padrão', () => {
    giftRegistry.addOrUpdate({
      giftId: 'custom_fireworks',
      name: 'Fogos de Artifício',
      diamondCost: 50,
      power: 'superStart',
      candidateBenefited: 'lula',
      description: 'Efeito personalizado de teste',
      isAvailableInRegion: true,
    });

    expect(giftRegistry.get('custom_fireworks')).toBeDefined();
    expect(giftRegistry.get('custom_fireworks')?.diamondCost).toBe(50);

    giftRegistry.reset();
    expect(giftRegistry.get('custom_fireworks')).toBeUndefined();
    expect(giftRegistry.list().length).toBe(DEFAULT_GIFT_MAP.length);
  });
});
