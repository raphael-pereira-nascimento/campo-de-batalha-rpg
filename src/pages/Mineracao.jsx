import { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../api.js';
import {
  VEIOS_MATERIAIS_LIST, getVeioMaterialById,
} from '../game/mineracao.js';
import { MATERIAIS, getMaterialById } from '../game/materials.js';

const VEIO_TIPO_LABEL = {
  minerio: '⛏️ Minério',
  metal: '🔧 Metal',
  pedra: '💎 Pedra',
};

const BIOMAS_ICONES = {
  montanhas: '🏔️',
  caverna: '🕳️',
  subterraneo: '🌑',
  vulcao: '🌋',
};

export default function Mineracao({ onBack, player, characters, walletCents, onWalletChange, onRefresh }) {
  const [characterId, setCharacterId] = useState(characters?.[0]?.id || null);
  const [cooldowns, setCooldowns] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [ultimoDrop, setUltimoDrop] = useState(null);

  const personagem = useMemo(() =>
    characters.find((c) => c.id === characterId) || null,
  [characters, characterId]);

  // Carrega cooldowns quando muda o personagem
  useEffect(() => {
    if (!characterId) return;
    setCarregando(true);
    api.getMaterialMiningCooldowns(characterId)
      .then((d) => setCooldowns(d.cooldowns || []))
      .catch((e) => console.warn('[mineração] cooldowns:', e.message))
      .finally(() => setCarregando(false));
  }, [characterId]);

  // Recarrega cooldowns periodicamente
  useEffect(() => {
    if (!characterId) return;
    const iv = setInterval(() => {
      api.getMaterialMiningCooldowns(characterId)
        .then((d) => setCooldowns(d.cooldowns || []))
        .catch(() => {});
    }, 10000);
    return () => clearInterval(iv);
  }, [characterId]);

  const podeMinero = (veio) => {
    const cd = cooldowns.find((c) => c.veioId === veio.id);
    if (!cd) return true;
    return cd.restanteSeg <= 0;
  };

  const handleMinero = async (veioId) => {
    if (!characterId) {
      setMensagem('Selecione um personagem primeiro.');
      return;
    }
    const veio = getVeioMaterialById(veioId);
    if (!veio) return;
    if (!podeMinero(veio)) {
      const cd = cooldowns.find((c) => c.veioId === veioId);
      setMensagem(`Aguarde ${cd.restanteSeg}s para minerar novamente.`);
      return;
    }

    setCarregando(true);
    try {
      const res = await api.mineMaterial(characterId, veioId);
      if (res.ok) {
        setUltimoDrop({ ...res, veio });
        setMensagem(`⛏️ ${res.quantidade}x ${res.material} obtido do ${veio.nome}!`);
        // Recarrega cooldowns
        const d = await api.getMaterialMiningCooldowns(characterId);
        setCooldowns(d.cooldowns || []);
        if (onWalletChange) onWalletChange(res.walletCents);
        if (onRefresh) onRefresh();
      }
    } catch (e) {
      setMensagem(e.message || 'Erro ao minerar.');
    } finally {
      setCarregando(false);
    }
  };

  const limparMensagem = useCallback(() => setMensagem(''), []);

  return (
    <div className="page">
      <header className="topbar">
        <h1>⛏️ Mineração de Materiais</h1>
        <button className="ghost" onClick={() => onBack()}>← Voltar</button>
      </header>

      <div className="content">
        <div style={{ padding: 16 }}>
          {/* Seleção de personagem */}
          <div style={{ marginBottom: 16, padding: 12, border: '1px solid #3a2e54', borderRadius: 8, background: '#241a3a' }}>
            <label style={{ display: 'block', fontSize: '0.85em', color: '#888', marginBottom: 6 }}>
              Personagem
            </label>
            <select
              value={characterId || ''}
              onChange={(e) => setCharacterId(e.target.value || null)}
              style={{
                width: '100%', padding: '8px', borderRadius: 6,
                border: '1px solid #444', background: '#1e142c', color: '#eee',
              }}
            >
              <option value="">— Selecionar —</option>
              {characters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} (Nv.{c.level || 1})
                </option>
              ))}
            </select>
          </div>

          {!characterId && (
            <div style={{ padding: 24, textAlign: 'center', color: '#888' }}>
              Selecione um personagem para começar a minerar.
            </div>
          )}

          {characterId && (
            <>
              {/* Informações do personagem */}
              <div style={{ marginBottom: 16, padding: 12, border: '1px solid #3a2e54', borderRadius: 8, background: '#241a3a' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '1.1em', fontWeight: 'bold', color: '#eee' }}>
                      {personagem?.name}
                    </div>
                    <div style={{ fontSize: '0.85em', color: '#888' }}>
                      Nível {personagem?.level || 1} • Carteira: {walletCents} bronze
                    </div>
                  </div>
                </div>
              </div>

              {/* Mensagem */}
              {mensagem && (
                <div style={{ marginBottom: 12, padding: 10, borderRadius: 6, background: '#3a2e54', color: '#b8a9cf', fontSize: '0.9em' }}>
                  {mensagem}
                </div>
              )}

              {/* Último drop */}
              {ultimoDrop && (
                <div style={{ marginBottom: 16, padding: 12, borderRadius: 8, background: '#1d3a2e', border: '1px solid #3ddc84' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: '24px' }}>⛏️</span>
                    <span style={{ fontWeight: 'bold', color: '#eee' }}>
                      Material obtido!
                    </span>
                  </div>
                  <div style={{ fontSize: '0.9em', color: '#b8a9cf' }}>
                    {ultimoDrop.quantidade}x {ultimoDrop.material}
                    <span style={{ color: '#888', marginLeft: 8 }}>
                      do {ultimoDrop.veio}
                    </span>
                  </div>
                  <button
                    onClick={limparMensagem}
                    style={{ marginTop: 8, padding: '6px 12px', border: '1px solid #444', borderRadius: 4, background: 'transparent', color: '#888', cursor: 'pointer' }}
                  >
                    Limpar
                  </button>
                </div>
              )}

              {/* Veios de mineração */}
              <h3 style={{ margin: '0 0 12px', color: '#b8a9cf' }}>Veios Disponíveis</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
                {VEIOS_MATERIAIS_LIST.map((veio) => {
                  const cd = cooldowns.find((c) => c.veioId === veio.id);
                  const restante = cd ? cd.restanteSeg : 0;
                  const pode = restante <= 0;
                  const material = getMaterialById(veio.material);
                  const tipoLabel = VEIO_TIPO_LABEL[veio.tipo] || veio.tipo;
                  const biomaIcone = BIOMAS_ICONES[veio.bioma] || '📍';

                  return (
                    <div
                      key={veio.id}
                      style={{
                        border: `1px solid ${pode ? '#4a90e2' : '#444'}`,
                        borderRadius: 8,
                        padding: 12,
                        background: '#1e142c',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      <div style={{ position: 'absolute', top: 8, right: 8, fontSize: '1.2em' }}>
                        {biomaIcone}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 6 }}>
                        <div style={{ fontWeight: 'bold', color: '#eee', fontSize: '1em' }}>
                          {veio.icone} {veio.nome}
                        </div>
                        <span style={{ fontSize: '0.75em', color: '#888', padding: '2px 6px', borderRadius: 4, background: '#333' }}>
                          {tipoLabel}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8em', color: '#888', marginBottom: 10 }}>
                        {veio.descricao}
                      </div>
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8em', color: '#888', marginBottom: 4 }}>
                          <span>Custo:</span>
                          <span style={{ color: '#ffd166' }}>{veio.custoCents} bronze</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8em', color: '#888' }}>
                          <span>Cooldown:</span>
                          <span>{veio.cooldownMin} min</span>
                        </div>
                      </div>
                      {pode ? (
                        <button
                          onClick={() => handleMinero(veio.id)}
                          disabled={carregando}
                          style={{
                            width: '100%', padding: '10px', border: 'none', borderRadius: 6,
                            background: '#4a90e2', color: '#fff', fontWeight: 'bold',
                            cursor: 'pointer', fontSize: '0.9em',
                          }}
                        >
                          ⛏️ Minerar
                        </button>
                      ) : (
                        <button disabled style={{
                          width: '100%', padding: '10px', border: 'none', borderRadius: 6,
                          background: '#444', color: '#888',
                        }}
                        >
                          ⏳ {restante}s
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
