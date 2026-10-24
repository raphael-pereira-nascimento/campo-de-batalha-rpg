import { useRef, useState } from 'react';
import FichaForm from '../components/FichaForm.jsx';
import CharacterSheet from '../components/CharacterSheet.jsx';
import ConnectionBadge from '../components/ConnectionBadge.jsx';
import { exportarFicha, importarFicha } from '../utils/fichaFile.js';
import { api, isOffline } from '../api.js';
import { shareCharacter, resolveSharedCharacter } from '../utils/shareCharacter.js';

export default function Characters({ player, characters, gameData, customClasses = [], onRefresh, onEnterLobby, onOpenRegistry, onOpenCompendium, onOpenRules, onOpenGemForge, onOpenToolShop, onOpenEquipmentShop, onOpenMining, onOpenTavern, onOpenTableBattle, onOpenDungeons, onLogout }) {
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
        <div className="topbar-brand">
          <h1>⚔️ Campo de Batalha</h1>
          <span className="player-name">Jogador: {player.name}</span>
          <ConnectionBadge />
        </div>
        <div className="topbar-primary">
          <button onClick={() => setCreating(true)}>➕ Nova ficha</button>
          <button onClick={onEnterLobby}>⚔️ Campo de Batalha</button>
        </div>
      </header>

      <nav className="subnav" aria-label="Atalhos do jogo">
        <button className="primary-link" onClick={onOpenRegistry}>📜 Registro do Mundo</button>
        <button className="primary-link" onClick={onOpenGemForge}>🔮 Forja de Gemas</button>
        {characters.length > 0 && (
          <button className="primary-link" onClick={() => onOpenMining?.(characters[0].id)}>⛏️ Mineração</button>
        )}
        <button onClick={() => onOpenEquipmentShop?.()}>🛒 Loja e equipamentos</button>
        <button onClick={onOpenToolShop}>🛠️ Ferramentas</button>
        <button onClick={onOpenDungeons}>🗺️ Dungeons</button>
        <button onClick={onOpenTavern}>🍺 Taverna</button>
        <button onClick={onOpenCompendium}>⚔️ Arsenal</button>
        <button onClick={onOpenRules}>📖 Regras</button>
        <button onClick={onOpenTableBattle}>📋 Mesa de Batalha</button>
        <button onClick={() => setPasteModal(true)}>📋 Colar ficha</button>
        <button onClick={() => fileRef.current && fileRef.current.click()}>📥 Importar</button>
        <button onClick={onLogout}>Sair</button>
      </nav>
      <input type="file" accept=".json,application/json" ref={fileRef} onChange={handleImport} style={{ display: 'none' }} />

      <div className="content">
        <div className="account-banner">
          {isOffline() ? (
            <>
              <span>💾</span>
              <span>
                <strong>Modo offline:</strong> sua conta, fichas e criações ficam salvas apenas
                neste navegador. Use “⬇️ Exportar ficha” para guardar backups.
              </span>
            </>
          ) : (
            <>
              <span>☁️</span>
              <span>
                <strong>Salvo no servidor:</strong> sua conta, fichas e criações ficam disponíveis
                em qualquer dispositivo.
              </span>
            </>
          )}
        </div>

        {importError && <div className="error">{importError}</div>}
        {characters.length === 0 && !creating && (
          <div className="empty">
            <div className="onboard-card">
              <span className="home-eyebrow">Comece aqui</span>
              <h2>Bem-vindo, {player.name}! 👋</h2>
              <p className="muted" style={{ marginTop: 0 }}>
                Sua conta já está pronta. Agora monte seu primeiro personagem — leva poucos minutos.
              </p>
              <ol className="onboard-steps">
                <li><span className="step-num">1</span> Crie a <strong>ficha do seu personagem</strong> (raça, classe, atributos, golpes e equipamento).</li>
                <li><span className="step-num">2</span> Entre no <strong>Campo de Batalha</strong> para lutar sozinho, em equipe ou contra o Mestre.</li>
                <li><span className="step-num">3</span> Explore as <strong>Dungeons</strong>, minere <strong>gemas</strong>, equipe e funda na <strong>Forja</strong> e publique criações no <strong>Registro do Mundo</strong>.</li>
              </ol>
              <div className="onboard-actions">
                <button onClick={() => setCreating(true)}>➕ Criar minha primeira ficha</button>
                <button className="ghost" onClick={onOpenRegistry}>📜 Explorar o Registro do Mundo</button>
                <button className="ghost" onClick={onOpenGemForge}>🔮 Ver a Forja de Gemas</button>
              </div>
              <div className="onboard-extra">
                <div className="onboard-extra-card">
                  <strong>📥 Já tem uma ficha?</strong>
                  <p>Importe um arquivo JSON ou cole um link compartilhado por outro jogador.</p>
                  <div className="onboard-actions" style={{ marginTop: 0 }}>
                    <button className="ghost" onClick={() => fileRef.current && fileRef.current.click()}>Importar</button>
                    <button className="ghost" onClick={() => setPasteModal(true)}>Colar ficha</button>
                  </div>
                </div>
                <div className="onboard-extra-card">
                  <strong>💎 Quer gemas?</strong>
                  <p>Depois de criar a ficha, use o botão <strong>⛏️ Minerar</strong> no cartão do personagem. Cada personagem tem seus próprios cooldowns de mineração.</p>
                  <button className="ghost" onClick={() => setCreating(true)}>➕ Criar ficha para minerar</button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="char-grid">
          {characters.map((c) => (
            <div key={c.id} className={selected === c.id ? 'char-card selected' : 'char-card'}>
              <CharacterSheet
                character={c}
                gameData={gameData}
                onChanged={onRefresh}
                onOpenShop={() => onOpenEquipmentShop?.(c.id)}
              />
              <div className="card-actions">
                <button className="mine-action" onClick={() => onOpenMining?.(c.id)}>⛏️ Minerar</button>
                <button className="ghost" onClick={() => onOpenEquipmentShop?.(c.id)}>🛒 Equipamentos</button>
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
