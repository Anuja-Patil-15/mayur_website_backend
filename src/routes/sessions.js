import { Router } from 'express';
import { and, eq, desc, ilike, gte, lte, sql, count, avg, sum } from 'drizzle-orm';
import { db } from '../db/index.js';
import { mcqSessions as s } from '../db/schema.js';
import { requireAuth } from '../middleware/auth.js';
import { computeScores } from '../scoring.js';

const router = Router();
router.use(requireAuth); // every route below is private to the logged-in user

const isDate = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
const toInt = (v) => (v === '' || v === null || v === undefined ? NaN : Number(v));

// GET /api/sessions?subject=&from=&to=  -> full history (newest first)
router.get('/', async (req, res) => {
  const filters = [eq(s.userId, req.userId)];
  if (req.query.subject) filters.push(ilike(s.subject, `%${req.query.subject}%`));
  if (isDate(req.query.from)) filters.push(gte(s.sessionDate, req.query.from));
  if (isDate(req.query.to)) filters.push(lte(s.sessionDate, req.query.to));
  const rows = await db.select().from(s).where(and(...filters)).orderBy(desc(s.sessionDate), desc(s.id));
  res.json({ sessions: rows });
});

// GET /api/sessions/summary -> dashboard totals + per-subject breakdown
router.get('/summary', async (req, res) => {
  const [totals] = await db.select({
    sessions: count(),
    totalMcqs: sum(s.total),
    totalMinutes: sum(s.timeMinutes),
    avgLearning: avg(s.learningScore),
    avgClarity: avg(s.conceptualClarity),
    totalA: sum(s.a), totalB: sum(s.b), totalC: sum(s.c), totalD: sum(s.d), totalE: sum(s.e),
  }).from(s).where(eq(s.userId, req.userId));

  const bySubject = await db.select({
    subject: s.subject,
    sessions: count(),
    totalMcqs: sum(s.total),
    avgClarity: avg(s.conceptualClarity),
    avgLearning: avg(s.learningScore),
  }).from(s).where(eq(s.userId, req.userId))
    .groupBy(s.subject).orderBy(sql`avg(${s.conceptualClarity}) asc`);

  const num = (v) => (v === null || v === undefined ? 0 : Number(v));
  res.json({
    totals: Object.fromEntries(Object.entries(totals).map(([k, v]) => [k, num(v)])),
    bySubject: bySubject.map((r) => ({ ...r, totalMcqs: num(r.totalMcqs), avgClarity: num(r.avgClarity), avgLearning: num(r.avgLearning) })),
  });
});

// POST /api/sessions -> save a new session (scores are calculated on the server)
router.post('/', async (req, res) => {
  const b = req.body;
  const total = toInt(b.total), timeMinutes = toInt(b.timeMinutes ?? 0);
  const counts = ['a', 'b', 'c', 'd', 'e'].map((k) => toInt(b[k]));
  const ok = (n) => Number.isInteger(n) && n >= 0;

  if (!Number.isInteger(total) || total < 1) return res.status(400).json({ error: 'Total MCQs must be 1 or more.' });
  if (!ok(timeMinutes)) return res.status(400).json({ error: 'Time must be 0 or more minutes.' });
  if (!counts.every(ok)) return res.status(400).json({ error: 'Category counts must be whole numbers, 0 or more.' });
  const sumCounts = counts.reduce((x, y) => x + y, 0);
  if (sumCounts !== total) return res.status(400).json({ error: `Category counts add up to ${sumCounts}, but total MCQs is ${total}.` });
  if (!isDate(b.sessionDate)) return res.status(400).json({ error: 'Choose a valid date.' });

  const [a, bb, c, d, e] = counts;
  const scores = computeScores({ a, b: bb, c, d, e, total, timeMinutes });

  const [row] = await db.insert(s).values({
    userId: req.userId,
    sessionDate: b.sessionDate,
    subject: String(b.subject || '').trim().slice(0, 200),
    total, timeMinutes, a, b: bb, c, d, e,
    ...scores,
    priority1: String(b.priority1 || '').slice(0, 300),
    priority2: String(b.priority2 || '').slice(0, 300),
    priority3: String(b.priority3 || '').slice(0, 300),
    reassessmentDate: isDate(b.reassessmentDate) ? b.reassessmentDate : null,
    mistakesReviewed: b.mistakesReviewed === true,
  }).returning();
  res.status(201).json({ session: row });
});

// PATCH /api/sessions/:id/reviewed -> tick "reviewed today's mistakes" later
router.patch('/:id/reviewed', async (req, res) => {
  const [row] = await db.update(s)
    .set({ mistakesReviewed: req.body.mistakesReviewed === true })
    .where(and(eq(s.id, Number(req.params.id)), eq(s.userId, req.userId)))
    .returning();
  if (!row) return res.status(404).json({ error: 'Session not found.' });
  res.json({ session: row });
});

// DELETE /api/sessions/:id
router.delete('/:id', async (req, res) => {
  const [row] = await db.delete(s)
    .where(and(eq(s.id, Number(req.params.id)), eq(s.userId, req.userId)))
    .returning({ id: s.id });
  if (!row) return res.status(404).json({ error: 'Session not found.' });
  res.json({ ok: true });
});

export default router;
