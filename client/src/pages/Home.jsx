import { useState } from 'react';

export default function Home({ onLogin }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError('');
    try {
      await onLogin(name);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="home">
      <div className="home-box">
        <h1>⚔️ Campo de Batalha RPG</h1>
        <p className="subtitle">
          Batalhas estilo Final Fantasy & Pokémon em tempo real para até <strong>20 jogadores</strong>.
        </p>
        <form onSubmit={submit} className="stack">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Seu nome de guerreiro"
            maxLength={30}
          />
          {error && <div className="error">{error}</div>}
          <button type="submit" disabled={loading || !name.trim()}>
            {loading ? 'Entrando...' : 'Entrar no Campo'}
          </button>
        </form>
      </div>
    </div>
  );
}
