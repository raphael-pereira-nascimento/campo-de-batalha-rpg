# Campo de Batalha RPG

Jogo de batalha estilo Final Fantasy / Pokémon em tempo real, suportando até 20 jogadores simultaneamente. Combina batalhas táticas por turnos com sistema de progressão, conteúdo customizado pelos jogadores e uma interface moderna baseada em web.

## Funcionalidades

- **Sistema de Batalha por Turnos** com dados (d20), críticos, esquiva, defesa e status effects
- **3 Modos de Jogo**: Livre (free-for-all), Equipes e Mestre vs Jogadores
- **Criação de Personagem** com multi-raças, multi-classes, golpes customizados, ultimate e especial
- **22 Raças jogáveis** com bônus de atributo e passivas mecânicas
- **6 Classes base** (Guerreiro, Mago, Arqueiro, Clérigo, Assassino, Paladino)
- **Sistema de Loja** com moedas e itens de combate
- **World Registry** para criar e compartilhar classes, raças, equipamentos, golpes e monstros customizados
- **Bestiário** com 10 monstros built-in e suporte a monstros customizados
- **Sistema de Level-Up** com distribuição automática de atributos
- **Recompensas Pós-Batalha** (XP, moedas, abates)

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
- [PostgreSQL](https://www.postgresql.org/) >= 14
- npm

## Instalação

```bash
# Clonar o repositório
git clone <url-do-repositorio>
cd campo-de-batalha-rpg

# Instalar dependências (server + client)
npm run setup
```

## Configuração do Banco de Dados

```bash
# Copiar o arquivo de exemplo de variáveis de ambiente
cp server/.env.example server/.env

# Editar server/.env e configurar a DATABASE_URL
# Exemplo: DATABASE_URL=postgresql://usuario:senha@localhost:5432/campo_batalha

# Criar as tabelas e migrar dados
npm run init-db
```

## Executar o Projeto

```bash
# Modo desenvolvimento (server + client simultaneamente)
npm run dev

# Ou executar separadamente:
npm run dev:server   # Backend em http://localhost:3000
npm run dev:client   # Frontend em http://localhost:5173

# Em produção (Windows):
start-server.bat
```

## Estrutura do Projeto

```
campo-de-batalha-rpg/
├── client/                  # Frontend React + Vite
│   └── src/
│       ├── api.js           # Camada de API (REST + Socket.IO)
│       ├── config.js        # Constantes compartilhadas
│       ├── App.jsx          # Componente raiz e roteamento
│       ├── components/      # Componentes reutilizáveis
│       │   ├── CharacterSheet.jsx   # Exibição de ficha
│       │   ├── FichaForm.jsx        # Wizard de criação (10 passos)
│       │   ├── StatBar.jsx          # Barra de HP/MP
│       │   └── ErrorBoundary.jsx    # Error boundary React
│       ├── pages/           # Páginas da aplicação
│       │   ├── Home.jsx      # Login/Cadastro
│       │   ├── Characters.jsx # Gerenciamento de fichas
│       │   ├── Lobby.jsx     # Lobby multiplayer
│       │   ├── Battle.jsx    # Tela de batalha
│       │   └── Registry.jsx  # World Registry (CRUD de conteúdo)
│       └── styles.css        # Estilos globais (dark theme)
├── server/                  # Backend Node.js
│   └── src/
│       ├── index.js         # Express server + rotas REST
│       ├── sockets.js       # Socket.IO (lobby, batalha, auth)
│       ├── db/              # PostgreSQL
│       │   ├── index.js         # Pool de conexão
│       │   ├── init.js          # Migrator CLI
│       │   ├── backup.js        # Backup CLI
│       │   └── migrations/      # SQL migrations
│       ├── game/            # Lógica do jogo
│       │   ├── data.js          # Classes, golpes, equipamentos, fórmulas
│       │   ├── races.js         # 22 raças jogáveis
│       │   ├── monsters.js      # Bestiário e construção de monstros
│       │   └── battleManager.js # Máquina de estados da batalha
│       ├── services/        # Lógica de negócio
│       │   ├── characters.js    # Jogadores e personagens
│       │   ├── battles.js       # Persistência de batalhas
│       │   └── customContent.js # CRUD de conteúdo customizado
│       ├── middleware/
│       │   └── auth.js     # Middleware de autenticação
│       └── utils.js         # Utilitários compartilhados
├── arquitetura.md           # Documentação da arquitetura
├── package.json             # Scripts e dependências raiz
└── start-server.bat         # Script de produção (Windows)
```

## Comandos Úteis

| Comando | Descrição |
|---------|-----------|
| `npm run setup` | Instala dependências do server e client |
| `npm run dev` | Inicia server + client em modo desenvolvimento |
| `npm run build` | Gera o build de produção do client |
| `npm run start` | Inicia o servidor em produção |
| `npm run init-db` | Cria/migra as tabelas do banco |
| `npm run backup` | Faz backup do banco PostgreSQL |
| `npm run test` | Roda todos os testes (unit + e2e) |
| `npm run test:unit` | Roda os testes unitários (vitest) |
| `npm run test:e2e` | Roda o smoke test (E2E) |

## API REST

| Método | Rota | Autenticação | Descrição |
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
