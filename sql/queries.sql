-- ============================================================
-- Q3.1  Insert subscriber baru: Fajar, Basic, aktivasi 24 Januari 2024
-- ============================================================
INSERT INTO subscribers (id, name, plan, activation_date)
VALUES ('SUB07', 'Fajar', 'Basic', '2024-01-24');

-- ============================================================
-- Q3.2  Ubah plan Fajar menjadi Premium
--       (pakai primary key, bukan name, karena name tidak dijamin unik)
-- ============================================================
UPDATE subscribers
SET    plan = 'Premium'
WHERE  id = 'SUB07';

-- ============================================================
-- Q3.3  Total data usage (semua snapshot) seluruh subscriber Premium
-- ============================================================
SELECT COALESCE(SUM(u.data_usage_mb), 0) AS total_premium_data_mb
FROM   subscriber_usage u
JOIN   subscribers s ON s.id = u.subscriber_id
WHERE  s.plan = 'Premium';

-- ============================================================
-- Q3.4  Top 3 subscriber berdasarkan total data usage
--       (id sebagai tie-breaker agar urutan deterministik)
-- ============================================================
SELECT s.id,
       s.name,
       SUM(u.data_usage_mb) AS total_data_mb
FROM   subscriber_usage u
JOIN   subscribers s ON s.id = u.subscriber_id
GROUP  BY s.id, s.name
ORDER  BY total_data_mb DESC, s.id ASC
LIMIT  3;
-- SQL Server: ganti LIMIT 3 dengan SELECT TOP 3 ...; Oracle 12c+: FETCH FIRST 3 ROWS ONLY.

-- ============================================================
-- Q3.5  Subquery: subscriber dengan rata-rata call minutes per snapshot <= 30
-- ============================================================
SELECT s.id, 
       s.name, 
       s.plan, 
       ROUND(AVG(u.call_minutes), 2) AS avg_call_minutes
FROM   subscribers s
JOIN   subscriber_usage u ON s.id = u.subscriber_id
GROUP  BY s.id, s.name, s.plan
HAVING AVG(u.call_minutes) <= 30
ORDER  BY s.id;
