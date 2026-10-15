// ─────────────────────────────────────────────────────────────────────────────
// SISTEMA — regras confirmadas pelo criador + pontos ainda provISÓRIOS.
//
// Regra fundamental do projeto: NÃO alterar regra estabelecida sem autorização.
// Tudo que está marcado como CONFIRMADA veio do criador; tudo marcado como
// PROVISÓRIO é um valor de balanceamento isolado aqui para ser ajustado com um
// único comando, sem precisar mexer na lógica de combate.
// ─────────────────────────────────────────────────────────────────────────────

/* ═══════════════════════════════════════════════════════════════════════════
   1. MANA — CONFIRMADA
   Regra: Mana = (Inteligência Final) × 10
   A Inteligência Final inclui base + BR + BC + outros modificadores.
   ═══════════════════════════════════════════════════════════════════════════ */
export const MANA_MULT_INT = 10;

/**
 * Mana máxima = (Inteligência Final) × 10.
 */
export function manaMaxFrom(intBase, intFinal, outros = 0) {
  const final = Number(intFinal) || 0;
  const extra = Number(outros) || 0;
  return Math.max(0, Math.round((final + extra) * MANA_MULT_INT));
}

/* ═══════════════════════════════════════════════════════════════════════════
   2. RECUPERAÇÃO DE MANA — CONFIRMADA
   Regra: "RECUPERAÇÃO = GASTO DE MANA ÷ 2".
   Arredondamento: metade para cima, conforme os exemplos do criador
   (5→3, 10→5, 15→8, 20→10, 30→15).
   TETO: a recuperação por turno não passa de 10% do MP TOTAL (máximo).
   Se metade do gasto for menor que os 10% do total, recupera normal;
   se for maior, recupera apenas os 10% do MP total.
   ═══════════════════════════════════════════════════════════════════════════ */
export const MANA_RECOVERY_DIVISOR = 2;

// Teto da recuperação por turno: fração do MP MÁXIMO (10% = 0.1). Confirmada.
export const MANA_RECOVERY_CAP_PCT = 0.1;

export function manaRecuperada(gasto, mpMax = 0) {
  const g = Math.max(0, Number(gasto) || 0);
  const base = Math.round(g / MANA_RECOVERY_DIVISOR);
  const total = Math.max(0, Number(mpMax) || 0);
  if (total <= 0) return base;
  const cap = Math.round(total * MANA_RECOVERY_CAP_PCT);
  return Math.max(0, Math.min(base, cap));
}

/* ═══════════════════════════════════════════════════════════════════════════
   3. ATRIBUTOS COM PESOS DIFERENTES — CONFIRMADA (direção), PROVISÓRIA (números)
   RES → HP | INT → Mana | DEX/AGI → precisão, movimento e controle
   REF → reação, esquiva e ações rápidas | FOR → força, carga e equipamento pesado
   ═══════════════════════════════════════════════════════════════════════════ */
export const PESOS_ATRIBUTOS = {
  hp: { resistencia: 1 },
  mana: { inteligencia: 1 },
  danoFisico: { forca: 1 },
  ataqueFisico: { destreza: 1, reflexos: 0.5, forca: 0.25 },
  ataqueMagico: { inteligencia: 1, reflexos: 0.25 },
  esquiva: { reflexos: 1, destreza: 0.5 },
  iniciativa: { reflexos: 1.5, destreza: 0.5, resistencia: 0.25 },
  controleVoo: { destreza: 0.75, reflexos: 0.25 },
  resistenciaVoo: { resistencia: 0.75, destreza: 0.25 },
  carga: { forca: 1 },
};

/** Soma ponderada: peso de um perfil (ex.: 'esquiva') sobre os atributos. */
export function pesoAtributo(perfil, atributos = {}) {
  const pesos = PESOS_ATRIBUTOS[perfil];
  if (!pesos) return 0;
  let total = 0;
  for (const [attr, peso] of Object.entries(pesos)) total += (Number(atributos[attr]) || 0) * peso;
  return total;
}

/** Ordem de iniciativa: REF pesa mais, mas DEX e RES também Lulucompõem. */
export function iniciativaDe(attributes, level) {
  return pesoAtributo('iniciativa', attributes) + (Number(level) || 1);
}

/**
 * Capacidade de carga (kg) — PROVISÓRIA: base 10 kg + FOR×10 + nível×2.
 * A FOR é o atributo que "influencia força física, carga e equipamentos pesados".
 */
export function cargaMaxima(attributes, level) {
  return 10 + pesoAtributo('carga', attributes) * 10 + (Number(level) || 1) * 2;
}

/* ═══════════════════════════════════════════════════════════════════════════
   4. VOO — CONFIRMADA (alcance vertical simplificado, sem invulnerabilidade)
   Voo é condição de combate, não sistema 3D. Ataques têm alcance vertical:
   ataque terrestre não alcança altitudes altas; arcos e armas de fogo chegam
   mais longe; certas magias atingem voadores e outras são limitadas.
   ═══════════════════════════════════════════════════════════════════════════ */
export const ALTITUDES = { chao: 0, rasteiro: 1, medio: 2, alto: 3 };

export const ALCANCE_VERTICAL = {
  corpo: 0,        // espada, punho, presa: não alcança quem está no ar
  medio: 1,        // lança, bacamarte curto
  longo: 2,        // arco, besta, mosquete, rifle
  magico: 3,       // magia com efeito aéreo (bola de fogo, raio)
  limitado: 1,     // magia de alcance vertical curto
};

/** Alcance vertical de uma arma branca ou de fogo. */
export function alcanceVerticalDeArma(weapon) {
  if (!weapon) return ALCANCE_VERTICAL.corpo;
  if (weapon.tipo === 'arma_fogo') {
    return weapon.alcance === 'corpo' ? ALCANCE_VERTICAL.corpo : ALCANCE_VERTICAL.longo;
  }
  if (weapon.alcance === 'corpo') return ALCANCE_VERTICAL.corpo;
  if (weapon.alcance === 'medio') return ALCANCE_VERTICAL.medio;
  return ALCANCE_VERTICAL.longo;
}

/** Alcance vertical de uma magia (campo `alcanceVertical` na magia). */
export function alcanceVerticalDeMagia(spell) {
  if (!spell) return ALCANCE_VERTICAL.magico;
  if (spell.alcanceVertical === 'limitado') return ALCANCE_VERTICAL.limitado;
  if (spell.alcanceVertical === 'terrestre') return ALCANCE_VERTICAL.corpo;
  if (spell.alcanceVertical === 'longo') return ALCANCE_VERTICAL.longo;
  return ALCANCE_VERTICAL.magico;
}

/** O alvo está além do alcance vertical deste ataque? */
export function foraDoAlcanceVertical(alcance, alvo) {
  if (!alvo || !alvo.voando) return false;
  return (Number(alvo.altitude) || 0) > (Number(alcance) || 0);
}

/* Custos e fadiga do voo — PROVISÓRIO (ajustar aqui quando o criador decidir) */
export const VOO = {
  manaSubida: 6,        // mana para decolar por voo mágico
  manaPorTurno: 2,      // manutenção por turno voando
  fadigaTurnos: 4,      // turnos de voo natural antes do teste de fadiga
  bonusAltitude: 1,     // quantos níveis de altitude o voo alcança por ação
  // Voo NÃO concede invulnerabilidade: apenas os números acima definem o efeito.
  esquivaBonus: 0,      //mantido em 0 de propósito (regra do criador)
};

/* ═══════════════════════════════════════════════════════════════════════════
   5. XP DIVIDIDA POR PARTICIPAÇÃO — CONFIRMADA (divisão por participação)
   A fórmula definitiva ainda pode ser refinada, mas ninguém pode monopolizar
   toda a XP. Os pesos abaixo são PROVISÓRIOS e ficam isolados aqui.
   ═══════════════════════════════════════════════════════════════════════════ */
export const XP_PESOS = {
  dano: 1,        // dano causado
  cura: 0.8,      // HP restaurado em aliados
  acerto: 2,      // ataques/magias que acertaram
  acao: 1,        // ações realizadas (participação simples)
  suporte: 6,     // buffs, defesas, suporte tático
  abate: 25,      // inimigos abatidos
  sobreviver: 15, // sobreviveu ao fim da batalha
};

export const XP_BASE = 150;      // pool base de qualquer batalha
export const XP_BONUS_CHEFE = 100;
export const XP_TETO_PARTICIPACAO = 0.6;  // máx. 60% do pool para um único jogador
export const XP_MINIMO_PARTICIPACAO = 0.05; // piso quando houve alguma participação

/**
 * Contribuição acumulada de um participante (usa p.contribuicao).
 * Sobreviver só conta como bônus para quem realmente agiu no combate:
 * quem não causeu dano, não curou e nem agiu não recebe XP.
 */
export function contribuicaoDe(p) {
  const st = p.contribuicao || {};
  let total = 0;
  total += (Number(st.dano) || 0) * XP_PESOS.dano;
  total += (Number(st.cura) || 0) * XP_PESOS.cura;
  total += (Number(st.acertos) || 0) * XP_PESOS.acerto;
  total += (Number(st.acoes) || 0) * XP_PESOS.acao;
  total += (Number(st.suporte) || 0) * XP_PESOS.suporte;
  total += (Number(p.kills) || 0) * XP_PESOS.abate;
  if (total <= 0) return 0;
  if (p.alive) total += XP_PESOS.sobreviver;
  return Math.max(0, total);
}

/**
 * Divide o pool de XP entre os participantes conforme a participação.
 * Aplica teto de 60% (nenhum jogador monopoliza) e piso de 5% para quem
 * contribuiu de algum modo. Devolve [{ uid, xpGained, share, contribuicao }].
 */
export function distribuirXp(participantes, poolTotal) {
  const pool = Math.max(0, Math.round(Number(poolTotal) || 0));
  const lista = (participantes || []).filter((p) => p && !p.isMonster);
  if (!lista.length || pool <= 0) {
    return lista.map((p) => ({ uid: p.uid, xpGained: 0, share: 0, contribuicao: 0 }));
  }

  const contrib = new Map(lista.map((p) => [p.uid, contribuicaoDe(p)]));
  const share = new Map(lista.map((p) => [p.uid, 0]));
  const ativos = lista.filter((p) => contrib.get(p.uid) > 0);
  if (!ativos.length) {
    return lista.map((p) => ({ uid: p.uid, xpGained: 0, share: 0, contribuicao: contrib.get(p.uid) }));
  }

  // Water-filling: quem estoura o teto entrega o excedente para os demais,
  // que passam a dividir proporcionalmente entre si o que sobrou.
  const teto = XP_TETO_PARTICIPACAO;
  const limitados = new Set();
  for (let guard = 0; guard <= ativos.length + 1; guard += 1) {
    const livres = ativos.filter((p) => !limitados.has(p.uid));
    const totalLivre = livres.reduce((s, p) => s + contrib.get(p.uid), 0);
    if (!livres.length || totalLivre <= 0) break;
    const disponivel = 1 - [...limitados].reduce((s, uid) => s + share.get(uid), 0);
    let estourou = false;
    for (const p of livres) {
      const bruto = disponivel * (contrib.get(p.uid) / totalLivre);
      if (bruto > teto + 1e-9) {
        share.set(p.uid, teto);
        limitados.add(p.uid);
        estourou = true;
      }
    }
    if (!estourou) {
      for (const p of livres) share.set(p.uid, disponivel * (contrib.get(p.uid) / totalLivre));
      break;
    }
  }

  // Converte as frações em XP (mantendo precisão decimal) e aplica o piso de
  // participação: quem contribuiu fica com pelo menos 5% do pool, e o que falta
  // sai proporcionalmente dos demais. Sem decimais o total sempre fecha.
  const pisoXp = pool * XP_MINIMO_PARTICIPACAO;
  const valores = lista.map((p) => ({ uid: p.uid, xp: pool * share.get(p.uid), contribuicao: contrib.get(p.uid) }));
  for (const alvo of valores) {
    if (alvo.contribuicao <= 0 || alvo.xp <= 0 || alvo.xp >= pisoXp - 1e-9) continue;
    const falta = pisoXp - alvo.xp;
    const doadores = valores.filter((o) => o.uid !== alvo.uid && o.xp > 0);
    const totalDoadores = doadores.reduce((s, o) => s + o.xp, 0);
    if (totalDoadores <= falta) continue;
    for (const o of doadores) o.xp -= (falta * o.xp) / totalDoadores;
    alvo.xp = pisoXp;
  }

  const out = valores.map((o) => ({ ...o, xpGained: Math.floor(o.xp) }));
  const sobra = pool - out.reduce((s, o) => s + o.xpGained, 0);
  if (sobra > 0 && out.length) {
    const maior = out.reduce((a, b) => (b.xpGained > a.xpGained ? b : a), out[0]);
    if (maior) maior.xpGained += sobra;
  }
  return out.map((o) => ({
    uid: o.uid,
    xpGained: o.xpGained,
    share: pool > 0 ? o.xpGained / pool : 0,
    contribuicao: o.contribuicao,
  }));
}

/** Pool total de XP de uma batalha (base + chefes + XP dos monstros abatidos). */
export function poolDeXp({ chefeDerrotado = false, monstrosDerrotados = [], eclipseMult = 1 } = {}) {
  let pool = XP_BASE + (chefeDerrotado ? XP_BONUS_CHEFE : 0);
  for (const xp of monstrosDerrotados) pool += Number(xp) || 0;
  return Math.round(pool * (eclipseMult || 1));
}

/* ═══════════════════════════════════════════════════════════════════════════
   6. DANO — PROVISÓRIO (mesmo padrão da vida/mana: Atributo Final, sem dados)
   Reforma autorizada pelo criador: o dano deixa de ser por dados (d6) e vira
   uma fórmula determinística pelos Atributos Finais, como vida e mana.

   Dano físico (ataque básico) = (FOR Final + danoBase da arma) × 10
   Golpe físico (habilidade)   = FOR Final × poder% × 1,5 × 10   (mega: × 2,2)
   Dano mágico                 = INT Final × poder% × 1,4 × 10
   Cura (magia de suporte)     = INT Final × poder% × 1,4 × 10   (cura mega: × 2,2)

   A defesa da armadura e o dano por turno (DoT) usam a MESMA escala ×10.
   Poções de HP também: 250 / 600 (na mesma proporção de 25 / 60 na vida antiga).
   O acerto continua sendo o d20; crítico (×2), elementos e buffs continuam
   sendo multiplicadores aplicados POR CIMA da base.

   Todos os números abaixo são PROVISÓRIOS: balanceamento isolado aqui para
   ser ajustado em um único lugar, sem mexer na lógica de combate.
   ═══════════════════════════════════════════════════════════════════════════ */
export const DANO_MULT = 10; // escala do dano (a mesma da vida/mana: atributo × 10)
export const DANO_COEF_ATAQUE = 1.5; // golpe físico de habilidade comum
export const DANO_COEF_MEGA = 2.2; // ultimate / especial
export const DANO_COEF_MAGICO = 1.4; // magia

/** danoBase de uma arma (ou das mãos nuas) — mesma regra em todos os pontos. */
export function danoBaseDaArma(arma) {
  return arma ? arma.danoBase || 4 : 2;
}

// ═══ ARSENAL — até 3 armas (uma por categoria) ═══
// Categorias: 'perto' (corpo a corpo) | 'distancia' (à distância) |
// 'utilitaria' (ferramenta com limites de uso). Regra do criador.
export const ARMAS_SLOTS = ['perto', 'distancia', 'utilitaria'];

export const ARMA_CATEGORIA_INFO = {
  perto: { nome: 'Corpo a corpo', icon: '⚔️' },
  distancia: { nome: 'À distância', icon: '🏹' },
  utilitaria: { nome: 'Utilitária', icon: '🧰' },
};

/**
 * Lista as armas equipadas, sem duplicar a arma legada `equipment.arma`.
 * Cada entrada: { slot, arma }. A arma legada é tratada como 'perto'.
 */
export function armasDeEquipamento(equipment = {}) {
  const out = [];
  const vistos = new Set();
  const armas = equipment.armas && typeof equipment.armas === 'object' ? equipment.armas : {};
  for (const slot of ARMAS_SLOTS) {
    const a = armas[slot];
    if (!a) continue;
    out.push({ slot, arma: a });
    if (a.id) vistos.add(a.id);
  }
  if (equipment.arma && !vistos.has(equipment.arma.id)) {
    out.push({ slot: 'perto', arma: equipment.arma });
  }
  return out;
}

/** Arma "ativa" para o ataque básico: a de maior dano base (empate → primeira equipada). */
export function melhorArma(equipment = {}) {
  let melhor = null;
  const melhorDano = () => (melhor ? Number(melhor.danoBase) || 0 : -1);
  for (const { arma } of armasDeEquipamento(equipment)) {
    const dano = Number(arma.danoBase) || 0;
    if (dano > melhorDano()) melhor = arma;
  }
  return melhor;
}

/**
 * Arma do ataque básico: a escolhida pelo jogador (por `id`, entre as equipadas)
 * ou, sem escolha, a de maior dano base (`melhorArma`). Deixa o jogador disparar
 * uma arma específica (ex.: bacamarte/nock gun com modo de alvo próprio).
 */
export function armaParaAtaque(equipment = {}, weaponId) {
  if (weaponId) {
    const escolhida = armasDeEquipamento(equipment).find((e) => e.arma && e.arma.id === weaponId);
    if (escolhida) return escolhida.arma;
  }
  return melhorArma(equipment);
}

/** Categoria de um item de arma (onde ele se encaixa nos 3 slots do arsenal). */
export function categoriaDeArma(arma) {
  if (!arma) return null;
  if (arma.categoria && ARMAS_SLOTS.includes(arma.categoria)) return arma.categoria;
  // Fallback por características legadas (antes do campo categoria existir).
  if (arma.alcance === 'corpo') return 'perto';
  return 'distancia';
}

/** Dano físico do ataque básico = (FOR Final + danoBase da arma) × 10 × mult. */
export function danoFisicoAtaque(forcaFinal, armaDanoBase = 0, mult = 1) {
  const forca = Number(forcaFinal) || 0;
  const arma = Number(armaDanoBase) || 0;
  return Math.max(0, Math.round((forca + arma) * DANO_MULT * (Number(mult) || 1)));
}

/** Golpe físico de habilidade = FOR Final × poder% × coef × 10 × mult. */
export function danoFisicoGolpe(forcaFinal, poderPct = 100, mult = 1, coef = DANO_COEF_ATAQUE) {
  const forca = Number(forcaFinal) || 0;
  return Math.max(
    0,
    Math.round(forca * (Number(coef) || 1) * ((Number(poderPct) || 0) / 100) * DANO_MULT * (Number(mult) || 1)),
  );
}

/** Dano mágico = INT Final × poder% × 1,4 × 10 × mult. */
export function danoMagico(intFinal, poderPct = 100, mult = 1, coef = DANO_COEF_MAGICO) {
  const inteligencia = Number(intFinal) || 0;
  return Math.max(
    0,
    Math.round(inteligencia * (Number(coef) || 1) * ((Number(poderPct) || 0) / 100) * DANO_MULT * (Number(mult) || 1)),
  );
}

/**
 * Cura = INT Final × poder% × 1,4 × 10 × mult — MESMA fórmula da magia
 * (cura na escala da vida, para acompanhar a reforma). Cura mega usa DANO_COEF_MEGA.
 */
export function curaMagica(intFinal, poderPct = 100, mult = 1, coef = DANO_COEF_MAGICO) {
  return danoMagico(intFinal, poderPct, mult, coef);
}

/* ═══════════════════════════════════════════════════════════════════════════
   7. DIFICULDADE DO GOLPE — PROVISÓRIO
   Golpes mais fortes e efeitos (status/debuff) mais pesados exigem um d20
   melhor. A dificuldade é um inteiro >= 0 que REDUZ o alvo de acerto
   (o combate é "rolar-menor": acerta se d20 <= alvo − dificuldade).
   O log mostra o alvo e "dificuldade +N".

   Referências (provisórias — ajuste só aqui):
   - Golpe comum (100% de poder): dificuldade 0.
   - Cada +100% de poder somam +2.
   - O status aplicado pesa por duração + dano por turno (dano ÷ 100).
   ═══════════════════════════════════════════════════════════════════════════ */
export const DIFICULDADE_PODER_REF = 100; // % de referência (não pesa)
export const DIFICULDADE_PODER_COEF = 0.02; // cada +100% => +2
export const DIFICULDADE_STATUS_COEF = 0.5; // peso do status (turnos + dano/100)
export const DIFICULDADE_MAX = 8; // teto: nenhum golpe fica impossível

/** Peso de um status de golpe: duração + dano por turno (dano ÷ 100). */
export function magnitudeDeStatus(status) {
  if (!status) return 0;
  return (Number(status.turnos) || 0) + (Number(status.dano) || 0) / 100;
}

/**
 * Dificuldade de um golpe no d20 (inteiro, 0..DIFICULDADE_MAX).
 * `poder` em % (100 = golpe comum) e `status` que o golpe aplica ao alvo.
 */
export function dificuldadeDoGolpe({ poder = DIFICULDADE_PODER_REF, status = null } = {}) {
  const dPoder =
    Math.max(0, (Number(poder) || 0) - DIFICULDADE_PODER_REF) * DIFICULDADE_PODER_COEF;
  const dStatus = magnitudeDeStatus(status) * DIFICULDADE_STATUS_COEF;
  return Math.max(0, Math.min(DIFICULDADE_MAX, Math.round(dPoder + dStatus)));
}

/* ═══════════════════════════════════════════════════════════════════════════
   8. ATAQUES MULTI-ALVO — PROVISÓRIO
   Alguns golpes, magias, armas e golpes MEGA podem atingir mais de um inimigo.
   O "modo de alvo" (`alvo`) define como:
   - 'unico'    → um único alvo (padrão).
   - 'area'     → atinge TODOS os inimigos vivos automaticamente.
   - 'cone'     → projéteis em leque: o jogador escolhe até `max` inimigos.
   - 'explosao' → alvo principal cheio + vizinhos escolhidos com dano reduzido
                  (multiplicador `splash`, padrão 50%).
   Golpes de área/cone/explosão podem "sair pela culatra": se a rolagem de mira
   for uma FALHA CRÍTICA (d20 <= limiar, padrão 1), há chance de o golpe desviar
   e acertar um aliado. Como o sistema é "rolar-menor" (rolagem baixa = boa mira),
   só a pior rolagem possível (1) espalha o golpe nos amigos. Tudo ajustável aqui.
   ═══════════════════════════════════════════════════════════════════════════ */
export const MULTI_ALVO_PADRAO = 3; // nº máx. de alvos em cone/explosão
export const MULTI_SPLASH_PADRAO = 0.5; // dano dos alvos secundários na explosão
export const MULTI_AREA_MULT = 0.55; // dano por alvo em área (acerta todos)
export const MULTI_CONE_MULT = 0.7; // dano por alvo em cone (até N escolhidos)
export const MULTI_DESVIO_LIMIAR = 1; // falha crítica (d20 <= 1) pode desviar o golpe
export const MULTI_DESVIO_CHANCE = 0.5; // chance de o desvio acertar aliados
export const MULTI_FOGO_AMIGO_MULT = 0.5; // dano do golpe desviado nos aliados

// Limita um multiplicador de dano ao intervalo (0, 1]; usa o padrão se inválido.
function clampMult(v, fallback) {
  const n = Number(v);
  return n > 0 ? Math.min(1, n) : fallback;
}

export const ALVO_TIPOS = {
  unico: 'Alvo único',
  area: 'Área (todos os inimigos)',
  cone: 'Cone (vários inimigos)',
  explosao: 'Explosão (alvo + vizinhos)',
};

// Rótulos curtos para tags/chips na interface.
export const ALVO_LABEL = {
  unico: 'Único',
  area: 'Área',
  cone: 'Cone',
  explosao: 'Explosão',
};

/**
 * Normaliza o modo de alvo de um golpe/arma. Aceita:
 *   { alvo: 'area'|'cone'|'explosao', alvos: N, splash: 0.5, danoMult: 0.6 }
 * Compatibilidade: golpes antigos só tinham `todos` (antes valia só para cura);
 * num golpe ofensivo, `todos: true` passa a significar 'area'.
 * Retorna { tipo, max, splash, danoMult }:
 *   - `danoMult`  → multiplicador de dano do alvo principal (também dos demais
 *                   em área/cone, que são uniformes).
 *   - `splash`    → multiplicador de dano dos alvos secundários.
 * Espalhar o golpe reduz o dano por alvo: área 55%, cone 70%; na explosão o
 * principal leva 100% e os vizinhos o splash (padrão 50%). Pode ser ajustado
 * por golpe via `danoMult`/`splash`.
 */
export function alvoNormalizado(golpe = {}) {
  const g = golpe || {};
  let tipo = g.alvo;
  if (!ALVO_TIPOS[tipo]) {
    const ofensivo = g.tipo === 'ataque' || g.tipo === 'fisico' || g.tipo === 'magia';
    tipo = g.todos && ofensivo ? 'area' : 'unico';
  }
  const alvos = Math.max(2, Math.min(10, Number(g.alvos) || MULTI_ALVO_PADRAO));
  const max = tipo === 'unico' ? 1 : tipo === 'area' ? 99 : alvos;
  const tipoMult = tipo === 'area' ? MULTI_AREA_MULT : tipo === 'cone' ? MULTI_CONE_MULT : 1;
  const padraoSplash = tipo === 'explosao' ? MULTI_SPLASH_PADRAO : tipoMult;
  const danoMult = clampMult(g.danoMult, tipoMult);
  const splash = clampMult(g.splash, padraoSplash);
  return { tipo, max, splash, danoMult };
}

/**
 * O golpe de área/cone/explosão desviou para aliados?
 * Só quando a rolagem de mira é uma FALHA CRÍTICA (d20 <= limiar, padrão 1) E a
 * rolagem de desvio (0..1) fica abaixo da chance. Como o acerto é "rolar-menor",
 * rolagens baixas normais são boas miras — apenas o 1 espalha o golpe.
 * `r` é injetável para testes determinísticos.
 */
export function desviouParaAliado(
  d20,
  r = Math.random(),
  limiar = MULTI_DESVIO_LIMIAR,
  chance = MULTI_DESVIO_CHANCE,
) {
  if (!(Number(d20) <= limiar)) return false;
  return Number(r) < chance;
}