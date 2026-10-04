import { useEffect, useMemo, useState } from 'react';
import { api, emitAck, isOffline, getSocket } from '../api.js';
import { dungeonsDisponiveis, montarEncontro } from '../game/dungeons.js';
import { estadoEclipse, ECLIPSE_PERIODO } from '../game/eclipse.js';

export default function Dungeons({ player, characters, onBack, onOpenBattle }) {
  const [dia, setDia] = useState(1);
  const [tipo, setTipo] = useState('comum');
  const [charId, setCharId] = useState('');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [calendarioOnline, setCalendarioOnline] = useState(false);

  useEffect(() => {
    if (characters[0] && !charId) setCharId(characters[0].id);
  }, [characters, charId]);

  // O calendário é do mundo do RPG: online é o servidor, offline é o localStorage.
  useEffect(() => {
    let vivo = true;
    api
      .calendario()
      .then((c) => {
        if (!vivo || !c) return;
        setDia(c.dia || 1);
        setTipo(c.tipoEclipse || 'comum');
        setCalendarioOnline(!isOffline());
      })
      .catch(() => {
        if (vivo) setCalendarioOnline(false);
      });
    const socket = getSocket();
    const onCal = (c) => {
      if (!c) return;
      setDia(c.dia || 1);
      setTipo(c.tipoEclipse || 'comum');
    };
    socket.on('calendarioUpdate', onCal);
    return () => {
      vivo = false;
      socket.off('calendarioUpdate', onCal);
    };
  }, []);

  const personagem = characters.find((c) => c.id === charId) || null;
  const nivel = personagem?.level || 1;
  const lista = useMemo(() => dungeonsDisponiveis(nivel, dia, tipo), [nivel, dia, tipo]);
  const fase = useMemo(() => estadoEclipse(dia, tipo), [dia, tipo]);

  const moverDia = async (n) => {
    setBusy('dia');
    setError('');
    try {
      const r = await api.avancarDia(n);
      setDia(r.dia);
      if (r.tipoEclipse) setTipo(r.tipoEclipse);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy('');
    }
  };

  const mudarTipo = async (novo) => {
    setBusy('tipo');
    setError('');
    try {
      const r = await api.setTipoEclipse(novo);
      setTipo(r.tipoEclipse || novo);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy('');
    }
  };

  const entrar = async (d) => {
    if (!personagem) {
      setError('Escolha um personagem para a incursão.');
      return;
    }
    setBusy(d.id);
    setError('');
    try {
      const enc = montarEncontro(d.id, { nivelJogadores: 1, dia, tipoEclipse: tipo });
      const ack = await emitAck('createBattle', {
        name: `🗺️ ${d.nome}`,
        mode: 'mestre',
        role: 'mestre_jogador',
        playerId: player.id,
        characterId: personagem.id,
        character: personagem,
        aiEnabled: true,
        dungeonId: d.id,
      });
      for (const monsterId of enc.monstroIds) {
        await emitAck('addMonster', { monsterId });
      }
      await emitAck('startBattle', {});
      onOpenBattle(ack.battleId);
    } catch (e) {
      setError(e.message);
      setBusy('');
    }
  };

  return (
    <div className="page">
      <header className="topbar">
        <div>
          <h1>🗺️ Dungeons</h1>
          <span className="player-name">
            Progressão: manequim → esqueleto → zumbi → mini golem → golem de pedra
          </span>
        </div>
        <button className="ghost" onClick={onBack}>← Voltar</button>
      </header>

      <div className="content">
        {error && <div className="error">{error}</div>}

        {/* ── Calendário do mundo / Eclipse ── */}
        <section className="panel eclipse-panel">
          <h2>{fase?.icon} {fase?.tipoNome} — Dia {dia} do mundo</h2>
          <p className="muted">
            {fase?.nome} · ciclo {fase?.ciclo} · dia {fase?.diaNoCiclo}/{ECLIPSE_PERIODO}
            {fase?.eclipseAtivo
              ? ' · O ECLIPSE está ativo agora!'
              : ` · faltam ${fase?.diasParaEclipse} dia(s) para o Eclipse`}
          </p>
          <p className="muted small">
            O calendário do RPG é independente do relógio: o dia só avança quando o Mestre manda.
            {calendarioOnline ? ' Sincronizado com o servidor.' : ' Salvo neste navegador.'}
          </p>
          <div className="cal-controls">
            <button onClick={() => moverDia(1)} disabled={busy === 'dia'}>⏭️ Avançar 1 dia</button>
            <button className="ghost" onClick={() => moverDia(5)} disabled={busy === 'dia'}>+5 dias</button>
            <button className="ghost" onClick={() => moverDia(25)} disabled={busy === 'dia'}>+25 dias</button>
            <label className="inline">
              Tipo:
              <select value={tipo} onChange={(e) => mudarTipo(e.target.value)} disabled={busy === 'tipo'}>
                <option value="comum">Comum</option>
                <option value="maior">Maior</option>
                <option value="raro">Raro</option>
              </select>
            </label>
          </div>
        </section>

        {/* ── Escolha do personagem ── */}
        <section className="panel">
          <h2>🧙 Personagem da incursão</h2>
          <div className="cal-controls">
            <select value={charId} onChange={(e) => setCharId(e.target.value)}>
              {characters.length === 0 && <option value="">Nenhuma ficha criada</option>}
              {characters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — nível {c.level}
                </option>
              ))}
            </select>
            {personagem && (
              <span className="muted small">
                A faixa da dungeon é escolhida pelo nível {nivel}.
              </span>
            )}
          </div>
        </section>

        {/* ── Lista de dungeons ── */}
        <div className="dungeon-list">
          {lista.map((d) => {
            const enc = montarEncontro(d.id, { nivelJogadores: 1, dia, tipoEclipse: tipo });
            return (
              <div key={d.id} className={`panel dungeon-card${d.bloqueada ? ' bloqueada' : ''}`}>
                <div className="dungeon-head">
                  <h2>{d.icone} {d.nome}</h2>
                  <span className="tag">NV {d.nivelMin}–{d.nivelMax}</span>
                  {d.bonusEclipse > 1 && <span className="tag eclipse-tag">🩸 Eclipse +{Math.round((d.bonusEclipse - 1) * 100)}%</span>}
                </div>
                <p className="muted">{d.descricao}</p>
                <p className="flavour">{d.flavour}</p>

                <div className="dungeon-rows">
                  <div>
                    <strong>Encontro</strong>
                    <ul className="dungeon-list-inline">
                      {enc.participantes.map((p, i) => (
                        <li key={`${p.monsterId}-${i}`}>
                          {p.charName} — {p.hpMax} HP
                          {p.horda ? ` (${p.horda.quantidade} corpos)` : ''}
                          {p.isBoss ? ' ☠️ CHEFE' : ''}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <strong>Puzzles</strong>
                    <ul className="dungeon-list-inline">
                      {d.puzzles.map((p) => <li key={p}>{p}</li>)}
                    </ul>
                  </div>
                  <div>
                    <strong>Recompensas</strong>
                    <ul className="dungeon-list-inline">
                      <li>✨ {enc.recompensas.xp} XP</li>
                      <li>⛁ {enc.recompensas.moedas} moedas</li>
                      {(d.recompensas.gemas || []).map((g) => <li key={g}>💎 {g}</li>)}
                      {(d.recompensas.equipamentos || []).map((e) => <li key={e}>🗡️ {e}</li>)}
                    </ul>
                  </div>
                </div>

                {d.bloqueada ? (
                  <p className="muted small">🔒 {d.motivoBloqueio}</p>
                ) : (
                  <button onClick={() => entrar(d)} disabled={!!busy || !personagem}>
                    {busy === d.id ? 'Montando o encontro...' : '⚔️ Entrar na dungeon'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
