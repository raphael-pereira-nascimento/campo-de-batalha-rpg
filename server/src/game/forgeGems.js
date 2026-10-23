// Gemas exclusivas da Forja (não entram no catálogo de loja/mineração/drops).
// Espelham src/game/gems.js -> `gemas`, com os efeitos já no formato padrão
// por slot ({ desc, bonus, status }), para que o combate no servidor aplique
// os mesmos bônus que o cliente exibe.

export const FORGE_GEMS = {
  obsidiana: {
    id: 'obsidiana',
    nome: 'Obsidiana',
    tipo: 'Elemental (Fogo/Escuridão)',
    raridade: 'epica',
    preco: 5000,
    estado: 'polido',
    efeitos: {
      armadura: {
        desc: '+25% resistência a fogo e escuridão',
        bonus: { resistencia: 2 },
        resistenciaFogo: 35,
        resistenciaEscuridao: 35,
        debuff: { danoImpacto: 15 },
      },
      arma: {
        desc: '+30% dano cortante e de fogo',
        bonus: { forca: 2, destreza: 1 },
        danoLamina: 15,
        danoMagiaFogo: 20,
      },
      acessorio: {
        desc: 'Resistência a fogo e maldição',
        bonus: { resistencia: 1 },
        resistenciaFogo: 25,
        resistenciaMaldicao: 25,
      },
      golem: {
        desc: 'Golem +25% resistente ao fogo',
        bonus: { resistencia: 2 },
        imunidadeFogo: true,
        imunidadeEscuridao: true,
        fraquezaImpacto: 25,
      },
    },
  },
  agataDeFogo: {
    id: 'agataDeFogo',
    nome: 'Ágata de Fogo',
    tipo: 'Elemental (Fogo)',
    raridade: 'incomum',
    preco: 3000,
    estado: 'polido',
    efeitos: {
      armadura: {
        desc: '+30% resistência ao fogo',
        bonus: { resistencia: 2 },
        resistenciaFogo: 30,
      },
      arma: {
        desc: '+20% dano de fogo (chance de incendiar)',
        bonus: { forca: 1 },
        chanceIncendiar: true,
        status: { tipo: 'queimadura', chance: 0.15 },
      },
      acessorio: {
        desc: 'Resistência ao calor',
        bonus: { resistencia: 1 },
        resistenciaCalor: true,
      },
      golem: {
        desc: 'Golem com golpe de explosão de fogo',
        bonus: { forca: 1 },
        golpeExplosaoFogo: true,
      },
    },
  },
  rubi: {
    id: 'rubi',
    nome: 'Rubi',
    tipo: 'Elemental (Fogo/Sangue)',
    raridade: 'epica',
    preco: 7000,
    estado: 'bruta',
    efeitos: {
      armadura: {
        desc: '+35% resistência ao fogo (fraqueza a gelo)',
        bonus: { resistencia: 2 },
        resistenciaFogo: 35,
        debuff: { danoGelo: 20 },
      },
      arma: {
        desc: '+30% dano de fogo (chance de queimadura)',
        bonus: { forca: 2 },
        danoFogo: 30,
        efeitoQueimadura: true,
        status: { tipo: 'queimadura', chance: 0.2 },
      },
      acessorio: {
        desc: '+15 vida máxima',
        bonus: { resistencia: 1 },
        vidaMaxima: 15,
      },
      golem: {
        desc: 'Golem com ataque de explosão de fogo',
        bonus: { forca: 1 },
        ataqueExplosaoFogo: true,
        debuff: { perdaEnergiaFrio: true },
      },
    },
  },
  pedraDeSangue: {
    id: 'pedraDeSangue',
    nome: 'Pedra de Sangue',
    tipo: 'Proibida (Sangue/Dor)',
    raridade: 'lendaria',
    preco: 20000,
    estado: 'polido',
    efeitos: {
      armadura: {
        desc: 'Cura 5 ao matar (perde vida com o tempo)',
        bonus: { resistencia: 1 },
        curaAoMatar: 5,
        debuff: { perdaVidaPorMinuto: 2 },
      },
      arma: {
        desc: '+35% dano de sangramento (chance de sangrar)',
        bonus: { forca: 2 },
        danoSangramento: 35,
        danoMagiaDor: 25,
        status: { tipo: 'sangramento', chance: 0.25 },
      },
      acessorio: {
        desc: 'Detecta inimigos feridos',
        bonus: { inteligencia: 1 },
        detectarFeridos: true,
      },
      golem: {
        desc: 'Golem absorve sangue dos feridos',
        bonus: { forca: 1 },
        absorverSangue: true,
      },
    },
  },
};

// Resolve uma gema do catálogo OU uma gema exclusiva da Forja.
export function getGemDef(id) {
  return FORGE_GEMS[id] || null;
}

// Receitas estáveis de fusão (mesmas do cliente, em src/game/gems.js).
// O servidor valida a combinação e cobra a mana — não confia no cliente.
export const FUSOES = [
  {
    ingredientes: ['obsidiana', 'agataDeFogo'],
    resultadoId: 'obsidiana_ardente',
    custoMana: 50,
  },
  {
    ingredientes: ['rubi', 'pedraDeSangue'],
    resultadoId: 'rubi_abissal',
    custoMana: 150,
  },
];

const _par = (a, b) => [a, b].sort().join('|');

// Retorna a receita para o par de gemas (ordem indiferente) ou null.
export function acharReceitaFusao(idA, idB) {
  const alvo = _par(idA, idB);
  return FUSOES.find((r) => _par(r.ingredientes[0], r.ingredientes[1]) === alvo) || null;
}
