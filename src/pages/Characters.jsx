import { useRef, useState } from 'react';
import FichaForm from '../components/FichaForm.jsx';
import CharacterSheet from '../components/CharacterSheet.jsx';
import { exportarFicha, importarFicha } from '../utils/fichaFile.js';
import { api } from '../api.js';

export default function Characters({ player, characters, gameData, customClasses = [], onRefresh, onEnterLobby, onOpenRegistry, onOpenCompendium, onOpenGemForge, onOpenToolShop, onOpenTableBattle, onLogout }) {
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState(null);
  const [importError, setImportError] = useState('');
  const fileRef = useRef(null);

  const created = () => {
    setCreating(false);
    onRefresh();
  };

  const handleImport = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try {
      await importarFicha(file, player.id, api);
      onRefresh();
    } catch (err) {
      setImportError(err.message);
      setTimeout(() => setImportError(''), 6000);
    }
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
          <button className="ghost" onClick={() => fileRef.current && fileRef.current.click()}>📥 Importar</button>
          <input type="file" accept=".json,application/json" ref={fileRef} onChange={handleImport} style={{ display: 'none' }} />
          <button className="ghost" onClick={onOpenCompendium}>⚔️ Arsenal</button>
          <button className="ghost" onClick={onOpenGemForge}>🔮 Forja de Gemas</button>
          <button className="ghost" onClick={onOpenToolShop}>🛠️ Loja de Ferramentas</button>
          <button className="ghost" onClick={onOpenRegistry}>
            📜 Registro do Mundo
          </button>
          <button onClick={onEnterLobby}>⚔️ Campo de Batalha</button>
          <button className="ghost" onClick={onOpenTableBattle}>📋 Mesa de Batalha</button>
          <button className="ghost" onClick={onLogout}>
            Sair
          </button>
        </div>
      </header>

      <div className="content">
        {importError && <div className="error">{importError}</div>}
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
              <div className="card-actions">
                <button className="ghost" onClick={() => exportarFicha(c)}>⬇️ Exportar ficha</button>
              </div>
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
