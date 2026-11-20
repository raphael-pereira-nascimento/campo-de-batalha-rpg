# Pendências — Materiais, Metais e Podridão

Atualizado em 20/11/2026 — Etapa 9 (runas na forja, Corrupção com API/UI,
imunidade do Tenebrium e preparação de Contaminação Profana/Núcleo Pandemônico),
rodada de buffs, cura, Ações Rápidas e canhões (D-44 a D-47), auditoria de
correções de comportamento em fichas, motores e Batalha de Mesa (1.9) e
implementação do Kraken do Abismo Eclipse com passiva, habilidades, horda e
arena espelhadas nos motores cliente/servidor (D-54 a D-61, seções 1.10, 3.14 e
3.15), regras provisórias de canhões com tripulação mínima e descrições
mecânicas (D-62 a D-67, seções 1.11 e 3.16) e a revisão D-68: painel 🧰 de
artilharia na Batalha de Mesa e D20 “rolar-maior” com números de
exigência em mesa, Campo e servidor (seções 1.11 e 3.18).

Este arquivo separa o que já foi **aprovado**, o que foi implementado como
**provisório**, o que continua **pendente** e o que é apenas **sugestão**.
Nenhum dado ausente foi inventado: quando a documentação oficial não define
nome, valor, fórmula ou efeito, a ficha continua marcada como pendente.

Fontes usadas nesta etapa:

- PDF oficial de materiais fornecido pelo criador (texto extraído e lido).
- Complemento do Catálogo de Metais e Minérios (fichas restantes e correções).
- Regras aprovadas pelo criador na conversa desta implementação.
- Código e dados que já existiam no projeto antes desta etapa.

Legenda:

- **Aprovado** — regra documentada ou autorizada; já implementada.
- **Provisório** — decisão tomada para destravar a implementação; não é regra
  oficial até o criador confirmar.
- **Pendente** — informação ou regra ausente; nada foi preenchido por estimativa.
- **Sugestão** — melhoria opcional, não implementada.

---

## Índice das decisões D-01 a D-68

| Código | Assunto | Status |
| --- | --- | --- |
| D-01 | `categoria` oficial + `tipo` legado | Provisório |
| D-02 | “Materiais utilizados em golens” como filtro por aplicação | Provisório |
| D-03 | Obsidiana e Diamante como material e gema | Provisório |
| D-04 | Raridades “Muito rara”, “Lendária” e “Mítica” | Provisório |
| D-05 | Schema de efeitos estendido | Provisório |
| D-06 | Qualidade “Variável” para Satetsu | Provisório |
| D-07 | Bônus negativo do secundário com `Math.trunc` | Provisório |
| D-08 | Percentuais do secundário seguem a mesma regra dos bônus | Provisório |
| D-09 | Custo de fabricação com quantidades em kg opcionais | Provisório |
| D-10 | Efeitos de Tenebrium em armas de impacto e golens | Resolvido no PDF e implementado |
| D-11 | Fichas completas de Ruidium, Vibranium, Honríneo e Mournlode | Pendente |
| D-12 | Efeitos de Ferro Estígio e Honríneo | Pendente |
| D-13 | Tabela da Podridão (5 estágios/10 turnos) | Aprovado pelo criador, fora do PDF |
| D-14 | Commit e limpeza do pacote final | Resolvido; decisão sobre o harness pendente |
| D-15 | Adamantino com preço e efeitos percentuais aprovados | Aprovado no complemento |
| D-16 | Honríneo limitado à adaptação automática, sem percentuais | Aprovado no complemento |
| D-17 | Vibranium com direção de efeitos, sem números | Aprovado no complemento; números pendentes |
| D-18 | Ruidium com preço, identidade e sistema de Corrupção | Aprovado no complemento |
| D-19 | Mournlode com preço e identidade, efeitos pendentes | Aprovado no complemento; efeitos pendentes |
| D-20 | Ferro de Febre com raridade, qualidade e preço | Aprovado no complemento; efeitos pendentes |
| D-21 | Ouro Imperial e Bronze Celestial com preço, sem efeitos | Aprovado no complemento |
| D-22 | Propriedades globais dos metais convencionais | Aprovado no complemento |
| D-23 | Correção da chave `mournrlode` para `mournlode` | Corrigido |
| D-24 | Remoção do alias indevido “Minério da Alma” | Corrigido; ficha própria criada em D-31 |
| D-25 | Preservação dos efeitos legados dos metais convencionais | Provisório; substituído onde há regra oficial (D-30) |
| D-26 | Uru e Aço Daédrico mantidos como fichas separadas | Provisório; decisão do criador pendente |
| D-27 | Minério da Alma como matéria-prima | Cadastrado como ficha pendente (D-31) |
| D-28 | Corrupção do Ruidium implementada em `corrupcao.js` | Implementado, aprovado |
| D-29 | Integração da Corrupção ao combate | Motor implementado; persistência sem API/UI |
| D-30 | Electrum, Prata e Obsidiana seguem os efeitos oficiais | Aprovado no complemento |
| D-31 | Catálogo consolidado com 52 fichas e novas fichas pendentes | Implementado |
| D-32 | Contaminação Pandemônica separada da Podridão e da Corrupção | Armas implementadas; armadura/golem pendentes |
| D-33 | Runas elementais com 17 elementos e regras de uso | Efeito genérico aprovado; identidades pendentes |
| D-34 | Metal das Almas duplica a Pedra da Alma, sem duplicar regras de combate | Implementado |
| D-35 | Integração de Contaminação e runas ao combate | Armas de Contaminação implementadas; runas pendentes |
| D-36 | Fichas individuais das 17 runas | Estrutura criada; efeito individual pendente |
| D-37 | Seleção e persistência de runas na forja | Implementado; compatibilidade oficial pendente |
| D-38 | Imunidade à Podridão pela armadura de Tenebrium | Implementado; alcance a confirmar |
| D-39 | Persistência, API, interface e histórico da Corrupção | Implementado; “Consumido” pendente |
| D-40 | Estado “Consumido” controlado pelo mestre | Estrutura implementada; regras adicionais pendentes |
| D-41 | Contaminação Profana e Núcleo Pandemônico | Estrutura descritiva preparada; automação pendente |
| D-42 | Ruptura Profana em acertos críticos | Implementado; alcance a confirmar |
| D-43 | Categorias de efeito sem definição exibidas como “Não definido” | Implementado |
| D-44 | Buffs/debuffs com eixo (físico/mágico), duração e grupo | Implementado |
| D-45 | Cura reformada: redução de cura recebida e status positivo no alvo | Implementado |
| D-46 | Ações Rápidas utilizáveis na Batalha de Mesa | Implementado |
| D-47 | Arsenal de 3 slots e canhões na Batalha de Mesa | Implementado |
| D-48 | Metadados de golpes personalizados sobrevivem a ficha → Registro → ficha | Implementado |
| D-49 | Batalha de Mesa usa as mesmas regras do motor (HoT/DOT, defesa, itens, controle, recarga, armas) | Implementado |
| D-50 | `attackUtility` respeita `action.weaponId`; categoria dos canhões tem fonte única | Implementado |
| D-51 | Congelamento consome o turno depois de aplicar o pulo | Implementado |
| D-52 | Gemas com comportamento idêntico offline/online; regen respeita redução de cura | Implementado |
| D-53 | Gestão de fichas (editar/excluir) e árvore técnica de golpes por nível/elemento/desbloqueio | Implementado; regras oficiais (P-15/P-01) pendentes |
| D-54 | Kraken do Abismo Eclipse como chefe autônomo de Eclipse | Provisório; `isEclipse` força o estado do dia 30 na batalha |
| D-55 | Coração da Tempestade: cura de 5% e bloqueio por Luz/Sagrado | Provisório; aliases `luz`/`sagrado` normalizados |
| D-56 | Água Profunda Corrompida: −2 DEX/REF sem Respiração Aquática | Provisório; imunidade por status, acessório ou poção |
| D-57 | Confusão e Medo no Kraken; Cegueira e Veneno na Maré Negra | Provisório; −20% acerto e −10% acerto/esquiva |
| D-58 | Horda de Marinheiros Afogados (1d4+2, pool de HP e Moral) | Provisório; Moral e dano escalável |
| D-59 | Tentáculos/Maré Negra (CD 16/18) e Chamado do Abismo (recarga 4) | Provisório; CD 16/18 e durações dos status vêm da especificação do chefe |
| D-60 | UI da Batalha e regressões do Kraken em cliente/servidor | Implementado; 13 testes novos no harness |
| D-61 | Renderização da horda invocada pelo Kraken na arena | Corrigido; memos de combatentes passam a depender também de `battle` |
| D-62 | `artilharia` como filtro/grupo, não como slot | Mantido; slots continuam `perto`, `distancia` e `utilitaria` |
| D-63 | Canhões sem recurso de munição separado | Provisório; usos por combate + recarga continuam como "munição" |
| D-64 | Tripulação mínima de 2 (atirador + 1 ajudante vivo do mesmo lado) | Provisório; sem ajudante: −20% de acerto e +1 turno de recarga |
| D-65 | "Ignora parte da defesa" vira `ignoraDefesaPct: 25` | Provisório; também em `besta_pesada` |
| D-66 | "Peso quase proibitivo" e "precisa de tripé" viram mecânica | Provisório; bombasta −1 DEX/REF, canhão de cerco `recarga: 5` |
| D-67 | "Pólvora negra" vira `fumacaExtra: 1` | Provisório; +1 fumaça por disparo do Canhão de Ferro |
| D-68 | Painel 🧰 de artilharia na mesa e D20 “rolar-maior” | Provisório; acerto se `d20 ≥ exigência`, 20 crítico e 1 falha; faixas 1–4/5–10/11–16/17–20 agora classificam a exigência |

---

## 1. Aprovado

### 1.1 Regras da documentação oficial

- **Categorias de exibição:** Minérios, Metais, Materiais especiais,
  Materiais mágicos e Materiais utilizados em golens. As fichas mostram a
  categoria oficial; a categoria de golens é uma visão por aplicação, sem tela
  separada (a implementação como filtro está registrada em D-02).
- **Qualidade independente da raridade:** Inferior, Comum, Refinado, Superior,
  Excepcional e Perfeito. A raridade segue a documentação oficial, que usa
  Comum, Incomum, Rara, Épica, Muito rara, Lendária e Mítica.
- **Composição:** o material principal concede 100% dos efeitos; o secundário
  concede até 25%, arredondado para baixo. O mesmo atributo ou percentual não
  acumula duas vezes; prevalece o valor do principal. Restrições e
  incompatibilidades declaradas bloqueiam a composição.
- **Efeitos separados por equipamento:** armaduras, lâminas, impacto, fogo,
  acessórios, cajados, varinhas, grimórios, orbes, catalisadores e golens.
  Categorias mágicas usam `equipamentoMagico` como fallback quando a ficha não
  tem efeito específico.
- **Podridão do Tenebrium:** 5 estágios, progressão em 10 turnos acumulados e
  todos os percentuais calculados sobre a **vida máxima original**, nunca sobre
  a vida já reduzida. Os tratamentos interrompem a progressão e restauram a
  vida máxima perdida.
- **Armas de Tenebrium:** causam 20% da vida máxima por turno durante 3 turnos;
  chance de aplicação de 15% em arma comum e 25% em equipamento mágico. Armas
  de impacto seguem as lâminas. A documentação também registra imunidade para
  armaduras de Tenebrium.
- **Golens de Tenebrium:** alternam entre o modo Velocidade (+60% velocidade e
  +40% de dano recebido) e o modo Resistência (+30% de dano causado, +50% de
  resistência a danos, −60% de velocidade e Podridão em todo dano causado).
- **Restrições oficiais já registradas:** Oricalco é vulnerável à antimagia;
  Tenebrium exige preparação mágica e pode provocar Podridão; Ferro Estígio
  exige treinamento específico; Ruidium possui um sistema próprio de Corrupção
  de 0 a 100 pontos, com seis estágios (Normal a Consumido), implementado em
  `corrupcao.js`.

#### Dados oficiais extraídos do PDF

| Material | Raridade | Qualidade | Preço por kg |
| --- | --- | --- | --- |
| Ferro Frio | Rara | Superior | 5 Ouro |
| Mithril | Épica | Excepcional | 12 Ouro |
| Electrum | Incomum | Refinado | 3 Ouro |
| Platina | Rara | Superior | 12 Ouro |
| Satetsu | Incomum | Variável | 4 Ouro |
| Aço Rúnico | Épica | Superior | 5 Ouro |
| Aço-Rubi | Épica | Excepcional | 30 Ouro |
| Oricalco | Épica | Excepcional | 35 Ouro |
| Aço Daédrico | Lendária | Excepcional | 40 Ouro |
| Tenebrium | Lendária | Excepcional | 45 Ouro |
| Aurorum | Muito rara | Superior | 60 Ouro |
| Thinaum | Lendária | Excepcional | 65 Ouro |
| Uru | Mítica | Perfeito | 80 Ouro |
| Vibranium | Mítica | Perfeito | 100 Ouro |
| Ruidium | Mítica | Perfeito | 90 Ouro |
| Prata Pandemônica | Lendária | Excepcional | 75 Ouro |
| Ouro Imperial | Muito rara | Excepcional | 50 Ouro |
| Bronze Celestial | Épica | Excepcional | 25 Ouro |
| Adamantino | Pendente | Pendente | 20 Ouro |
| Ferro de Febre | Rara | Superior | 18 Ouro |
| Mournlode | Pendente | Pendente | 70 Ouro |
| Honríneo | Mítica | Perfeito | 25 Ouropla |
| Minério de Honra | Mítica | Perfeito | 18 Ouropla |
| Obsidiana | Incomum | Superior | 8 Ouro |
| Carvão Vegetal | Pendente | Pendente | 2 Bronze |
| Carvão Mineral | Pendente | Pendente | 4 Bronze |
| Antracito | Pendente | Pendente | 15 Bronze |
| Carvão Mágico | Pendente | Pendente | 15 Ouro |

Os preços dos 12 materiais legados foram preservados, exceto Obsidiana, que
passou a usar o valor oficial do PDF. O complemento acrescentou os preços de
Adamantino (20 Ouro), Ferro de Febre (18 Ouro), Mournlode (70 Ouro), Ouro
Imperial (50 Ouro), Bronze Celestial (25 Ouro) e Ruidium (90 Ouro). Raridade e
qualidade de Adamantino e Mournlode continuam pendentes porque o complemento não
as informa.

### 1.2 Decisão D-13 — tabela da Podridão aprovada em conversa

Esta tabela **não está no PDF**; foi aprovada pelo criador nesta implementação.
Ela convive com o efeito de arma documentado no PDF, que é uma mecânica
diferente (dano por turno durante poucos turnos).

| Estágio | Nome | Turnos acumulados | Redução da vida máxima | Dano por turno |
| --- | --- | --- | --- | --- |
| I | Inicial | 0 | 5% | 5% |
| II | Leve | 2 | 15% | 10% |
| III | Moderado | 5 | 25% | 15% |
| IV | Grave | 8 | 35% | 20% |
| V | Crítico | 10 | 45% | 25% |

Tratamentos aprovados:

- **Básico:** trata os estágios I e II.
- **Avançado:** trata até o estágio III.
- **Especializado:** trata os estágios IV e V.

### 1.3 Entrega implementada e verificada

- Catálogo com **52 fichas**: 7 minérios, 35 metais, 5 materiais especiais e
  5 materiais mágicos. Os 12 `id`s originais foram preservados.
- `src/game/materialRules.js`: categorias, raridades, qualidades, aplicações,
  normalização, validação, filtros, ordenação, preços, efeitos por equipamento,
  compatibilidade e composição.
- `src/game/materials.js`: fichas normalizadas, `DADOS_OFICIAIS`, aliases,
  filtros por categoria/golem/raridade/qualidade/bioma e preço por quantidade.
- `src/game/podridao.js`: estágios, tratamentos, progressão por turnos, dano de
  arma e funções puras, sem integração automática com o combate.
- `src/game/forge.js`: categoria de efeito derivada do tipo real do equipamento,
  composição principal/secundário e custo por kg opcional. A regra antiga de
  1 kg do principal + 0,25 kg do secundário continua como padrão.
- `src/game/corrupcao.js`: estágios, ganhos e recuperação da Corrupção do
  Ruidium, em módulo puro.
- `src/game/contaminacao.js`: aplicações e cálculos da Contaminação
  Pandemônica, em módulo puro e sem tabela de estágios (D-32).
- `src/game/runas.js`: 17 elementos, regras de encaixe, combinação e
  multiplicadores de efeito, sem integrar o combate (D-33).
- Interface: `src/pages/Materiais.jsx`, `MaterialCard.jsx`,
  `MaterialDetails.jsx` e `MaterialComposition.jsx`, ligados em `App.jsx` e
  `Characters.jsx`. O catálogo tem busca por nome/id/alias, filtros de categoria,
  raridade, qualidade, bioma, aplicação, preço, ordenação e ficha detalhada.
- Testes: **242/242 passam** no harness de navegador. Cobrem dados oficiais,
  schema, aliases, filtros, preços, composição, custo, forja, Podridão,
  Corrupção do Ruidium, Contaminação Pandemônica, runas e o avaliador de efeitos
  de combate.
- Nenhum banco, configuração ou dado já cadastrado foi substituído de forma
  destrutiva. Nenhuma dependência nova foi adicionada ao projeto.

### 1.4 Complemento do catálogo — dados aprovados e implementados

O complemento foi comparado com o catálogo anterior. As decisões abaixo foram
tomadas seguindo a recomendação apresentada ao criador e ficam registradas como
**decisões desta implementação**, não como regras oficiais novas.

- **D-15 — Adamantino:** preço de 20 Ouro/kg; efeitos percentuais aprovados para
  armaduras, lâminas, impacto, armas de fogo, acessórios, equipamentos mágicos e
  golens. Raridade e qualidade não foram informadas e continuam pendentes.
- **D-16 — Honríneo:** 25 Ouropla/kg (250 Ouro), Mítica/Perfeito. A adaptação
  automática ao usuário foi registrada nas categorias, **sem percentuais**. Não
  há efeito individual de golem recuperado.
- **D-17 — Vibranium:** 100 Ouro/kg, Mítica/Perfeito. A direção dos efeitos por
  categoria foi registrada apenas como descrição. Percentuais, capacidade de
  armazenamento, sobrecarga e regras de combate continuam pendentes.
- **D-18 — Ruidium:** 90 Ouro/kg, Mítica/Perfeito. Identidade psíquica e sistema
  de Corrupção implementados em `src/game/corrupcao.js`. **Não** foram criados
  bônus numéricos de fabricação por categoria.
- **D-19 — Mournlode:** 70 Ouro/kg. Energia espiritual, purificação de maldições
  e aplicações contra mortos-vivos/sobrenaturais registradas como identidade.
  Efeitos por categoria continuam pendentes.
- **D-20 — Ferro de Febre:** Rara/Superior, 18 Ouro/kg, identidade de acúmulo de
  calor. Valores e descrições por categoria não recuperados.
- **D-21 — Ouro Imperial e Bronze Celestial:** classificações preservadas
  (Muito rara/Excepcional e Épica/Excepcional) e preços de 50 e 25 Ouro/kg.
  Nenhum efeito por categoria foi inventado.
- **D-22 — Metais convencionais:** Ouro, Prata, Cobre, Estanho, Chumbo, Platina e
  Electrum receberam as propriedades globais descritas no complemento.
- **D-23 — Correção de chave:** `mournrlode` passou a ser `mournlode`, alinhando a
  chave ao `id` e permitindo `getMaterialById('mournlode')`.
- **D-24 — Minério da Alma:** o alias indevido foi removido de `metalDasAlmas`.
  O minério é matéria-prima e ganhou ficha pendente própria em D-31.
- **D-25 — Efeitos legados:** os efeitos por categoria já existentes de Ferro,
  Cobre, Estanho, Chumbo, Prata e Ouro foram preservados em vez de apagados.
  Eles não foram confirmados pelo complemento e ficam marcados para revisão.
- **D-26 — Uru e Aço Daédrico:** as duas fichas continuam separadas. A repetição
  de efeitos semelhantes não foi tratada como intencional nem como erro.
- **D-28 — Corrupção do Ruidium:** estágios 0–19 Normal, 20–39 Influenciado,
  40–59 Perturbado, 60–79 Corrompido, 80–99 Dominado e 100 Consumido; potência
  mágica +5/+10/+15/+25%; ganhos de +1/+2/+3/+2/+1; recuperações de -5, -15 e
  remoção total. As penalidades do estágio já são aplicadas em `_finalAttrs`; a
  potência mágica continua descritiva.
- **D-30 — Efeitos oficiais substituem legados onde existem:** o Electrum passou
  a conceder apenas +5% de experiência e +5% em efeitos medicinais/cura, sem
  bônus físico por categoria. A Prata recebeu redução de 50% do dano
  anti-fantasma/anti-maldição, +100% de dano das armas contra fantasmas e
  maldições e +20% em efeitos medicinais. A Obsidiana recebeu os efeitos
  vulcânicos oficiais com penalidades explícitas. Ouro, Cobre, Estanho e Chumbo
  continuam com os efeitos legados marcados para revisão.
- **D-31 — Catálogo consolidado em 52 fichas:** 7 minérios, 35 metais, 5
  especiais e 5 mágicos. Foram adicionadas as fichas pendentes de Minério da
  Alma e Aço Negro; Satetsu passou a minério bruto; Pedra da Alma passou a
  material mágico. O filtro de golens continua por aplicação.
- **D-32 — Contaminação Pandemônica:** condição própria da Prata Pandemônica,
  separada da Podridão do Tenebrium e da Corrupção do Ruidium. A documentação
  define dano progressivo, redução de cura, menor resistência à corrupção e
  efeitos mais intensos em seres sagrados e equipamentos de luz, mas **não**
  define tabela de estágios. O módulo `contaminacao.js` registra apenas as seis
  aplicações documentadas (incluindo a Ruptura Profana) e não cria estágios.
- **D-33 — Runas elementais:** 17 elementos aprovados (Água, Gelo, Fogo, Ar,
  Planta, Pedra, Elétrico, Luz, Sombrio, Psíquico, Dor, Veneno, Tempo, Sangue,
  Metais, Ilusão e Areia). Sem Aço Rúnico, o equipamento aceita 1 runa com efeito
  reduzido em 50%; com Aço Rúnico, aceita 2 runas com efeitos aumentados em 50%.
  Duas runas simultâneas precisam ser de elementos diferentes e cada runa ocupa
  um encaixe de pedra preciosa. Os efeitos individuais de cada runa não foram
  definidos na documentação recuperada.
- **D-34 — Metal das Almas:** duplica os percentuais comuns da Pedra da Alma e
  mantém as três regras especiais de combate (+300% de dano, 50% de proteção e
  +300% de potência mágica por 3 turnos) fora da duplicação, em
  `regrasCombate` com `naoDuplicar`.

### 1.5 Efeitos em combate — implementação atual

Esta etapa implementou o pacote de efeitos aprovado, sem criar dados oficiais
novos. Os valores continuam vindo das fichas; o que mudou é que eles passaram a
ter interpretação mecânica explícita.

- `src/game/combatEffects.js` (com cópia em `server/src/game/`): avaliação pura
  de condições, percentuais tipados, teto de resistência, fórmula de dano,
  penalidades, dano de status sobre a vida máxima original e redução de cura.
- `src/game/materialRules.js`: classifica cada percentual como bônus, redução,
  resistência, chance, custo ou penalidade; normaliza a chance; monta
  `modificadores` e `perfilMecanico`, com a regra principal 100% / secundário
  até 25% / efeito idêntico não acumula.
- `src/game/forge.js`: grava `perfilMecanico` no item craftado e deriva o
  `efeito` automático de armas. Tenebrium aplica Podridão (15% ou 25% em
  equipamentos mágicos, 20% da vida máxima original por 3 turnos); Prata
  Pandemônica aplica Ferida Pandemônica em lâminas e Munição Contaminante em
  armas de fogo. Ruptura Profana permanece descritiva, pois só vale em crítico.
- `battleManager` (cliente e servidor): normaliza a chance dos status, guarda
  `hpMaxOriginal`, calcula dano percentual sobre a vida original, aplica redução
  de cura da Contaminação, aceita status `somenteCritico` com o resultado do
  crítico e aplica as penalidades percentuais da Corrupção em `_finalAttrs`.
- `server/src/services/characters.js` + migração `0010_corrupcao.sql`: preservam
  `perfilMecanico` na sanitização da forja e persistem a Corrupção (0–100) com
  `setCorrupcao`, `ganharCorrupcao`, `recuperarCorrupcaoPersonagem` e
  `estadoCorrupcaoDoPersonagem`.
- `src/game/runas.js`: efeito genérico **não oficial** aprovado (+10% de dano e
  +10% de resistência ao elemento; 20% de chance por 2 turnos), com
  `efeitoRuna` e `modificadoresRuna`. As identidades individuais das 17 runas
  continuam pendentes.
- Testes: `server/tests/combatEffects.test.js` cobre chance, condições,
  resistência, fórmula, penalidades, Corrupção, dano de status e cura; os testes
  de runas e forja foram estendidos para o efeito genérico e os status derivados.

Ainda não automatizado nesta etapa: recuperação/API/UI da Corrupção, seleção e
armazenamento de runas na forja, aplicações reativas (armadura de Tenebrium,
aura de golem), identidades individuais das runas e o comportamento completo do
estado “Consumido”. **(Superado pela Etapa 9 — ver 1.6.)**

### 1.6 Implementações da Etapa 9 (D-36 a D-43)

Nenhuma regra nova foi criada nesta etapa: as estruturas abaixo apenas expõem,
validam ou persistem o que já estava aprovado, e deixam explícito o que continua
pendente.

- **D-36 — Fichas individuais das 17 runas:** `RUNAS_FICHAS`, `fichaRuna` e
  `descreverFichaRuna` em `src/game/runas.js` organizam uma ficha por elemento
  (nome, identidade, regra de Aço Rúnico, efeito genérico). Como os efeitos
  individuais não existem no material recuperado, `efeitoIndividual` permanece
  `null`, `efeitoOficial` é `false` e `status` é `'pendente'`. O template
  genérico continua marcado como **não oficial**.
- **D-37 — Runas na forja:** `equipamentoTemAcoRunico`, `validarRunasEquipamento`
  e `normalizarRunasParaItem` em `src/game/forge.js`; `craftarEquipamento` aceita
  `runas`, valida limite (1 sem Aço Rúnico, 2 com), elementos diferentes e
  persiste `runas` no item. `Forge.jsx` oferece a seleção das 17 runas e mostra a
  prévia genérica com aviso de que não é oficial. O servidor
  (`sanitizarItemCraftado`) deriva o Aço Rúnico dos materiais e rejeita runas
  inválidas. Nenhuma compatibilidade runa↔equipamento foi inventada.
- **D-38 — Imunidade do Tenebrium:** `TENEBRIUM_RESTRICAO_ARMADURA_INTEIRA`,
  `TENEBRIUM_IMUNIDADE_PODRIDAO` e os helpers `materialConcedeImunidadePodridao`,
  `itemConcedeImunidadePodridao`, `equipamentoConcedeImunidadePodridao` e
  `participanteConcedeImunidadePodridao` em `src/game/podridao.js`. A imunidade é
  **derivada do equipamento vestido**: vale enquanto a armadura craftada tiver
  Tenebrium como material primário ou secundário e deixa de valer ao trocá-la.
  Aplica-se a personagens, não a monstros, e **não** altera a restrição de que
  Tenebrium não pode ser usado na armadura inteira.
- **D-39 — Corrupção persistida com API e interface:** rotas
  `GET/POST /api/characters/:id/corrupcao` em `server/src/index.js`;
  `registrarHistoricoCorrupcao`/`getHistoricoCorrupcao` e `setCorrupcao` com
  tipo/motivo em `server/src/services/characters.js`; migração
  `0011_corrupcao_historico.sql`; `api.getCorrupcao`/`api.setCorrupcao`
  (online e offline com clamp 0–100); painel em `CharacterSheet.jsx` com pontos,
  barra, estágio, penalidades, chance, potência, aviso de mudança de estágio,
  histórico e controles do mestre.
- **D-40 — “Consumido”:** a ficha mostra o aviso de que o mestre assume
  temporariamente o controle e que **não** é morte automática. O botão “Marcar
  Consumido (100)” apenas define a pontuação; duração, cura, consequências
  permanentes e recuperação continuam pendentes (ver D-40 na seção 3).
- **D-41 — Contaminação Profana e Núcleo Pandemônico:** `criarEfeitoContaminacaoProfana`
  e `criarEfeitoNucleoPandemico` em `src/game/contaminacao.js` descrevem as
  aplicações com `automatico: false`. Nenhum dano, chance ou efeito novo foi
  ativado; o combate continua aplicando apenas Ferida Pandemônica e Munição
  Contaminante.
- **D-42 — Ruptura Profana:** `CONTAMINACAO_POR_CATEGORIA.armaImpacto` em
  `src/game/forge.js` deriva `rupturaProfana` (30% de chance, 2 turnos,
  `somenteCritico`, interrompe cura/proteção). O `battleManager` só aplica quando
  o resultado do ataque é crítico.
- **D-43 — “Não definido”:** `MaterialDetails.jsx` passou a exibir “Não definido.”
  quando a categoria não tem efeito, em vez de “Efeito pendente para esta
  categoria.”, sem criar efeitos para preencher a tabela.
- **Testes:** `runas.test.js`, `podridao.test.js`, `contaminacao.test.js` e
  `forgeMaterials.test.js` foram estendidos. O harness de navegador passou
  **261/261** testes.

### 1.7 Buffs, cura, Ações Rápidas e canhões (D-44 a D-47)

Nenhum valor oficial foi alterado. Os metadados abaixo apenas tornam explícito o
que as magias e golpes já descrevem, e a mesa passou a usar o mesmo motor do
Campo de Batalha.

- **D-44 — Buffs/debuffs com eixo, duração e grupo:** `skillFromSpell` converte
  o `poder` fracionário da magia em percentual (`0.15 → 15`) e propaga
  `buffTipo`, `duracao`, `afetaAliados` e `todos`. O motor soma
  `poder / 100` ao eixo indicado (`buffPhysical`/`buffMagic`) e mantém o buff
  por `duracao` turnos (mínimo 1, padrão 3). Golpe sem `buffTipo` continua
  valendo para físico e mágico, por compatibilidade. Buffs e defesas
  individuais valem só para o conjurador; magias de grupo aplicam a todos os
  aliados vivos, incluindo o conjurador. `grito_de_guerra` (+15% físico) e
  `benção` (+10% mágico) foram marcados como oficiais em `data.js`.
- **D-45 — Cura reformada:** toda cura (magia ou item, cliente e servidor)
  passa por `reducaoCuraPct`/`reducaoPotenciaCuraProtecao`, com teto de 100% e o
  mesmo arredondamento do motor. Cura individual pode escolher um aliado; cura
  de item só pode ser aplicada em aliado. Cura com `status` aplica o status
  positivo no(s) alvo(s). `cura_massa` usa `todos: true` e inclui o conjurador.
- **D-46 — Ações Rápidas na Batalha de Mesa:** o painel passou a executar
  ataque, magia e item com cooldown, custo de MP, alvos, cura, buff, defesa e
  status. Ações em si (cura/buff/defesa), área automática e item dispensam alvo
  manual. O bloqueio global por alvo vazio foi removido; cada modo valida o que
  precisa. A ordem de iniciativa continua respeitada.
- **D-47 — Arsenal e canhões na mesa:** cada lutador tem três slots
  (corpo a corpo, distância e utilitária) preenchidos por `EQUIPMENT.armas`
  somado a `EQUIPMENT.canoes`. Canhões utilitários usam `usosMax` e
  `recargaTurnos`; a artilharia usa `recarga`. A mesa controla recarga, usos,
  calor (superaquecimento) e fumaça, e armas fora do catálogo entram como opção
  “(atual)”.
- **Testes:** `battle.test.js` ganhou cinco casos de magia/buff/cura e um de
  redução de cura recebida; nessa rodada o harness passou **336/336**. O total
  daquele ponto era 1.8; o total atual está em 1.9.

### 1.8 Consolidação da criação de golpes e paridade motor/mesa (D-48 a D-52)

Nenhuma regra, valor ou fórmula oficial foi criada. Estas são decisões técnicas
para não perder dados e para que Campo de Batalha, Batalha de Mesa, Registro do
Mundo e modo offline concordem.

- **D-48 — Metadados de golpes:** `status`, `afetaAliados`, `buffTipo`,
  `duracao` e `descricao` agora sobrevivem ao ciclo ficha → Registro do Mundo →
  ficha. A validação pura fica em `skillValidation.js` (servidor e cliente) e a
  migração `0012_custom_skill_metadata.sql` grava as colunas. Ids repetidos
  entre golpes de classe e personalizados são renomeados (`id_2`, `id_3`).
- **D-49 — Mesa alinhada ao motor:** HoT/regen passam pela redução de cura
  recebida; DOT e HoT são processados sequencialmente com clamp e log por
  efeito; `danoDeStatus` substitui o dano padrão inventado e honra
  `danoPctVidaMaxima` (Podridão); cegueira, lentidão, fraqueza e congelamento
  voltaram a ter efeito; defesa usa as três camadas do motor; itens curam quem
  os usa (como `_resolveItem`), com `drunk`/`drunkTurns`; cura em grupo usa
  `todos` e buff/defesa em grupo usa `afetaAliados`; recarga, calor e fumaça
  avançam no fim do turno do dono; a arma selecionada é usada no Ataque com
  Dado.
- **D-50 — Utilitárias e canhões:** `attackUtility` passou a aceitar
  `action.weaponId` nos dois motores e a UI envia o id da arma Utilitária
  selecionada. A categoria vem de `categoriaDeArma`: os canhões de
  `EQUIPMENT.canoes` continuam sendo armas de distância (sem usos por batalha),
  enquanto os canhões de `EQUIPMENT.armas` com `categoria: 'utilitaria'` usam
  `attackUtility`, usos e `recargaTurnos`.
- **D-51 — Congelamento:** a duração é consumida depois de aplicar o pulo de
  turno, não antes. Um status de 2 turnos agora faz o alvo perder 2 ações, e a
  mesa bloqueia ações enquanto ele está ativo.
- **D-52 — Gemas:** os efeitos de gema que existiam só no servidor (regen,
  bônus de dano físico/mágico e status de arma) foram espelhados no cliente. A
  regen de gema também passou a respeitar a redução de cura recebida, como as
  demais fontes.
- **Testes:** novos `customSkills.test.js` (7 casos) e `offlineSkills.test.js`
  (3 casos), `battle.test.js` estendido com duração do congelamento e
  `weaponId` utilitário. Harness daquele ponto: **347/347**, sem erros de
  console; total atual: **439/439** (1.9).

### 1.9 Auditoria de regressões em fichas, motores e Batalha de Mesa

Rodada de correções feitas apenas sobre comportamentos confirmados por leitura
e teste. As decisões D-01 a D-53 continuam válidas; nenhuma regra, nome, valor
ou fórmula oficial foi inventada.

| ID | Área | Correção confirmada |
| --- | --- | --- |
| F1 | Golpes — alvo | `normalizeSkill` preserva a **chave** (`unico`, `area`, `cone`, `explosao`) em vez de gravar o rótulo de `ALVO_TIPOS`. Valor inválido continua sendo rejeitado |
| F2 | Wizard — especial/ultimate | `MegaSkillStep` mantém os defaults próprios (poder `300`, status `2/50`, modo do ultimate) e só substitui por valores realmente salvos. Especial `420/2/77` e ultimate `300/3/50` sobreviveram ao ciclo editar → voltar |
| F3 | Wizard — tipo × status | `aoTrocarTipo` limpa status incompatível: `queimadura` some ao trocar para cura; `regeneracao` some ao voltar para magia/físico; buff/defesa não guardam status |
| F4 | Descrição da ficha | O campo “Descrição (opcional)” do wizard agora entra no payload; `CharacterManager.jsx` carrega/edita/envia `desc`; `decorateCharacter` devolve `desc` a partir da coluna `descricao`; `CharacterSheet.jsx` exibe o texto |
| F4 | Migração | `server/src/db/migrations/0014_character_descricao.sql` adiciona `descricao TEXT NOT NULL DEFAULT ''`, preservando fichas antigas. Edição sem `desc` não apaga descrição já salva |
| M1 | IA — congelamento | `_pularTurnoSeCongelado` é usado por `handleAction` e por `_aiAction` nos dois motores (servidor e cliente): monstro congelado não ataca e consome uma duração por turno |
| M2 | Buffs — duração | `buffPhysicalTurns` e `buffMagicTurns` são independentes; magia/item atualizam só o eixo correspondente; `buffTurns` permanece como compatibilidade para participantes/batalhas antigas |
| T1 | Mesa — Ações Rápidas | Trocar o atacante limpa magia e item selecionados, evitando botão habilitado para ação que não existe no novo lutador |
| T2 | Mesa — iniciativa | `rollInitiative` usa os participantes recém-atualizados para ordenar e para o log; combatentes adicionados depois entram uma única vez na ordem |
| T3 | Mesa — StrictMode | `addFighter`, `importCharacter`, `removeFighter` e chefe de bioma não chamam `setState` dentro de updaters; ordem e índice de turno deixaram de duplicar |
| T4 | Mesa — itens | Consome apenas **uma** entrada do inventário por id (duas poções idênticas caem para uma). A chave do `<select>` usa `${it.id}-${idx}` para eliminar aviso de children com mesma chave |
| T5 | Mesa — Ataque com Dado | `prepararDisparo` é compartilhado com Ações Rápidas: munição, recarga, calor, superaquecimento e fumaça são validados e consumidos uma vez por disparo, inclusive quando o D20 erra |

Regressões adicionadas em `server/tests/auditoria.test.js` e importadas pelo
harness: F1, M1 (dois casos) e M2 (dois casos). Bundle do cliente, do harness e
das páginas de smoke recompilados sem avisos novos.

Validação visual no navegador: descrição carregada/salva exatamente e exibida
na ficha; wizard com poder `300` e limpeza de status; pistola em “Ataque com
Dado” com `⏳ 2t`, calor `41%` e fumaça `22%`, segundo tiro bloqueado por
recarga; duas poções idênticas reduzidas a uma; troca de atacante limpando
item; iniciativa `Atirador → Alvo`, combatente novo entrando uma vez
(`1/3`) e ciclo `Alvo → Novo → Atirador`. Harness ao fim daquela rodada: **356/356** testes,
0 falhas, 0 erros de console e 0 avisos de chave duplicada. Nos smoke tests
offline, o único erro de console é o 404 esperado de `/api/health`.

### 1.10 Kraken do Abismo Eclipse (D-54 a D-60)

Implementação publicável do chefe de Eclipse em `src/game/` e
`server/src/game/`. Nenhuma regra oficial de D-01 a D-53 foi alterada; os
valores novos que não vieram da especificação do chefe ficam marcados como
provisórios em D-54–D-59.

| Elemento | Comportamento implementado |
| --- | --- |
| Ativação | `kraken_abismo_eclipse` tem `isEclipse: true`. Ao entrar na batalha, o motor força `estadoEclipse(30, tipo)` mesmo que o calendário esteja no dia 1, ativando passiva, habilidades, horda e arena |
| Coração da Tempestade | No início do turno do Kraken, cura `5%` do HP máximo. Dano de `Luz`/`Sagrado` (e `Luz Sagrada`) no turno anterior anula a cura; os aliases são normalizados sem criar elemento novo |
| Arena | `Água Profunda Corrompida` reduz Destreza e Reflexos em `2` para heróis sem Respiração Aquática (provisório). A proteção vem de status `respiracao_aquatica`, `respirador_abissal` ou `pocao_respiracao_aquatica` |
| Tentáculos da Loucura | Até 3 alvos testam `D20 + Reflexo` contra **CD 16**; falha causa dano físico e Confusão ou Medo por 2 turnos |
| Maré Negra | Todos os heróis vivos testam `D20 + Reflexo` contra **CD 18**; falha causa dano mágico, Cegueira e Veneno por 3 turnos |
| Chamado do Abismo | Invoca `1d4 + 2` Marinheiros Afogados com a definição de horda existente; recarga provisória de 4 turnos |
| Horda | HP é um pool por unidade (`HP individual × corpos`), Moral começa em 100 e cai com abates/dano; o dano escala com corpos e Moral, com barra própria na Batalha |
| Status | `cegueira`, `veneno`, `confusao` (−20% acerto, provisório), `medo` (−10% acerto/esquiva, provisório) e `respiracao_aquatica` passaram a existir no catálogo e na UI |
| Interface | Banner mostra a arena e quantos heróis estão penalizados; o combatente do Kraken mostra passiva, habilidades e arena; a horda mostra Moral; heróis sem respiração exibem o aviso |
| Paridade | `kraken.test.js` com 13 casos cobre ativação, CDs, passiva, aliases de Luz, status, invocação, Moral e arena. Harness local: **426/426**, 0 falhas e 0 erros de console, após incluir `data.test.js` no harness para cobrir também o catálogo de status |

---

## 2. Provisório

Estas decisões foram tomadas durante a implementação para que o sistema
funcionasse sem inventar regras oficiais. Todas precisam de confirmação do
criador antes de virarem regra definitiva.

### D-01 — `categoria` oficial e `tipo` legado

- **Decisão:** `categoria` é a classificação oficial de exibição
  (`minerio`, `metal`, `especial`, `magico`). `tipo` continua existindo como
  campo legado (`minerio`, `metal`, `pedra`) para não quebrar forja, mineração e
  dados já cadastrados. `pedra` é exibida como `especial`.
- **Motivo:** os dados antigos e a forja ainda leem `tipo`; remover o campo
  agora quebraria compatibilidade.
- **Confirmação necessária:** manter os dois campos indefinidamente ou migrar
  tudo para `categoria` em uma etapa futura?

### D-02 — “Materiais utilizados em golens” é filtro

- **Decisão:** não existe uma quinta categoria exclusiva de golem. O filtro
  “Materiais utilizados em golens” usa `aplicacoes` contendo `golem`.
- **Motivo:** o mesmo metal pode ser usado em armadura, arma e golem; uma
  categoria exclusiva forçaria duplicação da ficha.
- **Confirmação necessária:** manter como filtro ou criar uma seção visual
  separada, sem duplicar dados?

### D-03 — Obsidiana e Diamante como material e gema

- **Decisão:** as duas fichas continuam em “Materiais especiais” e também
  continuam disponíveis no sistema de gemas da forja.
- **Motivo:** os `id`s já eram usados pela forja e pelos testes de gemas.
- **Confirmação necessária:** aceitar a duplicação ou separar oficialmente
  “material” e “gema” em dois cadastros?

### D-04 — Escala de raridade estendida

- **Decisão:** a escala do projeto ganhou `muitoRara` (ordem 5), `lendaria`
  (ordem 6) e `mitica` (ordem 7), além de Comum, Incomum, Rara e Épica.
- **Motivo:** o PDF usa “Muito rara” e “Mítica”; sem esses degraus, fichas
  oficiais ficariam sem classificação.
- **Confirmação necessária:** a ordem 5–6–7 é a oficial do projeto? “Muito
  rara” fica abaixo de “Lendária” e “Mítica”?

### D-05 — Schema de efeitos estendido

- **Decisão:** cada efeito mantém `desc` e `bonus` e passou a aceitar também
  `percentuais`, `penalidades`, `condicoes` e `especial`.
- **Motivo:** o PDF descreve efeitos que não cabem em bônus numérico simples.
- **Confirmação necessária:** validar os nomes e a semântica desses campos antes
  de usá-los em combate.

### D-06 — Qualidade “Variável”

- **Decisão:** Satetsu recebeu a qualidade `variavel`, fora da escala ordenada
  (ordem 0), porque o PDF a descreve como variável.
- **Motivo:** encaixá-la em Inferior–Perfeito seria inventar um degrau.
- **Confirmação necessária:** “Variável” é uma qualidade oficial ou uma
  observação de que a qualidade depende da amostra?

### D-07 — Bônus negativo do secundário

- **Decisão:** o secundário usa `Math.trunc(valor * 0,25)` em vez de
  `Math.floor`. Assim, uma penalidade de -1 vira 0 (em vez de -1) e uma de -5
  vira -1 (em vez de -2), respeitando o limite de 25% sem exagerar a punição.
- **Motivo:** manter o limite de 25% também para valores negativos.
- **Confirmação necessária:** penalidades do secundário devem ser aplicadas,
  ignoradas ou também limitadas a 25%?

### D-08 — Percentuais do secundário

- **Decisão:** percentuais seguem a mesma regra dos bônus: o percentual do
  principal prevalece, o secundário entra com 25% truncado e chaves idênticas
  não acumulam.
- **Motivo:** evitar que dois materiais somem o mesmo percentual e fujam do
  limite de composição.
- **Confirmação necessária:** percentuais realmente seguem a regra de 25% ou
  devem ser tratados como efeito binário?

### D-09 — Custo com quantidades em kg

- **Decisão:** `calcularCustoFabricacao` aceita `{ primarioKg, secundarioKg }`.
  Sem quantidades informadas, mantém 1 kg do principal e 0,25 kg do secundário.
  Quantidades negativas viram zero.
- **Motivo:** o catálogo passou a ter preço por kg; era necessário calcular
  peças com massas diferentes sem alterar a economia atual.
- **Confirmação necessária:** a peça padrão continua 1 kg + 0,25 kg? O custo do
  material deve incluir o preço-base do equipamento na tela de composição?

### Outras decisões provisórias de implementação

- **Preço exibido:** valores em centavos são decompostos em Platina, Ouropla,
  Ouro, Prata e Bronze. A conversão usa a tabela `MOEDA` já existente.
- **Aplicações:** quando a ficha não declara `aplicacoes`, o sistema deriva a
  lista das categorias de efeito já cadastradas. Uru e os demais metais oficiais
  têm a aplicação de golem derivada do efeito de golem da própria ficha.
- **Fallback mágico:** cajado, varinha, grimório, orbe e catalisador sem efeito
  específico usam `equipamentoMagico`. Nenhuma ficha real inventa um efeito
  específico só para preencher a categoria.
- **Preço na composição:** a tela mostra o custo do material e avisa que ele
  **não inclui** o preço-base do equipamento.
- **Interface:** catálogo único com abas “Catálogo” e “Composição”; não foram
  criadas telas separadas por categoria.

### 1.11 Canhões — tripulação, descrições mecânicas e D20 (D-62 a D-68)

Decisões do criador sobre os canhões, aplicadas nos dois motores e nos dois
catálogos. As regras D-01 a D-61 continuam válidas; os números abaixo são
provisórios porque o texto oficial das armas não foi fornecido.

| Decisão | Comportamento implementado |
| --- | --- |
| D-62 | `artilharia` continua sendo apenas filtro/grupo (`WEAPON_CATEGORIES.artilharia` e `CANOES_IDS`). `ARMAS_SLOTS` permanece `perto`, `distancia`, `utilitaria` |
| D-63 | Não existe recurso de munição. A "munição" dos canhões é a carga atual: `usosMax`/`recargaTurnos` nos utilitários e `recarga` em turnos na artilharia |
| D-64 | Artilharia exige tripulação mínima de 2: o atirador e mais 1 aliado vivo do mesmo lado. Sem ajudante, o disparo continua, mas com `acertoPenalidade: 0.2` (log: "sem tripulação mínima") e `+1` turno de `wpnRecarga` |
| D-64 | Não há persistência de papéis de tripulação: qualquer combatente vivo do mesmo lado conta como ajudante, inclusive em modo livre (`team` nulo, comparando `isMonster`) |
| D-65 | "Ignora parte da defesa" virou `ignoraDefesaPct: 25` no Canhão de Dragões e na Besta Pesada. `_applyDamage` reduz a defesa em 25% antes de descontá-la do dano |
| D-66 | "Peso quase proibitivo" virou `penalidade: { destreza: -1, reflexos: -1 }` no Canhão Bombasta, aplicada por `effectiveAttributes`. "Precisa de tripé" virou `recarga: 5` no Canhão de Cerco (4 + 1 turno) |
| D-67 | "Pólvora negra" virou `fumacaExtra: 1` no Canhão de Ferro, somado à fumaça padrão do disparo por `_emitirFumaca` |
| D-68 | Batalha de Mesa com painel **💣 Artilharia — Canhões (🧰)**: atirador, peça, alvos, recarga/carga e tripulação. Acerto “rolar-maior” em mesa, Campo e servidor: `d20 ≥ exigência`, com `exigência = 21 − alvo + dificuldade`; 1 = falha natural e 20 = crítico natural |
| D-68 | `exigenciaD20(chance, dificuldade)` espelha a probabilidade antiga (0,35 → 14, 0,5 → 11, 0,95 → 2; limites 0 → 20 e 1 → 2) e limita a exigência a `2..20`. `_rollToHit` devolve `chance`, `exigencia`, `dificuldade` e `nivel`; o `nivel` vem da exigência, nunca da rolagem |
| D-68 | As faixas 🟢 Fácil 1–4 / 🟡 Médio 5–10 / 🟠 Difícil 11–16 / 🔴 Muito Difícil 17–20 mantêm os números, mas agora descrevem a **exigência da ação**; um d20 alto é mais fácil de conseguir. A direção “rolar-menor” anterior fica superada |
| Catálogo | Os dois conjuntos oficiais convivem com papéis distintos: 8 peças em `EQUIPMENT.canoes` (artilharia/distância) e 5 canhões em `EQUIPMENT.armas` com `categoria: 'utilitaria'`, `usosMax` e `recargaTurnos` |
| Compatibilidade | Os campos novos (`tripulacaoMinima`, `ignoraDefesaPct`, `fumacaExtra` e `penalidade`) são opcionais e foram espelhados em `src/game/data.js`, `server/src/game/data.js` e nos dois `battleManager.js`. Armas sem esses campos mantêm o comportamento anterior |
| Não inventado | Os números 25%, −1 DEX/REF, +1 turno de tripé, +1 fumaça e a penalidade de −20%/+1 recarga são provisórios e não foram apresentados como regra oficial. "Munição" não virou recurso persistente; P-14 fica em aberto apenas para escudos e itens mágicos |

#### Correções da revisão (D-62 a D-67)

- **`Rules.jsx`:** criada a seção 14.1 com D-62 a D-67 e corrigidas as passagens antigas que
  contradiziam a implementação (slot utilitário, `usosMax` para toda artilharia, "munição
  relevante", fumaça e `ignoraDefesaPct` omitidos).
- **Batalha de Mesa:** `TableBattle.jsx` passou a aplicar tripulação mínima (−20% de acerto e
  +1 recarga), `ignoraDefesaPct`, `fumacaExtra` e penalidades de equipamento na mira, antes
  isso só acontecia nos dois `battleManager.js`. A mesa não usa `BattleManager`.
- **Penalidade do Bombasta (D-66):** `penalidade` era contabilizada em `effectiveAttributes`,
  mas a mira usava os atributos-base, então −1 DEX/REF não tinha efeito em combate. Novo helper
  `penalidadesEquipamento` (nos dois `data.js`) aplica apenas malefícios a atirador e alvo em
  `_rollToHit` e em `effectiveStat` da mesa; bônus de equipamento continuam fora da rolagem.
- **Redação do tripé (D-66):** a descrição do Canhão de Cerco dizia "Precisa de tripé
  (+1 turno)", sugerindo um custo extra que não existe. Agora diz "Tripé embutido: recarga de
  5 turnos (+1 sem ajudante)", espelhada nos dois catálogos.
- **Modo livre (D-64):** `_aliadosDe` continua vazio em `'todos'` para fogo amigo, mas a
  tripulação usa verificação própria (`isMonster`) e humanos contam como ajudantes entre si —
  comportamento intencional, não bug.

#### Revisão D-68 — painel 🧰 e exigência do D20

- **Batalha de Mesa:** novo painel **💣 Artilharia — Canhões (🧰)**, com atirador, peça,
  alvos, recarga/carga, tripulação e fumaça; `artilharia` continua apenas filtro/grupo.
- **D20:** `exigenciaD20` em `src/game/sistema.js` e `server/src/game/sistema.js` converte a
  chance antiga na exigência mínima (`d20 ≥ exigência`) sem mudar probabilidades. 20 é crítico e
  1 é falha natural; golpes mais fortes/pesados aumentam a exigência e as faixas classificam a
  exigência, não a rolagem.
- **Paridade:** a conversão e o log (`exigia N no d20` / `Médio (≥N)`) estão espelhados nos dois
  `battleManager.js`; ataque rápido, magias multi-alvo e rolagem manual da mesa usam a mesma
  regra. `Battle.jsx` e `Rules.jsx` trocaram a descrição “rolar-menor” pela de D-68.

---

## 3. Pendente

### 3.1 Decisões pendentes desta etapa

#### D-11 — Fichas completas de Ruidium, Vibranium, Honríneo e Mournlode

- **Ruidium:** o preço, a classificação Mítica/Perfeito, a identidade psíquica e
  o sistema de Corrupção foram implementados (D-18 e D-28). Continuam pendentes
  os efeitos numéricos individuais por categoria.
- **Vibranium:** a identidade e a direção dos efeitos foram registradas (D-17).
  Faltam percentuais, limites de armazenamento, sobrecarga e efeitos de combate.
- **Honríneo:** a adaptação automática foi registrada sem números (D-16).
- **Mournlode:** preço e identidade foram registrados (D-19); faltam raridade,
  qualidade e efeitos individuais.
- **Decisão necessária:** recuperar os números oficiais restantes ou manter as
  fichas parciais.

#### D-12 — Efeitos de Ferro Estígio e Honríneo

- Ferro Estígio tem a restrição de treinamento registrada, mas os efeitos por
  equipamento continuam pendentes.
- Honríneo tem raridade, qualidade, preço e a propriedade de adaptação aprovada,
  mas os percentuais por categoria não existem na documentação recuperada.
- **Decisão necessária:** quais bônus, percentuais, penalidades e condições
  oficiais cada um concede?

#### D-14 — Commit e limpeza do pacote final

- O pacote das etapas 7 e 8 foi commitado em `1fbe868`, `a4db8de`, `c7b8428`,
  `c20aee5`, `adf007c`, `573a3fc` e `6020bd5`. O merge `6336a4b` recebeu a
  resolução dos conflitos em `91bd8f5` e a exibição de modificadores em
  `9c8ad27`; a árvore de trabalho ficou limpa.
- Os testes de regressão estão em `server/tests/forgeMaterials.test.js`,
  `materialCatalog.test.js`, `materialSchema.test.js`, `podridao.test.js`,
  `corrupcao.test.js`, `contaminacao.test.js` e `runas.test.js`.
- O arquivo temporário `server/tests/preview-materiais.jsx` foi removido do
  pacote final por ser apenas uma prévia local da interface.
- **Decisão necessária:** decidir se os arquivos de harness continuam no
  repositório ou viram ferramentas locais descartáveis; o envio dos commits ao
  remoto também depende do criador.

#### D-36 — Efeitos individuais das 17 runas

- **O que falta:** identidade mecânica de cada runa (efeito passivo, ativação,
  alvo, duração, custo, restrições) e eventual compatibilidade com categorias de
  equipamento.
- **Por que é necessário:** sem esses dados, a forja só pode aplicar o template
  genérico **não oficial**; qualquer valor por elemento seria invenção.
- **Onde será usado:** `src/game/runas.js` (`RUNAS_FICHAS`), `Forge.jsx`,
  `src/game/forge.js` e o motor de combate.
- **Afetados:** ficha individual, prévia da forja, persistência do item e
  aplicação automática em combate.
- **Decisão necessária:** fornecer o texto/valores oficiais ou autorizar
  explicitamente o template genérico como regra oficial.

#### D-37 — Compatibilidade entre runas e equipamentos

- **O que falta:** lista oficial de quais categorias aceitam quais runas e se
  existe custo/requisito além do encaixe de pedra preciosa.
- **Por que é necessário:** a implementação atual valida apenas limite, elementos
  diferentes e Aço Rúnico; não inventa compatibilidade.
- **Onde será usado:** `validarRunasEquipamento`, `Forge.jsx` e
  `sanitizarItemCraftado`.
- **Afetados:** seleção na forja e itens já persistidos.
- **Decisão necessária:** definir a matriz runa × categoria (ou confirmar que
  qualquer runa cabe em qualquer equipamento com encaixe).

#### D-38 — Alcance da imunidade do Tenebrium

- **O que falta:** definir se a imunidade cobre **toda** Podridão ou apenas a
  causada por Tenebrium; se vale para golens, monstros ou apenas personagens; e
  como interage com armas de Tenebrium.
- **Por que é necessário:** a regra aprovada garante imunidade à Podridão, mas a
  documentação recuperada não detalha as fontes cobertas.
- **Onde será usado:** `itemConcedeImunidadePodridao`,
  `participanteConcedeImunidadePodridao` e `_applyStatus` do `battleManager`.
- **Afetados:** combate online/offline e ficha de equipamento.
- **Decisão necessária:** confirmar o escopo da imunidade sem alterar a
  restrição de não usar Tenebrium na armadura inteira.

#### D-40 — Comportamento completo de “Consumido”

- **O que falta:** duração, condições de recuperação, consequências permanentes,
  quem controla o personagem, o que acontece fora de combate e se há morte
  possível por outras causas.
- **Por que é necessário:** a única regra aprovada é que o mestre assume
  temporariamente o controle e que **não** há morte automática.
- **Onde será usado:** painel de Corrupção em `CharacterSheet.jsx`, API de
  Corrupção e eventual estado de combate.
- **Afetados:** personagem, histórico, combate e permissões do mestre.
- **Decisão necessária:** aprovar as regras adicionais; até lá, a implementação
  mantém apenas o controle manual e o aviso.

#### D-41 — Contaminação Profana e Núcleo Pandemônico

- **O que falta:** gatilho exato da Contaminação Profana em armadura, progressão
  por exposição, remoção/purificação, materiais e instalação do Núcleo
  Pandemônico, custo de ativação, efeitos e limitações no golem.
- **Por que é necessário:** existem descrições oficiais parciais, mas não há
  números ou condições suficientes para automação.
- **Onde será usado:** `src/game/contaminacao.js`, `forge.js`, ficha de
  equipamento e futuro sistema de golens.
- **Afetados:** combate, forja, itens e golens.
- **Decisão necessária:** fornecer os detalhes oficiais; as estruturas
  permanecem com `automatico: false`.

#### D-42 — Condições da Ruptura Profana

- **O que falta:** confirmar se a Ruptura Profana existe apenas em armas de
  impacto e apenas em acertos críticos, e se outros equipamentos podem aplicá-la.
- **Por que é necessário:** a implementação atual segue exatamente o bloco
  recuperado (30%, 2 turnos, somente crítico), sem ampliar o alcance.
- **Onde será usado:** `CONTAMINACAO_POR_CATEGORIA` e `_applyStatus`.
- **Afetados:** armas de impacto e testes de forja/combate.
- **Decisão necessária:** confirmar o alcance ou indicar outras categorias.

### 3.2 Dados oficiais ainda ausentes

Situação atual do catálogo:

- **19 fichas sem raridade** e **30 sem qualidade**.
- **Nenhuma ficha está com status `completo`**; todas têm pelo menos um campo
  pendente.
- **25 fichas** estão marcadas como aplicação de golem.
- **5 fichas** são míticas e **5** são perfeitas (Uru, Vibranium, Ruidium,
  Honríneo e Minério de Honra).
- Todas as fichas continuam com os campos físicos pendentes: características,
  dureza, resistência, peso, densidade, flexibilidade e condutividade mágica.
- Muitas fichas ainda não têm descrição, bioma, compatibilidade, aplicações ou
  efeitos. Onde não há dado oficial, a interface mostra “Pendente”.
- **Imagens:** não existem os arquivos `assets/materiais/*.png`; a interface usa
  a inicial do material e o aviso “Imagem pendente”.
- **Adamantino** e **Mournlode** têm preço, mas não têm raridade nem qualidade
  informadas no complemento.
- **Ouro Imperial**, **Bronze Celestial**, **Ferro de Febre**, **Adamantino** e
  **Mournlode** têm preço oficial, mas não têm efeitos por categoria recuperados.
- **Aurorum**, **Prata Sagrada**, **Ébano**, **Stalhrim**, **Gelo Eterno**,
  **Aço Negro** e **Minério da Alma** continuam sem ficha de efeitos.

O que falta preencher com o criador/documentação:

1. Raridade e qualidade das 19/30 fichas restantes.
2. Descrições oficiais e biomas de origem.
3. Ficha física completa (peso, dureza, densidade etc.).
4. Lista oficial de categorias compatíveis por material.
5. Efeitos por equipamento que ainda estão vazios, incluindo Ferro de Febre,
   Ouro Imperial, Bronze Celestial, Mournlode e Aurorum.
6. Efeitos de golem para os materiais que podem ser usados em golens.
7. Imagens oficiais.
8. Percentuais, limites e sobrecarga do Vibranium.
9. Efeitos numéricos por categoria do Ruidium, sem confundir com a potência
   mágica da Corrupção.
10. Efeitos individuais de cada uma das 17 runas elementais.

### 3.3 Integrações ainda pendentes

- **Combate:** o avaliador puro (`combatEffects.js`) e o `perfilMecanico` já
  existem, e as armas de Tenebrium/Prata Pandemônica aplicam status. Efeitos
  reativos, de área e condicionais não representados pelo motor continuam
  descritivos; nenhum percentual é inventado.
- **Percentuais, penalidades, condições e efeitos especiais:** são expostos na
  ficha, na composição e no perfil mecânico. `forge.js` continua somando apenas
  bônus numéricos em `atributosFinais`; o combate usa o perfil quando a regra é
  automatizável.
- **Golens:** não existe golem jogável, equipamento ou aliado; o catálogo só
  registra quais materiais podem ser usados.
- **Mineração:** os veios e drops ainda entregam os `id`s refinados (`ferro`,
  `cobre`, `estanho`, `chumbo`). Falta decidir quando passam a entregar os
  minérios brutos (`minerioFerro` etc.).
- **Receitas:** nenhuma receita nova de equipamento foi aprovada. A
  compatibilidade existe no schema, mas nenhum material real declara uma lista
  oficial de categorias compatíveis.
- **Armadura de Tenebrium:** a imunidade documentada no PDF foi implementada
  como derivada do equipamento (D-38). A armadura craftada com Tenebrium no
  primário ou no secundário concede imunidade à Podridão enquanto estiver
  equipada. A restrição de não usar Tenebrium na armadura inteira continua
  valendo. Fontes da Podridão cobertas pela imunidade, interação com armas de
  Tenebrium e efeito em golens continuam pendentes.
- **Podridão no combate:** a Podridão de arma já é aplicada por Tenebrium. A
  exposição por turnos, a progressão de estágios e o tratamento continuam
  disponíveis como módulo puro, sem gatilho automático no `battleManager`.
- **Contaminação Pandemônica no combate (D-35/D-41):** armas de lâmina e de fogo
  já aplicam Ferida Pandemônica e Munição Contaminante, com dano sobre a vida
  máxima original e redução de cura. A Ruptura Profana é aplicada em acertos
  críticos (D-42). Contaminação Profana (armadura) e Núcleo Pandemônico (golem)
  têm apenas estrutura descritiva com `automatico: false`; a automação depende
  das decisões ainda abertas em D-41.
- **Corrupção no combate (D-29/D-39):** as penalidades do estágio já entram em
  `_finalAttrs`, a pontuação é persistida, as rotas de API existem, a ficha exibe
  pontos/estágio/penalidades/histórico e o mestre pode ajustar. O comportamento
  completo de “Consumido” continua pendente (D-40).
- **Runas no combate (D-35/D-37):** o efeito genérico aprovado existe em
  `efeitoRuna`/`modificadoresRuna`; a forja permite selecionar, validar e
  persistir as runas. As identidades e os efeitos individuais das 17 runas
  continuam pendentes, então não há aplicação automática por elemento no combate.
- **Paridade offline/online:** a forja e o combate têm caminhos separados; falta
  garantir que todos os efeitos valham nos dois. Na Etapa 8, o salvamento do
  item craftado, a dedução da carteira, a preferência pelo item do inventário e
  os atributos finais foram alinhados; agora o perfil mecânico também é
  preservado no servidor. Nesta rodada, `skillFromSpell` e o motor de
  buff/cura/status foram mantidos idênticos no cliente e no servidor.
- **Golpes no Registro do Mundo:** `validateCustomSkill` só aceita nome, tipo,
  poder, custo, cooldown, `todos`, descrição, alvo, alvos e splash. Os metadados
  novos (`status`, `afetaAliados`, `buffTipo`, `duracao`) ficam apenas em
  `character.skills`, sem coluna no schema/DB do Registro do Mundo.
- **Defesa na mesa × motor:** o motor trata defesa com `p.defense` (dano pela
  metade); a Batalha de Mesa usa redução percentual de dano recebido (teto 75%).
  A divergência é intencional e precisa de decisão antes de unificar.

### 3.4 Validação e limitações do ambiente

- **Neste ambiente (12/11/2026), `node`, `npm` e `git` não estão no `PATH`.**
  A validação local usou o binário do esbuild já presente em `node_modules`, um
  servidor estático em PowerShell e o harness de navegador.
- No ambiente da auditoria da Etapa 8, `node` v24.15.0 e `npm` 11.12.1 estavam
  disponíveis; no PowerShell, `npm`/`npx` puros esbarram na ExecutionPolicy e é
  preciso usar `npm.cmd`. Nesse ambiente, **421/421 testes unitários** passaram
  (`npm.cmd run test --prefix server`) e o build de produção
  (`npm.cmd run build`) concluiu sem erro.
- Resultado do harness após a integração dos efeitos (Etapa 8):
  **242/242 testes passam**, sem falhas, incluindo os novos testes de
  `combatEffects`, perfil mecânico, status derivados da forja e efeito genérico
  das runas.
- Resultado do harness na Etapa 9: **261/261 testes passam**, sem falhas e sem
  erros no console, incluindo fichas de runas, validação/persistência de runas na
  forja, imunidade do Tenebrium, Contaminação Profana/Núcleo Pandemônico e
  Ruptura Profana em crítico.
- Resultado do harness na rodada de buff/cura/Ações Rápidas/canhões:
  **347/347 testes passaram**, sem falhas e sem erros no console, incluindo os
  casos de Cura em Massa, Grito de Guerra, Benção, item com redução de cura,
  cura de magia em aliado com Contaminação Pandemônica, persistência de
  metadados de golpes, duração do congelamento e `weaponId` utilitário. Total
  atual, após a auditoria 1.9 e a rodada de canhões: **439/439**.
- Nesta rodada, `npm run test:unit`, `npm run test:e2e` e `npm run build` não
  puderam ser executados porque `node`/`npm` continuam fora do `PATH`; a
  validação foi feita pelo bundle do esbuild e pelo harness de navegador.
- A interface foi validada no navegador: catálogo com 52 fichas, filtros
  (7 minérios, 35 metais, 5 especiais, 5 mágicos e 25 de golem), busca por alias
  (inclusive sem acento), ficha detalhada e composição com custo parcial e
  limitação de kg.
- A prévia registrou apenas respostas HTTP 404 para as imagens ausentes; não
  houve erro de aplicação no console.
- **Teste E2E oficial, responsividade e acessibilidade completa** continuam sem
  verificação.
- O `git` também não está no `PATH` neste ambiente; quando necessário, usar o
  executável do GitHub Desktop. O commit-base e as etapas seguintes já foram
  commitados; as pendências de commit restantes estão em D-14.

### 3.5 Correções aplicadas na auditoria

Estas correções foram feitas sobre a implementação já commitada. Não alteram
nomes, valores, fórmulas nem efeitos oficiais; apenas corrigem o comportamento
do código.

| Área | Correção |
| --- | --- |
| Imagem do material | `MaterialThumb.jsx` centraliza o fallback com inicial e selo “Imagem pendente” para cards e ficha; a imagem que falha ao carregar também cai no fallback |
| Composição — kg | Quantidade negativa é limitada a zero; o valor exibido usa o kg já normalizado |
| Composição — preço | Custo parcial é identificado como “Parcial” e lista os materiais sem preço por kg |
| Custo da forja | `craftarEquipamento` repassa `quantidades` para `calcularCustoFabricacao` |
| Inventário | `tipoInventarioEquipamento` grava `arma_fogo` somente para armas de fogo e preserva `arma`, `armadura` e `acessorio` |
| Aliases | `getMaterialPorAlias` usa `normalizarTexto`, encontrando aliases com ou sem acento; o import ausente em `materials.js` foi corrigido |
| Bônus de conjunto | `calcularBonusConjunto` aceita `materiais.primario` como id ou objeto |
| Podridão — vida atual | Vida 0 permanece 0 (personagem caído) e valores negativos são limitados a zero, antes e depois do tratamento |
| Validação de efeitos | `validarMaterial` confere `percentuais`, `penalidades`, `condicoes`, `especial`, `chance`, `duracao`, `alvo`, `status` e `modificadores` |

### 3.6 Regras gerais do RPG ainda pendentes (P-01 a P-18)

Estas pendências já existiam antes da etapa de materiais e continuam válidas.
Foram mantidas aqui para não se perderem.

| Código | Tema | Situação atual | Decisão necessária |
| --- | --- | --- | --- |
| P-01 | Nível máximo, XP e crescimento | Limite manual 30; “Subir com XP” sem limite; atributos param no teto 12 | Nível máximo, curva, teto e o que fazer com personagens acima do limite |
| P-02 | Quem recebe XP | Só vencedores vivos recebem; derrota total não distribui | Mortos/perdedores participam? Quem recebe em PvP e em derrota? |
| P-03 | Teto de 60% e sobra de XP | Sobra vai para o maior participante; solo vira 100% | Redistribuir, descartar ou converter a sobra? |
| P-04 | HP de chefe | Chefes internos usam 2,5–3,0; chefe dinâmico usa ×2 | Padronizar em ×2 ou manter multiplicadores por tipo? |
| P-05 | Recompensas, ondas e puzzles | Batalha concede XP genérica, moedas e drop aleatório; ondas entram juntas | Usar recompensas configuradas? Ondas sequenciais? Puzzles agora? |
| P-06 | Categorias de armadura e sinergia | Armaduras sem categoria; classes sem sinergia | Só exibir ou aplicar bônus? Quais números? Como migrar? |
| P-07 | Peso, quantidade e inventário | `cargaMaxima()` existe, mas loja usa 40 de peso/20 espaços; servidor não valida | Aplicar no servidor? Qual fórmula de espaços? O que conta para peso? |
| P-08 | Status `atordoado` e `ferido` | Existem 8 status; os dois citados não existem | Efeito exato e duração de cada um |
| P-09 | Desgaste, falhas e reparo | `WEAPON_STATES` só é exibido; não há durabilidade/falha/reparo | Gatilhos, pontos, custo e local do reparo |
| P-10 | Distância horizontal | Só existe alcance vertical; `ALCANCE_TYPES` não participa do combate | Faixas abstratas? Quem muda de faixa? Alcance por arma/magia? |
| P-11 | Fome e saciedade | Não existe | Como sobe, penalidades, comida, raças e se afeta combate |
| P-12 | Golems | Só existe o slot visual nos efeitos de gema | Golem é personagem, equipamento ou aliado? Como entra na ficha? |
| P-13 | Veículos | Não existe | Inventário, mapa ou flavor? Capacidade, velocidade e destruição |
| P-14 | Munição, escudos e itens mágicos | **Munição resolvida (D-63):** sem recurso separado — usos por combate + recarga, com tripulação provisória em D-64. Escudos e itens mágicos continuam sem implementação | Escudo é slot separado? Quais capacidades e regras oficiais para escudos/itens mágicos? |
| P-15 | Especializações de classe | Só existe especialização em arma (+10% corpo a corpo/distância) | Cada classe terá árvore? Quais especializações e custos? |
| P-16 | Paridade offline/online das gemas | Servidor aplica regeneração/bônus/status; offline só bônus de atributo | Unificar lógica ou manter cópias com teste de paridade? |
| P-17 | Efeitos raciais e de equipamento no Eclipse | `buffsEclipseRaca` definido, mas não usado; equipamentos melhores não aparecem | Quais buffs entram? Como e quando surgem equipamentos melhores? |
| P-18 | Documentos de contexto ausentes | Não existem `AI_CONTEXT.md` nem `AI_RULES.md`; a fonte efetiva é `Rules.jsx` | Criar os arquivos a partir de `Rules.jsx` e do código, sem inventar regras? |

Arquivos afetados pelas pendências gerais: `server/src/services/characters.js`,
`src/components/CharacterSheet.jsx`, `src/game/data.js`,
`server/src/game/data.js`, `src/game/battleManager.js`,
`server/src/game/battleManager.js`, `src/game/sistema.js`,
`server/src/game/sistema.js`, `src/pages/Rules.jsx`, `src/pages/Battle.jsx`,
`src/pages/Dungeons.jsx`, `src/pages/ToolShop.jsx`, `src/pages/Registry.jsx`,
`src/pages/Compendium.jsx`, `src/game/eclipse.js`,
`server/src/game/eclipse.js`, `src/game/forgeGems.js`,
`src/components/AlvoSelect.jsx`, `src/components/FichaForm.jsx`,
`src/config.js`, `src/api.js`, `src/pages/Forge.jsx` e
`tools/sync-server-game.ps1`.

### 3.7 Relatório de divergências do complemento

Comparação entre o catálogo anterior, o PDF e o complemento:

| Item | Divergência encontrada | Tratamento aplicado |
| --- | --- | --- |
| Mournlode | A chave era `mournrlode`, mas o `id` era `mournlode`; a busca por id falhava | Chave corrigida para `mournlode` (D-23) |
| Minério da Alma | Era alias de `metalDasAlmas`, mas o complemento o define como matéria-prima do metal | Alias removido; ficha pendente própria criada (D-24 e D-31) |
| Efeitos legados dos metais | Ferro, Cobre, Estanho, Chumbo, Prata e Ouro tinham efeitos por categoria não confirmados pelo complemento | Efeitos preservados e marcados para revisão (D-25) |
| Uru e Aço Daédrico | Efeitos muito semelhantes e mesmos percentuais em várias categorias | Fichas mantidas separadas; decisão do criador pendente (D-26) |
| Adamantino | O complemento informa preço e efeitos, mas não raridade/qualidade | Preço e efeitos implementados; classificação pendente |
| Honríneo | O complemento proíbe criar percentuais adicionais | Apenas a adaptação automática foi registrada |
| Vibranium | O complemento aprova a direção dos efeitos, mas não os números | Descrições registradas; números pendentes |
| Ruidium | A ficha anterior só citava “cinco estágios”; o complemento define a mecânica completa | `corrupcao.js` implementado; efeitos de fabricação por categoria continuam pendentes |
| Ferro de Febre | O complemento afirma que a ficha completa foi aprovada, mas não traz os valores | Raridade, qualidade, preço e identidade registrados; efeitos pendentes |
| Mournlode | O complemento define preço e identidade, mas não os efeitos nem raridade/qualidade | Preço e identidade registrados; raridade, qualidade e efeitos pendentes |
| Ouro Imperial | A ficha anterior tinha classificação, mas não preço | Preço de 50 Ouro/kg adicionado; efeitos pendentes |
| Bronze Celestial | A ficha anterior tinha classificação, mas não preço | Preço de 25 Ouro/kg adicionado; efeitos pendentes |
| Obsidiana | O complemento reforça que é material vulcânico, não metal | Mantida como `tipo: 'pedra'` e categoria especial (D-03) |
| Carvão | O complemento reforça que é material utilitário, não metal | Mantido como especial e fora das fichas de arma/armadura |
| Preço do Cobre | O complemento diz “preço aumentado em 10%”, sem informar a referência | Preço atual preservado; referência registrada como pendência |

Nenhum nome, valor, fórmula ou efeito oficial foi alterado sem autorização. As
lacunas que o complemento não preenche continuam como pendentes.

### 3.8 Correções de integração aplicadas na Etapa 8

Estas correções fecham os defeitos de integração da forja listados na Etapa 7.
Nenhuma regra, fórmula ou valor oficial foi alterado.

| Área | Correção |
| --- | --- |
| Rota de craft | Criada `POST /api/characters/craft` em `server/src/index.js`, com validação de personagem, vínculo com o jogador, tipo, categoria de arma e limites numéricos |
| Dados do item | `sanitizarItemCraftado` (servidor) grava apenas campos conhecidos, limita bônus a ±99, descarta atributos desconhecidos e valida nome/tipo/categoria |
| Id do item | Cada peça nova recebe um `id` único; duas armas iguais não compartilham mais o mesmo id no inventário |
| Melhoria/reparo | `craftItem` com `modo: 'atualizar'` substitui a peça existente em vez de criar uma cópia duplicada |
| Carteira | Criada `POST /api/wallet/spend`, usada por `api.gastarCarteira` na forja (craft, melhoria e reparo) |
| Equipar craftado | `equipItem` (online e offline) procura primeiro o item no inventário, preservando `atributosFinais`, materiais, durabilidade, gemas e slots; a peça sai do inventário ao ser equipada e volta ao desequipar |
| Atributos finais | `effectiveAttributes` (cliente e servidor) usa `atributosFinais` no lugar de `bonus`, sem somar os dois; `calcularAtributosPersonagem` segue a mesma regra |
| Atributos de combate | A peça craftada passa a gravar `defesa`, `alcance`, `elemento`, `efeito`, `alvo`, `alvos`, `splash` e `recarga` da definição-base; sem isso, armaduras perdiam a defesa e armas de fogo viravam corpo a corpo |
| Slots de gema | O item craftado passa a gravar `socketSlots`, permitindo encaixar gemas depois de equipado |
| Gemas no craft | As gemas escolhidas na forja viram `socketedGems`/`socketedGemEstados`; `atributosFinais` guarda apenas bônus-base + materiais e `gemsAttrs` aplica os efeitos da gema, sem duplicar atributos |
| Gemas em armas | `gemsAttrs` e os loops de regeneração/multiplicadores do servidor passam a varrer `equipment.armas` com a categoria `arma`, cobrindo as até três armas equipadas e a arma legada sem duplicar |
| Arquivo temporário | `preview-materiais-entry.jsx` foi removido por não ser referenciado pelo projeto |
| Seleção de materiais | `Forge.jsx` passou a montar a lista por `categoria` (minério, metal, especial e mágico), sem depender só do campo legado `tipo` |
| Efeitos gerais | `getEfeitoPorEquipamento` combina `efeitosGerais` com o efeito da categoria, preserva o fallback de `efeitos.geral` e mantém golens fora desse fallback; `MaterialDetails` exibe os modificadores resultantes e rotula `efeitosGerais` como efeito geral |
| Testes | 421/421 testes unitários passavam na auditoria da Etapa 8; o harness local valida 200/200, incluindo 6 testes novos de resolução de efeitos por equipamento |

### 3.9 Correções e integrações aplicadas na Etapa 9

Nenhuma regra, fórmula ou valor oficial foi alterado. As alterações apenas
expõem, validam ou persistem o que já estava aprovado.

| Área | Alteração |
| --- | --- |
| Fichas de runas | `RUNAS_FICHAS`, `fichaRuna` e `descreverFichaRuna` em `src/game/runas.js`; efeito individual permanece `null` e `status: 'pendente'` |
| Runas na forja | `equipamentoTemAcoRunico`, `validarRunasEquipamento` e `normalizarRunasParaItem` em `src/game/forge.js`; `craftarEquipamento` valida e persiste `runas` |
| UI da forja | `Forge.jsx` seleciona as 17 runas, aplica limite por Aço Rúnico, bloqueia elementos repetidos e exibe a prévia genérica marcada como provisória |
| Servidor — runas | `sanitizarItemCraftado` deriva Aço Rúnico dos materiais e rejeita runas inválidas |
| Imunidade do Tenebrium | Constantes e helpers em `src/game/podridao.js`; imunidade aplicada em `_applyStatus` nas duas cópias de `battleManager.js` |
| Contaminação Profana | `criarEfeitoContaminacaoProfana` com `automatico: false` em `src/game/contaminacao.js` |
| Núcleo Pandemônico | `criarEfeitoNucleoPandemico` com `automatico: false` em `src/game/contaminacao.js` |
| Ruptura Profana | `armaImpacto: 'rupturaProfana'` em `CONTAMINACAO_POR_CATEGORIA`; status 30% / 2 turnos / `somenteCritico` |
| Corrupção — persistência | `setCorrupcao` com tipo/motivo, `registrarHistoricoCorrupcao` e `getHistoricoCorrupcao` em `server/src/services/characters.js` |
| Corrupção — migração | `server/src/db/migrations/0011_corrupcao_historico.sql` cria `character_corruption_history` com índice |
| Corrupção — API | Rotas `GET/POST /api/characters/:id/corrupcao` com checagem de dono e suporte a `pontos`, `ganho` e `recuperacao` |
| Corrupção — cliente | `api.getCorrupcao`/`api.setCorrupcao` online/offline com clamp 0–100 e histórico local |
| Corrupção — UI | Painel em `CharacterSheet.jsx` com pontos, barra, estágio, penalidades, chance, potência, aviso de mudança, histórico e controles do mestre |
| MaterialDetails | Categorias sem efeito exibem “Não definido.” |
| Testes | `runas.test.js`, `podridao.test.js`, `contaminacao.test.js` e `forgeMaterials.test.js` estendidos; harness **261/261** |

### 3.10 Correções aplicadas na rodada de buffs, cura e Ações Rápidas

Nenhuma regra, fórmula ou valor oficial foi alterado. As correções alinham a
Batalha de Mesa ao motor do Campo de Batalha e fecham defeitos da criação de
golpes.

| Área | Correção |
| --- | --- |
| Motor — buffs | `_aplicarBuff` soma `poder / 100` no eixo `buffTipo`, respeita `duracao` e mantém buff sem eixo valendo para físico e mágico |
| Motor — aliados | `_aliadosComVoce` inclui o conjurador nas magias de grupo, sem contar duas vezes o mesmo alvo |
| Motor — cura | Cura de magia e de item aplica `_curaRecebida` (redução de cura, teto 100%); cura com `status` aplica o status positivo no alvo |
| Dados | `grito_de_guerra`, `benção` e `cura_massa` receberam `buffTipo`, `duracao`, `afetaAliados` e `todos` oficiais; `skillFromSpell` propaga os campos |
| Ficha — servidor | `normalizeSkill` passou a persistir `status`, `todos`, `afetaAliados`, `buffTipo` e `duracao` |
| Ficha — golpes | `SkillsStep` reescrito com ids únicos, clamps, status, `todos`, `afetaAliados`, `buffTipo`, `duracao`, descrição, condição, modo padrão e validação/seed |
| Ficha — especiais/ultimate | `MegaSkillStep` reescrito com a mesma normalização e validação dos golpes |
| Mesa — Arsenal | Três slots por lutador com canhões; recarga, usos, calor, fumaça e superaquecimento; arma fora do catálogo aparece como “(atual)” |
| Mesa — Ações Rápidas | Ataque, magia e item com cooldown, MP, alvos, cura/buff/defesa; alvo vazio deixou de bloquear ações em si; área automática dispensa alvo |
| Mesa — cura | `statusParaEfeito` carrega `reducaoCuraPct`; `reducaoDeCuraRecebida`/`curaRecebida` aplicam a redução com o arredondamento do motor; item cura a si mesmo, como `_resolveItem` |
| Mesa — equipar | Equipar arma grava `id`; arsenal aceita arma fora do catálogo |
| Testes | `battle.test.js` com 70 casos (6 novos de magia/buff/cura); harness da rodada **347/347**, sem erros de console; total atual **439/439** |
| Limpeza | `smoke-tb-ficha.jsx` e bundles temporários de smoke removidos |

### 3.11 Auditorias e correções finais de golpes e paridade

| Área | Resultado |
| --- | --- |
| Persistência de golpes | `status`, `afetaAliados`, `buffTipo`, `duracao` e `descricao` sobrevivem ao ciclo ficha → Registro → ficha; validação pura em `skillValidation.js` (servidor/cliente); colunas novas na migração 0012 |
| Criação de ficha | Publicação e importação em `FichaForm.jsx` preservam os metadados; erro de publicação aparece na UI; edição de especial/ultimate com `status` corrigida; `Registry.jsx` edita status/buff/duração e mostra tags |
| Ids | `dedupeSkillIds` evita ids repetidos entre golpes de classe e personalizados, preservando os ids de classe |
| Mesa — efeitos | HoT/DOT sequenciais, `danoDeStatus` (Podridão incluída), chances/somente-crítico/renovação por `statusId`, controle ativo, defesa em três camadas, itens no próprio usuário com `drunk`, suporte com critérios do motor, recarga por turno do dono, arma da UI no Ataque com Dado, proteção sem mutação e cleanup dos timers |
| Motor — API/paridade | `attackUtility` aceita `weaponId`; congelamento não sofre mais off-by-one; gemas com o mesmo efeito nos dois motores e regen de gema com redução de cura |
| Verificado, sem alteração | `condicao`/`modo` são campos de especial/ultimate e já passam por `normalizeMegaSkill`; golpes comuns não os usam no motor. Não existe limite oficial de golpes por ficha — criar um seria inventar regra; aguarda decisão do criador. Canhões de artilharia permanecem como distância (`categoriaDeArma`), os utilitários seguem em `attackUtility` |
| Testes | `customSkills.test.js`, `offlineSkills.test.js` e `battle.test.js` estendidos; harness da rodada **347/347**, sem erros de console; bundle do cliente sem avisos; total atual **439/439** |

### 3.12 Gestão de fichas e árvore técnica de golpes (D-53)

| Área | Resultado |
| --- | --- |
| Gestão de fichas | Nova aba `🗂️ Gerenciar fichas e golpes` em Personagens (`CharacterManager.jsx`), integrada em `App.jsx` como `view === 'characterManager'`; edita nome/gênero/passiva e exclui fichas com confirmação |
| API online/offline | `PUT`/`DELETE /api/characters/:id`; `api.updateCharacter`/`api.deleteCharacter` com branches offline e `deleteOfflineCharacter`; edição preserva nível, XP, HP/MP atuais, inventário e Corrupção, recalculando os máximos |
| Árvore de golpes | Metadados `elemento`, `nivel` (1–30) e `desbloqueado` em `skills`, espelhados em validação servidor/cliente; golpes disponíveis se `desbloqueado !== false && nivel <= character.level`; `spells` derivado apenas dos disponíveis |
| Compatibilidade | Golpes antigos passam a ser físicos, nível 1 e desbloqueados; migração `0013_custom_skill_tree.sql` leva os mesmos campos ao Registro do Mundo; `FichaForm.jsx` e `Registry.jsx` expõem elemento/MP/nível/desbloqueio; todos os `SKILL_TYPES` disponíveis |
| Combate | Filtro de golpes indisponíveis em `skillsOf` dos motores cliente/servidor e em `makeFighter` da Mesa, para golpes bloqueados ou acima do nível não serem usados |
| Não inventado | Árvore é estrutura técnica/provisória: sem custo de XP, sem pré-requisitos entre nós e sem regra oficial de desbloqueio (P-15/P-01 seguem pendentes) |
| Verificado | Smoke offline: desbloqueio persistiu e `spells` ficou `['golpe_a', 'golpe_b']` com ids válidos; golpe de nível 10 permaneceu fora da ficha nível 5. Os 404 de `/api/health` no servidor estático são esperados no modo offline |
| Testes | `customSkills.test.js` e `offlineSkills.test.js` estendidos; harness da rodada **350/350**, sem erros de console; bundle do cliente compilado com `--jsx=automatic`; total atual **439/439** |

### 3.13 Auditoria de correções de comportamento (1.9)

| Área | Resultado |
| --- | --- |
| Criação de golpes | `alvo` volta a ser gravado como chave; defaults de especial/ultimate não são sobrescritos por defaults de golpe comum; trocar o tipo limpa status incompatível |
| Fichas | Descrição do wizard salva, persistida online/offline, editável em `CharacterManager.jsx` e visível em `CharacterSheet.jsx`; migração 0014 idempotente; edição parcial não apaga `desc` |
| Motores online/offline | IA respeita congelamento; buffs físico e mágico expiram em contadores próprios com compatibilidade para `buffTurns`; alterações espelhadas nos dois `battleManager.js` |
| Batalha de Mesa | Limpeza de seleção ao trocar atacante; iniciativa com estado atual; sem `setState` em updaters; uma cópia por item consumida; `prepararDisparo` unifica o custo do tiro no Ataque com Dado e nas Ações Rápidas |
| Interface | Smoke pages confirmaram descrição, wizard e mesa no navegador; aviso de `same key` das poções idênticas eliminado |
| Testes | `auditoria.test.js` com 6 casos importado pelo harness; naquela rodada, **356/356**, 0 falhas, 0 erros de console e 0 avisos de chave duplicada |
| Publicação | Bump do service worker para `cbrpg-v4`, invalidando `cbrpg-v3` e forçando o download dos bundles corrigidos |

### 3.14 Kraken Eclipse — implementação e validação (1.10)

| Área | Resultado |
| --- | --- |
| Dados | `SPELLS` e `STATUS_DEFS` do Kraken, `respirador_abissal` e `pocao_respiracao_aquatica` espelhados em cliente/servidor; metadados de golpe preservados por `skillFromSpell` |
| Bestiário | `kraken_abismo_eclipse` e `horda_marinheiros_afogados` com `isEclipse`, `arenaEffect`, `passivaEclipse`, `habilidades`, `horda` e moral; `buildMonster` expõe esses campos ao participante |
| Motores | Passiva, bloqueio por Luz/Sagrado, arena, testes de Reflexo CD 16/18, três habilidades, IA do Kraken, dano escalável e queda de Moral espelhados nos dois `battleManager.js` |
| Compatibilidade | `_rollToHit` ganhou um 5º argumento opcional `battle` e repassa o contexto nas chamadas internas; testes antigos continuam válidos. Diferenças prévias entre cliente e servidor (`randomUUID`, `clamp`, gemas, imports) foram preservadas |
| Interface | Banner da arena, selos de Kraken/habilidades/penalidade e barra de Moral adicionados à Batalha |
| Testes | `server/tests/kraken.test.js` com 13 casos importado pelo harness; `data.test.js` atualizado para os 13 status e também importado pelo harness, evitando que o Vitest do CI veja uma regressão que o navegador não via; recompilação com aliases de `vitest`, `node:*`, `pg` e `@electric-sql/pglite`; **426/426**, 0 falhas e 0 erros de console |
| Publicação | Service worker bumpado para `cbrpg-v5`, invalidando `cbrpg-v4`; build/publish via Actions e Pages, com verificação no site público |
| Não inventado | Durações de 2/3 turnos, CDs 16/18, cura de 5% e invocação 1d4+2 vêm da especificação do chefe; penalidades numéricas da arena, Confusão/Medo, dano escalável e recarga do Chamado seguem provisórias (D-54 a D-59) |

### 3.15 Correção da horda na arena (D-61)

| Área | Resultado |
| --- | --- |
| Bug | Após `Chamado do Abismo`, a horda entrava em `participants`, aparecia na timeline, no seletor e no log, mas não renderizava como `.ff-fighter` na arena e não exibia a barra de Moral |
| Causa | `_invocarHordaKraken` adiciona o participante mutando `battle.participants` no mesmo array; `emit` publica só uma cópia rasa de `battle`. Os memos de `heroes`, `enemies`, `teamA` e `teamB` em `src/pages/Battle.jsx` dependiam apenas de `participants` e ficavam presos à referência antiga |
| Correção | `heroes`, `enemies`, `teamA` e `teamB` agora dependem também de `battle`; a formação e a arena passam a ver o novo combatente na mesma atualização que já atualizava timeline/log |
| Validação | Smoke local com `Chamado do Abismo`: lado “👹 Inimigos” passou a conter `Marinheiros Afogados` com barras `HP 4458/4458` e `Moral 100/100`; arquivo temporário removido após a checagem |
| Regras | Nenhuma regra nova. A horda, o pool de HP e a Moral continuam provisórios conforme D-58 |

### 3.16 Canhões — implementação e validação (1.11)

| Área | Resultado |
| --- | --- |
| Dados | `EQUIPMENT.canoes` e `EQUIPMENT.armas` espelhados com `tripulacaoMinima: 2`, `ignoraDefesaPct: 25`, `fumacaExtra: 1`, `penalidade` do bombasta e `recarga: 5` do tripé; utilitários mantêm `usosMax` + `recargaTurnos` |
| Motores | `_tripulacaoIncompleta`, `acertoPenalidade` em `_rollToHit`, `opts.ignoraDefesaPct` em `_applyDamage`, +1 recarga sem ajudante, penalidade nos alvos extras e `fumacaExtra` em `_emitirFumaca`, nos dois `battleManager.js` |
| Compatibilidade | Campos opcionais; armas sem tripulação ignoram a verificação. Durante o teste foi encontrado e corrigido um nome trocado (`ignorarDefesaPct` → `ignoraDefesaPct`) nos dois motores — sem essa correção o dano não mudava |
| Testes | `server/tests/canhoes.test.js` com 8 casos e `server/tests/data.test.js` com 5 casos novos, ambos importados pelo harness; recompilação com aliases de `vitest`, `node:*`, `pg` e `@electric-sql/pglite`; **439/439**, 0 falhas, 0 erros de console e 0 avisos |
| Não inventado | Nenhum número foi apresentado como regra oficial: os valores de D-62 a D-67 são provisórios e P-14 continua aberto para escudos e itens mágicos |
| Publicação | Commit `fe331da` em `origin/main`, Actions #123 verde (build + deploy); site público servindo `cbrpg-v7`. Verificado no navegador: loja com “💣 Artilharia 8” e descrições mecânicas publicadas (tripé `Recarga 5`, pólvora negra `+1 fumaça`, bombasta `−1 DEX/REF`, Dragões `ignora 25% da defesa`); únicos erros de console: os dois `/api/health` offline conhecidos |

### 3.17 Revisão dos canhões — paridade e regras 14.1 (1.12)

| Área | Resultado |
| --- | --- |
| Batalha de Mesa | `TableBattle.jsx` passou a aplicar D-64, D-65 e D-67 e as penalidades de equipamento na mira; antes essas regras existiam só nos dois `battleManager.js`. A mesa não usa `BattleManager`, então a paridade foi implementada diretamente nela |
| Mira (D-66) | Novo helper `penalidadesEquipamento` nos dois `data.js`, usado por `_attrsMira` nos motores e por `effectiveStat` na mesa. Só malefícios entram na rolagem; bônus de equipamento continuam fora. Sem isso, o `−1 DEX/REF` do Bombasta não tinha efeito em combate |
| Regras | Seção **14.1 Canhões e Artilharia (PROVISÓRIO — D-62 a D-67)** publicada em `Rules.jsx`, com D-01 a D-61 mantidos. Corrigidas as passagens antigas que diziam que canhões ocupavam slot utilitário, que toda artilharia usava `usosMax`, que havia “munição relevante” e que o tripé somava +1 turno extra |
| Catálogo | Descrição do Canhão de Cerco trocada para “Tripé embutido: recarga de 5 turnos (+1 sem ajudante)” nos dois `data.js`; o +1 provisório restante é apenas o de tripulação incompleta (D-64) |
| Testes | Novo caso para a penalidade de mira do Bombasta em `server/tests/canhoes.test.js`; harness **440/440**, 0 falhas. Bundle do cliente compilado com esbuild; única compilação oficial permanece a do Actions |
| Publicação | Commit `05dd717` em `origin/main`, Actions **#125** verde (build + deploy), deployment `7950273127` com status `success`. Site público servindo `cbrpg-v8` (`caches.keys()` confirmou o cache ativo). Verificado no navegador: seção 14.1 completa publicada; Bombasta com VEL/REF 7 e recarga 6t; Canhão de Ferro sem ajudante com aviso, recarga 6t e +1 fumaça; Canhão de Dragões com crítico e 520 dano contra defesa 100 (D-65) |
| Follow-up | Divergência preexistente fora desta revisão: `_physMult` do cliente lê `g.efeitos?.[categoria]?.bonus?.forca`, enquanto o servidor lê `fx?.bonus?.forca`. Avaliar em separado antes de mexer, para não alterar equilíbrio sem decisão |

### 3.18 Revisão D-68 — painel 🧰 e D20 rolar-maior (1.13)

| Área | Resultado |
| --- | --- |
| Decisão | D-68 é **provisória**: acerto se `d20 ≥ exigência`; 20 = crítico natural e 1 = falha natural. A direção “rolar-menor” anterior fica superada; D-01 a D-67 continuam válidos |
| Regras documentadas | `Rules.jsx`: combate, faixas do D20, seção 7 e título 14.1 atualizados para D-62 a D-68; painel da mesa e a equivalência `exigência = 21 − alvo + dificuldade` explicados. Nenhuma regra oficial foi inventada |
| Motores | `exigenciaD20` nos dois `sistema.js`; `_rollToHit` nos dois `battleManager.js` devolve `chance`/`exigencia` e classifica o `nivel` pela exigência. Log de combate passa a mostrar `exigia N no d20` e `Faixa (≥N)` |
| Interface | `TableBattle.jsx`: painel 💣 Artilharia (🧰), conversão no ataque rápido, magias multi-alvo e rolagem manual; `Battle.jsx`: título das faixas com D-68 |
| Testes | `server/tests/sistema.test.js` com conversões 0,35 → 14, 0,5 → 11, 0,95 → 2, 0 → 20 e 1 → 2 e classificação pela exigência; `server/tests/battle.test.js` com rolagens altas equivalentes e exigência > para golpes fortes. Suíte completa: **623/623**, 0 falhas |
| Validação local | `npm run build` OK (Vite 5.4.21; apenas aviso de tamanho de chunk). Smoke em `http://127.0.0.1:5173/mesa-de-batalha.html`: painel 🧰 com atirador/peça/alvos exibindo `exige 10 no D20`, tiro registrado `⚔️ Atirador erra Alvo com Canhão Leve → D20:7 · Médio (≥10)`, recarga `⏳ 4t` e ataque rápido `Chance: 53% (exige 10 ou mais no D20; 20 é crítico, 1 é falha)` com `Ajudante ataca Alvo → D20: 14 · Médio (≥10) → ACERTA → 100 dano` |
| Publicação | Service worker bumpado para `cbrpg-v9`. Commit, Actions/Pages e verificação no site público: **a registrar após a publicação** |

---

## 4. Sugestão

1. **Confirmar as decisões provisórias** e mover as que forem aprovadas para
   `AI_RULES.md` ou para `src/pages/Rules.jsx`. Só depois tratá-las como regra
   oficial.
2. **Preencher as fichas em lotes pequenos**, começando pelas que têm uso
   imediato na forja e nos golens. Registrar a fonte de cada dado no próprio
   commit ou em uma tabela de origem.
3. **Adicionar as imagens oficiais** em `assets/materiais/`. Até lá, manter o
   placeholder com a inicial e o selo “Imagem pendente”.
4. **Exibir o status da ficha no catálogo** (por exemplo, “Pendente” ou
   “Completa”) e permitir filtrar apenas fichas pendentes. O campo `status` já
   existe em `materials.js`.
5. **Unificar a aplicação de efeitos** entre forja, combate online e offline,
   incluindo percentuais, penalidades, condições e efeitos especiais. O perfil
   mecânico e `combatEffects.js` já são compartilhados; falta levar essa
   integração aos efeitos ainda descritivos.
6. **Criar testes de paridade** entre cliente e servidor para efeitos de
   materiais/gemas, sem duplicar regras.
7. **Usar `compatibilidade` de verdade** quando as receitas oficiais forem
   definidas, em vez de manter o campo apenas no schema.
8. **Integrar a Corrupção do Ruidium ao combate** (D-29/D-39): as penalidades
   de estágio entram em `_finalAttrs`; a pontuação é persistida; as rotas de API,
   o painel da ficha e o histórico já existem. Faltam gatilhos automáticos de
   ganho/recuperação, a potência mágica adicional nas habilidades e o
   comportamento completo de “Consumido” (D-40).
9. **Decidir a transição dos drops de mineração** dos `id`s refinados para os
   minérios brutos, com migração dos veios existentes.
10. **Automatizar a validação** em CI com `npm test` e `npm run build` em um
    ambiente que tenha Node.js; o harness de navegador é uma contingência, não
    um substituto do pipeline oficial.
11. **Manter a validação sem Node.js apenas se for útil:** `vitest-shim.js` e
    `harness-navegador.js` continuam no repositório; o arquivo temporário de
    prévia da interface foi removido. Se o projeto tiver Node.js em CI, o
    harness pode ser aposentado.
12. **Remover o campo legado `tipo`** somente depois de migrar forja, mineração
    e dados existentes para `categoria`, com teste de compatibilidade.
13. **Revisar a ordem das pendências gerais:** P-01, P-02 e P-03 (nível e XP)
    primeiro; depois P-04 e P-05 (chefes e masmorras); em seguida P-06, P-07 e
    P-09 (equipamento, inventário e desgaste); por fim P-08, P-10 a P-18.
14. **Integrar a Contaminação Pandemônica ao combate** (D-35/D-41/D-42): Ferida
    Pandemônica e Munição Contaminante já são aplicadas por armas, com dano
    sobre a vida máxima original e redução de cura; a Ruptura Profana já é
    aplicada em crítico. Faltam Contaminação Profana (armadura) e Núcleo
    Pandemônico (golem), que dependem da decisão D-41.
15. **Definir e integrar os efeitos das 17 runas** (D-33/D-36/D-37): cada runa
    ainda não tem efeito individual na documentação recuperada. O template
    genérico não oficial (+10% de dano/resistência e 20% de chance por 2 turnos)
    já existe; a forja já seleciona, valida e persiste as runas. Faltam as
    identidades e a aplicação por elemento no combate.
16. **Unificar a defesa e persistir os golpes (D-44/D-46):** decidir entre o
    `defense` do motor (dano pela metade) e a redução percentual da mesa, e criar
    colunas/validação no Registro do Mundo para `status`, `afetaAliados`,
    `buffTipo` e `duracao`, hoje restritos a `character.skills`.
