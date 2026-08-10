import { useEffect, useState } from 'react';
import { api, getSocket } from './api.js';
import Home from './pages/Home.jsx';
import Characters from './pages/Characters.jsx';
import Lobby from './pages/Lobby.jsx';
import Battle from './pages/Battle.jsx';
import Registry from './pages/Registry.jsx';

export default function App() {
  const [view, setView] = useState('home');
  const [player, setPlayer] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [customClasses, setCustomClasses] = useState([]);
  const [gameData, setGameData] = useState(null);
  const [battleId, setBattleId] = useState(null);

  useEffect(() => {
    api
      .getGameData()
      .then((d) => setGameData(d))
      .catch((e) => console.error(e));
    api
      .listCustomClasses()
      .then((d) => setCustomClasses(d.classes || []))
      .catch((e) => console.error(e));
    getSocket();
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('cbr_player');
    if (stored) {
      const p = JSON.parse(stored);
      setPlayer(p);
      api
        .listCharacters(p.id)
        .then((d) => {
          setCharacters(d.characters);
          setView('characters');
        })
        .catch(() => setView('home'));
    }
  }, []);

  const handleLogin = async (name) => {
    const { player: p } = await api.createPlayer(name);
    localStorage.setItem('cbr_player', JSON.stringify(p));
    localStorage.setItem('cbr_player_name', p.name);
    setPlayer(p);
    const d = await api.listCharacters(p.id);
    setCharacters(d.characters);
    setView('characters');
  };

  const refreshCharacters = async () => {
    const d = await api.listCharacters(player.id);
    setCharacters(d.characters);
  };

  const handleLogout = () => {
    localStorage.removeItem('cbr_player');
    localStorage.removeItem('cbr_player_name');
    setPlayer(null);
    setCharacters([]);
    setView('home');
  };

  if (!gameData) {
    return <div className="loading">Carregando o Campo de Batalha...</div>;
  }

  if (view === 'home') {
    return <Home onLogin={handleLogin} />;
  }

  if (view === 'characters') {
    return (
      <Characters
        player={player}
        characters={characters}
        gameData={gameData}
        customClasses={customClasses}
        onRefresh={refreshCharacters}
        onEnterLobby={() => setView('lobby')}
        onOpenRegistry={() => setView('registry')}
        onLogout={handleLogout}
      />
    );
  }

  if (view === 'registry') {
    return <Registry player={player} gameData={gameData} onBack={() => setView('characters')} />;
  }

  if (view === 'lobby') {
    return (
      <Lobby
        player={player}
        characters={characters}
        onBack={() => setView('characters')}
        onOpenBattle={(id) => setBattleId(id)}
        onEnterBattle={() => setView('battle')}
      />
    );
  }

  return (
    <Battle
      battleId={battleId}
      player={player}
      gameData={gameData}
      onExit={() => {
        setView('lobby');
        setBattleId(null);
      }}
      onBackToSheets={() => setView('characters')}
    />
  );
}
