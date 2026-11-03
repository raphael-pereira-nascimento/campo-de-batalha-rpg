import { Suspense, lazy, useEffect, useState } from 'react';
import { api, getSocket, getPlayer, getToken, logout, isOffline, setPlayerSession } from './api.js';
import Home from './pages/Home.jsx';
import Characters from './pages/Characters.jsx';
import ConnectionBadge from './components/ConnectionBadge.jsx';
import { MATERIAIS, getMateriaisPorTipo, getMateriaisPorRaridade } from './game/materials.js';
import { EQUIPAMENTOS, getEquipamentosPorTipo, EQUIP_TIPO } from './game/equipments.js';

const Lobby = lazy(() => import('./pages/Lobby.jsx'));
const Battle = lazy(() => import('./pages/Battle.jsx'));
const Registry = lazy(() => import('./pages/Registry.jsx'));
const Compendium = lazy(() => import('./pages/Compendium.jsx'));
const Rules = lazy(() => import('./pages/Rules.jsx'));
const TableBattle = lazy(() => import('./pages/TableBattle.jsx'));
const GemForge = lazy(() => import('./pages/GemForge.jsx'));
const Forge = lazy(() => import('./pages/Forge.jsx'));
const Mineracao = lazy(() => import('./pages/Mineracao.jsx'));
const ToolShop = lazy(() => import('./pages/ToolShop.jsx'));
const Tavern = lazy(() => import('./pages/Tavern.jsx'));
const Dungeons = lazy(() => import('./pages/Dungeons.jsx'));
const ShareView = lazy(() => import('./pages/ShareView.jsx'));

// Detecta a rota /share/:id levando em conta a base do deploy. No GitHub Pages
// o app fica em /campo-de-batalha-rpg/, então o caminho é /campo-de-batalha-rpg/share/:id.
const BASE_URL = import.meta.env.BASE_URL || '/';
function shareIdFromPath() {
  if (typeof window === 'undefined') return null;
  let path = window.location.pathname;
  path = path.startsWith(BASE_URL) ? path.slice(BASE_URL.length) : path.replace(/^\/+/, '');
  const m = path.match(/^share\/([A-Za-z0-9_-]+)/);
  return m ? m[1] : null;
}
const SHARE_MATCH = shareIdFromPath();

export default function App({ initialView } = {}) {
  const [view, setView] = useState(initialView || 'home');
  const [share, setShare] = useState(SHARE_MATCH);
  const [player, setPlayer] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [characters, setCharacters] = useState([]);
  const [customClasses, setCustomClasses] = useState([]);
  const [gameData, setGameData] = useState(null);
  const [gameDataError, setGameDataError] = useState(false);
  const [battleId, setBattleId] = useState(null);
  // De onde a batalha veio: 'lobby' ou 'dungeons' (define para onde o "Sair" volta).
  const [battleOrigin, setBattleOrigin] = useState('lobby');
  const [offlineMode, setOfflineMode] = useState(isOffline());
  const [walletCents, setWalletCents] = useState(0);
  // Aba/personagem com que a Loja abre. Permite que o botão "Minerar" de uma
  // ficha abra direto a mineração daquele personagem.
  const [toolShopConfig, setToolShopConfig] = useState({ tab: 'tools', characterId: null });

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
          // Páginas standalone (mesa-de-batalha.html etc.) voltam para a
          // página pedida após restaurar a sessão.
          setView(initialView && initialView !== 'home' ? initialView : 'characters');
        })
        .catch(() => {
          if (getToken() && !isOffline()) {
            logout();
            setView('home');
          }
        })
        .finally(() => setAuthChecked(true));
    } else {
      setAuthChecked(true);
    }
  }, []);

  const handleLogin = async (name, password) => {
    const { player, token } = await api.createPlayer(name, password);
    // Persistência da sessão num único ponto (api.setPlayerSession) para o
    // reload restaurar o login de forma confiável.
    setPlayerSession(player, token);
    setPlayer(player);
    const d = await api.listCharacters(player.id);
    setCharacters(d.characters);
    setView(initialView && initialView !== 'home' ? initialView : 'characters');
    return { player, token };
  };

  const refreshWallet = async () => {
    try {
      const d = await api.getWallet();
      const cents = d && d.wallet && typeof d.wallet === 'object' ? d.wallet.cents : Number(d?.wallet) || 0;
      setWalletCents(cents);
      return cents;
    } catch (_) {
      return walletCents;
    }
  };

  const refreshCharacters = async () => {
    const d = await api.listCharacters(player.id);
    setCharacters(d.characters);
    await refreshWallet();
  };

  const handleLogout = () => {
    logout();
    setPlayer(null);
    setCharacters([]);
    setView('home');
  };

  const abrirToolShop = async (opts = {}) => {
    await refreshWallet();
    setToolShopConfig({
      tab: opts.tab || 'tools',
      characterId: opts.characterId || null,
    });
    setView('toolShop');
  };

  const abrirMineracao = (characterId) => abrirToolShop({ tab: 'mine', characterId });

  const abrirForja = async () => {
    await refreshWallet();
    setView('gemForge');
  };

  const handleToolBuy = (_ferramenta, preco) => {
    setWalletCents((c) => Math.max(0, c - preco));
  };

  const abrirTaverna = async () => {
    try {
      const d = await api.getWallet();
      const cents = d && d.wallet && typeof d.wallet === 'object' ? d.wallet.cents : Number(d?.wallet) || 0;
      setWalletCents(cents);
    } catch (_) {
      // mantém o valor atual da carteira
    }
    setView('tavern');
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

  if (share) {
    return (
      <Suspense fallback={<div className="loading">Carregando ficha compartilhada...</div>}>
        <ShareView
          shareId={share}
          player={player}
          gameData={gameData}
          onImported={() => {
            setShare(null);
            setView('characters');
            if (player) refreshCharacters();
          }}
          onHome={() => {
            setShare(null);
            setView(player ? 'characters' : 'home');
          }}
        />
      </Suspense>
    );
  }

  if (view === 'home') {
    return <Home onLogin={handleLogin} />;
  }

  // Páginas standalone exigem login: sem sessão, mostra o login e depois
  // volta para a página pedida (handleLogin já cuida do retorno).
  if (!player && authChecked && !share) {
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
        onOpenGemForge={abrirForja}
        onOpenMateriais={() => setView('materiais')}
        onOpenEquipamentos={() => setView('equipamentos')}
        onOpenForge={() => setView('forge')}
        onOpenMineracao={() => setView('mineracao')}
        onOpenToolShop={() => abrirToolShop({ tab: 'tools' })}
        onOpenEquipmentShop={(characterId) => abrirToolShop({ tab: 'equipment', characterId })}
        onOpenMining={abrirMineracao}
        onOpenTavern={abrirTaverna}
        onOpenTableBattle={() => setView('tableBattle')}
        onOpenDungeons={() => setView('dungeons')}
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
    return <Suspense fallback={<div className="loading">Acessando a forja...</div>}>
      <GemForge
        onBack={() => setView('characters')}
        player={player}
        characters={characters}
        onRefresh={refreshCharacters}
        walletCents={walletCents}
        onOpenToolShop={() => abrirToolShop()}
        onOpenMining={abrirMineracao}
        onEnterLobby={() => setView('lobby')}
      />
    </Suspense>;
  }

  if (view === 'forge') {
    return <Suspense fallback={<div className="loading">Acessando a forja de equipamentos...</div>}>
      <Forge
        onBack={() => setView('characters')}
        player={player}
        characters={characters}
        walletCents={walletCents}
        onWalletChange={setWalletCents}
        onRefresh={refreshCharacters}
      />
    </Suspense>;
  }

  if (view === 'mineracao') {
    return <Suspense fallback={<div className="loading">Abrindo a mineração...</div>}>
      <Mineracao
        onBack={() => setView('characters')}
        player={player}
        characters={characters}
        walletCents={walletCents}
        onWalletChange={setWalletCents}
        onRefresh={refreshCharacters}
      />
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
        characters={characters}
        player={player}
        initialTab={toolShopConfig.tab}
        initialCharacterId={toolShopConfig.characterId}
        onComprar={handleToolBuy}
        onWalletChange={setWalletCents}
        onRefresh={refreshCharacters}
        onBack={() => setView('characters')}
      />
    </Suspense>;
  }

  if (view === 'tavern') {
    return <Suspense fallback={<div className="loading">Abrindo a taverna...</div>}>
      <Tavern
        player={player}
        characters={characters}
        onBack={() => setView('characters')}
        onRefresh={refreshCharacters}
        onWalletChange={setWalletCents}
      />
    </Suspense>;
  }

  if (view === 'tableBattle') {
    return <Suspense fallback={<div className="loading">Carregando mesa...</div>}>
      <TableBattle onBack={() => setView('characters')} characters={characters} gameData={gameData} />
    </Suspense>;
  }

  if (view === 'dungeons') {
    return <Suspense fallback={<div className="loading">Abrindo as dungeons...</div>}>
      <Dungeons
        player={player}
        characters={characters}
        onBack={() => setView('characters')}
        onOpenBattle={(id) => {
          setBattleId(id);
          setBattleOrigin('dungeons');
          setView('battle');
        }}
      />
    </Suspense>;
  }

  if (view === 'materiais') {
    const porTipo = Object.fromEntries(
      ['minerio', 'metal', 'pedra'].map(t => [t, getMateriaisPorTipo(t)])
    );
    return (
      <div className="page">
        <header className="topbar">
          <h1>📦 Materiais</h1>
          <button className="ghost" onClick={() => setView('characters')}>← Voltar</button>
        </header>
        <div className="content">
          <p className="muted">Catálogo de minérios, metais e pedras preciosas para forja.</p>
          <div style={{ display: 'grid', gap: 16, padding: 12 }}>
            {['minerio', 'metal', 'pedra'].map(tipo => (
              <section key={tipo} style={{ border: '1px solid #3a2e54', borderRadius: 8, padding: 12, background: '#241a3a' }}>
                <h3 style={{ margin: '0 0 8px', color: '#b8a9cf' }}>{tipo.charAt(0).toUpperCase() + tipo.slice(1)}s</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
                  {porTipo[tipo].map(m => (
                    <div key={m.id} style={{ border: '1px solid #444', borderRadius: 6, padding: 8, background: '#1e142c' }}>
                      <div style={{ fontWeight: 'bold', color: '#eee' }}>{m.nome}</div>
                      <div style={{ fontSize: '0.85em', color: '#888' }}>{m.raridade} • {m.bioma}</div>
                      <div style={{ fontSize: '0.85em', color: '#b8a9cf', marginTop: 4 }}>{m.descricao}</div>
                      <div style={{ fontSize: '0.8em', color: '#8b5fbf', marginTop: 4 }}>R$ {m.precoPorKg}/kg</div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (view === 'equipamentos') {
    const porTipo = Object.fromEntries(
      Object.values(EQUIP_TIPO).map(t => [t.nome.toLowerCase(), getEquipamentosPorTipo(t.nome.toLowerCase().replace('ã', 'a'))])
    );
    return (
      <div className="page">
        <header className="topbar">
          <h1>⚔️ Equipamentos</h1>
          <button className="ghost" onClick={() => setView('characters')}>← Voltar</button>
        </header>
        <div className="content">
          <p className="muted">Catálogo de armas, armaduras, acessórios e itens mágicos.</p>
          <div style={{ display: 'grid', gap: 16, padding: 12 }}>
            {Object.entries(EQUIP_TIPO).map(([id, tipo]) => {
              const items = getEquipamentosPorTipo(id);
              if (items.length === 0) return null;
              return (
                <section key={id} style={{ border: '1px solid #3a2e54', borderRadius: 8, padding: 12, background: '#241a3a' }}>
                  <h3 style={{ margin: '0 0 8px', color: '#b8a9cf' }}>{tipo.nome} ({items.length})</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
                    {items.map(eq => (
                      <div key={eq.id} style={{ border: '1px solid #444', borderRadius: 6, padding: 8, background: '#1e142c' }}>
                        <div style={{ fontWeight: 'bold', color: '#eee' }}>{eq.nome}</div>
                        <div style={{ fontSize: '0.85em', color: '#888' }}>{eq.raridade} • {eq.peso} kg</div>
                        <div style={{ fontSize: '0.85em', color: '#b8a9cf', marginTop: 4 }}>{eq.descricao}</div>
                        <div style={{ fontSize: '0.8em', color: '#8b5fbf', marginTop: 4 }}>R$ {calcularPrecoEquipamento(eq.id)}</div>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (view === 'lobby') {
    return <Suspense fallback={<div className="loading">Carregando...</div>}>
      <Lobby
        player={player}
        characters={characters}
        gameData={gameData}
        onBack={() => setView('characters')}
        onOpenBattle={(id) => setBattleId(id)}
        onEnterBattle={() => {
          setBattleOrigin('lobby');
          setView('battle');
        }}
      />
    </Suspense>;
  }

  return <Suspense fallback={<div className="loading">Carregando batalha...</div>}>
    <Battle
      battleId={battleId}
      player={player}
      gameData={gameData}
      onExit={() => {
        setView(battleOrigin);
        setBattleId(null);
      }}
      onBackToSheets={() => setView('characters')}
    />
  </Suspense>;
}
