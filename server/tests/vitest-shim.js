// ═══════════════════════════════════════════════════════════════════════════════════════
// Shim mínimo de Vitest para rodar os testes deste projeto dentro do navegador.
// Não substitui o Vitest oficial: existe só porque `node`/`npm` não estão instalados
// nesta máquina de desenvolvimento. Os testes continuam sendo escritos para o Vitest.
// ═══════════════════════════════════════════════════════════════════════════════════════

export const __testes = [];
const pilha = [];
const pilhaHooks = [{ antes: [], depois: [] }];

export function describe(nome, fn) {
  pilha.push(nome);
  pilhaHooks.push({ antes: [], depois: [] });
  try {
    fn();
  } finally {
    pilhaHooks.pop();
    pilha.pop();
  }
}

export function beforeEach(fn) {
  pilhaHooks[pilhaHooks.length - 1].antes.push(fn);
}

export function afterEach(fn) {
  pilhaHooks[pilhaHooks.length - 1].depois.push(fn);
}

// Spies mínimos: Math.random é o único alvo usado nos testes deste projeto.
const spies = [];
function criarMock(original) {
  let impl = (...args) => original.apply(null, args);
  const fila = [];
  const spy = (...args) => {
    if (fila.length) return fila.shift()(...args);
    return impl(...args);
  };
  spy.mockReturnValue = (valor) => {
    impl = () => valor;
    return spy;
  };
  spy.mockReturnValueOnce = (valor) => {
    fila.push(() => valor);
    return spy;
  };
  spy.mockImplementation = (fn) => {
    impl = fn;
    return spy;
  };
  spy.mockRestore = () => {};
  return spy;
}

export const vi = {
  spyOn(objeto, metodo) {
    const original = objeto[metodo];
    const spy = criarMock(original);
    objeto[metodo] = spy;
    spies.push({ objeto, metodo, original });
    return spy;
  },
  fn(impl = () => {}) {
    return criarMock(impl);
  },
  restoreAllMocks() {
    for (let i = spies.length - 1; i >= 0; i -= 1) {
      const { objeto, metodo, original } = spies[i];
      objeto[metodo] = original;
    }
    spies.length = 0;
  },
  clearAllMocks() {
    spies.length = 0;
  },
};

export function it(nome, fn) {
  __testes.push({
    nome: [...pilha, nome].join(' › '),
    fn,
    antes: pilhaHooks.flatMap((h) => h.antes),
    depois: pilhaHooks.flatMap((h) => h.depois),
  });
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

// Subconjunto profundo: todo campo de `esperado` precisa existir e bater em `valor`.
function contemSubconjunto(valor, esperado) {
  if (Object.is(valor, esperado)) return true;
  if (esperado == null || typeof esperado !== 'object') return igualProfundo(valor, esperado);
  if (valor == null || typeof valor !== 'object') return false;
  if (Array.isArray(esperado) !== Array.isArray(valor)) return false;
  return Object.keys(esperado).every((chave) => (
    Object.prototype.hasOwnProperty.call(valor, chave)
    && contemSubconjunto(valor[chave], esperado[chave])
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
    toMatchObject: (esperado) => {
      if (!contemSubconjunto(valor, esperado)) {
        falhar(`esperado conter ${descrever(esperado)}, recebido ${descrever(valor)}`);
      }
    },
    toThrow: (esperado) => {
      if (typeof valor !== 'function') {
        falhar('toThrow espera uma função');
        return;
      }
      let erro = null;
      try {
        valor();
      } catch (e) {
        erro = e;
      }
      if (!erro) {
        falhar('esperado que a função lançasse erro');
        return;
      }
      if (esperado === undefined) return;
      const texto = String(erro?.message || erro);
      const bate = esperado instanceof RegExp ? esperado.test(texto) : texto.includes(String(esperado));
      if (!bate) falhar(`esperado erro correspondente a ${descrever(esperado)}, recebido ${descrever(texto)}`);
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
      for (const antes of teste.antes) await antes();
      await teste.fn();
      resultados.push({ nome: teste.nome, ok: true });
    } catch (erro) {
      resultados.push({ nome: teste.nome, ok: false, erro: String(erro?.stack || erro?.message || erro) });
    } finally {
      for (const depois of teste.depois) {
        try {
          await depois();
        } catch (_e) { /* hooks de limpeza não derrubam o teste */ }
      }
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
