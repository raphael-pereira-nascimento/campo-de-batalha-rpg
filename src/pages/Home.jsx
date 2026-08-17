import { useState } from 'react';
import { setPlayerSession } from '../api.js';

export default function Home({ onLogin }) {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !password) return;
    setLoading(true);
    setError('');
    try {
      const { player, token } = await onLogin(name, password);
      setPlayerSession(player, token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home">
      <div className="home-box">
        <h1>⚔️ Campo de Batalha RPG</h1>
        <p className="subtitle">
          Batalhas estilo Final Fantasy &amp; Pokémon em tempo real para até <strong>20 jogadores</strong>.
        </p>
        <form onSubmit={submit} className="stack">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Seu nome de guerreiro"
            maxLength={30}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Senha (mínimo 4 caracteres)"
            maxLength={64}
          />
          {error && <div className="error">{error}</div>}
          <button type="submit" disabled={loading || !name.trim() || !password}>
            {loading ? 'Entrando...' : 'Entrar no Campo'}
          </button>
        </form>
      </div>
    </div>
  );
}
