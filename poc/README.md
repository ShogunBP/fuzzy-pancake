# 📱 Guia de Execução da PoC — Poco X5 Pro (Android 14)

Este pacote valida se o aparelho sustenta a execução ininterrupta do servidor Node, a renderização do jogo em Canvas 2D e o compartilhamento de tela na live do TikTok simultaneamente.

---

## 1. Preparação do Aparelho (Poco X5 Pro / HyperOS)

Para evitar que o Android 14 mate o processo em segundo plano ou sobreaqueça o hardware:

1. **Taxa de Atualização da Tela:**
   * Vá em **Configurações > Tela > Taxa de atualização**.
   * Trave em **Padrão (60 Hz)**. *Não use 120 Hz durante a live contínua para evitar estresse térmico desnecessário na GPU.*

2. **Permissão de Fundo para o Termux:**
   * Vá em **Configurações > Apps > Gerenciar apps > Termux**.
   * Em **Economia de bateria**, selecione **Sem restrições**.
   * Em **Início automático**, ative a opção.
   * Na tela de apps recentes, segure o app do Termux e clique no ícone do **Cadeado** para não ser fechado na limpeza de memória.

3. **Alimentação Térmica:**
   * Mantenha conectado à tomada.
   * *Recomendação:* Use um carregador comum de 10W a 18W em vez do carregador turbo de 67W, ou ative a proteção de carregamento otimizado (se disponível no HyperOS), reduzindo o aquecimento térmico prolongado da bateria.

---

## 2. Instalação e Execução no Termux

Abra o **Termux** no Poco X5 Pro e execute:

```bash
# 1. Atualizar repositórios e instalar o Node.js
pkg update -y && pkg install nodejs -y

# 2. Impedir que o Android coloque a CPU em repouso profundo
termux-wake-lock

# 3. Navegar até a pasta poc (transferida para o aparelho ou clonada)
cd poc

# 4. Iniciar o servidor HTTP
node server.js
```

> **Dica para rodar em segundo plano:**
> Se preferir rodar o servidor em background para poder fechar o terminal do Termux:
> ```bash
> nohup node server.js > server.log 2>&1 &
> ```

---

## 3. Como Transmitir no TikTok

1. Abra o navegador (Chrome ou navegador padrão do sistema) no Poco X5 Pro.
2. Acesse: `http://localhost:3000`
3. Toque no botão **"Tela Cheia"** na barra inferior.
4. Abra o aplicativo do **TikTok**, inicie uma live selecionando a opção **Compartilhamento de Tela** (Jogos/Tela móvel).
5. Volte para a aba do navegador em tela cheia e deixe transmitindo.

---

## 4. O que Observar e Medir

Durante os testes (ciclo curto de 30-60 min e ciclo longo de 6 horas), acompanhe:

* **FPS:** Deve se manter estável entre 55 e 60 FPS no topo da tela.
* **Uptime:** Tempo decorrido de execução contínua sem quedas.
* **RAM Node:** Monitorar se há vazamento de memória (deve ficar na faixa de 25MB a 50MB de RSS estável).
* **Temperatura do Aparelho:** O Poco X5 Pro fica morno ou atinge temperaturas desconfortáveis (> 42°C)?
* **Quedas da Live:** A live continuou ativa ou o TikTok encerrou por falta de atividade/gestão de bateria do sistema?

Os resultados devem ser registrados diretamente em:  
[`devboard/docs/active/features/[in-progress]-prova-de-conceito-android-live/README.md`](file:///d:/Projetos/Pessoal/Corrida%20Interativa/devboard/docs/active/features/%5Bin-progress%5D-prova-de-conceito-android-live/README.md)
