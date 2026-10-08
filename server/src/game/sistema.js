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
   ═══════════════════════════════════════════════════════════════════════════ */
export const MANA_RECOVERY_DIVISOR = 2;

export function manaRecuperada(gasto) {
  const g = Math.max(0, Number(gasto) || 0);
  return Math.round(g / MANA_RECOVERY_DIVISOR);
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