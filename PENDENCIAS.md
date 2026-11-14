# Pendências — Materiais, Metais e Podridão

Atualizado em 12/11/2026 — Etapa 8 (complemento do catálogo e integrações da forja).

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

## Índice das decisões D-01 a D-35

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
estado “Consumido”.

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
- **Armadura de Tenebrium:** a imunidade documentada no PDF ainda não foi
  implementada no combate (permanece descritiva).
- **Podridão no combate:** a Podridão de arma já é aplicada por Tenebrium. A
  exposição por turnos, a progressão de estágios e o tratamento continuam
  disponíveis como módulo puro, sem gatilho automático no `battleManager`.
- **Contaminação Pandemônica no combate (D-35):** armas de lâmina e de fogo já
  aplicam Ferida Pandemônica e Munição Contaminante, com dano sobre a vida
  máxima original e redução de cura. Contaminação Profana (armadura), Núcleo
  Pandemônico (golem) e Ruptura Profana (crítico) ainda não têm automação
  completa.
- **Corrupção no combate (D-29):** as penalidades do estágio já entram em
  `_finalAttrs` e a pontuação é persistida. Faltam rota de API, exibição na ficha
  do cliente e definição do comportamento completo de “Consumido”.
- **Runas no combate (D-35):** o efeito genérico aprovado existe em
  `efeitoRuna`/`modificadoresRuna`, mas as identidades individuais das 17 runas
  não foram definidas. Seleção/armazenamento na forja e aplicação automática
  continuam pendentes.
- **Paridade offline/online:** a forja e o combate têm caminhos separados; falta
  garantir que todos os efeitos valham nos dois. Na Etapa 8, o salvamento do
  item craftado, a dedução da carteira, a preferência pelo item do inventário e
  os atributos finais foram alinhados; agora o perfil mecânico também é
  preservado no servidor.

### 3.4 Validação e limitações do ambiente

- **Neste ambiente (12/11/2026), `node`, `npm` e `git` não estão no `PATH`.**
  A validação local usou o binário do esbuild já presente em `node_modules`, um
  servidor estático em PowerShell e o harness de navegador.
- No ambiente da auditoria da Etapa 8, `node` v24.15.0 e `npm` 11.12.1 estavam
  disponíveis; no PowerShell, `npm`/`npx` puros esbarram na ExecutionPolicy e é
  preciso usar `npm.cmd`. Nesse ambiente, **421/421 testes unitários** passaram
  (`npm.cmd run test --prefix server`) e o build de produção
  (`npm.cmd run build`) concluiu sem erro.
- Resultado do harness neste ambiente após a integração dos efeitos:
  **242/242 testes passam**, sem falhas, incluindo os novos testes de
  `combatEffects`, perfil mecânico, status derivados da forja e efeito genérico
  das runas.
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
| P-14 | Munição, escudos e itens mágicos | Recarga existe; munição, escudos e itens mágicos não | Munição por tiro ou combate? Escudo é slot separado? Capacidades? |
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
8. **Integrar a Corrupção do Ruidium ao combate** (D-29): as penalidades de
   estágio já entram em `_finalAttrs` e a pontuação é persistida. Faltam rota de
   API, exibição na ficha do cliente, gatilhos de ganho/recuperação e a potência
   mágica adicional nas habilidades.
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
14. **Integrar a Contaminação Pandemônica ao combate** (D-35): Ferida
    Pandemônica e Munição Contaminante já são aplicadas por armas, com dano
    sobre a vida máxima original e redução de cura. Faltam Contaminação Profana
    (armadura), Núcleo Pandemônico (golem) e automação completa da Ruptura
    Profana.
15. **Definir e integrar os efeitos das 17 runas** (D-33/D-35): cada runa ainda
    não tem efeito individual na documentação recuperada. O template genérico
    não oficial (+10% de dano/resistência e 20% de chance por 2 turnos) já
    existe; faltam as identidades, os encaixes na forja e a aplicação em combate.
