import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api, getSocket, emitAck, isOffline, applyOfflineRewards } from '../api.js';
import StatBar from '../components/StatBar.jsx';
import { playLogKind, play, isMuted, toggleMute } from '../utils/sfx.js';
import { VOO, ALTITUDES } from '../game/sistema.js';

const CLASS_ICONS = { guerreiro: '🛡️', mago: '🔮', arqueiro: '🏹', clerigo: '✝️', assassino: '🗡️', paladino: '⚔️' };
const MONSTER_ICON = '👾';
const BOSS_ICON = '👹';
const TURN_SECONDS = 45;

export default function Battle({ battleId, player, gameData, onExit, onBackToSheets }) {
  const [battle, setBattle] = useState(null);
  const [error, setError] = useState('');
  const [targetId, setTargetId] = useState('');
  const [spellId, setSpellId] = useState('');
  const [itemId, setItemId] = useState('');
  const [actionType, setActionType] = useState('attack');
  const [busy, setBusy] = useState(false);
  const [monsterPick, setMonsterPick] = useState('');
  const [chefeDinamico, setChefeDinamico] = useState(false);
  const [customMonsters, setCustomMonsters] = useState([]);
  const [timelineOffset, setTimelineOffset] = useState(0);
  const [floats, setFloats] = useState([]);
  const [secondsLeft, setSecondsLeft] = useState(TURN_SECONDS);
  const [muted, setMuted] = useState(isMuted());
  const logRef = useRef(null);
  const hpPrevRef = useRef({});
  const floatIdRef = useRef(0);

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

  // Números flutuantes: compara HP antes/depois a cada atualização da batalha.
  const registerFloat = useCallback((key, delta) => {
    floatIdRef.current += 1;
    const f = { id: floatIdRef.current, key, delta };
    setFloats((prev) => [...prev.slice(-12), f]);
    setTimeout(() => setFloats((prev) => prev.filter((x) => x.id !== f.id)), 1500);
  }, []);

  useEffect(() => {
    if (!battle?.participants) return;
    const prev = hpPrevRef.current;
    for (const p of battle.participants) {
      const key = p.characterId || p.uid;
      if (key == null || !p.alive && p.hp === 0 && prev[key] === undefined) {
        if (key != null) prev[key] = 0;
        continue;
      }
      if (key == null) continue;
      const old = prev[key];
      if (old !== undefined && old !== p.hp) registerFloat(key, p.hp - old);
      prev[key] = p.hp;
    }
  }, [battle, registerFloat]);

  const participants = battle?.participants || [];
  const currentIdx = battle?.turnOrder?.[battle.currentTurnIndex];
  const currentChar = currentIdx !== undefined ? participants[currentIdx] : null;
  const isHost = battle?.host === player.id;
  const isMasterTurn = battle?.mode === 'mestre' && !!currentChar?.isMonster && isHost;
  const currentIsMine = !!currentChar && currentChar.playerId === player.id;
  const isMyTurn = currentIsMine || isMasterTurn;

  // A linha do tempo destaca a posição avançada localmente; resetamos o
  // deslocamento sempre que o turno real do servidor muda.
  useEffect(() => {
    setTimelineOffset(0);
  }, [battle?.turno, battle?.currentTurnIndex]);

  const nextTimeline = () => {
    if (!battle?.turnOrder?.length) return;
    setTimelineOffset((o) => (o + 1) % battle.turnOrder.length);
  };

  // Timer de turno: se o tempo acabar, o personagem defende automaticamente.
  const turnKey = battle?.status === 'in_progress' && isMyTurn ? `${battle.turno}-${battle.currentTurnIndex}` : null;

  useEffect(() => {
    if (!turnKey) return;
    setSecondsLeft(TURN_SECONDS);
    const t = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(t);
          act({ type: 'defend' });
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turnKey]);

  // Sons: ao detectar novas linhas de log, toca o som correspondente ao 'kind'.
  const logLenPrevRef = useRef(0);
  useEffect(() => {
    if (!battle?.log) return;
    const prev = logLenPrevRef.current;
    if (battle.log.length > prev) {
      for (let i = prev; i < battle.log.length; i++) playLogKind(battle.log[i].kind);
      logLenPrevRef.current = battle.log.length;
    }
  }, [battle?.log?.length]);

  // Som de vitória ao fim da batalha.
  const prevStatusRef = useRef(null);
  useEffect(() => {
    if (!battle) return;
    const prev = prevStatusRef.current;
    if (prev === 'in_progress' && battle.status === 'finished') play('victory');
    prevStatusRef.current = battle.status;
  }, [battle]);

  const myChars = useMemo(() => participants.filter((p) => p.playerId === player.id), [participants, player.id]);
  const active = currentIsMine ? currentChar : isMasterTurn ? currentChar : myChars[0];

  const heroes = useMemo(() => participants.filter((p) => !p.isMonster), [participants]);
  const enemies = useMemo(() => participants.filter((p) => p.isMonster), [participants]);
  const teamA = useMemo(() => participants.filter((p) => p.team === 'A'), [participants]);
  const teamB = useMemo(() => participants.filter((p) => p.team === 'B'), [participants]);

  // Formação estilo Final Fantasy: dois lados frente a frente.
  // No modo livre (sem lados), todos ficam lado a lado em uma linha única.
  const formation = useMemo(() => {
    if (!battle) return null;
    if (battle.mode === 'mestre') {
      return {
        left: { label: '👹 Inimigos', fighters: enemies },
        right: { label: '🛡️ Aventureiros', fighters: heroes },
      };
    }
    if (battle.mode === 'equipes') {
      return {
        left: { label: '⚔️ Equipe B', fighters: teamB },
        right: { label: '🛡️ Equipe A', fighters: teamA },
      };
    }
    return null;
  }, [battle, heroes, enemies, teamA, teamB]);

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
      const result = await emitAck('battleAction', {
        battleId,
        characterId: active.characterId,
        playerId: player.id,
        action: payload,
      });
      if (result.battle) setBattle(result.battle);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const doAttack = () => act({ type: 'attack', targetId: targetId || aliveTargets[0]?.characterId });
  const doDefend = () => act({ type: 'defend' });
  const doDodge = () => act({ type: 'dodge' });
  const doVoo = (dir) => act({ type: 'voo', dir });
  const doMagic = () => {
    if (!spellId) return;
    act({ type: 'magic', spellId, targetId: targetId || null });
  };
  const doItem = () => act({ type: 'useItem', itemId });

  const start = async () => {
    setBusy(true);
    setError('');
    try {
      const result = await emitAck('startBattle', { battleId, playerId: player.id });
      if (result.battle) setBattle(result.battle);
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
      const result = await emitAck('addMonster', {
        battleId,
        playerId: player.id,
        monsterId: isCustom ? undefined : monsterPick,
        customMonsterId: isCustom ? monsterPick.slice(7) : undefined,
        modoChefeDinamico: chefeDinamico,
      });
      if (result.battle) setBattle(result.battle);
      setMonsterPick('');
      setChefeDinamico(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const toggleDrunk = async (p) => {
    if (!p || p.isMonster) return;
    setBusy(true);
    setError('');
    try {
      const result = await emitAck('toggleDrunk', {
        battleId,
        participantId: p.characterId || p.uid,
      });
      if (result.battle) setBattle(result.battle);
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
            {isHost && battle.hostRole === 'mestre' && <span className="tag">👁️ Somente Mestre</span>}
            {isHost && battle.hostRole === 'mestre_jogador' && <span className="tag">👑 Mestre Jogador</span>}
          </h1>
        </div>
        <button className="ghost" onClick={leave}>
          ← Sair
        </button>
        <button
          className="ghost sfx-toggle"
          onClick={() => { const m = toggleMute(); setMuted(m); }}
          title={muted ? 'Ativar som' : 'Silenciar'}
        >
          {muted ? '🔇' : '🔊'}
        </button>
      </header>

      {battle.eclipse && <EclipseBanner eclipse={battle.eclipse} dungeonId={battle.dungeonId} />}

      <div className="battle-layout">
        <div className="arena">
          {battle.status === 'in_progress' && battle.turnOrder?.length > 0 && (
            <InitiativeTimeline
              participants={participants}
              turnOrder={battle.turnOrder}
              currentTurnIndex={battle.currentTurnIndex}
              offset={timelineOffset}
              onNext={nextTimeline}
            />
          )}

          {formation ? (
            <div className="ff-stage">
              <FfSide
                side={formation.left}
                mirrored
                current={currentChar}
                gameData={gameData}
                selectedId={targetId}
                floats={floats}
                onSelect={(id) => setTargetId(id)}
                onToggleDrunk={toggleDrunk}
              />
              <div className="ff-divider" aria-hidden="true">⚔️</div>
              <FfSide
                side={formation.right}
                current={currentChar}
                gameData={gameData}
                selectedId={targetId}
                floats={floats}
                onSelect={(id) => setTargetId(id)}
                onToggleDrunk={toggleDrunk}
              />
            </div>
          ) : (
            <div className="ff-lineup">
              {participants.map((p, i) => (
                <FfFighter
                  key={p.characterId}
                  p={p}
                  index={i}
                  current={currentChar}
                  gameData={gameData}
                  floats={floats}
                  selected={targetId === p.characterId}
                  selectTarget={() => setTargetId(p.characterId)}
                  onToggleDrunk={toggleDrunk}
                />
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
                <label className="check-label inline chefe-toggle">
                  <input
                    type="checkbox"
                    checked={chefeDinamico}
                    onChange={(e) => setChefeDinamico(e.target.checked)}
                  />
                  ☠️ Modo Chefe Dinâmico
                  <span className="chefe-hint">
                    HP = soma do HP dos jogadores × 2.0 · ações por nº de jogadores
                  </span>
                </label>
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
            <VictoryPanel battle={battle} player={player} onExit={onBackToSheets} />
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

          {battle.status === 'in_progress' && (
            <QuickChat battle={battle} player={player} />
          )}

          {battle.status === 'in_progress' && active && isMyTurn && (
            <div className="panel action-panel">
              <h2>
                {isMasterTurn ? `Turno do inimigo: ${active.charName}` : `Turno de ${active.charName}`}
              </h2>
              <div className="turn-timer">
                <span className={`turn-timer-clock${secondsLeft <= 10 ? ' urgent' : ''}`}>
                  ⏱ {secondsLeft}s
                </span>
                <div className="turn-timer-track">
                  <div
                    className="turn-timer-fill"
                    style={{ width: `${Math.max(0, (secondsLeft / TURN_SECONDS) * 100)}%` }}
                  />
                </div>
              </div>
              <p className="muted small">O tempo acabou? O personagem defende automaticamente.</p>
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
                  {active && (
                    <div className="voo-actions">
                      <p className="muted small">
                        {active.voando
                          ? `🕊️ No ar — altitude ${active.altitude} (${active.vooTipo === 'natural' ? 'voo natural' : 'voo mágico'}). Voo não dá esquiva automática: attacks sem alcance vertical não te acertam.`
                          : 'Voo não concede invulnerabilidade: apenas define a altitude e o alcance dos ataques.'}
                      </p>
                      {active.voando ? (
                        <>
                          <button onClick={() => doVoo('subir')} disabled={busy || (active.altitude || 0) >= ALTITUDES.alto}>
                            ⬆️ Subir
                          </button>
                          <button onClick={() => doVoo('descer')} disabled={busy}>
                            ⬇️ Descer
                          </button>
                          <button onClick={() => doVoo('aterrissar')} disabled={busy}>
                            🛬 Aterrissar
                          </button>
                        </>
                      ) : (
                        <button onClick={() => doVoo('subir')} disabled={busy || active.mp < VOO.manaSubida}>
                          🕊️ Decolar {active.vooNatural ? '(voo natural)' : `(${VOO.manaSubida} MP)`}
                        </button>
                      )}
                    </div>
                  )}
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
                {isHost && battle.mode === 'mestre' && myChars.length === 0
                  ? `👁️ Você é o Somente Mestre: aguardando o combate entre os aventureiros e seus inimigos${currentChar ? ` — vez de ${currentChar.charName}` : ''}.`
                  : myChars.length || isMasterTurn
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

// Linha do Tempo de Iniciativa: mostra os combatentes na ordem exata do turno.
// O destaque começa no turno atual (currentTurnIndex) e o botão "Próximo Turno"
// o avança localmente pela lista (offset), até o servidor mudar de turno.
function InitiativeTimeline({ participants, turnOrder, currentTurnIndex, offset, onNext }) {
  const base = currentTurnIndex != null ? currentTurnIndex % turnOrder.length : 0;
  const activePos = (base + offset) % turnOrder.length;

  const unit = (idx) => {
    const p = participants[idx];
    if (!p) return null;
    const icon = p.isMonster ? (p.isBoss ? BOSS_ICON : MONSTER_ICON) : CLASS_ICONS[p.cls] || '🧙';
    return { p, icon };
  };

  return (
    <div className="initiative-timeline">
      <span className="timeline-title" title="Linha do Tempo de Iniciativa">📋</span>
      <div className="timeline-track">
        {turnOrder.map((idx, i) => {
          const u = unit(idx);
          if (!u) return null;
          const isActive = i === activePos;
          return (
            <div
              key={idx + '-' + i}
              className={`timeline-node${isActive ? ' active' : ''}${u.p.drunk ? ' drunk' : ''}${u.p.alive ? '' : ' dead'}`}
              title={`${u.p.charName}${u.p.drunk ? ' (bêbado)' : ''}`}
            >
              <span className="timeline-icon">{u.icon}</span>
              <span className="timeline-name">{u.p.charName}</span>
            </div>
          );
        })}
      </div>
      <button className="timeline-next" onClick={onNext} title="Mover destaque para o próximo turno">
        Próximo ▶
      </button>
    </div>
  );
}

function FfSide({ side, mirrored, current, gameData, selectedId, floats, onSelect, onToggleDrunk }) {
  return (
    <div className={`ff-side${mirrored ? ' enemies-side' : ''}`}>
      <h3 className="ff-side-label">{side.label}</h3>
      <div className="ff-row">
        {side.fighters.map((p, i) => (
          <FfFighter
            key={p.characterId}
            p={p}
            index={i}
            mirrored={mirrored}
            current={current}
            gameData={gameData}
            floats={floats}
            selected={selectedId === p.characterId}
            selectTarget={() => onSelect(p.characterId)}
            onToggleDrunk={onToggleDrunk}
          />
        ))}
        {side.fighters.length === 0 && <p className="muted small">Aguardando combatentes...</p>}
      </div>
    </div>
  );
}

const QUICK_PHRASES = [
  { id: 'grito', text: 'Grito de Guerra! 💥' },
  { id: 'curar', text: 'Preciso de cura! 💚' },
  { id: 'foco', text: 'Foco! 🎯' },
  { id: 'atacar', text: 'Ataquem juntos! ⚔️' },
  { id: 'cuidado', text: 'Cuidado! 🛡️' },
  { id: 'obrigado', text: 'Obrigado! 🤝' },
  { id: 'trocar', text: 'Vamos trocar de alvo! 🔄' },
  { id: 'rir', text: 'Hahaha! 😄' },
  { id: 'desafio', text: 'Isso é tudo que tem? 😤' },
  { id: 'rendicao', text: 'Não desista! 💪' },
];

function QuickChat({ battle, player }) {
  const send = (phrase) => {
    getSocket().emit('quickChat', { battleId: battle.id, phrase: phrase.text });
  };

  useEffect(() => {
    const socket = getSocket();
    const handler = (data) => {
      const charName = data.charName || data.playerName || '???';
      battle.log.push({ id: Date.now() + Math.random(), kind: 'chat', text: `💬 ${charName}: "${data.phrase}"` });
    };
    socket.on('quickChatMessage', handler);
    return () => socket.off('quickChatMessage', handler);
  }, [battle]);

  return (
    <div className="quick-chat-bar">
      {QUICK_PHRASES.map((p) => (
        <button key={p.id} className="quick-chat-bubble" onClick={() => send(p)} title={p.text}>
          {p.text}
        </button>
      ))}
    </div>
  );
}

function EclipseBanner({ eclipse, dungeonId }) {
  if (!eclipse) return null;
  const forte = eclipse.eclipseAtivo;
  const classe = forte ? 'eclipse-banner forte' : eclipse.sinais ? 'eclipse-banner sinais' : 'eclipse-banner';
  return (
    <div className={classe}>
      <span className="eclipse-icon">{eclipse.icon}</span>
      <span className="eclipse-txt">
        <strong>
          {eclipse.tipoNome} · {eclipse.nome}
        </strong>
        {forte ? (
          <span className="eclipse-mults">
            {' '}Monstros +{Math.round((eclipse.monstroMult - 1) * 100)}% · Chefes +{Math.round((eclipse.chefeMult - 1) * 100)}% · XP
            +{Math.round((eclipse.xpMult - 1) * 100)}%
          </span>
        ) : (
          <span className="eclipse-mults">
            {' '}faltam {eclipse.diasParaEclipse} dia(s) para o Eclipse
          </span>
        )}
        {dungeonId && <span className="tag">🗺️ Dungeon</span>}
      </span>
    </div>
  );
}

function VictoryPanel({ battle, player, onExit }) {
  const rewardsRef = useRef(false);
  const winners = (battle.participants || []).filter((p) => p.alive && !p.isMonster);

  // Aplica recompensas uma única vez ao montar (offline: salva no localStorage).
  useEffect(() => {
    if (rewardsRef.current) return;
    rewardsRef.current = true;
    if (!isOffline()) return;
    for (const p of winners) {
      if (p.playerId === player.id) {
        applyOfflineRewards(p.characterId, p.xpGained || 0, p.kills || 0);
      }
    }
  }, [winners, player.id]);

  return (
    <div className="panel victory-panel">
      <h2>🏆 {battle.winner} venceu!</h2>
      {battle.xpPool > 0 && <p className="muted small">Pool de XP: {battle.xpPool} (dividido por participação)</p>}
      <div className="reward-list">
        {winners.map((p) => {
          const coins = 100 + (p.kills || 0) * 25;
          return (
            <div key={p.characterId} className="reward-row">
              <span className="reward-name">{p.charName}</span>
              <span className="reward-tag reward-xp">+{p.xpGained || 0} XP</span>
              {p.xpShare != null && <span className="reward-tag">📊 {p.xpShare}%</span>}
              <span className="reward-tag reward-coins">+{coins} ℛ</span>
              {p.kills > 0 && <span className="reward-tag">⚔️ {p.kills} abate{p.kills > 1 ? 's' : ''}</span>}
            </div>
          );
        })}
      </div>
      <button onClick={onExit} style={{ marginTop: 12 }}>Ver minhas fichas</button>
    </div>
  );
}

function FfFighter({ p, index, mirrored, current, gameData, floats = [], selected, selectTarget, onToggleDrunk }) {
  const isCurrent = !!current && (current.characterId === p.characterId || current.uid === p.uid);
  const icon = p.isMonster ? (p.isBoss ? BOSS_ICON : MONSTER_ICON) : CLASS_ICONS[p.cls] || '🧙';
  const myFloats = floats.filter((f) => f.key === (p.characterId || p.uid));
  const races =
    !p.isMonster && Array.isArray(p.races) && p.races.length
      ? p.races
      : !p.isMonster && gameData.races?.[p.race]
        ? [gameData.races[p.race]]
        : [];
  return (
    <div
      className={[
        'ff-fighter',
        isCurrent ? 'current' : '',
        p.alive ? '' : 'dead',
        selected ? 'targeted' : '',
        p.isMonster ? 'monster' : '',
        p.isBoss ? 'boss' : '',
      ].filter(Boolean).join(' ')}
      onClick={selectTarget}
    >
      <span className="ff-turn-arrow" aria-hidden="true">▼</span>
      <span className={`ff-sprite${mirrored ? ' mirrored' : ''}`} style={{ animationDelay: `${(index % 5) * -0.6}s` }}>
        {icon}
      </span>
      <strong className="ff-name">
        {!p.isMonster && p.gender && (
          <span className="gender-icon" title={p.gender === 'feminino' ? 'Feminino' : 'Masculino'}>
            {p.gender === 'feminino' ? '♀' : '♂'}
          </span>
        )}
        {p.charName}
      </strong>
      {myFloats.map((f) => (
        <span key={f.id} className={`float-num ${f.delta >= 0 ? 'float-heal' : 'float-dmg'}`}>
          {f.delta > 0 ? `+${f.delta}` : f.delta}
        </span>
      ))}
      {p.isBoss && <span className="tag boss-tag">☠️ CHEFE</span>}
      {p.team && <span className="tag">Eq. {p.team}</span>}
      {isCurrent && <span className="tag current-tag">▶ Turno</span>}
      {p.voando && (
        <span className="tag voo-tag" title="Voo não dá invulnerabilidade: define a altitude e o alcance vertical dos ataques.">
          🕊️ Alt. {p.altitude}
          {p.vooTipo === 'natural' ? ' (natural)' : ' (mágico)'}
        </span>
      )}
      {p.horda && (
        <span className="tag horda-tag" title="Horda: cada corpo tem a própria vida e vale XP individual.">
          👥 {p.horda.quantidade}/{p.horda.inicial}
        </span>
      )}
      {p.eclipse && <span className="tag eclipse-tag" title="Monstro fortalecido pelo Eclipse.">🩸 Eclipse</span>}
      {p.alive ? (
        <>
          <StatBar label="HP" value={p.hp} max={p.hpMax} color="#e63946" />
          {!p.isMonster && <StatBar label="MP" value={p.mp} max={p.mpMax} color="#4a90e2" />}
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
          {races.map((r) => (
            <span className="tag" key={r.id || r.nome}>{r.nome}</span>
          ))}
          {p.ultimateMode && <span className="tag ult-mode-tag">🔥 Ultimate ({p.ultimateModeTurns}t)</span>}
          {p.kills > 0 && <span className="tag">⚔️ {p.kills}</span>}
          <div className="ff-badges">
            {p.defense && <span className="tag">🛡️</span>}
            {p.dodge && <span className="tag">💨</span>}
            {p.drunk && <span className="tag drunk-tag">🍺 Bêbado</span>}
            {(p.statuses || []).map((s) => {
              const def = gameData.statuses?.[s.id];
              return (
                <span className={`tag status-tag${s.id === 'congelamento' ? ' cc-tag' : ''}`} key={s.id} title={def?.desc || s.nome}>
                  {def?.icon || '✦'}{s.turnos > 0 ? ` ${s.turnos}t` : ''}
                </span>
              );
            })}
            {!p.isMonster && onToggleDrunk && (
              <button
                className={`drunk-toggle${p.drunk ? ' on' : ''}`}
                onClick={(e) => { e.stopPropagation(); onToggleDrunk(p); }}
                title="Alternar status Bêbado (+1 Força, -1 Destreza e Reflexo)"
              >
                🍺{p.drunk ? ' ON' : ' OFF'}
              </button>
            )}
          </div>
        </>
      ) : (
        <div className="dead-label">☠️ Derrotado</div>
      )}
    </div>
  );
}
