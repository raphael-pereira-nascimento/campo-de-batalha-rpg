import { useRef, useState } from 'react';
import FichaForm from '../components/FichaForm.jsx';
import CharacterSheet from '../components/CharacterSheet.jsx';
import ConnectionBadge from '../components/ConnectionBadge.jsx';
import { exportarFicha, importarFicha } from '../utils/fichaFile.js';
import { api, isOffline } from '../api.js';
import { shareCharacter, resolveSharedCharacter } from '../utils/shareCharacter.js';

export default function Characters({ player, characters, gameData, customClasses = [], onRefresh, onEnterLobby, onOpenRegistry, onOpenCompendium, onOpenRules, onOpenGemForge, onOpenToolShop, onOpenTavern, onOpenTableBattle, onOpenDungeons, onLogout }) {
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState(null);
  const [importError, setImportError] = useState('');
  const [shareModal, setShareModal] = useState(null); // character
  const [shareResult, setShareResult] = useState(null);
  const [shareCopied, setShareCopied] = useState(false);
  const [pasteModal, setPasteModal] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [pasteError, setPasteError] = useState('');
  const [pasteBusy, setPasteBusy] = useState(false);
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
          <div style={{ marginTop: 6 }}>
            <ConnectionBadge />
          </div>
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
          <button className="ghost" onClick={onOpenTavern}>🍺 O Último Copo</button>
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
            <p style={{ fontSize: 18, color: 'var(--text)' }}>Bem-vindo, {player.name}! 👋</p>
            <p>Siga estes passos para começar a jogar:</p>
            <ol className="onboard-steps">
              <li><span className="step-num">1</span> Crie a <strong>ficha do seu personagem</strong> (raça, classe, golpes e equipamento).</li>
              <li><span className="step-num">2</span> Entre no <strong>Campo de Batalha</strong> para lutar sozinho, em equipe ou contra o Mestre.</li>
              <li><span className="step-num">3</span> Explore as <strong>Dungeons</strong>, forje <strong>gemas</strong> e registre criações no <strong>Registro do Mundo</strong>.</li>
            </ol>
            <button onClick={() => setCreating(true)}>➕ Criar Ficha</button>
            <p className="muted" style={{ marginTop: 16, fontSize: 13 }}>
              Já tem uma ficha pronta? Use <strong>📥 Importar</strong> ou <strong>📋 Colar ficha</strong> no topo.
            </p>
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
                    setShareCopied(false);
                    if (res.url && navigator.clipboard) {
                      try { await navigator.clipboard.writeText(res.url); setShareCopied(true); } catch { /* segue sem copiar */ }
                    }
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
              <p className="muted">
                Link público por 30 dias (abre a ficha pronta para ver e importar){shareCopied ? ' — ✅ link copiado!' : ''}
              </p>
            )}
            {shareResult.url && (
              <input value={shareResult.url} readOnly style={{ width: '100%', fontSize: 12, padding: 6 }} />
            )}
            {shareResult.url && (
              <button
                className="ghost"
                style={{ marginTop: 6 }}
                onClick={() => window.open(shareResult.url, '_blank', 'noopener')}
              >
                👁️ Ver página pública
              </button>
            )}
            <textarea
              value={shareResult.json}
              readOnly
              style={{ width: '100%', height: 220, fontSize: 11, fontFamily: 'monospace', marginTop: 8 }}
            />
            <div className="modal-actions">
              {shareResult.url && (
                <button onClick={async () => { try { await navigator.clipboard.writeText(shareResult.url); setShareCopied(true); alert('Link copiado!'); } catch { alert('Não foi possível copiar.'); } }}>
                  {shareCopied ? '✅ Link copiado' : 'Copiar link'}
                </button>
              )}
              <button onClick={async () => { try { await navigator.clipboard.writeText(shareResult.json); alert('JSON copiado!'); } catch { alert('Não foi possível copiar.'); } }}>Copiar JSON</button>
              <button className="ghost" onClick={() => { setShareModal(null); setShareResult(null); setShareCopied(false); }}>Fechar</button>
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
              <button disabled={pasteBusy} onClick={async () => {
                setPasteBusy(true);
                setPasteError('');
                try {
                  const data = await resolveSharedCharacter(pasteText);
                  // Mesmo caminho do FichaForm: playerId dentro do payload e apenas
                  // campos conhecidos — o servidor revalida tudo (sem dados forjados).
                  await api.createCharacter({
                    playerId: player.id,
                    name: data.name,
                    gender: data.gender,
                    attributes: data.attributes,
                    races: data.races,
                    classes: data.classes,
                    passiva: data.passiva,
                    skills: data.skills,
                    ultimate: data.ultimate,
                    especial: data.especial,
                    equipment: data.equipment,
                    habilidades: data.habilidades || [],
                  });
                  setPasteModal(false);
                  setPasteText('');
                  onRefresh();
                } catch (e) {
                  setPasteError(e.message);
                } finally {
                  setPasteBusy(false);
                }
              }}>{pasteBusy ? 'Importando…' : 'Importar ficha'}</button>
              <button className="ghost" onClick={() => { setPasteModal(false); setPasteText(''); setPasteError(''); }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
