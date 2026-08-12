# Arquitetura do Projeto - Campo de Batalha RPG

## Visão Geral

Campo de Batalha RPG é um jogo de batalha estilo Final Fantasy & Pokémon em tempo real, suportando até 20 jogadores simultaneamente. O sistema combina batalhas táticas por turnos com um rico sistema de progressione, conteúdo customizado generativo pelos jogadores e uma interface moderna baseada em web.

## Arquitetura Principal

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                        │
│                                                             │
│  ┌─────────────┐  ┌───────────────────────┐  ┌─────────────┐  │
│  │   Home      │  │   Characters/Lobby     │  │   Battle    │  │
│  │  (Login)   │  │  (Gerenciamento)       │  │  (In-Battle)│  │
│  └─────────────┘  └───────────────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/GraphQL + WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Backend (Node.js)                        │
│  ┌─────────────┐  ┌───────────────────────┐  ┌─────────────┐  │
│  │   Router    │  │   Services Layer       │  │   Database  │  │
│  │   (Express)│  │   (Business Logic)     │  │ (PostgreSQL) │  │
│  └─────────────┘  └───────────────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────────────┘
