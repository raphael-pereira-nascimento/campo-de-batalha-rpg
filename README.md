# Campo de Batalha RPG

Jogo de batalha estilo Final Fantasy / Pokémon em tempo real, suportando até 20 jogadores simultaneamente. Combina batalhas táticas por turnos com sistema de progressão, conteúdo customizado pelos jogadores e uma interface moderna baseada em web.

Jogue **online** (com backend + PostgreSQL) ou **offline** (100% no browser, sem servidor).

## Funcionalidades

- **Sistema de Batalha por Turnos** com dados (d20), críticos, esquiva, defesa e 8 status effects
- **3 Modos de Jogo**: Livre (free-for-all), Equipes e Mestre vs Jogadores
- **Modo Solo Offline** — batalhe contra monstros controlados por IA sem servidor
- **Criação de Personagem** com multi-raças, multi-classes, golpes customizados, ultimate e especial
- **23 Raças jogáveis** com bônus de atributo e passivas mecânicas
- **6 Classes base** (Guerreiro, Mago, Arqueiro, Clérigo, Assassino, Paladino)
- **Sistema de Loja** com moedas (cobre, prata, ouro, ouropla, platina) e itens de combate
- **World Registry** para criar classes, raças, equipamentos, golpes e monstros customizados
- **Bestiário** com 10 monstros built-in + monstros customizados
- **Sistema de Level-Up** com distribuição automática de atributos
- **Recompensas Pós-Batalha** (XP, moedas, abates)
- **Autenticação** com senhas e hashing scrypt

## Tecnologias

| Camada | Tecnologia |
|--------|------------|
| Frontend | React 18 + Vite |
| Backend | Node.js + Express |
| Realtime | Socket.IO |
| Database | PostgreSQL |
| Testes | Vitest (unit) + Smoke Test (e2e) |

## Pré-requisitos

- [Node.js](https://nodejs.org/) >= 18
- [PostgreSQL](https://www.postgresql.org/) >= 14 (apenas para modo online)

## Instalação

```bash
git clone <url-do-repositorio>
cd campo-de-batalha-rpg
npm install
```

## Executar o Projeto

```bash
# Modo offline (sem servidor) — apenas frontend
npm run dev

# Modo online (server + client simultaneamente)
npm run dev

# Produção (Windows)
start-server.bat
```

> **Modo offline**: Basta rodar `npm run dev` sem configurar `VITE_API_URL`. O jogo detecta automaticamente e roda 100% no browser com `localStorage`.

## Configuração do Banco de Dados (modo online)

```bash
# Configurar DATABASE_URL no .env na raiz do projeto
# DATABASE_URL=postgresql://usuario:senha@localhost:5432/campo_batalha_rpg

# Criar as tabelas e migrar dados
npm run init-db
```

## Estrutura do Projeto

```
campo-de-batalha-rpg/
├── src/                     # Frontend React + Vite
│   ├── api.js               # Camada de API (REST + Socket.IO + modo offline)
│   ├── config.js            # Constantes compartilhadas
│   ├── App.jsx              # Componente raiz e roteamento
│   ├── components/          # Componentes reutilizáveis
│   │   ├── CharacterSheet.jsx   # Exibição de ficha
│   │   ├── FichaForm.jsx        # Wizard de criação (10 passos)
│   │   ├── StatBar.jsx          # Barra de HP/MP
│   │   └── ErrorBoundary.jsx    # Error boundary React
│   ├── pages/               # Páginas da aplicação
│   │   ├── Home.jsx          # Login/Cadastro
│   │   ├── Characters.jsx    # Gerenciamento de fichas
│   │   ├── Lobby.jsx         # Lobby multiplayer + solo offline
│   │   ├── Battle.jsx        # Tela de batalha
│   │   └── Registry.jsx      # World Registry (CRUD de conteúdo)
│   ├── game/                # Motor do jogo (portável para browser)
│   │   ├── data.js           # Classes, golpes, equipamentos, fórmulas
│   │   ├── races.js          # 23 raças jogáveis
│   │   ├── monsters.js       # Bestiário e construção de monstros
│   │   └── battleManager.js  # Máquina de estados da batalha
│   ├── offline/             # Módulos de modo offline
│   │   ├── storage.js        # localStorage para player, fichas, carteira
│   │   ├── gameData.js       # Dados do jogo inline
│   │   ├── ai.js             # IA para monstros
│   │   └── battle.js         # Orquestrador de batalha offline
│   └── styles.css            # Estilos globais (dark theme)
├── server/                  # Backend Node.js
│   └── src/
│       ├── index.js          # Express server + rotas REST
│       ├── sockets.js        # Socket.IO (lobby, batalha, auth)
│       ├── db/               # PostgreSQL
│       │   ├── index.js          # Pool de conexão
│       │   ├── init.js           # Migrator CLI
│       │   ├── backup.js         # Backup CLI
│       │   └── migrations/       # SQL migrations
│       ├── game/             # Lógica do jogo (server-side)
│       │   ├── data.js
│       │   ├── races.js
│       │   ├── monsters.js
│       │   └── battleManager.js
│       ├── services/         # Lógica de negócio
│       │   ├── characters.js
│       │   ├── battles.js
│       │   └── customContent.js
│       ├── middleware/
│       │   └── auth.js       # Middleware de autenticação
│       └── utils.js
├── .env                     # Variáveis de ambiente (DATABASE_URL)
├── package.json             # Scripts e dependências
├── arquitetura.md           # Documentação da arquitetura
├── render.yaml              # Deploy automático no Render
└── start-server.bat         # Script de produção (Windows)
```

## Comandos

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Frontend em desenvolvimento (funciona offline) |
| `npm run build` | Build de produção |
| `npm run start` | Servidor em produção |
| `npm test` | Todos os testes (46 unit + 28 e2e) |
| `npm run test:unit` | Testes unitários (vitest) |
| `npm run test:e2e` | Smoke test (E2E) |
| `npm run init-db` | Cria/migra as tabelas do banco |
| `npm run backup` | Backup do banco PostgreSQL |

## Deploy Online (Render + GitHub Pages)

1. Criar conta no [Render](https://render.com) (grátis)
2. Criar PostgreSQL → copiar **Internal Database URL**
3. Criar Web Service → conectar repositório GitHub
   - **Build Command:** `npm install --prefix server`
   - **Start Command:** `node server/src/index.js`
   - **Env Var:** `DATABASE_URL` = URL do PostgreSQL
4. Configurar GitHub Pages → Source: **GitHub Actions**
5. Atualizar `VITE_SOCKET_URL` no `.github/workflows/deploy.yml` com a URL do Render
6. No Render Shell: `npm run init-db --prefix server`

## Deploy Offline (GitHub Pages)

O jogo funciona 100% offline sem backend. Para disponibilizar:

```bash
npm run build
# O diretório dist/ pode ser hospedado em qualquer static host
```

## API REST

| Método | Rota | Auth | Descrição |
|--------|------|:---:|-----------|
| POST | `/api/players` | - | Login/Cadastro |
| GET | `/api/players/:id/characters` | ✓ | Listar personagens |
| POST | `/api/characters` | ✓ | Criar personagem |
| GET | `/api/characters/:id` | ✓ | Ver ficha |
| POST | `/api/characters/:id/equip` | ✓ | Equipar item |
| GET | `/api/wallet` | ✓ | Ver carteira |
| GET | `/api/shop` | - | Itens da loja |
| POST | `/api/shop/buy` | ✓ | Comprar item |
| GET | `/api/gamedata` | - | Dados do jogo |
| GET/POST/PUT/DELETE | `/api/custom-*` | ✓ | CRUD conteúdo customizado |

## Eventos Socket.IO

| Evento | Descrição |
|--------|-----------|
| `authenticate` | Autenticar com token |
| `createBattle` | Criar batalha no lobby |
| `joinBattle` | Entrar em batalha |
| `leaveBattle` | Sair da batalha |
| `startBattle` | Iniciar batalha |
| `addMonster` | Adicionar monstro (modo mestre) |
| `removeMonster` | Remover monstro (modo mestre) |
| `battleAction` | Executar ação (ataque, magia, defender, etc.) |
| `battleUpdate` | Receber atualização do estado da batalha |
| `getHistory` | Consultar histórico de batalhas |

## Licença

MIT
