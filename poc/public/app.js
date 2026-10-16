(function () {
  const canvas = document.getElementById('race-canvas');
  const ctx = canvas.getContext('2d', { alpha: false });

  const fpsDisplay = document.getElementById('fps-display');
  const uptimeDisplay = document.getElementById('uptime-display');
  const ramDisplay = document.getElementById('ram-display');
  const lapsDisplay = document.getElementById('laps-display');
  const fullscreenBtn = document.getElementById('fullscreen-btn');

  // Ajuste de DPI e Resolução
  let width = 0;
  let height = 0;
  let dpr = 1;

  function resizeCanvas() {
    dpr = Math.min(window.devicePixelRatio || 1, 2); // Limitar a 2x para economizar GPU no mobile
    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  window.addEventListener('resize', resizeCanvas);

  // Estado dos Dois Corredores
  const runners = [
    {
      name: 'Corredor A',
      number: '13',
      color: '#EF4444',
      trailColor: 'rgba(239, 68, 68, 0.25)',
      y: 0,
      baseSpeed: 180,
      currentSpeed: 180,
      boostTimer: 0,
      size: 32,
      laps: 0
    },
    {
      name: 'Corredor B',
      number: '22',
      color: '#3B82F6',
      trailColor: 'rgba(59, 130, 246, 0.25)',
      y: 0,
      baseSpeed: 180,
      currentSpeed: 180,
      boostTimer: 0,
      size: 32,
      laps: 0
    }
  ];

  let totalLaps = 0;
  let startTime = Date.now();

  // Medição de FPS
  let lastTime = performance.now();
  let frameCount = 0;
  let fpsTimer = performance.now();
  let currentFps = 60;

  // Atualização de Telemetria do Servidor
  async function fetchServerTelemetry() {
    try {
      const res = await fetch('/api/telemetry');
      if (res.ok) {
        const data = await res.json();
        ramDisplay.textContent = `${data.memory.rssMb} MB`;
      }
    } catch (e) {
      ramDisplay.textContent = 'local';
    }
  }

  setInterval(fetchServerTelemetry, 3000);
  fetchServerTelemetry();

  // Loop de Animação
  function update(dt) {
    // Corrida vertical (de baixo para cima, estilo pista vertical)
    const trackHeight = height;

    runners.forEach((r, idx) => {
      // Pequenas variações randômicas periódicas para simular corrida
      r.boostTimer -= dt;
      if (r.boostTimer <= 0) {
        const variance = (Math.random() - 0.5) * 60;
        r.currentSpeed = Math.max(120, r.baseSpeed + variance);
        r.boostTimer = 0.5 + Math.random() * 1.5;
      }

      r.y += r.currentSpeed * dt;

      // Quando atinge o topo (linha de chegada)
      if (r.y >= trackHeight) {
        r.y = 0;
        r.laps += 1;
        totalLaps += 1;
        lapsDisplay.textContent = totalLaps;
      }
    });

    // Formatação de Uptime do Frontend
    const elapsedSec = Math.floor((Date.now() - startTime) / 1000);
    const h = String(Math.floor(elapsedSec / 3600)).padStart(2, '0');
    const m = String(Math.floor((elapsedSec % 3600) / 60)).padStart(2, '0');
    const s = String(elapsedSec % 60).padStart(2, '0');
    uptimeDisplay.textContent = `${h}:${m}:${s}`;
  }

  function render() {
    // Fundo limpo
    ctx.fillStyle = '#030712';
    ctx.fillRect(0, 0, width, height);

    const laneWidth = width / 2;

    // Linha divisória da pista
    ctx.strokeStyle = '#1F2937';
    ctx.lineWidth = 2;
    ctx.setLineDash([12, 12]);
    ctx.beginPath();
    ctx.moveTo(laneWidth, 0);
    ctx.lineTo(laneWidth, height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Linha de largada (embaixo) e chegada (em cima)
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, height - 20);
    ctx.lineTo(width, height - 20);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, 20);
    ctx.lineTo(width, 20);
    ctx.stroke();

    // Renderizar Corredores
    runners.forEach((r, idx) => {
      const centerX = (idx === 0) ? laneWidth * 0.5 : laneWidth * 1.5;
      const posY = height - 20 - r.y; // Sobe de baixo para cima

      // Rastro de velocidade
      ctx.fillStyle = r.trailColor;
      ctx.fillRect(centerX - r.size / 2, posY, r.size, 30);

      // Corpo do Corredor (Bloco)
      ctx.fillStyle = r.color;
      ctx.fillRect(centerX - r.size / 2, posY - r.size, r.size, r.size);

      // Borda contrastante
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(centerX - r.size / 2, posY - r.size, r.size, r.size);

      // Número do candidato
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 13px ui-monospace, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(r.number, centerX, posY - r.size / 2);

      // Nome e Voltas
      ctx.font = '10px sans-serif';
      ctx.fillStyle = '#94A3B8';
      ctx.fillText(`${r.name} (${r.laps})`, centerX, posY + 16);
    });
  }

  function gameLoop(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.1); // Trava máxima de delta para evitar saltos
    lastTime = now;

    // Cálculo de FPS a cada 500ms
    frameCount++;
    if (now - fpsTimer >= 500) {
      currentFps = Math.round((frameCount * 1000) / (now - fpsTimer));
      fpsDisplay.textContent = currentFps;
      if (currentFps >= 55) {
        fpsDisplay.className = 'telemetry-value good';
      } else if (currentFps >= 40) {
        fpsDisplay.className = 'telemetry-value warn';
      } else {
        fpsDisplay.className = 'telemetry-value';
      }
      frameCount = 0;
      fpsTimer = now;
    }

    update(dt);
    render();

    requestAnimationFrame(gameLoop);
  }

  // Alternador de Tela Cheia
  fullscreenBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      fullscreenBtn.textContent = 'Sair da Tela Cheia';
    } else {
      document.exitFullscreen().catch(() => {});
      fullscreenBtn.textContent = 'Tela Cheia';
    }
  });

  // Inicialização
  resizeCanvas();
  requestAnimationFrame(gameLoop);
})();
