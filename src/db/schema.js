import {
  pgTable, serial, integer, text, boolean, date, timestamp, doublePrecision, index, check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const mcqSessions = pgTable('mcq_sessions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  sessionDate: date('session_date').notNull(),
  subject: text('subject').notNull().default(''),
  total: integer('total').notNull(),
  timeMinutes: integer('time_minutes').notNull().default(0),
  // A conceptually correct, B retrieval failure, C conceptual error, D new learning, E confusion
  a: integer('a').notNull().default(0),
  b: integer('b').notNull().default(0),
  c: integer('c').notNull().default(0),
  d: integer('d').notNull().default(0),
  e: integer('e').notNull().default(0),
  learningScore: doublePrecision('learning_score').notNull(),
  conceptualClarity: doublePrecision('conceptual_clarity').notNull(),
  previouslyLearned: doublePrecision('previously_learned'),
  retrievalReliability: doublePrecision('retrieval_reliability'),
  mcqsPerHour: doublePrecision('mcqs_per_hour'),
  priority1: text('priority_1').notNull().default(''),
  priority2: text('priority_2').notNull().default(''),
  priority3: text('priority_3').notNull().default(''),
  reassessmentDate: date('reassessment_date'),
  mistakesReviewed: boolean('mistakes_reviewed').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('mcq_sessions_user_date_idx').on(t.userId, t.sessionDate),
  check('mcq_sessions_total_positive', sql`${t.total} >= 1`),
  check('mcq_sessions_counts_match', sql`${t.a} + ${t.b} + ${t.c} + ${t.d} + ${t.e} = ${t.total}`),
]);
