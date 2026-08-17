import { useEffect, useRef, useState } from 'react';
import { getSocket, emitAck, isOffline } from '../api.js';
import { MONSTERS } from '../game/monsters.js';

export default function Lobby({ player, characters, gameData, onBack, onOpenBattle, onEnterBattle }) {
  const [battles, setBattles] = useState([]);
  const [name, setName] = useState('');
  const [mode, setMode] = useState('todos');
  const [charId, setCharId] = useState(characters[0]?.id || '');
  const [joinCharId, setJoinCharId] = useState(characters[0]?.id || '');
  const [team, setTeam] = useState('A');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [soloMonster, setSoloMonster] = useState('manequim');
  const [soloCount, setSoloCount] = useState(1);

  useEffect(() => {
    if (isOffline()) return;
    const socket = getSocket();
    const onLobby = (list) => setBattles(list);
    socket.on('lobbyUpdate', onLobby);
    socket.emit('joinLobby');
    return () => {
      socket.off('lobbyUpdate', onLobby);
    };
  }, []);

  useEffect(() => {
    if (characters[0] && !charId) setCharId(characters[0].id);
    if (characters[0] && !joinCharId) setJoinCharId(characters[0].id);
  }, [characters, charId, joinCharId]);

  const create = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const character = characters.find((c) => c.id === charId);
      if (isOffline()) {
        const ack = await emitAck('createBattle', {
          name: name || 'Batalha Solo',
          mode: 'mestre',
          playerId: player.id,
          character,
        });
        onOpenBattle(ack.battleId);
        onEnterBattle();
      } else {
        const ack = await emitAck('createBattle', {
          name,
          mode,
          playerId: player.id,
          characterId: charId,
        });
        onOpenBattle(ack.battleId);
        onEnterBattle();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const startSolo = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const character = characters.find((c) => c.id === charId);
      if (!character) { setError('Selecione um personagem.'); setBusy(false); return; }

      const ack = await emitAck('createBattle', {
        name: 'Batalha Solo',
        mode: 'mestre',
        playerId: player.id,
        character,
      });

      for (let i = 0; i < soloCount; i++) {
        await emitAck('addMonster', { monsterId: soloMonster });
      }

      await emitAck('startBattle', {});
      onOpenBattle(ack.battleId);
      onEnterBattle();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const join = async (battleId, selectedTeam) => {
    setBusy(true);
    setError('');
    try {
      const ack = await emitAck('joinBattle', {
        battleId,
        playerId: player.id,
        characterId: joinCharId,
        team: battleMode(battleId) === 'equipes' ? selectedTeam : null,
      });
      onOpenBattle(ack.battleId);
      onEnterBattle();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const battleMode = (id) => battles.find((b) => b.id === id)?.mode || 'todos';

  const monsterList = Object.values(MONSTERS);

  return (
    <div className="page">
      <header className="topbar">
        <div>
          <h1>Campo de Batalha</h1>
          <span className="player-name">Jogador: {player.name}</span>
          {isOffline() && <span className="tag">Modo Offline</span>}
        </div>
        <button className="ghost" onClick={onBack}>
          ← Minhas Fichas
        </button>
      </header>

      <div className="content lobby-grid">
        {isOffline() ? (
          <>
            <section className="panel">
              <h2>Batalha Solo</h2>
              <p className="muted small">Enfrente monstros sem servidor!</p>
              <form onSubmit={startSolo} className="stack">
                <label>
                  Seu personagem
                  <select value={charId} onChange={(e) => setCharId(e.target.value)}>
                    {characters.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} (Nv.{c.level})
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Monstro
                  <select value={soloMonster} onChange={(e) => setSoloMonster(e.target.value)}>
                    {monsterList.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.escalaChefe ? '☠️ ' : ''}{m.nome} (Nv.{m.nivel})
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Quantidade
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={soloCount}
                    onChange={(e) => setSoloCount(Math.max(1, Math.min(5, +e.target.value)))}
                  />
                </label>
                {error && <div className="error">{error}</div>}
                <button type="submit" disabled={busy || !charId}>
                  ⚔️ Lutar!
                </button>
              </form>
            </section>
          </>
        ) : (
          <>
            <section className="panel">
              <h2>Criar batalha</h2>
              <form onSubmit={create} className="stack">
                <label>
                  Nome da batalha
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Arena de Ferro" maxLength={30} />
                </label>
                <label>
                  Modo
                  <select value={mode} onChange={(e) => setMode(e.target.value)}>
                    <option value="todos">Todos contra todos</option>
                    <option value="equipes">2 Equipes (A × B)</option>
                    <option value="mestre">Mestre vs Jogadores</option>
                  </select>
                </label>
                {mode === 'mestre' && (
                  <p className="muted small">
                    Você será o <strong>Mestre</strong>: controla os inimigos ao vivo e também luta com seu personagem.
                  </p>
                )}
                <label>
                  Seu personagem
                  <select value={charId} onChange={(e) => setCharId(e.target.value)}>
                    {characters.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} (Nv.{c.level})
                      </option>
                    ))}
                  </select>
                </label>
                {error && <div className="error">{error}</div>}
                <button type="submit" disabled={busy || !charId}>
                  Criar e Entrar
                </button>
              </form>
            </section>

            <section className="panel">
              <h2>Batalhas abertas ({battles.length})</h2>
              {battles.length === 0 && <p className="muted">Nenhuma batalha aberta. Crie uma acima!</p>}
              <div className="battle-list">
                {battles.map((b) => (
                  <div className="battle-row" key={b.id}>
                    <div>
                      <strong>{b.name}</strong>
                      <span className="tag">{b.mode === 'equipes' ? 'Equipes A×B' : b.mode === 'mestre' ? 'Mestre vs Jogadores' : 'Todos contra todos'}</span>
                      <span className="tag">
                        {b.players}/20 jogadores
                      </span>
                      <span className="tag">Anfitrião: {b.hostName}</span>
                      <span className={`tag status-${b.status}`}>
                        {b.status === 'lobby' ? 'Aberto' : b.status === 'in_progress' ? 'Em andamento' : 'Finalizada'}
                      </span>
                    </div>
                    {b.status === 'lobby' ? (
                      <div className="join-controls">
                        {b.mode === 'equipes' && (
                          <select value={team} onChange={(e) => setTeam(e.target.value)}>
                            <option value="A">Equipe A</option>
                            <option value="B">Equipe B</option>
                          </select>
                        )}
                        <select value={joinCharId} onChange={(e) => setJoinCharId(e.target.value)}>
                          {characters.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                        <button onClick={() => join(b.id, team)} disabled={busy || !joinCharId}>
                          Entrar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          onOpenBattle(b.id);
                          onEnterBattle();
                        }}
                      >
                        {b.status === 'in_progress' ? 'Voltar à batalha' : 'Ver resultado'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
