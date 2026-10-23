import { useState } from 'react';
import { setPlayerSession, isOffline, getPlayer } from '../api.js';
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
  // Quem já tem sessão salva vê "Entrar"; visitantes novos veem "Criar conta".
  const [mode, setMode] = useState(() => (getPlayer() ? 'enter' : 'create'));
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isCreate = mode === 'create';
  const senhaValida = password.length >= 4;
  const senhasConferem = !isCreate || password === confirmPassword;
  const canSubmit = name.trim().length > 0 && senhaValida && senhasConferem;

  const trocarModo = (novo) => {
    setMode(novo);
    setError('');
    setConfirmPassword('');
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    if (isCreate && password !== confirmPassword) {
      setError('As senhas não conferem. Digite a mesma senha nos dois campos.');
      return;
    }
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
      <div className="home-shell">
        <section className="home-hero">
          <span className="home-eyebrow">RPG de batalhas em tempo real</span>
          <h1>⚔️ Campo de Batalha RPG</h1>
          <p className="subtitle">
            Crie sua conta, monte a ficha do seu herói e jogue com amigos — ou sozinho
            contra monstros e dungeons.
          </p>

          <div className="home-features">
            <div className="home-feature">
              <span className="home-feature-icon">💾</span>
              <div>
                <strong>Conta e fichas salvas</strong>
                <p>Volte quando quiser: seus personagens, itens e gemas continuam onde você deixou.</p>
              </div>
            </div>
            <div className="home-feature">
              <span className="home-feature-icon">📜</span>
              <div>
                <strong>Registro do Mundo</strong>
                <p>Crie classes, raças, golpes e monstros. Publique para outros jogadores usarem.</p>
              </div>
            </div>
            <div className="home-feature">
              <span className="home-feature-icon">💎</span>
              <div>
                <strong>Gemas que funcionam</strong>
                <p>Minere, compre, equipe e funda pedras preciosas com efeitos reais no combate.</p>
              </div>
            </div>
          </div>

          <ol className="home-steps">
            <li>
              <span className="step-num">1</span>
              <div>
                <strong>Crie sua conta</strong>
                <p>Escolha um nome de guerreiro e uma senha. É rápido e gratuito.</p>
              </div>
            </li>
            <li>
              <span className="step-num">2</span>
              <div>
                <strong>Monte a ficha</strong>
                <p>Escolha raça, classe, atributos, golpes e equipamento.</p>
              </div>
            </li>
            <li>
              <span className="step-num">3</span>
              <div>
                <strong>Jogue e evolua</strong>
                <p>Entre no Campo de Batalha, explore dungeons, ganhe gemas e publique criações.</p>
              </div>
            </li>
          </ol>
        </section>

        <section className="home-auth">
          <div className="home-auth-head">
            <div>
              <h2>{isCreate ? 'Criar conta' : 'Entrar na sua conta'}</h2>
              <p className="muted small">
                {isCreate
                  ? 'Leva menos de um minuto. Depois você já cria sua primeira ficha.'
                  : 'Bem-vindo de volta! Suas fichas e criações estão esperando.'}
              </p>
            </div>
            <ConnectionBadge />
          </div>

          {isOffline() ? (
            <div className="offline-warning">
              ⚠️ <strong>Modo offline:</strong> o servidor não foi encontrado. Sua conta, fichas e
              criações ficam salvas <strong>apenas neste navegador</strong>. Limpar os dados do
              navegador apaga tudo — use “⬇️ Exportar” nas fichas para guardar backups. Para salvar
              na nuvem e acessar de outros dispositivos, ligue o servidor com <code>npm run dev</code>.
            </div>
          ) : (
            <div className="online-note">
              ✅ <strong>Modo online:</strong> sua conta, fichas e criações são salvas no servidor.
              Você pode entrar de qualquer dispositivo.
            </div>
          )}

          <div className="home-tabs">
            <button
              type="button"
              className={mode === 'enter' ? 'home-tab active' : 'home-tab'}
              onClick={() => trocarModo('enter')}
            >
              Entrar
            </button>
            <button
              type="button"
              className={mode === 'create' ? 'home-tab active' : 'home-tab'}
              onClick={() => trocarModo('create')}
            >
              Criar conta
            </button>
          </div>

          <p className="home-hint">
            {isCreate
              ? 'Já tem uma conta com esse nome? Sem problema: entre com a mesma senha e você continua de onde parou.'
              : 'Primeira vez aqui? Toque em “Criar conta”.'}
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
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isCreate ? 'Mínimo 4 caracteres' : 'Sua senha'}
                maxLength={64}
              />
            </label>
            {isCreate && (
              <label>
                Confirmar senha
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Digite a senha novamente"
                  maxLength={64}
                />
              </label>
            )}
            <label className="check-label">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
              />
              Mostrar senha
            </label>
            {isCreate && password.length > 0 && password.length < 4 && (
              <p className="muted small">A senha precisa ter pelo menos 4 caracteres.</p>
            )}
            {isCreate && confirmPassword.length > 0 && !senhasConferem && (
              <p className="error">As senhas não conferem.</p>
            )}
            {error && <div className="error">{error}</div>}
            <button type="submit" disabled={loading || !canSubmit}>
              {loading
                ? isCreate
                  ? 'Criando conta...'
                  : 'Entrando...'
                : isCreate
                  ? 'Criar conta e começar'
                  : 'Entrar no Campo'}
            </button>
          </form>

          <p className="home-next muted">
            Próximo passo: criar a <strong>ficha do seu personagem</strong> e entrar no Campo de
            Batalha.
          </p>
        </section>
      </div>
    </div>
  );
}
