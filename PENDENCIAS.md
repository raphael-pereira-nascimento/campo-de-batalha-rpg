# Pendências — Materiais, Metais e Podridão

Atualizado em 10/11/2026 — Etapa 6 (testes e documentação).

Este arquivo separa o que já foi **aprovado**, o que foi implementado como
**provisório**, o que continua **pendente** e o que é apenas **sugestão**.
Nenhum dado ausente foi inventado: quando a documentação oficial não define
nome, valor, fórmula ou efeito, a ficha continua marcada como pendente.

Fontes usadas nesta etapa:

- PDF oficial de materiais fornecido pelo criador (texto extraído e lido).
- Regras aprovadas pelo criador na conversa desta implementação.
- Código e dados que já existiam no projeto antes desta etapa.

Legenda:

- **Aprovado** — regra documentada ou autorizada; já implementada.
- **Provisório** — decisão tomada para destravar a implementação; não é regra
  oficial até o criador confirmar.
- **Pendente** — informação ou regra ausente; nada foi preenchido por estimativa.
- **Sugestão** — melhoria opcional, não implementada.

---

## Índice das decisões D-01 a D-14

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
| D-10 | Efeitos de Tenebrium em armas de impacto e golens | Pendente |
| D-11 | Fichas completas de Ruidium, Vibranium, Honríneo e Mournlode | Pendente |
| D-12 | Efeitos de Ferro Estígio e Honríneo | Pendente |
| D-13 | Tabela da Podridão (5 estágios/10 turnos) | Aprovado pelo criador, fora do PDF |
| D-14 | Commit e limpeza do pacote final | Pendente |

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
  chance de aplicação de 15% em arma comum e 25% em equipamento mágico. A
  documentação também registra imunidade para armaduras de Tenebrium.
- **Restrições oficiais já registradas:** Oricalco é vulnerável à antimagia;
  Tenebrium exige preparação mágica e pode provocar Podridão; Ferro Estígio
  exige treinamento específico; Ruidium possui um sistema próprio de Corrupção
  com cinco estágios (Normal a Consumido), ainda sem valores completos.

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
| Prata Pandemônica | Lendária | Excepcional | 75 Ouro |
| Ouro Imperial | Muito rara | Excepcional | Pendente |
| Bronze Celestial | Épica | Excepcional | Pendente |
| Honríneo | Mítica | Perfeito | 25 Ouropla |
| Minério de Honra | Mítica | Perfeito | 18 Ouropla |
| Obsidiana | Incomum | Superior | 8 Ouro |
| Carvão Vegetal | Pendente | Pendente | 2 Bronze |
| Carvão Mineral | Pendente | Pendente | 4 Bronze |
| Antracito | Pendente | Pendente | 15 Bronze |
| Carvão Mágico | Pendente | Pendente | 15 Ouro |

Os preços dos 12 materiais legados foram preservados, exceto Obsidiana, que
passou a usar o valor oficial do PDF. Ouro Imperial e Bronze Celestial têm
raridade e qualidade oficiais, mas continuam sem preço documentado.

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

- Catálogo com **49 fichas**: 5 minérios, 35 metais, 5 materiais especiais e
  4 materiais mágicos. Os 12 `id`s originais foram preservados.
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
- Interface: `src/pages/Materiais.jsx`, `MaterialCard.jsx`,
  `MaterialDetails.jsx` e `MaterialComposition.jsx`, ligados em `App.jsx` e
  `Characters.jsx`. O catálogo tem busca por nome/id/alias, filtros de categoria,
  raridade, qualidade, bioma, aplicação, preço, ordenação e ficha detalhada.
- Testes: **115/115 passam** no harness de navegador. Cobrem dados oficiais,
  schema, aliases, filtros, preços, composição, custo, forja e Podridão.
- Nenhum banco, configuração ou dado já cadastrado foi substituído de forma
  destrutiva. Nenhuma dependência nova foi adicionada ao projeto.

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
  lista das categorias de efeito já cadastradas. Uru declara `golem`
  explicitamente.
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

#### D-10 — Tenebrium em armas de impacto e golens

- O PDF documenta a Podridão em armas; não foram encontrados valores oficiais
  para armas de impacto nem para golens de Tenebrium.
- **Decisão necessária:** esses equipamentos aplicam a mesma Podridão, uma
  versão reduzida ou nenhuma?
- **Hoje no código:** `PODRIDAO_ARMA` só descreve a arma comum e a mágica.

#### D-11 — Fichas completas de Ruidium, Vibranium, Honríneo e Mournlode

- **Ruidium:** só existe a observação do sistema de Corrupção em cinco estágios
  (Normal a Consumido); faltam nomes, percentuais, duração, cura e efeitos.
- **Vibranium:** a característica “absorve, armazena e redistribui energia
  cinética” está registrada, mas não há fórmula, limite ou efeito de combate.
- **Honríneo:** a adaptação automática ao usuário está registrada, sem números.
- **Mournlode:** a ficha está pendente e não há dados oficiais suficientes
  registrados para preencher raridade, qualidade, preço ou efeitos.
- **Decisão necessária:** completar com a documentação oficial ou manter as
  fichas parciais até uma etapa específica.

#### D-12 — Efeitos de Ferro Estígio e Honríneo

- Ferro Estígio tem a restrição de treinamento registrada, mas os efeitos por
  equipamento continuam pendentes.
- Honríneo tem raridade, qualidade, preço e a característica de adaptação, mas
  os efeitos numéricos por categoria continuam pendentes.
- **Decisão necessária:** quais bônus, percentuais, penalidades e condições
  oficiais cada um concede?

#### D-14 — Commit e limpeza do pacote final

- O commit-base `1c13525` (“parte 1 de implementação de minérios e metais”) já
  existe e inclui a maior parte da implementação.
- **Fora do commit atual:** `server/tests/forgeMaterials.test.js` e a versão
  final deste `PENDENCIAS.md`; `server/tests/harness-navegador.js` também tem
  uma alteração não commitada.
- O arquivo temporário `server/tests/preview-materiais.jsx` foi removido do
  pacote final por ser apenas uma prévia local da interface.
- **Decisão necessária:** commitar o teste de integração da forja e este
  `PENDENCIAS.md`; decidir se os arquivos de harness continuam no repositório
  ou viram ferramentas locais descartáveis.

### 3.2 Dados oficiais ainda ausentes

Situação atual do catálogo:

- **18 fichas sem raridade** e **29 sem qualidade**.
- **Nenhuma ficha está com status `completo`**; todas têm pelo menos um campo
  pendente.
- **13 fichas** estão marcadas como aplicação de golem.
- **4 fichas** são míticas e **4** são perfeitas (Uru, Vibranium, Honríneo e
  Minério de Honra).
- Todas as fichas continuam com os campos físicos pendentes: características,
  dureza, resistência, peso, densidade, flexibilidade e condutividade mágica.
- Muitas fichas ainda não têm descrição, bioma, compatibilidade, aplicações ou
  efeitos. Onde não há dado oficial, a interface mostra “Pendente”.
- **Imagens:** não existem os arquivos `assets/materiais/*.png`; a interface usa
  a inicial do material e o aviso “Imagem pendente”.
- **Ouro Imperial** e **Bronze Celestial** têm raridade/qualidade oficiais, mas
  não têm preço oficial preenchido.

O que falta preencher com o criador/documentação:

1. Raridade e qualidade das 18/29 fichas restantes.
2. Descrições oficiais e biomas de origem.
3. Ficha física completa (peso, dureza, densidade etc.).
4. Lista oficial de categorias compatíveis por material.
5. Efeitos por equipamento que ainda estão vazios.
6. Efeitos de golem para os materiais que podem ser usados em golens.
7. Imagens oficiais.
8. Valores completos do sistema de Corrupção do Ruidium.
9. Regras de Vibranium, Honríneo e Mournlode.

### 3.3 Integrações ainda pendentes

- **Combate:** os efeitos de materiais são calculados na forja, mas não são
  aplicados automaticamente pelo `battleManager` durante a batalha.
- **Percentuais, penalidades, condições e efeitos especiais:** são expostos na
  ficha e na composição, mas `forge.js` só soma bônus numéricos. Nada é aplicado
  automaticamente em combate.
- **Golens:** não existe golem jogável, equipamento ou aliado; o catálogo só
  registra quais materiais podem ser usados.
- **Mineração:** os veios e drops ainda entregam os `id`s refinados (`ferro`,
  `cobre`, `estanho`, `chumbo`). Falta decidir quando passam a entregar os
  minérios brutos (`minerioFerro` etc.).
- **Receitas:** nenhuma receita nova de equipamento foi aprovada. A
  compatibilidade existe no schema, mas nenhum material real declara uma lista
  oficial de categorias compatíveis.
- **Armadura de Tenebrium:** a imunidade documentada no PDF ainda não foi
  implementada no combate.
- **Podridão no combate:** `podridao.js` é um módulo puro; falta decidir onde a
  exposição acumula, quando o dano é aplicado e como o tratamento é usado.
- **Paridade offline/online:** a forja e o combate têm caminhos separados; falta
  garantir que os mesmos efeitos valham nos dois.

### 3.4 Validação e limitações do ambiente

- **`node` e `npm` não estão disponíveis neste ambiente.** Por isso
  `npm run test:unit`, `npm run test:e2e` e `npm run build` oficiais não foram
  executados.
- A validação foi feita com o binário do esbuild já presente em
  `node_modules`, um servidor estático em PowerShell e o harness de navegador.
- Resultado do harness: **115/115 testes passam**, sem falhas.
- A interface foi validada no navegador: catálogo com 49 fichas, filtros,
  busca por alias, ficha detalhada e composição com custo.
- A prévia registrou apenas respostas HTTP 404 para as imagens ausentes; não
  houve erro de aplicação no console.
- **Build de produção, teste E2E oficial, responsividade e acessibilidade
  completa** ainda não foram verificados.
- O `git` também não está no `PATH`; quando necessário, usar o executável do
  GitHub Desktop. O commit-base já foi criado, mas os arquivos citados em D-14
  continuam fora dele.

### 3.5 Regras gerais do RPG ainda pendentes (P-01 a P-18)

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
   incluindo percentuais, penalidades, condições e efeitos especiais. Hoje a
   forja só soma bônus numéricos.
6. **Criar testes de paridade** entre cliente e servidor para efeitos de
   materiais/gemas, sem duplicar regras.
7. **Usar `compatibilidade` de verdade** quando as receitas oficiais forem
   definidas, em vez de manter o campo apenas no schema.
8. **Criar um módulo de Corrupção do Ruidium** nos mesmos moldes de
   `podridao.js`, com estágios, tratamentos e funções puras, quando os valores
   oficiais forem fornecidos.
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
