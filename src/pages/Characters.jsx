import { useState } from 'react';
import FichaForm from '../components/FichaForm.jsx';
import CharacterSheet from '../components/CharacterSheet.jsx';

export default function Characters({ player, characters, gameData, customClasses = [], onRefresh, onEnterLobby, onOpenRegistry, onLogout }) {
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState(null);

  const created = () => {
    setCreating(false);
    onRefresh();
  };

  return (
    <div className="page">
      <header className="topbar">
        <div>
          <h1>⚔️ Campo de Batalha</h1>
          <span className="player-name">Jogador: {player.name}</span>
        </div>
        <div className="topbar-actions">
          <button onClick={() => setCreating(true)}>+ Nova Ficha</button>
          <button className="ghost" onClick={onOpenRegistry}>
            📜 Registro do Mundo
          </button>
          <button onClick={onEnterLobby}>⚔️ Campo de Batalha</button>
          <button className="ghost" onClick={onLogout}>
            Sair
          </button>
        </div>
      </header>

      <div className="content">
        {characters.length === 0 && !creating && (
          <div className="empty">
            <p>Você ainda não tem personagens. Crie sua primeira ficha!</p>
            <button onClick={() => setCreating(true)}>Criar Ficha</button>
          </div>
        )}

        <div className="char-grid">
          {characters.map((c) => (
            <div key={c.id} className={selected === c.id ? 'char-card selected' : 'char-card'}>
              <CharacterSheet character={c} gameData={gameData} onChanged={onRefresh} />
            </div>
          ))}
        </div>
      </div>

      {creating && (
        <FichaForm
          player={player}
          gameData={gameData}
          customClasses={customClasses}
          onCreated={created}
          onCancel={() => setCreating(false)}
        />
      )}
    </div>
  );
}
