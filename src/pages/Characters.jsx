import { useRef, useState } from 'react';
import FichaForm from '../components/FichaForm.jsx';
import CharacterSheet from '../components/CharacterSheet.jsx';
import { exportarFicha, importarFicha } from '../utils/fichaFile.js';
import { api } from '../api.js';
import { shareCharacter, resolveSharedCharacter } from '../utils/shareCharacter.js';

export default function Characters({ player, characters, gameData, customClasses = [], onRefresh, onEnterLobby, onOpenRegistry, onOpenCompendium, onOpenRules, onOpenGemForge, onOpenToolShop, onOpenTableBattle, onOpenDungeons, onLogout }) {
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState(null);
  const [importError, setImportError] = useState('');
  const [shareModal, setShareModal] = useState(null); // character
  const [shareResult, setShareResult] = useState(null);
  const [pasteModal, setPasteModal] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [pasteError, setPasteError] = useState('');
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
          <button className="ghost" onClick={() => setPasteModal(true)}>📋 Colar ficha</button>
          <button className="ghost" onClick={() => fileRef.current && fileRef.current.click()}>📥 Importar</button>
          <input type="file" accept=".json,application/json" ref={fileRef} onChange={handleImport} style={{ display: 'none' }} />
          <button className="ghost" onClick={onOpenCompendium}>⚔️ Arsenal</button>
          <button className="ghost" onClick={onOpenRules}>📖 Regras</button>
          <button className="ghost" onClick={onOpenGemForge}>🔮 Forja de Gemas</button>
          <button className="ghost" onClick={onOpenToolShop}>🛠️ Loja de Ferramentas</button>
          <button className="ghost" onClick={onOpenRegistry}>
            📜 Registro do Mundo
          </button>
          <button onClick={onEnterLobby}>⚔️ Campo de Batalha</button>
          <button className="ghost" onClick={onOpenDungeons}>🗺️ Dungeons</button>
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
                <button className="ghost" onClick={async () => {
                  try {
                    const res = await shareCharacter(c);
                    setShareResult(res);
                    setShareModal(c);
                  } catch (e) {
                    alert(e.message);
                  }
                }}>🔗 Compartilhar</button>
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

      {shareModal && shareResult && (
        <div className="modal-backdrop">
          <div className="modal large">
            <h2>Compartilhar ficha — {shareModal.name}</h2>
            {shareResult.offline ? (
              <p className="muted">Modo offline: copie este JSON para compartilhar.</p>
            ) : (
              <p className="muted">Link gerado para 30 dias:</p>
            )}
            {shareResult.url && (
              <input value={shareResult.url} readOnly style={{ width: '100%', fontSize: 12, padding: 6 }} />
            )}
            <textarea
              value={shareResult.json}
              readOnly
              style={{ width: '100%', height: 220, fontSize: 11, fontFamily: 'monospace', marginTop: 8 }}
            />
            <div className="modal-actions">
              {shareResult.url && (
                <button onClick={async () => { try { await navigator.clipboard.writeText(shareResult.url); alert('Link copiado!'); } catch { alert('Não foi possível copiar.'); } }}>Copiar link</button>
              )}
              <button onClick={async () => { try { await navigator.clipboard.writeText(shareResult.json); alert('JSON copiado!'); } catch { alert('Não foi possível copiar.'); } }}>Copiar JSON</button>
              <button className="ghost" onClick={() => { setShareModal(null); setShareResult(null); }}>Fechar</button>
            </div>
          </div>
        </div>
      )}

      {pasteModal && (
        <div className="modal-backdrop">
          <div className="modal large">
            <h2>Colar ficha compartilhada</h2>
            <p className="muted">Cole aqui o link gerado ou o JSON da ficha:</p>
            <textarea
              value={pasteText}
              onChange={(e) => { setPasteText(e.target.value); setPasteError(''); }}
              style={{ width: '100%', height: 180, fontSize: 11, fontFamily: 'monospace' }}
            />
            {pasteError && <p className="error">{pasteError}</p>}
            <div className="modal-actions">
              <button onClick={async () => {
                try {
                  const data = await resolveSharedCharacter(pasteText);
                  const created = await api.createCharacter(player.id, {
                    name: data.name,
                    level: data.level,
                    xp: data.xp,
                    attributes: data.attributes,
                    classes: data.classes,
                    races: data.races,
                    skills: data.skills,
                    spells: data.spells,
                    ultimate: data.ultimate,
                    especial: data.especial,
                    inventory: data.inventory || [],
                    equipment: data.equipment,
                    passiva: data.passiva,
                    gender: data.gender,
                    custom_class_name: data.custom_class_name,
                  });
                  setPasteModal(false);
                  setPasteText('');
                  onRefresh();
                } catch (e) {
                  setPasteError(e.message);
                }
              }}>Importar ficha</button>
              <button className="ghost" onClick={() => { setPasteModal(false); setPasteText(''); setPasteError(''); }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
