import { useState } from 'react';
import { setPlayerSession, isOffline } from '../api.js';
import ConnectionBadge from '../components/ConnectionBadge.jsx';

// Mensagens de erro amigáveis: o backend cria a conta automaticamente quando o
// nome é novo, então o texto precisa orientar quem está entrando pela 1ª vez.
function friendlyError(message = '') {
  const m = message.toLowerCase();
  if (m.includes('senha incorreta')) {
    return 'Esse nome de guerreiro já existe e a senha não confere. Se é sua conta, confira a senha; se você é novo, escolha outro nome.';
  }
  if (m.includes('pelo menos 4')) {
    return 'A senha precisa ter pelo menos 4 caracteres.';
  }
  if (m.includes('informe') && m.includes('nome')) {
    return 'Escolha um nome de guerreiro para continuar.';
  }
  return message || 'Não foi possível entrar. Tente novamente.';
}

export default function Home({ onLogin }) {
  const [mode, setMode] = useState('enter'); // 'enter' | 'create'
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isCreate = mode === 'create';
  const canSubmit = name.trim().length > 0 && password.length >= 4;

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError('');
    try {
      const { player, token } = await onLogin(name.trim(), password);
      setPlayerSession(player, token);
    } catch (err) {
      setError(friendlyError(err.message));
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

        <div className="home-badge-row">
          <ConnectionBadge />
        </div>

        {isOffline() && (
          <div className="offline-warning">
            ⚠️ <strong>Modo offline:</strong> o servidor não foi encontrado, então sua conta, fichas e criações
            ficam salvas <strong>apenas neste navegador</strong>. Limpar os dados do navegador apaga tudo.
            Use “⬇️ Exportar” nas fichas para guardar backups.
          </div>
        )}

        <div className="home-tabs">
          <button
            type="button"
            className={mode === 'enter' ? 'home-tab active' : 'home-tab'}
            onClick={() => { setMode('enter'); setError(''); }}
          >
            Entrar
          </button>
          <button
            type="button"
            className={mode === 'create' ? 'home-tab active' : 'home-tab'}
            onClick={() => { setMode('create'); setError(''); }}
          >
            Criar conta
          </button>
        </div>

        <p className="home-hint">
          {isCreate
            ? 'Escolha um nome e uma senha. Sua conta é criada na hora — depois você já pode montar a ficha do seu personagem.'
            : 'Primeira vez aqui? Toque em “Criar conta”. Se já tem uma conta, entre com seu nome e senha.'}
        </p>

        <form onSubmit={submit} className="stack">
          <label>
            Nome de guerreiro
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isCreate ? 'Ex.: Lyra, a Valente' : 'Seu nome de guerreiro'}
              maxLength={30}
              autoFocus
            />
          </label>
          <label>
            Senha
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isCreate ? 'Mínimo 4 caracteres' : 'Sua senha'}
              maxLength={64}
            />
          </label>
          {error && <div className="error">{error}</div>}
          <button type="submit" disabled={loading || !canSubmit}>
            {loading ? (isCreate ? 'Criando conta...' : 'Entrando...') : isCreate ? 'Criar conta e começar' : 'Entrar no Campo'}
          </button>
        </form>

        <p className="home-next muted">
          Próximo passo: criar a <strong>ficha do seu personagem</strong> e entrar no Campo de Batalha.
        </p>
      </div>
    </div>
  );
}
