# Corrida Presidencial '26

Jogo interativo de corrida arcade para lives (sprint entre dois candidatos), com integração a eventos de chat e presentes em tempo real.

## 🚀 Tecnologias

- **TypeScript**
- **Vite**
- **Vitest**

## 📦 Como rodar

```bash
# Instalar dependências
npm install

# Rodar servidor de desenvolvimento
npm run dev

# Rodar suíte de testes
npm run test
```

## 🎮 Rotas

- `/` : Tela principal da corrida e overlay de transmissão.
- `/?admin=1` ou `/admin` : Painel de controle e telemetria do operador (PIN padrão: `2026`).
- `/?debug=1` : Modo de depuração técnica do motor de física e eventos.
