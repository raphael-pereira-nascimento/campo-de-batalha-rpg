import { useEffect, useState } from 'react';
import { api, getSocket, getPlayer, getToken, logout, isOffline } from './api.js';
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
  const [gameDataError, setGameDataError] = useState(false);
  const [battleId, setBattleId] = useState(null);
  const [offlineMode, setOfflineMode] = useState(isOffline());

  useEffect(() => {
    api
      .getGameData()
      .then((d) => setGameData(d))
      .catch((e) => {
        console.error(e);
        setGameDataError(true);
      });
    api
      .listCustomClasses()
      .then((d) => setCustomClasses(d.classes || []))
      .catch(() => {});

    if (!isOffline()) {
      try { getSocket(); } catch (_) {}
    }
  }, []);

  useEffect(() => {
    const stored = getPlayer();
    if (stored) {
      setPlayer(stored);
      api
        .listCharacters(stored.id)
        .then((d) => {
          setCharacters(d.characters);
          setView('characters');
        })
        .catch(() => {
          if (getToken() && !isOffline()) {
            logout();
            setView('home');
          }
        });
    }
  }, []);

  const handleLogin = async (name, password) => {
    const { player, token } = await api.createPlayer(name, password);
    setPlayer(player);
    localStorage.setItem('cbr_player_name', player.name);
    localStorage.setItem('cbr_token', token);
    const d = await api.listCharacters(player.id);
    setCharacters(d.characters);
    setView('characters');
    return { player, token };
  };

  const refreshCharacters = async () => {
    const d = await api.listCharacters(player.id);
    setCharacters(d.characters);
  };

  const handleLogout = () => {
    logout();
    setPlayer(null);
    setCharacters([]);
    setView('home');
  };

  if (!gameData) {
    if (gameDataError) {
      return (
        <div className="loading">
          <p>Não foi possível carregar os dados do jogo.</p>
          {!isOffline() && (
            <p className="muted">Verifique se o servidor está rodando.</p>
          )}
          <button
            onClick={() => {
              setGameDataError(false);
              api
                .getGameData()
                .then((d) => setGameData(d))
                .catch(() => setGameDataError(true));
            }}
          >
            Tentar novamente
          </button>
          {!isOffline() && (
            <button
              className="ghost"
              onClick={() => window.location.reload()}
              style={{ marginTop: 8 }}
            >
              Recarregar página
            </button>
          )}
        </div>
      );
    }
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
        gameData={gameData}
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
