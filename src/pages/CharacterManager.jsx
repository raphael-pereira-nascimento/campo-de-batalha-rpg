import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api.js';
import { SKILL_TYPES, rotuloPoder, ajudaPoder, resumoPoder, rotuloElemento } from '../config.js';
import { ELEMENTOS } from '../game/data.js';
import { NIVEL_GOLPE_MIN, NIVEL_GOLPE_MAX } from '../game/skillValidation.js';

// Estrutura técnica da árvore (P-15/P-01 continuam pendentes): nível manual
// 1–30 e uma flag de desbloqueio. Nenhum custo/XP de desbloqueio foi inventado.
// Golpes antigos, sem estes campos, entram como nível 1, físicos e liberados.
const GOLPE_VAZIO = {
  nome: '',
  tipo: 'magia',
  elemento: 'fisico',
  poder: 150,
  custo: 5,
  cooldown: 0,
  nivel: NIVEL_GOLPE_MIN,
  desbloqueado: true,
  desc: '',
};

let seq = 0;
const novoId = () => `golpe_${Date.now()}_${(seq += 1)}`;
const clamp = (v, min, max, padrao) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.round(n))) : padrao;
};

// Motivo separado para não confundir "bloqueado pelo jogador" com
// "nível ainda não alcançado" — os dois usavam a mesma classe .locked.
function motivoIndisponivel(skill, nivelFicha) {
  if (!skill) return '';
  if (skill.desbloqueado === false || skill.desbloqueado === null) return '🔒 Bloqueado';
  if (clamp(skill.nivel, NIVEL_GOLPE_MIN, NIVEL_GOLPE_MAX, NIVEL_GOLPE_MIN) > nivelFicha) {
    return `⏳ Requer nível ${skill.nivel}`;
  }
  return '';
}

function golpeParaEditor(s = {}) {
  return {
    ...GOLPE_VAZIO,
    // O id precisa sobreviver à ida e volta formulário → ficha: `spells` é
    // derivado desses ids e, sem eles, vira [null, null] no save offline.
    id: s.id || null,
    nome: s.nome || '',
    tipo: SKILL_TYPES[s.tipo] ? s.tipo : 'magia',
    elemento: ELEMENTOS.includes(s.elemento) ? s.elemento : 'fisico',
    poder: clamp(s.poder, 10, 1000, 100),
    custo: clamp(s.custo, 0, 99, 0),
    cooldown: clamp(s.cooldown, 0, 20, 0),
    nivel: clamp(s.nivel, NIVEL_GOLPE_MIN, NIVEL_GOLPE_MAX, NIVEL_GOLPE_MIN),
    desbloqueado: s.desbloqueado !== false && s.desbloqueado !== null,
    desc: s.desc ?? s.descricao ?? '',
  };
}

export default function CharacterManager({ player, characters, onRefresh, onBack }) {
  const [selectedId, setSelectedId] = useState(characters[0]?.id || '');
  const [form, setForm] = useState({ name: '', gender: 'masculino', passiva: '', desc: '', skills: [] });
  const [golpe, setGolpe] = useState(GOLPE_VAZIO);
  const [editIndex, setEditIndex] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const editorRef = useRef(null);

  const selected = useMemo(
    () => characters.find((c) => c.id === selectedId) || null,
    [characters, selectedId],
  );

  useEffect(() => {
    if (!selectedId && characters.length) setSelectedId(characters[0].id);
    if (selectedId && !characters.some((c) => c.id === selectedId)) {
      setSelectedId(characters[0]?.id || '');
    }
  }, [characters, selectedId]);

  useEffect(() => {
    if (!selected) {
      setForm({ name: '', gender: 'masculino', passiva: '', desc: '', skills: [] });
      return;
    }
    setForm({
      name: selected.name || '',
      gender: selected.gender || 'masculino',
      passiva: selected.passiva || '',
      desc: selected.desc || '',
      skills: (selected.skills || []).map(golpeParaEditor),
    });
    setGolpe(GOLPE_VAZIO);
    setEditIndex(null);
    setError('');
    setNotice('');
  }, [selected]);

  const nivelFicha = selected?.level || 1;

  const contadores = useMemo(() => {
    const disponiveis = form.skills.filter((s) => !motivoIndisponivel(s, nivelFicha)).length;
    return {
      total: form.skills.length,
      disponiveis,
      guardados: form.skills.length - disponiveis,
      niveis: new Set(form.skills.map((s) => s.nivel)).size,
    };
  }, [form.skills, nivelFicha]);

  const arvore = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase('pt-BR');
    const niveis = new Map();
    form.skills.forEach((skill, index) => {
      const nivel = clamp(skill.nivel, NIVEL_GOLPE_MIN, NIVEL_GOLPE_MAX, NIVEL_GOLPE_MIN);
      const motivo = motivoIndisponivel(skill, nivelFicha);
      if (termo && !`${skill.nome || ''} ${skill.desc || ''}`.toLocaleLowerCase('pt-BR').includes(termo)) return;
      if (filtroTipo !== 'todos' && skill.tipo !== filtroTipo) return;
      if (filtroEstado === 'disponivel' && motivo) return;
      if (filtroEstado === 'indisponivel' && !motivo) return;
      if (!niveis.has(nivel)) niveis.set(nivel, []);
      niveis.get(nivel).push({ skill, index, motivo });
    });
    return [...niveis.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([nivel, itens]) => [
        nivel,
        itens.sort((a, b) => String(a.skill.nome || '').localeCompare(String(b.skill.nome || ''), 'pt-BR')),
      ]);
  }, [form.skills, busca, filtroTipo, filtroEstado, nivelFicha]);

  const setCampoGolpe = (campo, valor) => {
    setGolpe((g) => ({ ...g, [campo]: valor }));
    setError('');
  };

  const salvarGolpe = () => {
    if (!golpe.nome.trim()) {
      setError('Informe o nome do golpe.');
      return;
    }
    const normalizado = {
      ...golpeParaEditor(golpe),
      nome: golpe.nome.trim().slice(0, 40),
    };
    setForm((f) => {
      const skills = [...f.skills];
      if (editIndex !== null && skills[editIndex]) {
        // Mantém metadados avançados (alvo, status, buff...) do golpe original.
        skills[editIndex] = { ...skills[editIndex], ...normalizado };
      } else {
        skills.push({ ...normalizado, id: novoId() });
      }
      return { ...f, skills };
    });
    setGolpe(GOLPE_VAZIO);
    setEditIndex(null);
    setNotice('Golpe salvo na árvore. Clique em “Salvar ficha” para persistir.');
  };

  const editarGolpe = (index) => {
    const skill = form.skills[index];
    if (!skill) return;
    const { ...campos } = skill;
    setGolpe(golpeParaEditor(campos));
    setEditIndex(index);
    setError('');
    setNotice('Editando golpe — clique em “Salvar golpe” e depois em “Salvar ficha”.');
    requestAnimationFrame(() => editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  const removerGolpe = (index) => {
    const skill = form.skills[index];
    if (!skill || !window.confirm(`Remover o golpe “${skill.nome}” da árvore?`)) return;
    setForm((f) => ({ ...f, skills: f.skills.filter((_, i) => i !== index) }));
    if (editIndex === index) {
      setGolpe(GOLPE_VAZIO);
      setEditIndex(null);
    }
    setNotice('Golpe removido da árvore. Clique em “Salvar ficha” para persistir.');
  };

  const duplicarGolpe = (index) => {
    const skill = form.skills[index];
    if (!skill) return;
    const copia = {
      ...skill,
      id: novoId(),
      nome: `${String(skill.nome || 'Golpe').slice(0, 34)} (cópia)`,
    };
    setForm((f) => {
      const skills = [...f.skills];
      skills.splice(index + 1, 0, copia);
      return { ...f, skills };
    });
    setNotice('Cópia criada. Clique em “Salvar ficha” para persistir.');
  };

  const moverGolpe = (index, nivel) => {
    const alvo = clamp(nivel, NIVEL_GOLPE_MIN, NIVEL_GOLPE_MAX, NIVEL_GOLPE_MIN);
    setForm((f) => ({
      ...f,
      skills: f.skills.map((s, i) => (i === index ? { ...s, nivel: alvo } : s)),
    }));
    setNotice('Nível do golpe alterado. Clique em “Salvar ficha” para persistir.');
  };

  const alternarBloqueio = (index) => {
    setForm((f) => ({
      ...f,
      skills: f.skills.map((s, i) => (i === index
        ? { ...s, desbloqueado: s.desbloqueado === false || s.desbloqueado === null }
        : s)),
    }));
  };

  const salvarFicha = async () => {
    if (!selected) return;
    if (!form.name.trim()) {
      setError('Informe o nome do personagem.');
      return;
    }
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const skills = form.skills.map((s) => {
        const { ...golpe } = s;
        return {
          ...golpe,
          elemento: ELEMENTOS.includes(golpe.elemento) ? golpe.elemento : 'fisico',
          nivel: clamp(golpe.nivel, NIVEL_GOLPE_MIN, NIVEL_GOLPE_MAX, NIVEL_GOLPE_MIN),
          desbloqueado: golpe.desbloqueado === true,
          custo: clamp(golpe.custo, 0, 99, 0),
          poder: clamp(golpe.poder, 10, 1000, 100),
          cooldown: clamp(golpe.cooldown, 0, 20, 0),
        };
      });
      await api.updateCharacter(selected.id, {
        playerId: player?.id || selected.playerId,
        name: form.name.trim(),
        gender: form.gender,
        passiva: form.passiva,
        desc: form.desc,
        attributes: selected.attributes,
        races: selected.races,
        classes: selected.classes,
        ultimate: selected.ultimate,
        especial: selected.especial,
        equipment: selected.equipment,
        habilidades: selected.habilidades,
        skills,
      });
      await onRefresh?.();
      setNotice('Ficha salva. Os golpes desbloqueados e do nível atual já estão disponíveis no combate.');
    } catch (e) {
      setError(e?.message || 'Não foi possível salvar a ficha.');
    } finally {
      setSaving(false);
    }
  };

  const excluirFicha = async () => {
    if (!selected) return;
    if (!window.confirm(`Excluir a ficha de ${selected.name}? Essa ação não pode ser desfeita.`)) return;
    setSaving(true);
    setError('');
    try {
      await api.deleteCharacter(selected.id);
      await onRefresh?.();
      setSelectedId('');
      setNotice('Ficha excluída.');
    } catch (e) {
      setError(e?.message || 'Não foi possível excluir a ficha.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="content">
      <nav className="subnav">
        <button onClick={onBack}>← Voltar às fichas</button>
      </nav>

      <h1>🗂️ Gerenciar fichas e árvore de golpes</h1>
      <p className="muted">
        Edite o nome, o gênero e a passiva da ficha, monte a árvore de golpes por nível e escolha
        quais estão desbloqueados. Golpes bloqueados (ou acima do nível da ficha) ficam guardados
        na árvore e não aparecem no combate. Níveis e desbloqueio são uma estrutura técnica
        provisória — as regras oficiais de especialização/XP ainda estão pendentes.
      </p>

      {characters.length === 0 && (
        <div className="empty">Você ainda não tem fichas. Crie uma em “Personagens” primeiro.</div>
      )}

      {characters.length > 0 && (
        <>
          <div className="form-row manager-top">
            <label>
              Ficha
              <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
                {characters.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} · nível {c.level || 1}</option>
                ))}
              </select>
            </label>
            <label>
              Nome do personagem
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} maxLength={40} />
            </label>
            <label>
              Gênero
              <select value={form.gender} onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}>
                <option value="masculino">Masculino</option>
                <option value="feminino">Feminino</option>
              </select>
            </label>
          </div>
          <label>
            Passiva
            <input value={form.passiva} onChange={(e) => setForm((f) => ({ ...f, passiva: e.target.value }))} maxLength={300} placeholder="Habilidade passiva da ficha" />
          </label>
          <label>
            Descrição (opcional)
            <textarea value={form.desc} onChange={(e) => setForm((f) => ({ ...f, desc: e.target.value }))} rows={3} maxLength={300} placeholder="História, aparência, características..." />
          </label>
          <p className="muted small">
            Raças, classes, atributos e equipamento são preservados da ficha original para não
            perder progresso. Use “Criar ficha” no menu de Personagens para refazer essas partes.
          </p>

          <hr />

          <h2 ref={editorRef}>➕ {editIndex === null ? 'Adicionar golpe' : 'Editar golpe'}</h2>
          <p className="muted small">
            Escolha qualquer tipo de golpe (físico, magia, cura, buff ou defesa). O custo de MP é
            gasto ao usar o golpe; o elemento define fraquezas/resistências no combate.
          </p>
          <div className="form-row">
            <label>
              Nome
              <input value={golpe.nome} onChange={(e) => setCampoGolpe('nome', e.target.value)} maxLength={40} placeholder="Ex.: Bola de Fogo" />
            </label>
            <label>
              Tipo
              <select value={golpe.tipo} onChange={(e) => setCampoGolpe('tipo', e.target.value)}>
                {Object.entries(SKILL_TYPES).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </label>
            <label>
              Elemento mágico
              <select value={golpe.elemento} onChange={(e) => setCampoGolpe('elemento', e.target.value)}>
                {ELEMENTOS.map((el) => (<option key={el} value={el}>{rotuloElemento(el)}</option>))}
              </select>
            </label>
          </div>
          <div className="form-row">
            <label>
              Custo de MP
              <input type="number" min={0} max={99} value={golpe.custo} onChange={(e) => setCampoGolpe('custo', Number(e.target.value))} />
            </label>
            <label>
              {rotuloPoder(golpe.tipo)}
              <input type="number" min={10} max={1000} value={golpe.poder} disabled={golpe.tipo === 'defesa'} title={ajudaPoder(golpe.tipo)} onChange={(e) => setCampoGolpe('poder', Number(e.target.value))} />
              <small className="muted small field-help">{ajudaPoder(golpe.tipo)}</small>
            </label>
            <label>
              Recarga (turnos)
              <input type="number" min={0} max={20} value={golpe.cooldown} onChange={(e) => setCampoGolpe('cooldown', Number(e.target.value))} />
            </label>
            <label>
              Nível para adquirir
              <input type="number" min={NIVEL_GOLPE_MIN} max={NIVEL_GOLPE_MAX} value={golpe.nivel} onChange={(e) => setCampoGolpe('nivel', Number(e.target.value))} />
            </label>
          </div>
          <label>
            Descrição (opcional)
            <input value={golpe.desc} onChange={(e) => setCampoGolpe('desc', e.target.value)} maxLength={200} />
          </label>
          <label className="check-label">
            <input type="checkbox" checked={golpe.desbloqueado} onChange={(e) => setCampoGolpe('desbloqueado', e.target.checked)} />
            Já desbloqueado (desmarque para guardar na árvore e liberar depois)
          </label>
          <div className="manager-actions">
            <button onClick={salvarGolpe}>+ {editIndex === null ? 'Adicionar à árvore' : 'Salvar golpe'}</button>
            {editIndex !== null && (
              <button className="ghost" onClick={() => { setEditIndex(null); setGolpe(GOLPE_VAZIO); }}>Cancelar edição</button>
            )}
          </div>

          <hr />

          <h2>🌳 Árvore de habilidades</h2>
          <p className="muted small">
            Nível atual da ficha: <strong>{nivelFicha}</strong>. Golpes com nível maior ou
            bloqueados não entram no combate até serem liberados aqui. Estrutura técnica provisória
            (D-53): sem custo de XP ou pré-requisitos oficiais.
          </p>
          <div className="tree-counters" aria-live="polite">
            <span className="tag">{contadores.total} golpes na árvore</span>
            <span className="tag tag-ok">✅ {contadores.disponiveis} disponíveis</span>
            <span className="tag">{contadores.niveis} níveis ocupados</span>
          </div>
          <div className="tree-filters">
            <label>
              Buscar golpe
              <input
                type="search"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Nome ou descrição"
              />
            </label>
            <label>
              Tipo
              <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
                <option value="todos">Todos</option>
                {Object.entries(SKILL_TYPES).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
              </select>
            </label>
            <label>
              Estado
              <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
                <option value="todos">Todos</option>
                <option value="disponivel">Disponíveis</option>
                <option value="indisponivel">Guardados/bloqueados</option>
              </select>
            </label>
            {(busca || filtroTipo !== 'todos' || filtroEstado !== 'todos') && (
              <button className="ghost" onClick={() => { setBusca(''); setFiltroTipo('todos'); setFiltroEstado('todos'); }}>
                Limpar filtros
              </button>
            )}
          </div>
          <div className="skill-tree">
            {arvore.map(([nivel, itens]) => (
              <section className="skill-tree-level" key={nivel}>
                <h3>Nível {nivel}</h3>
                <div className="skill-tree-branch">
                  {itens.map(({ skill, index, motivo }) => {
                    const bloqueado = skill.desbloqueado === false || skill.desbloqueado === null;
                    const classe = [
                      'skill-node',
                      motivo ? 'locked' : 'unlocked',
                      editIndex === index ? 'editando' : '',
                    ].filter(Boolean).join(' ');
                    return (
                      <div className={classe} key={skill.id || index}>
                        <div className="skill-node-head">
                          <strong>{skill.nome}</strong>
                          {motivo && <span className="tag tag-lock">{motivo}</span>}
                        </div>
                        <div className="skill-node-tags">
                          <span className="tag">{SKILL_TYPES[skill.tipo] || skill.tipo}</span>
                          <span className="tag">✦ {rotuloElemento(skill.elemento || 'fisico')}</span>
                          <span className="tag">MP {skill.custo ?? 0}</span>
                          <span className="tag">{resumoPoder(skill)}</span>
                        </div>
                        {skill.desc && <p className="muted small">{skill.desc}</p>}
                        <label className="skill-move">
                          Nível
                          <select
                            value={clamp(skill.nivel, NIVEL_GOLPE_MIN, NIVEL_GOLPE_MAX, NIVEL_GOLPE_MIN)}
                            onChange={(e) => moverGolpe(index, Number(e.target.value))}
                          >
                            {Array.from({ length: NIVEL_GOLPE_MAX }, (_, i) => i + 1).map((n) => (
                              <option key={n} value={n}>{n}</option>
                            ))}
                          </select>
                        </label>
                        <div className="skill-node-actions">
                          <button className="ghost" onClick={() => alternarBloqueio(index)}>
                            {bloqueado ? '🔓 Desbloquear' : '🔒 Bloquear'}
                          </button>
                          <button className="ghost" onClick={() => editarGolpe(index)}>✏️ Editar</button>
                          <button className="ghost" onClick={() => duplicarGolpe(index)}>⧉ Duplicar</button>
                          <button className="ghost danger-ghost" onClick={() => removerGolpe(index)}>✕ Remover</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
            {form.skills.length === 0 && <p className="muted">Nenhum golpe na árvore desta ficha.</p>}
            {form.skills.length > 0 && arvore.length === 0 && (
              <p className="muted">Nenhum golpe corresponde aos filtros atuais.</p>
            )}
          </div>

          <div className="manager-actions">
            <button onClick={salvarFicha} disabled={saving}>{saving ? 'Salvando...' : '💾 Salvar ficha'}</button>
            <button className="danger" onClick={excluirFicha} disabled={saving}>🗑️ Excluir ficha</button>
          </div>
          {error && <div className="error">{error}</div>}
          {notice && <div className="notice">{notice}</div>}
        </>
      )}
    </div>
  );
}
