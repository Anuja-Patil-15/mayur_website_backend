-- Useful queries (the API runs the Drizzle equivalents of these).
-- Replace 1 with a real user id.

-- 1. Register a user (password_hash comes from bcrypt)
INSERT INTO users (name, email, password_hash) VALUES ('Asha', 'asha@example.com', '<bcrypt-hash>') RETURNING id;

-- 2. Find user for login
SELECT * FROM users WHERE email = 'asha@example.com';

-- 3. Save a session
INSERT INTO mcq_sessions
  (user_id, session_date, subject, total, time_minutes, a, b, c, d, e,
   learning_score, conceptual_clarity, previously_learned, retrieval_reliability, mcqs_per_hour,
   priority_1, priority_2, priority_3, reassessment_date, mistakes_reviewed)
VALUES
  (1, CURRENT_DATE, 'Pediatrics - Neonatology', 100, 90, 55, 15, 10, 10, 10,
   (2*55 + 0.5*15 + 10 + 0.5*10) * 100.0 / (2*100),
   55 * 100.0 / 100, 55 * 100.0 / (55+15+10+10), 55 * 100.0 / (55+15), 100 * 60.0 / 90,
   'Neonatal jaundice', 'APGAR scoring', 'Neonatal sepsis', CURRENT_DATE + 2, false);

-- 4. Full history for the dashboard (newest first)
SELECT * FROM mcq_sessions WHERE user_id = 1 ORDER BY session_date DESC, id DESC;

-- 5. History filtered by subject and date range
SELECT * FROM mcq_sessions
WHERE user_id = 1 AND subject ILIKE '%pedia%' AND session_date BETWEEN '2026-10-01' AND '2026-10-31'
ORDER BY session_date DESC;

-- 6. Dashboard totals
SELECT COUNT(*) AS sessions, SUM(total) AS total_mcqs, SUM(time_minutes) AS total_minutes,
       AVG(learning_score) AS avg_learning, AVG(conceptual_clarity) AS avg_clarity,
       SUM(a) AS a, SUM(b) AS b, SUM(c) AS c, SUM(d) AS d, SUM(e) AS e
FROM mcq_sessions WHERE user_id = 1;

-- 7. Weakest subjects first
SELECT subject, COUNT(*) AS sessions, SUM(total) AS total_mcqs, AVG(conceptual_clarity) AS avg_clarity
FROM mcq_sessions WHERE user_id = 1 GROUP BY subject ORDER BY avg_clarity ASC;

-- 8. Topics due for reassessment
SELECT id, subject, priority_1, priority_2, priority_3, reassessment_date
FROM mcq_sessions
WHERE user_id = 1 AND reassessment_date <= CURRENT_DATE AND mistakes_reviewed = false
ORDER BY reassessment_date;

-- 9. Mark mistakes reviewed / delete a session
UPDATE mcq_sessions SET mistakes_reviewed = true WHERE id = 1 AND user_id = 1;
DELETE FROM mcq_sessions WHERE id = 1 AND user_id = 1;
