// Exporta/importa fichas como arquivos JSON portáteis.
// O import passa pelo MESMO caminho de criação (api.createCharacter),
// então o servidor revalida tudo — nada de dados forjados entrando direto.

const CAMPOS_FICHA = [
  'name',
  'gender',
  'attributes',
  'races',
  'classes',
  'passiva',
  'skills',
  'ultimate',
  'especial',
  'equipment',
  'habilidades',
];

export function exportarFicha(character) {
  const ficha = {};
  for (const campo of CAMPOS_FICHA) {
    if (character[campo] !== undefined) ficha[campo] = character[campo];
  }
  const blob = new Blob([JSON.stringify(ficha, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ficha-${(character.name || 'personagem').toLowerCase().replace(/\s+/g, '-')}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function importarFicha(file, playerId, api) {
  let data;
  try {
    data = JSON.parse(await file.text());
  } catch {
    throw new Error('Arquivo inválido: não é um JSON válido.');
  }
  const obrigatorios = ['name', 'attributes', 'races', 'classes'];
  const faltando = obrigatorios.filter((c) => !data[c]);
  if (faltando.length) {
    throw new Error(`Arquivo incompleto. Faltam campos: ${faltando.join(', ')}.`);
  }
  const payload = { playerId };
  for (const campo of CAMPOS_FICHA) {
    if (data[campo] !== undefined) payload[campo] = data[campo];
  }
  const { character } = await api.createCharacter(payload);
  return character;
}
