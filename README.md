# Campo de Batalha RPG

Jogo de batalha estilo Final Fantasy / Pokémon em tempo real, suportando até 20 jogadores simultaneamente.

## Funcionalidades

- **Batalha por Turnos** com dados (d20), críticos, esquiva, defesa e status effects
- **3 Modos de Jogo**: Livre, Equipes e Mestre vs Jogadores
- **Criação de Personagem** com multi-raças, multi-classes, ultimate e especial
- **22 Raças jogáveis** com bônus de atributo e passivas mecânicas
- **6 Classes base** (Guerreiro, Mago, Arqueiro, Clérigo, Assassino, Paladino)
- **Sistema de Loja** com moedas e itens de combate
- **World Registry** para criar classes, raças, equipamentos, golpes e monstros customizados
- **Bestiário** com 10 monstros built-in + monstros customizados

## Tecnologias

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + Vite |
| Backend | Node.js + Express |
| Realtime | Socket.IO |
| Database | PostgreSQL |
| Testes | Vitest (unit) + Smoke Test (e2e) |

## Pré-requisitos

- [Node.js](https://nodejs.org/) >= 18
- [PostgreSQL](https://www.postgresql.org/) >= 14

## Instalação Local

```bash
git clone <url-do-repositorio>
cd campo-de-batalha-rpg

# Instalar dependências
npm run setup

# Configurar banco
cp server/.env.example server/.env
# Edite server/.env com sua DATABASE_URL
npm run init-db --prefix server

# Rodar (server + client simultâneamente)
npm run dev
```

O frontend fica em `http://localhost:5173` e o backend em `http://localhost:3000`.

## Deploy Online (Render + GitHub Pages)

### 1. Criar conta no [Render](https://render.com) (grátis)

### 2. Criar PostgreSQL no Render
- New → PostgreSQL → Free tier
- Copie a **Internal Database URL**

### 3. Criar Web Service no Render
- New → Web Service
- Conecte seu repositório GitHub
- Configurações:
  - **Build Command:** `npm install --prefix server`
  - **Start Command:** `node server/src/index.js`
  - **Environment Variable:** `DATABASE_URL` = URL copiada do PostgreSQL
- Anote a URL do serviço (ex: `https://campo-de-batalha-rpg.onrender.com`)

### 4. Configurar GitHub Pages
- Vá em Settings → Pages do repositório
- Source: **GitHub Actions**

### 5. Atualizar a URL do backend
- Edite `.github/workflows/deploy.yml`
- Troque `VITE_SOCKET_URL` pela URL do Render
- Faça push na branch `main` — o GitHub Actions faz deploy automático

### 6. Inicializar o banco
- No Render, rode no Shell: `npm run init-db --prefix server`

O site ficará disponível em `https://<seu-usuario>.github.io/campo-de-batalha-rpg/`

## Comandos

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Server + client em desenvolvimento |
| `npm run build` | Build de produção |
| `npm run start` | Servidor em produção |
| `npm test` | Todos os testes (unit + e2e) |
| `npm run test:unit` | Testes unitários (vitest) |
| `npm run test:e2e` | Smoke test (E2E) |

## Licença

MIT
