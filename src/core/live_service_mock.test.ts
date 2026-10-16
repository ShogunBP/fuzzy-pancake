import { describe, expect, it } from 'vitest';
import {
  LiveServiceMock,
  MAX_CHAT_MESSAGES_RETAINED,
  MAX_DONATIONS_RETAINED,
} from './live_service_mock';

describe('LiveServiceMock', () => {
  it('deve fornecer status inicial de conexão e permitir reconexão', () => {
    const service = new LiveServiceMock();
    const initial = service.getConnectionStatus();
    expect(initial.state).toBe('connected');
    expect(initial.channelName).toBeDefined();

    service.disconnect();
    expect(service.getConnectionStatus().state).toBe('disconnected');
  });

  it('deve calcular top doadores corretamente', () => {
    const service = new LiveServiceMock();
    service.recordDonation({
      userId: 'test_top',
      userName: '@super_doador',
      giftId: 'confetti',
      giftName: 'Confete',
      diamonds: 500,
      timestamp: Date.now(),
    });

    const top = service.getTopDonors(1);
    expect(top.length).toBe(1);
    expect(top[0].userName).toBe('@super_doador');
    expect(top[0].totalDiamonds).toBe(500);
  });

  it('deve permitir atualizar perfil dos candidatos e notificar listeners', () => {
    const service = new LiveServiceMock();
    let notified = false;
    service.onCandidateChange((candidates) => {
      notified = true;
      expect(candidates.lula.name).toBe('Lula Editado');
    });

    service.updateCandidateProfile('lula', { name: 'Lula Editado' });
    expect(service.getCandidateProfiles().lula.name).toBe('Lula Editado');
    expect(notified).toBe(true);
  });

  it('deve respeitar a política de retenção para mensagens de chat (máximo 200)', () => {
    const service = new LiveServiceMock();
    for (let i = 0; i < 250; i++) {
      service.recordChatMessage({
        userId: `user_${i}`,
        userName: `@user_${i}`,
        candidateNumber: i % 2 === 0 ? '13' : '22',
        message: `Mensagem ${i}`,
        timestamp: Date.now(),
      });
    }

    const messages = service.getChatMessages();
    expect(messages.length).toBe(MAX_CHAT_MESSAGES_RETAINED);
    expect(messages.length).toBe(200);
    // Mais recente primeiro
    expect(messages[0].message).toBe('Mensagem 249');
  });

  it('deve respeitar a política de retenção para doações (máximo 200)', () => {
    const service = new LiveServiceMock();
    for (let i = 0; i < 250; i++) {
      service.recordDonation({
        userId: `donor_${i}`,
        userName: `@donor_${i}`,
        giftId: 'rose',
        giftName: 'Rosa',
        diamonds: 1,
        timestamp: Date.now(),
      });
    }

    const donations = service.getDonations();
    expect(donations.length).toBe(MAX_DONATIONS_RETAINED);
    expect(donations.length).toBe(200);
    expect(donations[0].userName).toBe('@donor_249');
  });

  it('deve calcular top mensagens agregadas com contagem, porcentagem e candidato', () => {
    const service = new LiveServiceMock();
    // Limpar mensagens iniciais
    for (let i = 0; i < 10; i++) {
      service.recordChatMessage({
        userId: `u_${i}`,
        userName: `@u_${i}`,
        candidateNumber: '13',
        message: '13!',
        timestamp: Date.now(),
      });
    }
    for (let i = 0; i < 5; i++) {
      service.recordChatMessage({
        userId: `u2_${i}`,
        userName: `@u2_${i}`,
        candidateNumber: '22',
        message: '22',
        timestamp: Date.now(),
      });
    }

    const top = service.getTopMessages(5);
    expect(top.length).toBeGreaterThan(0);
    expect(top[0].text).toBe('13!');
    expect(top[0].count).toBe(10);
    expect(top[0].candidateNumber).toBe('13');
    expect(top[0].percentage).toBeGreaterThan(0);
  });
});
