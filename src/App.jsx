import { Suspense, lazy, useEffect, useState } from 'react';
import { api, getSocket, getPlayer, getToken, logout, isOffline } from './api.js';
import Home from './pages/Home.jsx';
import Characters from './pages/Characters.jsx';

const Lobby = lazy(() => import('./pages/Lobby.jsx'));
const Battle = lazy(() => import('./pages/Battle.jsx'));
const Registry = lazy(() => import('./pages/Registry.jsx'));
const Compendium = lazy(() => import('./pages/Compendium.jsx'));
const Rules = lazy(() => import('./pages/Rules.jsx'));
const TableBattle = lazy(() => import('./pages/TableBattle.jsx'));
const GemForge = lazy(() => import('./pages/GemForge.jsx'));
const ToolShop = lazy(() => import('./pages/ToolShop.jsx'));

export default function App() {
  const [view, setView] = useState('home');
  const [player, setPlayer] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [customClasses, setCustomClasses] = useState([]);
  const [gameData, setGameData] = useState(null);
  const [gameDataError, setGameDataError] = useState(false);
  const [battleId, setBattleId] = useState(null);
  const [offlineMode, setOfflineMode] = useState(isOffline());
  const [walletCents, setWalletCents] = useState(0);

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

  const abrirToolShop = async () => {
    try {
      const d = await api.getWallet();
      const cents = d && d.wallet && typeof d.wallet === 'object' ? d.wallet.cents : Number(d?.wallet) || 0;
      setWalletCents(cents);
    } catch (_) {
      // mantém o valor atual da carteira
    }
    setView('toolShop');
  };

  const handleToolBuy = (_ferramenta, preco) => {
    setWalletCents((c) => Math.max(0, c - preco));
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
        onOpenCompendium={() => setView('compendium')}
        onOpenRules={() => setView('rules')}
        onOpenGemForge={() => setView('gemForge')}
        onOpenToolShop={abrirToolShop}
        onOpenTableBattle={() => setView('tableBattle')}
        onLogout={handleLogout}
      />
    );
  }

  if (view === 'registry') {
    return <Suspense fallback={<div className="loading">Carregando...</div>}>
      <Registry player={player} gameData={gameData} onBack={() => setView('characters')} />
    </Suspense>;
  }

  if (view === 'compendium') {
    return <Suspense fallback={<div className="loading">Carregando...</div>}>
      <Compendium onBack={() => setView('characters')} />
    </Suspense>;
  }

  if (view === 'rules') {
    return <Suspense fallback={<div className="loading">Carregando...</div>}>
      <Rules onBack={() => setView('characters')} />
    </Suspense>;
  }

  if (view === 'gemForge') {
    return <Suspense fallback={<div className="loading">Acesando a forja...</div>}>
      <GemForge onBack={() => setView('characters')} />
    </Suspense>;
  }

  if (view === 'toolShop') {
    return <Suspense fallback={<div className="loading">Abrindo a loja...</div>}>
      <ToolShop
        jogador={{
          nome: player?.name || 'Jogador',
          carteira: walletCents,
          inventario: [],
          limitePeso: 40,
          limiteEspacos: 20,
        }}
        localAtual="Porto Ferro"
        onComprar={handleToolBuy}
        onBack={() => setView('characters')}
      />
    </Suspense>;
  }

  if (view === 'tableBattle') {
    return <Suspense fallback={<div className="loading">Carregando mesa...</div>}>
      <TableBattle onBack={() => setView('characters')} characters={characters} gameData={gameData} />
    </Suspense>;
  }

  if (view === 'lobby') {
    return <Suspense fallback={<div className="loading">Carregando...</div>}>
      <Lobby
        player={player}
        characters={characters}
        gameData={gameData}
        onBack={() => setView('characters')}
        onOpenBattle={(id) => setBattleId(id)}
        onEnterBattle={() => setView('battle')}
      />
    </Suspense>;
  }

  return <Suspense fallback={<div className="loading">Carregando batalha...</div>}>
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
  </Suspense>;
}
