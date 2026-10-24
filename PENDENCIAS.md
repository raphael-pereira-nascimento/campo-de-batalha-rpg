# Pendências — Campo de Batalha RPG

Atualizado em 23/10/2026.

Este arquivo registra regras que ainda precisam de decisão do criador. Nenhuma
fórmula pendente foi inventada ou implementada nesta etapa. Quando uma regra for
decidida, ela deve ser movida para `AI_RULES.md` (ou para `src/pages/Rules.jsx`)
e só então aplicada no código.

## Implementado nesta etapa

- Prévia de masmorra usa o nível do personagem selecionado, em vez de nível 1.
- Vitórias offline contam 1 por batalha vencida, não a quantidade de abates.
- Log de recuperação de mana não anuncia mais o teto de 10% quando o MP apenas
  está quase cheio.
- `tools/sync-server-game.ps1` foi reduzido aos arquivos realmente sincronizáveis;
  `data.js` e `battleManager.js` não são mais sobrescritos às cegas.
- `README.md` atualizado para 12 etapas de criação e correções recentes.

## Pendências de regra

### P-01 — Nível máximo, custo de XP e crescimento

- **Regra atual:** o limite máximo ainda não está definido; há possibilidade de
  chegar a aproximadamente LV 1100 (`src/pages/Rules.jsx`, seção 3).
- **Hoje no código:** o ajuste manual para em 30 (`NIVEL_MANUAL_MAX`), mas o
  caminho “Subir com XP” não tem limite. Todos os atributos sobem +1 por nível e
  param no teto 12, então o crescimento efetivo termina por volta do nível 7.
- **Decisão necessária:** qual é o nível máximo; qual a curva de crescimento;
  qual o teto de atributo; o que acontece com personagens já acima do novo limite.
- **Arquivos afetados:** `server/src/services/characters.js`,
  `src/components/CharacterSheet.jsx`, `src/game/data.js`,
  `server/src/game/data.js`, `src/api.js`.

### P-02 — Quem recebe XP

- **Regra atual:** a XP é dividida conforme a participação, e nenhum jogador deve
  monopolizar toda a XP (`src/pages/Rules.jsx`, seção 11).
- **Hoje no código:** apenas vencedores vivos recebem XP; mortos e perdedores
  ficam com 0. Em derrota total, não há distribuição.
- **Decisão necessária:** mortos e perdedores recebem participação? Quem recebe
  em PvP? Quem recebe quando o grupo perde?
- **Arquivos afetados:** `src/game/battleManager.js`,
  `server/src/game/battleManager.js`, `src/game/sistema.js`,
  `server/src/game/sistema.js`.

### P-03 — Teto de 60% e sobra da XP

- **Regra atual:** nenhum jogador deve monopolizar toda a XP
  (`src/pages/Rules.jsx`, seção 11); o código usa teto provisório de 60%.
- **Hoje no código:** a sobra do arredondamento é jogada no maior participante.
  Com um único participante, o teto de 60% vira 100%.
- **Decisão necessária:** a sobra é redistribuída entre quem está abaixo do teto,
  descartada, ou convertida em moedas? Em solo/FFA, o sobrevivente pode receber
  100%?
- **Arquivos afetados:** `src/game/sistema.js`, `server/src/game/sistema.js`,
  testes de XP.

### P-04 — HP de chefe

- **Regra atual:** `BOSS HP = HP total dos jogadores × 2`, ajustável por
  quantidade de jogadores e tipo de chefe (`src/pages/Rules.jsx`, seção 22).
- **Hoje no código:** chefes internos usam 2,5–3,0; o padrão do `addMonster` é 3.
  O chefe dinâmico usa ×2.
- **Decisão necessária:** normalizar todos para ×2, manter multiplicadores por
  tipo, ou expor um multiplicador configurável por chefe?
- **Arquivos afetados:** `src/game/battleManager.js`,
  `server/src/game/battleManager.js`, `src/game/monsters.js`,
  `server/src/game/monsters.js`.

### P-05 — Recompensas, ondas e puzzles de masmorra

- **Regra atual:** masmorras podem ter puzzles, inimigos, subchefes, chefes,
  recompensas, equipamentos, gemas e eventos especiais
  (`src/pages/Rules.jsx`, seção 23).
- **Hoje no código:** a prévia mostra XP, moedas, gemas e equipamentos
  configurados, mas a batalha concede apenas XP genérica, `100 + abates × 25`
  moedas e um drop aleatório de gema. Ondas entram todas juntas; puzzles são
  apenas texto.
- **Decisão necessária:** conceder exatamente as recompensas configuradas? O
  drop aleatório é extra ou substituto? Ondas devem ser sequenciais? Puzzles
  entram agora ou ficam para depois?
- **Arquivos afetados:** `src/game/dungeons.js`, `server/src/game/dungeons.js`,
  `server/src/services/characters.js`, `src/pages/Dungeons.jsx`,
  `src/pages/Battle.jsx`.

### P-06 — Categorias de armadura e sinergia de classe

- **Regra atual:** armaduras leves, médias, pesadas, superpesadas e mágicas;
  classes têm sinergia, mas não restrição absoluta (`src/pages/Rules.jsx`,
  seções 8 e 13).
- **Hoje no código:** armaduras não têm categoria; classes não têm sinergia de
  armadura.
- **Decisão necessária:** só exibir a categoria ou aplicar bônus/penalidades?
  Quais números de sinergia? Como migrar equipamentos customizados?
- **Arquivos afetados:** `src/game/data.js`, `server/src/game/data.js`,
  `src/components/CharacterSheet.jsx`, `src/pages/Compendium.jsx`,
  `src/pages/Registry.jsx`.

### P-07 — Peso, quantidade e espaço do inventário

- **Regra atual:** o jogador administra peso, quantidade, espaço e recursos
  (`src/pages/Rules.jsx`, seção 16).
- **Hoje no código:** `cargaMaxima()` existe, mas a loja usa limites fixos de
  40 de peso e 20 espaços; o servidor não valida peso/espaço nas compras.
- **Decisão necessária:** aplicar a fórmula de carga no servidor? Qual fórmula
  de espaços? O que conta para peso (equipamento, ferramentas, poções, gemas)?
  Personagens existentes ficam “grandfathered”?
- **Arquivos afetados:** `src/game/sistema.js`, `server/src/game/sistema.js`,
  `server/src/services/characters.js`, `server/src/index.js`,
  `src/pages/ToolShop.jsx`, `src/components/CharacterSheet.jsx`.

### P-08 — Status `atordoado` e `ferido`

- **Regra atual:** estados e condições incluem voando, ferido, envenenado,
  atordoado, queimando, congelado, sangrando, efeitos mágicos, buffs e debuffs
  (`src/pages/Rules.jsx`, seção 7).
- **Hoje no código:** existem 8 status; `atordoado` e `ferido` não existem.
- **Decisão necessária:** qual efeito exato de cada um (pular turno, reduzir
  dano/cura, penalidade de acerto) e qual duração padrão?
- **Arquivos afetados:** `src/game/data.js`, `server/src/game/data.js`,
  `src/game/battleManager.js`, `server/src/game/battleManager.js`,
  `src/pages/Battle.jsx`.

### P-09 — Desgaste, falhas e reparo de armas

- **Regra atual:** qualquer arma pode falhar; o ferreiro repara, reforça,
  modifica e instala gemas (`src/pages/Rules.jsx`, seção 15).
- **Hoje no código:** `WEAPON_STATES` existe com multiplicadores, mas é apenas
  exibido no Compêndio; não há durabilidade, falha ou reparo.
- **Decisão necessária:** quais gatilhos (natural 1, crítico, ataque forte, uso
  defensivo), quantos pontos de durabilidade, custo de reparo e onde o reparo
  acontece?
- **Arquivos afetados:** `src/game/data.js`, `server/src/game/data.js`,
  `src/game/battleManager.js`, `server/src/game/battleManager.js`,
  `server/src/index.js`, `src/api.js`.

### P-10 — Distância horizontal

- **Regra atual:** distância simplificada em perto, médio alcance, longe e fora
  do alcance (`src/pages/Rules.jsx`, seção 7).
- **Hoje no código:** existe alcance vertical; `ALCANCE_TYPES` aparece apenas no
  Compêndio e não participa do combate.
- **Decisão necessária:** o combate terá faixas abstratas? Quem pode mudar de
  faixa? Armas e magias terão alcance horizontal explícito?
- **Arquivos afetados:** `src/game/sistema.js`, `server/src/game/sistema.js`,
  `src/game/battleManager.js`, `server/src/game/battleManager.js`,
  `src/pages/Battle.jsx`, `src/components/AlvoSelect.jsx`.

### P-11 — Fome e saciedade

- **Regra atual:** existe sistema de fome/saciedade, com diferenças raciais
  (`src/pages/Rules.jsx`, seção 17).
- **Hoje no código:** não existe.
- **Decisão necessária:** como a fome sobe, quais penalidades, como comida e
  raças interagem, e se o sistema afeta combate ou só exploração.
- **Arquivos afetados:** `src/game/data.js`, `server/src/game/data.js`,
  `server/src/services/characters.js`, `src/components/CharacterSheet.jsx`,
  `src/pages/Battle.jsx`.

### P-12 — Golems

- **Regra atual:** golems comuns não têm Mana; golems especiais usam gemas/Mana
  (`src/pages/Rules.jsx`, seção 20).
- **Hoje no código:** só existe o slot visual `golem` nos efeitos de gema; não há
  golem jogável, equipamento ou companheiro.
- **Decisão necessária:** golem é personagem jogável, equipamento ou aliado?
  Como ele entra na ficha e na batalha?
- **Arquivos afetados:** `src/game/data.js`, `server/src/game/data.js`,
  `src/components/CharacterSheet.jsx`, `src/game/battleManager.js`,
  `server/src/game/battleManager.js`.

### P-13 — Veículos

- **Regra atual:** carroças de carga, corrida, transporte e defesa; veículos
  mágicos (`src/pages/Rules.jsx`, seção 26).
- **Hoje no código:** não existe.
- **Decisão necessária:** veículos entram no inventário, no mapa ou só como
  flavor? Quais regras de capacidade, velocidade e destruição?
- **Arquivos afetados:** `src/game/data.js`, `server/src/game/data.js`,
  `src/components/CharacterSheet.jsx`, `server/src/services/characters.js`.

### P-14 — Munição, escudos e itens mágicos de inventário

- **Regra atual:** munição é relevante para armas de fogo; escudos podem sofrer
  dano estrutural; existem cinto de bolsos, bolsa de flechas e mochila sem fundo
  (`src/pages/Rules.jsx`, seções 14–16).
- **Hoje no código:** recarga existe, mas munição, escudos e itens mágicos de
  inventário não existem.
- **Decisão necessária:** munição é contada por tiro ou por combate? Escudo é
  slot separado? Quais capacidades dos itens mágicos?
- **Arquivos afetados:** `src/game/data.js`, `server/src/game/data.js`,
  `src/game/battleManager.js`, `server/src/game/battleManager.js`,
  `src/components/CharacterSheet.jsx`, `src/pages/ToolShop.jsx`.

### P-15 — Especializações de classe

- **Regra atual:** classes definem função, bônus, habilidades, passivas, estilo
  de combate e especializações (`src/pages/Rules.jsx`, seção 8).
- **Hoje no código:** só existe especialização em arma (+10% para corpo a corpo
  ou distância).
- **Decisão necessária:** cada classe terá uma árvore de especializações? Quais
  especializações e custos?
- **Arquivos afetados:** `src/game/data.js`, `server/src/game/data.js`,
  `src/config.js`, `src/components/FichaForm.jsx`,
  `src/game/battleManager.js`, `server/src/game/battleManager.js`.

### P-16 — Paridade offline/online das gemas da forja

- **Regra atual:** gemas têm efeitos permanentes em armas, armaduras,
  acessórios e golems (`src/pages/Rules.jsx`, seção 19).
- **Hoje no código:** o servidor aplica regeneração, bônus e status de gemas da
  forja; o cliente/offline só aplica bônus de atributo.
- **Decisão necessária:** offline deve ter os mesmos efeitos? Unificamos a lógica
  em um módulo compartilhado ou mantemos cópias com teste de paridade?
- **Arquivos afetados:** `src/game/battleManager.js`,
  `server/src/game/battleManager.js`, `src/game/data.js`,
  `server/src/game/data.js`, `server/src/game/forgeGems.js`,
  `tools/sync-server-game.ps1`.

### P-17 — Efeitos raciais e de equipamento no Eclipse

- **Regra atual:** durante o Eclipse, raças recebem buffs e equipamentos
  melhores aparecem (`src/pages/Rules.jsx`, seção 24).
- **Hoje no código:** `buffsEclipseRaca` está definido em `eclipse.js`, mas não é
  usado; equipamentos melhores não aparecem.
- **Decisão necessária:** quais buffs raciais entram em combate? Como e quando
  equipamentos melhores aparecem?
- **Arquivos afetados:** `src/game/eclipse.js`, `server/src/game/eclipse.js`,
  `src/game/battleManager.js`, `server/src/game/battleManager.js`,
  `src/game/data.js`, `server/src/game/data.js`.

### P-18 — Documentos de contexto ausentes

- **Regra atual:** o projeto não possui `AI_CONTEXT.md` nem `AI_RULES.md`.
- **Hoje no código:** a fonte efetiva é `src/pages/Rules.jsx`.
- **Decisão necessária:** esses arquivos existem em outro lugar? Se não, posso
  criá-los a partir de `Rules.jsx` e do código atual, sem inventar regras?
- **Arquivos afetados:** `AI_CONTEXT.md`, `AI_RULES.md`, `README.md`,
  `arquitetura.md`.

## Ordem sugerida para decidir

1. P-01, P-02 e P-03 (nível e XP) — desbloqueiam a progressão.
2. P-04 e P-05 (chefes e masmorras) — alinham recompensas e dificuldade.
3. P-06, P-07 e P-09 (equipamento, inventário e desgaste).
4. P-08, P-10 e P-15 (combate e especializações).
5. P-11 a P-14 e P-17 (sistemas de exploração e conteúdo).
6. P-16 e P-18 (paridade e documentação).
