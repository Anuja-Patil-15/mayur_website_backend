import jwt from 'jsonwebtoken';

const COOKIE = 'token';
const secret = () => process.env.JWT_SECRET || 'dev-secret';

export function setAuthCookie(res, user) {
  const token = jwt.sign({ id: user.id }, secret(), { expiresIn: '7d' });
  res.cookie(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export const clearAuthCookie = (res) => res.clearCookie(COOKIE);

export function requireAuth(req, res, next) {
  try {
    const payload = jwt.verify(req.cookies[COOKIE], secret());
    req.userId = payload.id;
    next();
  } catch {
    res.status(401).json({ error: 'Please log in to continue.' });
  }
}
