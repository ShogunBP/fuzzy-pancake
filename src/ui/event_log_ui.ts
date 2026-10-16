import type { RaceEngine } from '../core/race_engine';
import type { LogEntry } from '../core/types';

export class EventLogUI {
  private container: HTMLElement;
  private listEl: HTMLElement;
  private countTotalEl: HTMLElement;
  private countAppliedEl: HTMLElement;
  private countIgnoredEl: HTMLElement;
  private currentFilter: 'all' | 'applied' | 'ignored' | 'chat' | 'gift' | 'lifecycle' = 'all';
  private autoScroll = true;

  constructor(private engine: RaceEngine, parentElement: HTMLElement) {
    this.container = document.createElement('div');
    this.container.id = 'event-log-container';
    this.container.innerHTML = `
      <div class="log-header">
        <div class="log-title">
          <span>📋 Log de Eventos em Tempo Real</span>
          <span class="log-counters">
            Total: <b id="log-total">0</b> | 
            <span style="color: #4ade80;">Aplicados: <b id="log-applied">0</b></span> | 
            <span style="color: #f87171;">Ignorados: <b id="log-ignored">0</b></span>
          </span>
        </div>
        <div class="log-actions">
          <button id="btn-export-log" class="btn-sm btn-secondary" title="Exportar log completo em JSON">📥 Exportar JSON</button>
          <button id="btn-clear-log" class="btn-sm btn-secondary" title="Limpar histórico da tela">🗑 Limpar</button>
        </div>
      </div>

      <div class="log-filters">
        <button class="filter-btn active" data-filter="all">Todos</button>
        <button class="filter-btn" data-filter="applied">Apenas Aplicados</button>
        <button class="filter-btn" data-filter="ignored">Apenas Ignorados</button>
        <button class="filter-btn" data-filter="chat">Chat (13/22)</button>
        <button class="filter-btn" data-filter="gift">Presentes</button>
        <button class="filter-btn" data-filter="lifecycle">Sistema</button>
      </div>

      <div id="log-list" class="log-list">
        <div class="log-empty">Nenhum evento registrado ainda. Inicie a corrida ou envie chat/presentes.</div>
      </div>
    `;

    parentElement.appendChild(this.container);

    this.listEl = this.container.querySelector('#log-list')!;
    this.countTotalEl = this.container.querySelector('#log-total')!;
    this.countAppliedEl = this.container.querySelector('#log-applied')!;
    this.countIgnoredEl = this.container.querySelector('#log-ignored')!;

    this.setupListeners();
    this.attachEngineListeners();
  }

  private setupListeners(): void {
    const filterButtons = this.container.querySelectorAll<HTMLButtonElement>('.filter-btn');
    filterButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        filterButtons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentFilter = btn.dataset.filter as any;
        this.renderAll();
      });
    });

    const btnClear = this.container.querySelector('#btn-clear-log')!;
    btnClear.addEventListener('click', () => {
      this.engine.clearLogs();
      this.renderAll();
    });

    const btnExport = this.container.querySelector('#btn-export-log')!;
    btnExport.addEventListener('click', () => {
      const jsonStr = this.engine.exportLogsJson();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `corrida_log_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });

    this.listEl.addEventListener('scroll', () => {
      const atBottom = this.listEl.scrollHeight - this.listEl.scrollTop <= this.listEl.clientHeight + 40;
      this.autoScroll = atBottom;
    });
  }

  private attachEngineListeners(): void {
    this.engine.onDecision((decision) => {
      this.appendEntry(decision);
      this.updateCounters();
    });

    this.engine.onLifecycle((entry) => {
      this.appendEntry(entry);
      this.updateCounters();
    });
  }

  private updateCounters(): void {
    const logs = this.engine.getLogs();
    const total = logs.length;
    const applied = logs.filter((l) => l.kind === 'lifecycle' || l.applied).length;
    const ignored = logs.filter((l) => l.kind === 'event_decision' && !l.applied).length;

    this.countTotalEl.textContent = total.toString();
    this.countAppliedEl.textContent = applied.toString();
    this.countIgnoredEl.textContent = ignored.toString();
  }

  private appendEntry(entry: LogEntry): void {
    // Remover mensagem de vazio se existir
    const emptyEl = this.listEl.querySelector('.log-empty');
    if (emptyEl) {
      emptyEl.remove();
    }

    if (!this.matchesFilter(entry)) {
      return;
    }

    const itemEl = this.createEntryElement(entry);
    this.listEl.appendChild(itemEl);

    if (this.autoScroll) {
      this.listEl.scrollTop = this.listEl.scrollHeight;
    }
  }

  private matchesFilter(entry: LogEntry): boolean {
    if (this.currentFilter === 'all') return true;
    if (this.currentFilter === 'applied') return entry.kind === 'lifecycle' || entry.applied;
    if (this.currentFilter === 'ignored') return entry.kind === 'event_decision' && !entry.applied;
    if (this.currentFilter === 'chat') return entry.kind === 'event_decision' && entry.event.type === 'chat';
    if (this.currentFilter === 'gift') return entry.kind === 'event_decision' && entry.event.type === 'gift';
    if (this.currentFilter === 'lifecycle') return entry.kind === 'lifecycle';
    return true;
  }

  private createEntryElement(entry: LogEntry): HTMLElement {
    const div = document.createElement('div');
    div.className = 'log-item';

    const timeStr = `+${entry.timestampSec.toFixed(1)}s`;

    if (entry.kind === 'lifecycle') {
      div.classList.add('log-lifecycle');

      const spanTime = document.createElement('span');
      spanTime.className = 'log-time';
      spanTime.textContent = timeStr;
      div.appendChild(spanTime);

      const spanBadge = document.createElement('span');
      spanBadge.className = 'log-badge badge-system';
      spanBadge.textContent = 'SISTEMA';
      div.appendChild(spanBadge);

      const spanBody = document.createElement('span');
      spanBody.className = 'log-body';
      const bCode = document.createElement('b');
      bCode.textContent = entry.code;
      spanBody.appendChild(bCode);
      spanBody.appendChild(document.createTextNode(` — ${entry.description}`));
      div.appendChild(spanBody);

      return div;
    }

    // EventDecision
    const appliedClass = entry.applied ? 'log-applied' : 'log-ignored';
    div.classList.add(appliedClass);

    let badgeClass = 'badge-applied';
    let badgeLabel = 'APLICADO';

    if (entry.code === 'BLOCKED_BY_SHIELD') {
      badgeClass = 'badge-blocked';
      badgeLabel = 'ESCUDO';
    } else if (!entry.applied) {
      badgeClass = 'badge-ignored';
      badgeLabel = 'IGNORADO';
    }

    const spanTime = document.createElement('span');
    spanTime.className = 'log-time';
    spanTime.textContent = timeStr;
    div.appendChild(spanTime);

    const spanBadge = document.createElement('span');
    spanBadge.className = `log-badge ${badgeClass}`;
    spanBadge.textContent = badgeLabel;
    div.appendChild(spanBadge);

    const divContent = document.createElement('div');
    divContent.className = 'log-content';

    const divTitle = document.createElement('div');
    divTitle.className = 'log-event-title';

    const ev = entry.event;
    if (ev.type === 'chat') {
      const candName = ev.candidateId === 'lula' ? 'Lula (13)' : 'Flávio (22)';
      divTitle.appendChild(document.createTextNode(`💬 Chat "${ev.candidateId === 'lula' ? '13' : '22'}" (${candName}) de `));
      const codeUser = document.createElement('code');
      codeUser.textContent = ev.userId;
      divTitle.appendChild(codeUser);
    } else {
      divTitle.textContent = `🎁 Presente [${ev.giftId}] para ${ev.candidateBenefited.toUpperCase()}`;
    }
    divContent.appendChild(divTitle);

    const divReason = document.createElement('div');
    divReason.className = 'log-reason';

    const spanCode = document.createElement('span');
    spanCode.className = 'log-code';
    spanCode.textContent = `[${entry.code}]`;
    divReason.appendChild(spanCode);
    divReason.appendChild(document.createTextNode(` ${entry.reason}`));

    if (entry.effectDescription) {
      const bEffect = document.createElement('b');
      bEffect.className = 'log-effect';
      bEffect.textContent = ` » ${entry.effectDescription}`;
      divReason.appendChild(bEffect);
    }
    divContent.appendChild(divReason);

    div.appendChild(divContent);
    return div;
  }

  private renderAll(): void {
    this.listEl.innerHTML = '';
    const logs = this.engine.getLogs();

    const filtered = logs.filter((e) => this.matchesFilter(e));
    if (filtered.length === 0) {
      this.listEl.innerHTML = `<div class="log-empty">Nenhum evento correspondente ao filtro selecionado.</div>`;
      return;
    }

    for (const entry of filtered) {
      this.listEl.appendChild(this.createEntryElement(entry));
    }

    this.updateCounters();
    if (this.autoScroll) {
      this.listEl.scrollTop = this.listEl.scrollHeight;
    }
  }
}
