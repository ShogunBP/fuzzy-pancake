/**
 * Mock/Simulador do Adaptador de Live para o Painel Admin.
 * Permite monitorar estado da conexão, estatísticas de doações e histórico de chat.
 */

export interface LiveConnectionStatus {
  state: 'connected' | 'reconnecting' | 'disconnected';
  connectedDurationSec: number;
  reconnectCount: number;
  lastEventTimestamp: number;
  lastError: string | null;
  channelName: string;
}

export interface DonationRecord {
  userId: string;
  userName: string;
  giftId: string;
  giftName: string;
  diamonds: number;
  timestamp: number;
}

export interface ChatMessageRecord {
  userId: string;
  userName: string;
  candidateNumber: '13' | '22';
  message: string;
  timestamp: number;
}

export interface CandidateProfile {
  id: 'lula' | 'flavio';
  name: string;
  number: string;
  color: string;
  avatarUrl: string;
}

export interface TopMessageItem {
  text: string;
  count: number;
  candidateNumber: '13' | '22' | 'both';
  percentage: number;
}

export const MAX_DONATIONS_RETAINED = 200;
export const MAX_CHAT_MESSAGES_RETAINED = 200;

export class LiveServiceMock {
  private status: LiveConnectionStatus = {
    state: 'connected',
    connectedDurationSec: 1420,
    reconnectCount: 0,
    lastEventTimestamp: Date.now(),
    lastError: null,
    channelName: '@eleicoes_brasil_2026',
  };

  private donations: DonationRecord[] = [
    { userId: 'user_1', userName: '@eleitor_13', giftId: 'rose', giftName: 'Rosa', diamonds: 1, timestamp: Date.now() - 12000 },
    { userId: 'user_2', userName: '@patriota_22', giftId: 'white_rose', giftName: 'Rosa Branca', diamonds: 1, timestamp: Date.now() - 9500 },
    { userId: 'user_3', userName: '@brasil_pixel', giftId: 'banana', giftName: 'Banana', diamonds: 5, timestamp: Date.now() - 6200 },
    { userId: 'user_4', userName: '@gamer_nordeste', giftId: 'donut', giftName: 'Donut', diamonds: 30, timestamp: Date.now() - 3100 },
    { userId: 'user_1', userName: '@eleitor_13', giftId: 'confetti', giftName: 'Confete', diamonds: 100, timestamp: Date.now() - 1500 },
  ];

  private chatMessages: ChatMessageRecord[] = [
    { userId: 'user_1', userName: '@eleitor_13', candidateNumber: '13', message: '13', timestamp: Date.now() - 14000 },
    { userId: 'user_2', userName: '@patriota_22', candidateNumber: '22', message: '22', timestamp: Date.now() - 11000 },
    { userId: 'user_5', userName: '@nordeste_vote', candidateNumber: '13', message: '13 na liderança!', timestamp: Date.now() - 8000 },
    { userId: 'user_6', userName: '@sul_capitao', candidateNumber: '22', message: '22', timestamp: Date.now() - 4000 },
    { userId: 'user_7', userName: '@eleitor_centro', candidateNumber: '13', message: '13', timestamp: Date.now() - 2000 },
    { userId: 'user_8', userName: '@brasil_avanca', candidateNumber: '22', message: '22!', timestamp: Date.now() - 1000 },
  ];

  private candidates: Record<'lula' | 'flavio', CandidateProfile> = {
    lula: {
      id: 'lula',
      name: 'Lula',
      number: '13',
      color: '#ef4444',
      avatarUrl: '',
    },
    flavio: {
      id: 'flavio',
      name: 'Flávio',
      number: '22',
      color: '#3b82f6',
      avatarUrl: '',
    },
  };

  private connectionListeners: Set<(status: LiveConnectionStatus) => void> = new Set();
  private dataListeners: Set<() => void> = new Set();
  private candidateListeners: Set<(candidates: Record<'lula' | 'flavio', CandidateProfile>) => void> = new Set();

  public getConnectionStatus(): LiveConnectionStatus {
    return { ...this.status };
  }

  public onConnectionChange(listener: (status: LiveConnectionStatus) => void): () => void {
    this.connectionListeners.add(listener);
    return () => this.connectionListeners.delete(listener);
  }

  public onDataChange(listener: () => void): () => void {
    this.dataListeners.add(listener);
    return () => this.dataListeners.delete(listener);
  }

  public onCandidateChange(listener: (candidates: Record<'lula' | 'flavio', CandidateProfile>) => void): () => void {
    this.candidateListeners.add(listener);
    return () => this.candidateListeners.delete(listener);
  }

  private notifyConnection(): void {
    for (const listener of this.connectionListeners) {
      try {
        listener(this.getConnectionStatus());
      } catch {
        // Ignora erros
      }
    }
  }

  private notifyData(): void {
    for (const listener of this.dataListeners) {
      try {
        listener();
      } catch {
        // Ignora erros
      }
    }
  }

  private notifyCandidates(): void {
    const cand = this.getCandidateProfiles();
    for (const listener of this.candidateListeners) {
      try {
        listener(cand);
      } catch {
        // Ignora erros
      }
    }
  }

  public reconnect(): void {
    this.status.state = 'reconnecting';
    this.status.reconnectCount++;
    this.status.lastError = null;
    this.notifyConnection();

    setTimeout(() => {
      this.status.state = 'connected';
      this.status.lastEventTimestamp = Date.now();
      this.notifyConnection();
    }, 1200);
  }

  public disconnect(reason = 'Conexão encerrada pelo operador'): void {
    this.status.state = 'disconnected';
    this.status.lastError = reason;
    this.notifyConnection();
  }

  public recordDonation(record: DonationRecord): void {
    this.donations.unshift(record);
    // Política de retenção: limita ao teto configurado
    if (this.donations.length > MAX_DONATIONS_RETAINED) {
      this.donations.length = MAX_DONATIONS_RETAINED;
    }
    this.status.lastEventTimestamp = Date.now();
    this.notifyData();
  }

  public recordChatMessage(msg: ChatMessageRecord): void {
    this.chatMessages.unshift(msg);
    // Política de retenção: limita ao teto configurado
    if (this.chatMessages.length > MAX_CHAT_MESSAGES_RETAINED) {
      this.chatMessages.length = MAX_CHAT_MESSAGES_RETAINED;
    }
    this.status.lastEventTimestamp = Date.now();
    this.notifyData();
  }

  public getDonations(windowMs?: number): DonationRecord[] {
    if (!windowMs) return [...this.donations];
    const threshold = Date.now() - windowMs;
    return this.donations.filter((d) => d.timestamp >= threshold);
  }

  public getChatMessages(windowMs?: number): ChatMessageRecord[] {
    if (!windowMs) return [...this.chatMessages];
    const threshold = Date.now() - windowMs;
    return this.chatMessages.filter((m) => m.timestamp >= threshold);
  }

  public getTopDonors(limit = 5, windowMs?: number): { userName: string; totalDiamonds: number; count: number }[] {
    const source = this.getDonations(windowMs);
    const map = new Map<string, { totalDiamonds: number; count: number }>();
    for (const d of source) {
      const cur = map.get(d.userName) ?? { totalDiamonds: 0, count: 0 };
      cur.totalDiamonds += d.diamonds;
      cur.count += 1;
      map.set(d.userName, cur);
    }
    return Array.from(map.entries())
      .map(([userName, stats]) => ({ userName, ...stats }))
      .sort((a, b) => b.totalDiamonds - a.totalDiamonds)
      .slice(0, limit);
  }

  /**
   * Definição de Top Mensagens:
   * Mensagens mais frequentes na janela de tempo especificada (ou sessão completa),
   * agrupadas pelo texto normalizado, informando a contagem total, porcentagem da audiência
   * e o candidato correspondente.
   */
  public getTopMessages(limit = 10, windowMs?: number): TopMessageItem[] {
    const source = this.getChatMessages(windowMs);
    const totalCount = source.length;
    if (totalCount === 0) return [];

    const map = new Map<string, { count: number; candidate13: number; candidate22: number }>();
    for (const msg of source) {
      const normalized = msg.message.trim().toLowerCase();
      const current = map.get(normalized) ?? { count: 0, candidate13: 0, candidate22: 0 };
      current.count++;
      if (msg.candidateNumber === '13') current.candidate13++;
      if (msg.candidateNumber === '22') current.candidate22++;
      map.set(normalized, current);
    }

    return Array.from(map.entries())
      .map(([text, stats]) => {
        let candidateNumber: '13' | '22' | 'both' = 'both';
        if (stats.candidate13 > stats.candidate22) candidateNumber = '13';
        else if (stats.candidate22 > stats.candidate13) candidateNumber = '22';

        return {
          text,
          count: stats.count,
          candidateNumber,
          percentage: Math.round((stats.count / totalCount) * 100),
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  public getCandidateProfiles(): Record<'lula' | 'flavio', CandidateProfile> {
    return {
      lula: { ...this.candidates.lula },
      flavio: { ...this.candidates.flavio },
    };
  }

  public updateCandidateProfile(id: 'lula' | 'flavio', partial: Partial<CandidateProfile>): void {
    this.candidates[id] = { ...this.candidates[id], ...partial };
    this.notifyCandidates();
  }
}

export const liveServiceMock = new LiveServiceMock();
