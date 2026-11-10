// ═══════════════════════════════════════════════════════════════════════════════════════
// Shim mínimo de Vitest para rodar os testes deste projeto dentro do navegador.
// Não substitui o Vitest oficial: existe só porque `node`/`npm` não estão instalados
// nesta máquina de desenvolvimento. Os testes continuam sendo escritos para o Vitest.
// ═══════════════════════════════════════════════════════════════════════════════════════

export const __testes = [];
const pilha = [];

export function describe(nome, fn) {
  pilha.push(nome);
  try {
    fn();
  } finally {
    pilha.pop();
  }
}

export function it(nome, fn) {
  __testes.push({ nome: [...pilha, nome].join(' › '), fn });
}

function igualProfundo(a, b) {
  if (Object.is(a, b)) return true;
  if (typeof a !== typeof b) return false;
  if (a == null || b == null) return false;
  if (typeof a !== 'object') return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const chavesA = Object.keys(a);
  const chavesB = Object.keys(b);
  if (chavesA.length !== chavesB.length) return false;
  return chavesA.every((chave) => (
    Object.prototype.hasOwnProperty.call(b, chave) && igualProfundo(a[chave], b[chave])
  ));
}

function descrever(valor) {
  try {
    return JSON.stringify(valor);
  } catch {
    return String(valor);
  }
}

function criarExpect(valor, mensagem) {
  const falhar = (texto) => {
    throw new Error(mensagem ? `${mensagem}: ${texto}` : texto);
  };

  const matchers = {
    toBe: (esperado) => {
      if (!Object.is(valor, esperado)) falhar(`esperado ${descrever(esperado)}, recebido ${descrever(valor)}`);
    },
    toEqual: (esperado) => {
      if (!igualProfundo(valor, esperado)) falhar(`esperado ${descrever(esperado)}, recebido ${descrever(valor)}`);
    },
    toHaveLength: (esperado) => {
      if (!valor || valor.length !== esperado) falhar(`esperado tamanho ${esperado}, recebido ${valor?.length}`);
    },
    toBeTruthy: () => {
      if (!valor) falhar(`esperado valor verdadeiro, recebido ${descrever(valor)}`);
    },
    toBeFalsy: () => {
      if (valor) falhar(`esperado valor falso, recebido ${descrever(valor)}`);
    },
    toBeNull: () => {
      if (valor !== null) falhar(`esperado null, recebido ${descrever(valor)}`);
    },
    toBeUndefined: () => {
      if (valor !== undefined) falhar(`esperado undefined, recebido ${descrever(valor)}`);
    },
    toBeDefined: () => {
      if (valor === undefined) falhar('esperado valor definido, recebido undefined');
    },
    toContain: (esperado) => {
      const contem = typeof valor === 'string' ? valor.includes(esperado) : Array.isArray(valor) && valor.includes(esperado);
      if (!contem) falhar(`esperado conter ${descrever(esperado)} em ${descrever(valor)}`);
    },
    toContainEqual: (esperado) => {
      const contem = Array.isArray(valor) && valor.some((item) => igualProfundo(item, esperado));
      if (!contem) falhar(`esperado conter ${descrever(esperado)} em ${descrever(valor)}`);
    },
    toBeGreaterThan: (esperado) => {
      if (!(valor > esperado)) falhar(`esperado > ${esperado}, recebido ${descrever(valor)}`);
    },
    toBeGreaterThanOrEqual: (esperado) => {
      if (!(valor >= esperado)) falhar(`esperado >= ${esperado}, recebido ${descrever(valor)}`);
    },
    toBeLessThan: (esperado) => {
      if (!(valor < esperado)) falhar(`esperado < ${esperado}, recebido ${descrever(valor)}`);
    },
    toBeLessThanOrEqual: (esperado) => {
      if (!(valor <= esperado)) falhar(`esperado <= ${esperado}, recebido ${descrever(valor)}`);
    },
    toBeCloseTo: (esperado, digitos = 2) => {
      const limite = Math.pow(10, -digitos) / 2;
      if (!(Math.abs(Number(valor) - Number(esperado)) < limite)) {
        falhar(`esperado ~${esperado} (±${limite}), recebido ${descrever(valor)}`);
      }
    },
    toMatch: (esperado) => {
      const regex = esperado instanceof RegExp ? esperado : new RegExp(esperado);
      if (!regex.test(String(valor))) falhar(`esperado corresponder a ${regex}`);
    },
    toBeInstanceOf: (esperado) => {
      if (!(valor instanceof esperado)) falhar(`esperado instância de ${esperado?.name}`);
    },
  };

  matchers.not = Object.fromEntries(
    Object.entries(matchers).map(([nome, matcher]) => [nome, (...args) => {
      try {
        matcher(...args);
      } catch {
        return;
      }
      falhar(`não esperado: ${nome}(${args.map(descrever).join(', ')})`);
    }]),
  );

  return matchers;
}

export function expect(valor, mensagem) {
  return criarExpect(valor, mensagem);
}

export async function executarTestes() {
  const resultados = [];
  for (const teste of __testes) {
    try {
      await teste.fn();
      resultados.push({ nome: teste.nome, ok: true });
    } catch (erro) {
      resultados.push({ nome: teste.nome, ok: false, erro: String(erro?.stack || erro?.message || erro) });
    }
  }
  const falharam = resultados.filter((item) => !item.ok);
  return {
    total: resultados.length,
    passaram: resultados.length - falharam.length,
    falharam: falharam.length,
    resultados,
  };
}
