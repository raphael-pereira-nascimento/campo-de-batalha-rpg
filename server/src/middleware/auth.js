import { query } from '../db/index.js';

export async function requireAuth(req, res, next) {
  const auth = req.headers.authorization || '';
  const [, token] = auth.split(' ');
  if (!token) return res.status(401).json({ ok: false, error: 'Token ausente.' });
  try {
    const { rows } = await query('SELECT id, name FROM players WHERE token = $1', [token]);
    if (!rows.length) return res.status(401).json({ ok: false, error: 'Token inválido.' });
    req.player = rows[0];
    next();
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}

// Autenticação opcional: identifica o jogador quando há token válido, mas não
// bloqueia visitantes. Usado nas listagens do Registro do Mundo, que mostram
// as criações públicas de todos + as privadas do próprio jogador.
export async function optionalAuth(req, _res, next) {
  const auth = req.headers.authorization || '';
  const [, token] = auth.split(' ');
  if (!token) return next();
  try {
    const { rows } = await query('SELECT id, name FROM players WHERE token = $1', [token]);
    if (rows.length) req.player = rows[0];
  } catch {
    /* segue como visitante */
  }
  next();
}
