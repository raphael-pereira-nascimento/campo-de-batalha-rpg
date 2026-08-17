import { useEffect, useMemo, useRef, useState } from 'react';
import { api, getSocket, emitAck } from '../api.js';
import StatBar from '../components/StatBar.jsx';

const CLASS_ICONS = { guerreiro: '🛡️', mago: '🔮', arqueiro: '🏹', clerigo: '✝️', assassino: '🗡️', paladino: '⚔️' };
const MONSTER_ICON = '👾';
const BOSS_ICON = '👹';

export default function Battle({ battleId, player, gameData, onExit, onBackToSheets }) {
  const [battle, setBattle] = useState(null);
  const [error, setError] = useState('');
  const [targetId, setTargetId] = useState('');
  const [spellId, setSpellId] = useState('');
  const [itemId, setItemId] = useState('');
  const [actionType, setActionType] = useState('attack');
  const [busy, setBusy] = useState(false);
  const [monsterPick, setMonsterPick] = useState('');
  const [customMonsters, setCustomMonsters] = useState([]);
  const logRef = useRef(null);

  useEffect(() => {
    const socket = getSocket();
    const onUpdate = (data) => {
      if (data === null) {
        setBattle(null);
        return;
      }
      setBattle(data);
    };
    socket.on('battleUpdate', onUpdate);
    if (battleId) {
      socket.emit('joinRoom', { battleId });
      socket.emit('getBattle', { battleId }, (ack) => {
        if (ack && ack.ok) setBattle(ack.battle);
        else if (ack) setError(ack.error);
      });
    }
    return () => {
      socket.off('battleUpdate', onUpdate);
      if (battleId) socket.emit('leaveRoom', { battleId });
    };
  }, [battleId]);

  useEffect(() => {
    if (battle?.mode === 'mestre') {
      api
        .listCustomMonsters()
        .then((d) => setCustomMonsters(d.monsters || []))
        .catch(() => {});
    }
  }, [battle?.mode]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [battle?.log?.length]);

  const participants = battle?.participants || [];
  const currentIdx = battle?.turnOrder?.[battle.currentTurnIndex];
  const currentChar = currentIdx !== undefined ? participants[currentIdx] : null;
  const isHost = battle?.host === player.id;
  const isMasterTurn = battle?.mode === 'mestre' && !!currentChar?.isMonster && isHost;
  const currentIsMine = !!currentChar && currentChar.playerId === player.id;
  const isMyTurn = currentIsMine || isMasterTurn;

  const myChars = useMemo(() => participants.filter((p) => p.playerId === player.id), [participants, player.id]);
  const active = currentIsMine ? currentChar : isMasterTurn ? currentChar : myChars[0];

  const heroes = useMemo(() => participants.filter((p) => !p.isMonster), [participants]);
  const enemies = useMemo(() => participants.filter((p) => p.isMonster), [participants]);

  const aliveTargets = useMemo(() => {
    if (!battle) return [];
    if (battle.mode === 'mestre') {
      return isMasterTurn || !currentIsMine
        ? heroes.filter((p) => p.alive)
        : enemies.filter((p) => p.alive);
    }
    return participants.filter((p) => p.alive && p.characterId !== (active && active.characterId));
  }, [battle, participants, heroes, enemies, active, isMasterTurn, currentIsMine]);

  const megaNeedsTarget = (s) => s && (s.tipo === 'fisico' || s.tipo === 'magia');

  const act = async (payload) => {
    if (!active) return;
    setBusy(true);
    setError('');
    try {
      await emitAck('battleAction', {
        battleId,
        characterId: active.characterId,
        playerId: player.id,
        action: payload,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const doAttack = () => act({ type: 'attack', targetId: targetId || aliveTargets[0]?.characterId });
  const doDefend = () => act({ type: 'defend' });
  const doDodge = () => act({ type: 'dodge' });
  const doMagic = () => {
    if (!spellId) return;
    act({ type: 'magic', spellId, targetId: targetId || null });
  };
  const doItem = () => act({ type: 'useItem', itemId });

  const start = async () => {
    setBusy(true);
    setError('');
    try {
      await emitAck('startBattle', { battleId, playerId: player.id });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const addMonster = async () => {
    if (!monsterPick) return;
    setBusy(true);
    setError('');
    try {
      const isCustom = monsterPick.startsWith('custom_');
      await emitAck('addMonster', {
        battleId,
        playerId: player.id,
        monsterId: isCustom ? undefined : monsterPick,
        customMonsterId: isCustom ? monsterPick.slice(7) : undefined,
      });
      setMonsterPick('');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const removeMonster = async (participantId) => {
    setBusy(true);
    setError('');
    try {
      await emitAck('removeMonster', { battleId, playerId: player.id, participantId });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const leave = async () => {
    try {
      await emitAck('leaveBattle', { battleId, characterId: myChars[0]?.characterId });
    } catch (_e) {
      /* batalha em andamento não permite sair; apenas fecha a tela */
    }
    onExit();
  };

  if (!battle) {
    return (
      <div className="page">
        <header className="topbar">
          <h1>Batalha</h1>
          <button className="ghost" onClick={onExit}>
            ← Voltar ao Lobby
          </button>
        </header>
        <div className="content">
          <p className="muted">{error || 'Conectando à batalha...'}</p>
        </div>
      </div>
    );
  }

  const canStart = battle.mode === 'mestre' ? heroes.length >= 1 && enemies.length >= 1 : participants.length >= 2;
  const spellData = active?.spells?.length
    ? active.spells.map((id) => ({ id, data: gameData.spells[id] || null })).filter((s) => s.data)
    : [];

  return (
    <div className="page battle-page">
      <header className="topbar">
        <div>
          <h1>
            ⚔️ {battle.name}{' '}
            <span className={`status-chip status-${battle.status}`}>
              {battle.status === 'in_progress' ? 'Em andamento' : battle.status === 'finished' ? 'Finalizada' : 'Aguardando...'}
            </span>
          </h1>
        </div>
        <button className="ghost" onClick={leave}>
          ← Sair
        </button>
      </header>

      <div className="battle-layout">
        <div className="arena">
          {battle.mode === 'mestre' ? (
            <div className="mestre-arena">
              <div className="side-col heroes-col">
                <h3>Aventureiros</h3>
                <div className="team-chars">
                  {heroes.map((p) => (
                    <CharCard key={p.characterId} p={p} current={currentChar} gameData={gameData} selectTarget={() => setTargetId(p.characterId)} selected={targetId === p.characterId} />
                  ))}
                  {heroes.length === 0 && <p className="muted">Nenhum aventureiro ainda.</p>}
                </div>
              </div>
              <div className="side-col enemies-col">
                <h3>Inimigos <span className="muted small">(controlados pelo mestre)</span></h3>
                <div className="team-chars">
                  {enemies.map((p) => (
                    <CharCard key={p.characterId} p={p} current={currentChar} gameData={gameData} selectTarget={() => setTargetId(p.characterId)} selected={targetId === p.characterId} />
                  ))}
                  {enemies.length === 0 && <p className="muted">Nenhum inimigo ainda.</p>}
                </div>
              </div>
            </div>
          ) : battle.mode === 'equipes' ? (
            <div className="teams">
              {['A', 'B'].map((t) => (
                <div key={t} className="team-col">
                  <h3>Equipe {t}</h3>
                  <div className="team-chars">
                    {participants
                      .filter((p) => p.team === t)
                      .map((p) => (
                        <CharCard key={p.characterId} p={p} current={currentChar} gameData={gameData} selectTarget={() => setTargetId(p.characterId)} selected={targetId === p.characterId} />
                      ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="ff-grid">
              {participants.map((p) => (
                <CharCard key={p.characterId} p={p} current={currentChar} gameData={gameData} selectTarget={() => setTargetId(p.characterId)} selected={targetId === p.characterId} />
              ))}
            </div>
          )}

          {battle.mode === 'mestre' && isHost && battle.status === 'lobby' && (
            <div className="master-panel">
              <h4>Adicionar inimigos</h4>
              <div className="join-controls">
                <select value={monsterPick} onChange={(e) => setMonsterPick(e.target.value)}>
                  <option value="">Escolha um monstro...</option>
                  <optgroup label="Bestiário">
                    {Object.values(gameData.monsters || {}).map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.escalaChefe ? '☠️ ' : ''}{m.nome} (Nv.{m.nivel})
                      </option>
                    ))}
                  </optgroup>
                  {customMonsters.length > 0 && (
                    <optgroup label="Criados por você">
                      {customMonsters.map((m) => (
                        <option key={m.id} value={`custom_${m.id}`}>
                          {m.escala_chefe ? '☠️ ' : ''}{m.nome} (Nv.{m.nivel})
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
                <button onClick={addMonster} disabled={busy || !monsterPick}>
                  + Adicionar
                </button>
              </div>
              <div className="master-enemies">
                {enemies.map((e) => (
                  <span className="tag" key={e.characterId}>
                    {e.monsterName}
                    <button className="ghost remove-x" onClick={() => removeMonster(e.characterId)} disabled={busy}>
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {battle.status === 'lobby' && (
            <div className="lobby-banner">
              <p>
                Jogadores na sala: <strong>{participants.length}/20</strong>
              </p>
              {isHost ? (
                <button onClick={start} disabled={busy || !canStart}>
                  Começar Batalha
                </button>
              ) : (
                <p className="muted">Aguardando o anfitrião iniciar...</p>
              )}
              {battle.mode === 'mestre' && !canStart && (
                <p className="muted small">Precisa de ao menos 1 aventureiro e 1 inimigo.</p>
              )}
              {error && <div className="error">{error}</div>}
            </div>
          )}

          {battle.status === 'finished' && (
            <div className="win-banner">
              <h2>🏆 {battle.winner} venceu!</h2>
              <button className="ghost" onClick={onBackToSheets}>
                Ver minhas fichas
              </button>
            </div>
          )}
        </div>

        <aside className="side">
          <div className="panel battle-log-panel">
            <h2>Crônica da Batalha</h2>
            <div className="battle-log" ref={logRef}>
              {battle.log.map((l) => (
                <div key={l.id} className={`log-line log-${l.kind}`}>
                  {l.text}
                </div>
              ))}
            </div>
          </div>

          {battle.status === 'in_progress' && active && isMyTurn && (
            <div className="panel action-panel">
              <h2>
                {isMasterTurn ? `Turno do inimigo: ${active.charName}` : `Turno de ${active.charName}`}
              </h2>
              {isMasterTurn && <p className="muted small">Você é o mestre: decida a ação deste inimigo ao vivo.</p>}
              {error && <div className="error">{error}</div>}

              <div className="action-tabs">
                <button className={actionType === 'attack' ? 'active' : ''} onClick={() => setActionType('attack')}>
                  ⚔️ Ataque
                </button>
                <button className={actionType === 'magic' ? 'active' : ''} onClick={() => setActionType('magic')}>
                  ✨ Magia
                </button>
                <button className={actionType === 'item' ? 'active' : ''} onClick={() => setActionType('item')}>
                  🧪 Item
                </button>
                <button className={actionType === 'defense' ? 'active' : ''} onClick={() => setActionType('defense')}>
                  🛡️ Defesa
                </button>
                {!isMasterTurn && active && (active.ultimate || active.especial) && (
                  <button className={actionType === 'mega' ? 'active' : ''} onClick={() => setActionType('mega')}>
                    🔥 MEGA
                  </button>
                )}
              </div>

              {actionType === 'attack' && (
                <div className="action-body">
                  <TargetSelect targets={aliveTargets} value={targetId} onChange={setTargetId} />
                  <button onClick={doAttack} disabled={busy || !aliveTargets.length}>
                    Atacar
                  </button>
                </div>
              )}

              {actionType === 'magic' && active && (
                <div className="action-body">
                  <select value={spellId} onChange={(e) => setSpellId(e.target.value)}>
                    <option value="">Escolha a magia...</option>
                    {spellData.map(({ id, data }) => (
                      <option key={id} value={id} disabled={data.custo > active.mp}>
                        {data.nome} · MP {data.custo} {data.custo > active.mp ? '(MP insuficiente)' : ''}
                      </option>
                    ))}
                  </select>
                  {needsTarget(spellId, gameData.spells) && (
                    <TargetSelect targets={aliveTargets} value={targetId} onChange={setTargetId} />
                  )}
                  <button onClick={doMagic} disabled={busy || !spellId || (needsTarget(spellId, gameData.spells) && !targetId)}>
                    Conjurar
                  </button>
                </div>
              )}

              {actionType === 'item' && active && (
                <div className="action-body">
                  <select value={itemId} onChange={(e) => setItemId(e.target.value)}>
                    <option value="">Escolha o item...</option>
                    {(active.inventory || []).map((it, i) => (
                      <option key={i} value={it.id}>
                        {it.nome}
                      </option>
                    ))}
                  </select>
                  <button onClick={doItem} disabled={busy || !itemId || !(active.inventory || []).length}>
                    Usar
                  </button>
                </div>
              )}

              {actionType === 'defense' && (
                <div className="action-body">
                  <button onClick={doDefend} disabled={busy}>
                    🛡️ Defender (dano -50%)
                  </button>
                  <button onClick={doDodge} disabled={busy}>
                    💨 Esquivar (esquiva +)
                  </button>
                </div>
              )}

              {actionType === 'mega' && active && (
                <div className="action-body mega-actions">
                  <div className="mega-bars block">
                    <span className="bar-row">
                      <span className="bar-label">🔥 Ultimate</span>
                      <div className="bar-track">
                        <div className="bar-fill ult" style={{ width: `${active.ultimateBar || 0}%` }} />
                      </div>
                      <span className="bar-num">{Math.round(active.ultimateBar || 0)}%</span>
                    </span>
                    <span className="bar-row">
                      <span className="bar-label">💫 Especial</span>
                      <div className="bar-track">
                        <div className="bar-fill esp" style={{ width: `${active.especialBar || 0}%` }} />
                      </div>
                      <span className="bar-num">{Math.round(active.especialBar || 0)}%</span>
                    </span>
                  </div>

                  {active.ultimate && (
                    <>
                      <button
                        className="ghost"
                        onClick={() => act({ type: 'ultimate' })}
                        disabled={busy || (active.ultimateBar || 0) < 100 || active.ultimateMode}
                      >
                        {active.ultimateMode
                          ? `🔥 Modo Ultimate ativo (${active.ultimateModeTurns}t · dano +${Math.round((active.ultimateModeMult || 0) * 100)}%)`
                          : `🔥 Ativar Ultimate (${active.ultimate.nome})`}
                      </button>
                      {active.ultimateMode && !active.ultimateSkillUsed && (
                        <>
                          {megaNeedsTarget(active.ultimate) && (
                            <TargetSelect targets={aliveTargets} value={targetId} onChange={setTargetId} />
                          )}
                          <button
                            onClick={() => act({ type: 'ultimateSkill', targetId: targetId || null })}
                            disabled={busy || !aliveTargets.length || (megaNeedsTarget(active.ultimate) && !targetId)}
                          >
                            ⚡ Golpe Ultimate: {active.ultimate.nome}
                          </button>
                        </>
                      )}
                      {active.ultimateMode && active.ultimateSkillUsed && (
                        <p className="muted small">Golpe ultimate já usado nesta ativação.</p>
                      )}
                    </>
                  )}

                  {active.especial && (
                    <>
                      {megaNeedsTarget(active.especial) && (
                        <TargetSelect targets={aliveTargets} value={targetId} onChange={setTargetId} />
                      )}
                      <button
                        onClick={() => act({ type: 'especial', targetId: targetId || null })}
                        disabled={busy || (active.especialBar || 0) < 100 || !aliveTargets.length || (megaNeedsTarget(active.especial) && !targetId)}
                      >
                        💫 {active.especial.nome} (100%)
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {battle.status === 'in_progress' && (!active || !isMyTurn) && (
            <div className="panel">
              <p className="muted">
                {myChars.length || isMasterTurn
                  ? `Aguardando o turno de ${currentChar ? currentChar.charName : '...'}...`
                  : 'Você não está nesta batalha.'}
              </p>
              {error && <div className="error">{error}</div>}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function needsTarget(spellId, spells) {
  const s = spells[spellId];
  if (!s) return false;
  return s.tipo === 'ataque' || s.tipo === 'cura';
}

function TargetSelect({ targets, value, onChange }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Escolha o alvo...</option>
      {targets.map((t) => (
        <option key={t.characterId} value={t.characterId}>
          {t.charName} {t.isMonster ? `(${t.monsterName})` : ''} · HP {t.hp}/{t.hpMax}
        </option>
      ))}
    </select>
  );
}

function CharCard({ p, current, gameData, selectTarget, selected }) {
  const isCurrent = current && (current.characterId === p.characterId || current.uid === p.uid);
  const hpPct = (p.hp / p.hpMax) * 100;
  const icon = p.isMonster ? (p.isBoss ? BOSS_ICON : MONSTER_ICON) : CLASS_ICONS[p.cls] || '🧙';
  const label = p.isMonster ? p.monsterName : p.custom_class_name || gameData.classes?.[p.cls]?.nome;
  const races = !p.isMonster && Array.isArray(p.races) && p.races.length ? p.races : !p.isMonster && gameData.races?.[p.race] ? [gameData.races[p.race]] : [];
  return (
    <div
      className={['char-card battle-card', isCurrent ? 'current' : '', p.alive ? '' : 'dead', selected ? 'targeted' : '', p.isMonster ? 'monster-card' : '', p.isBoss ? 'boss-card' : ''].filter(Boolean).join(' ')}
      onClick={selectTarget}
    >
      <div className="battle-card-head">
        <span className="class-icon">{icon}</span>
        <div>
          <strong>{p.charName}</strong>
          <span className="tag">{label}</span>
          {races.map((r) => (
            <span className="tag" key={r.id || r.nome}>{r.nome}</span>
          ))}
          {p.isBoss && <span className="tag boss-tag">☠️ CHEFE</span>}
          {p.team && <span className="tag">Eq. {p.team}</span>}
          {isCurrent && <span className="tag current-tag">▶ Turno</span>}
        </div>
      </div>
      {p.alive ? (
        <>
          <StatBar label="HP" value={p.hp} max={p.hpMax} color="#e63946" />
          <StatBar label="MP" value={p.mp} max={p.mpMax} color="#4a90e2" />
          {p.ultimateMode && <span className="tag ult-mode-tag">🔥 Modo Ultimate ({p.ultimateModeTurns}t · +{Math.round((p.ultimateModeMult || 0) * 100)}%)</span>}
          {p.kills > 0 && <span className="tag">⚔️ {p.kills} abates</span>}
          {!p.isMonster && (
            <div className="mega-bars">
              <span className="bar-row">
                <span className="bar-label" title="Ultimate">🔥</span>
                <div className="bar-track">
                  <div className={`bar-fill ult${p.ultimateMode ? ' active' : ''}`} style={{ width: `${p.ultimateBar || 0}%` }} />
                </div>
                <span className="bar-num">{Math.round(p.ultimateBar || 0)}%</span>
              </span>
              <span className="bar-row">
                <span className="bar-label" title="Especial">💫</span>
                <div className="bar-track">
                  <div className={`bar-fill esp${(p.especialBar || 0) >= 100 ? ' ready' : ''}`} style={{ width: `${p.especialBar || 0}%` }} />
                </div>
                <span className="bar-num">{Math.round(p.especialBar || 0)}%</span>
              </span>
            </div>
          )}
        </>
      ) : (
        <div className="dead-label">☠️ Derrotado</div>
      )}
      {hpPct > 0 && (
        <div className="defense-badges">
          {p.defense && <span className="tag">🛡️</span>}
          {p.dodge && <span className="tag">💨</span>}
          {p.buffTurns > 0 && <span className="tag">🔮</span>}
          {(p.statuses || []).map((s) => {
            const def = gameData.statuses?.[s.id];
            return (
              <span className={`tag status-tag${s.id === 'congelamento' ? ' cc-tag' : ''}`} key={s.id} title={def?.desc || s.nome}>
                {def?.icon || '✦'} {s.nome}
                {s.turnos > 0 ? ` · ${s.turnos}t` : ''}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
