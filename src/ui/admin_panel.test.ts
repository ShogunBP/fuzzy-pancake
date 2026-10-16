// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest';
import { giftRegistry } from '../config/gifts';
import { liveServiceMock } from '../core/live_service_mock';
import { RaceEngine } from '../core/race_engine';
import { AdminPanel, escapeHtml } from './admin_panel';

describe('AdminPanel - Segurança contra XSS e Sanitização de Conteúdo Externo', () => {
  let engine: RaceEngine;
  let container: HTMLElement;
  let panel: AdminPanel;

  beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);

    engine = new RaceEngine({ seed: 12345 });
    panel = new AdminPanel(engine, container);
  });

  describe('escapeHtml utility', () => {
    it('escapa corretamente caracteres especiais perigosos', () => {
      const malicious = '<img src=x onerror="alert(1)"> & <script>alert("xss")</script>';
      const escaped = escapeHtml(malicious);

      expect(escaped).not.toContain('<img');
      expect(escaped).not.toContain('<script');
      expect(escaped).toContain('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
      expect(escaped).toContain('&amp;');
      expect(escaped).toContain('&lt;script&gt;');
    });

    it('trata valores vazios ou nulos sem quebrar', () => {
      expect(escapeHtml('')).toBe('');
      expect(escapeHtml(null as unknown as string)).toBe('');
      expect(escapeHtml(undefined as unknown as string)).toBe('');
    });
  });

  describe('Proteção XSS em mensagens do Chat do TikTok (Feed ao vivo e Top mensagens)', () => {
    it('renderiza usuário e comentário maliciosos via textContent sem criar nós de imagem ou executar script', () => {
      const xssPayload = '<img src=x onerror="window.__xss_executed=true">';
      const maliciousUser = '<img src=x onerror="window.__xss_user=true">@hacker';

      liveServiceMock.recordChatMessage({
        userId: 'malicious_user_1',
        userName: maliciousUser,
        candidateNumber: '13',
        message: xssPayload,
        timestamp: Date.now(),
      });

      // Cria esqueleto da aba chat
      container.innerHTML = `
        <div id="admin-tab-content">
          <table><tbody id="admin-chat-feed-tbody"></tbody></table>
          <table><tbody id="admin-chat-top-tbody"></tbody></table>
        </div>
      `;

      // Simula aba ativa 'chat' e popula via populateTabTables
      (panel as any).activeTab = 'chat';
      panel.populateTabTables(document.getElementById('admin-tab-content'));

      const feedTbody = document.getElementById('admin-chat-feed-tbody')!;
      // NENHUM elemento <img> deve existir dentro do tbody
      expect(feedTbody.querySelectorAll('img').length).toBe(0);

      // O payload deve estar seguro como textContent
      const rows = feedTbody.querySelectorAll('tr');
      expect(rows.length).toBeGreaterThan(0);
      const firstRow = rows[0];
      const cells = firstRow.querySelectorAll('td');

      // Coluna do usuário
      expect(cells[1].textContent).toBe(maliciousUser);
      expect(cells[1].innerHTML).not.toContain('<img');

      // Coluna da mensagem
      expect(cells[3].textContent).toBe(xssPayload);
      expect(cells[3].innerHTML).not.toContain('<img');

      // Top mensagens também não pode criar tags img
      const topTbody = document.getElementById('admin-chat-top-tbody')!;
      expect(topTbody.querySelectorAll('img').length).toBe(0);
      const topTexts = Array.from(topTbody.querySelectorAll('tr')).map(
        (r) => r.querySelectorAll('td')[0]?.textContent || ''
      );
      expect(topTexts.some((txt) => txt.includes(xssPayload))).toBe(true);

      // Confirma que nenhuma variável global de injeção foi disparada
      expect((window as any).__xss_executed).toBeUndefined();
      expect((window as any).__xss_user).toBeUndefined();
    });
  });

  describe('Proteção XSS em Top Doações / Ranking de doadores', () => {
    it('renderiza nome de doador malicioso como textContent puro sem injeção HTML', () => {
      const maliciousDonor = '<img src="https://evil.com/x.png" onerror="window.__xss_donor=true">';

      liveServiceMock.recordDonation({
        userId: 'donor_xss',
        userName: maliciousDonor,
        giftId: 'rose',
        giftName: 'Rosa',
        diamonds: 999999,
        timestamp: Date.now(),
      });

      container.innerHTML = `
        <div id="admin-tab-content">
          <table><tbody id="admin-ranking-tbody"></tbody></table>
        </div>
      `;

      (panel as any).activeTab = 'ranking';
      panel.populateTabTables(document.getElementById('admin-tab-content'));

      const tbody = document.getElementById('admin-ranking-tbody')!;
      // Garante que nenhuma tag img foi instanciada
      expect(tbody.querySelectorAll('img').length).toBe(0);

      const userCells = Array.from(tbody.querySelectorAll('tr td:nth-child(2)'));
      const found = userCells.find((c) => c.textContent === maliciousDonor);
      expect(found).toBeDefined();
      expect(found!.innerHTML).not.toContain('<img');
      expect((window as any).__xss_donor).toBeUndefined();
    });
  });

  describe('Proteção XSS na Tabela de Presentes', () => {
    it('renderiza nomes de presentes customizados via textContent', () => {
      const maliciousGiftName = '<img src=x onerror="window.__xss_gift=true">Super Rosa';
      giftRegistry.update('rose', {
        name: maliciousGiftName,
      });

      container.innerHTML = `
        <div id="admin-tab-content">
          <table><tbody id="admin-gifts-tbody"></tbody></table>
        </div>
      `;

      (panel as any).activeTab = 'gifts';
      panel.populateTabTables(document.getElementById('admin-tab-content'));

      const tbody = document.getElementById('admin-gifts-tbody')!;
      expect(tbody.querySelectorAll('img').length).toBe(0);

      const nameCell = tbody.querySelector('td:nth-child(2)');
      expect(nameCell).not.toBeNull();
      expect(nameCell!.textContent).toBe(maliciousGiftName);
      expect(nameCell!.innerHTML).not.toContain('<img');
      expect((window as any).__xss_gift).toBeUndefined();

      // Restaura o presente
      giftRegistry.reset();
    });
  });

  describe('Proteção XSS nos Logs de Telemetria', () => {
    it('renderiza payload e descrições de logs maliciosos com textContent', () => {
      const xssLogMsg = '<img src=x onerror="window.__xss_log=true">';
      engine.handleEvent({
        type: 'chat',
        userId: xssLogMsg,
        candidateId: 'lula',
        timestamp: Date.now(),
      });

      container.innerHTML = `
        <div id="admin-tab-content">
          <table><tbody id="admin-telemetry-tbody"></tbody></table>
        </div>
      `;

      (panel as any).activeTab = 'telemetry';
      panel.populateTabTables(document.getElementById('admin-tab-content'));

      const tbody = document.getElementById('admin-telemetry-tbody')!;
      expect(tbody.querySelectorAll('img').length).toBe(0);
      expect((window as any).__xss_log).toBeUndefined();
    });
  });
});
