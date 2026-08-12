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
