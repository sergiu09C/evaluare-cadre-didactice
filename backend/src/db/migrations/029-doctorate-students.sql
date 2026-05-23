-- Migration 029: doctoranzi (studenți la programele doctorat)
--
-- Cerere user: „Încă nu avem studenți la doctorat."
-- Cauza: migrarea 026 a creat programs + study_years + courses + evaluations
-- DAR nu și series + groups + users → 0 doctoranzi în structura academică.
--
-- Acum adaug:
--   - 15 serii (1 per study_year doctorat 51-65)
--   - 15 grupe (1 per serie)
--   - 90 doctoranzi (6 per grupă × 15) cu ID-uri 9001-9090
--   - parolă: aceeași hash ca restul studenților (password123)
--
-- ID-uri fixe pentru idempotență (INSERT OR IGNORE).

-- =====================================================================
-- PASUL 1: 1 serie per study_year doctorat (id 51-65)
-- =====================================================================
INSERT OR IGNORE INTO series (id, study_year_id, name) VALUES
  (101, 51, 'D1'), (102, 52, 'D1'), (103, 53, 'D1'),
  (104, 54, 'D1'), (105, 55, 'D1'), (106, 56, 'D1'),
  (107, 57, 'D1'), (108, 58, 'D1'), (109, 59, 'D1'),
  (110, 60, 'D1'), (111, 61, 'D1'), (112, 62, 'D1'),
  (113, 63, 'D1'), (114, 64, 'D1'), (115, 65, 'D1');

-- =====================================================================
-- PASUL 2: 1 grupă per serie
-- =====================================================================
INSERT OR IGNORE INTO groups (id, series_id, number) VALUES
  (301, 101, 1), (302, 102, 1), (303, 103, 1),
  (304, 104, 1), (305, 105, 1), (306, 106, 1),
  (307, 107, 1), (308, 108, 1), (309, 109, 1),
  (310, 110, 1), (311, 111, 1), (312, 112, 1),
  (313, 113, 1), (314, 114, 1), (315, 115, 1);

-- =====================================================================
-- PASUL 3: 90 doctoranzi (6 per grupă × 15 grupe)
-- ID-uri 9001-9090, email doctorand{N}@univ.ro, password123
-- =====================================================================
INSERT OR IGNORE INTO users (id, email, password_hash, first_name, last_name, role, group_id, year, is_active) VALUES
  -- Grupa 301 (Doctorat Informatică an 1)
  (9001,'doctorand1@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Andrei','Doctorand','student',301,1,1),
  (9002,'doctorand2@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Bianca','Doctorand','student',301,1,1),
  (9003,'doctorand3@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Cristian','Doctorand','student',301,1,1),
  (9004,'doctorand4@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Diana','Doctorand','student',301,1,1),
  (9005,'doctorand5@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Eugen','Doctorand','student',301,1,1),
  (9006,'doctorand6@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Florina','Doctorand','student',301,1,1),
  -- Grupa 302 (Doctorat Informatică an 2)
  (9007,'doctorand7@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Gabriel','Doctorand','student',302,2,1),
  (9008,'doctorand8@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Horia','Doctorand','student',302,2,1),
  (9009,'doctorand9@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Ioana','Doctorand','student',302,2,1),
  (9010,'doctorand10@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Iulia','Doctorand','student',302,2,1),
  (9011,'doctorand11@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Lucian','Doctorand','student',302,2,1),
  (9012,'doctorand12@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Marius','Doctorand','student',302,2,1),
  -- Grupa 303 (Doctorat Informatică an 3)
  (9013,'doctorand13@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Nicoleta','Doctorand','student',303,3,1),
  (9014,'doctorand14@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Octavian','Doctorand','student',303,3,1),
  (9015,'doctorand15@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Patricia','Doctorand','student',303,3,1),
  (9016,'doctorand16@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Radu','Doctorand','student',303,3,1),
  (9017,'doctorand17@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Simona','Doctorand','student',303,3,1),
  (9018,'doctorand18@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Tudor','Doctorand','student',303,3,1),
  -- Grupa 304 (Doctorat Matematică an 1)
  (9019,'doctorand19@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Vlad','Doctorand','student',304,1,1),
  (9020,'doctorand20@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Alexandra','Doctorand','student',304,1,1),
  (9021,'doctorand21@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Bogdan','Doctorand','student',304,1,1),
  (9022,'doctorand22@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Camelia','Doctorand','student',304,1,1),
  (9023,'doctorand23@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Daniel','Doctorand','student',304,1,1),
  (9024,'doctorand24@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Elena','Doctorand','student',304,1,1),
  -- Grupa 305 (Doctorat Matematică an 2)
  (9025,'doctorand25@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Florin','Doctorand','student',305,2,1),
  (9026,'doctorand26@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Gabriela','Doctorand','student',305,2,1),
  (9027,'doctorand27@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Horea','Doctorand','student',305,2,1),
  (9028,'doctorand28@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Irina','Doctorand','student',305,2,1),
  (9029,'doctorand29@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Justin','Doctorand','student',305,2,1),
  (9030,'doctorand30@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Karina','Doctorand','student',305,2,1),
  -- Grupa 306 (Doctorat Matematică an 3)
  (9031,'doctorand31@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Liviu','Doctorand','student',306,3,1),
  (9032,'doctorand32@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Mihaela','Doctorand','student',306,3,1),
  (9033,'doctorand33@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Narcisa','Doctorand','student',306,3,1),
  (9034,'doctorand34@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Ovidiu','Doctorand','student',306,3,1),
  (9035,'doctorand35@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Petruta','Doctorand','student',306,3,1),
  (9036,'doctorand36@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Raluca','Doctorand','student',306,3,1),
  -- Grupa 307 (Doctorat Fizică an 1)
  (9037,'doctorand37@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Sebastian','Doctorand','student',307,1,1),
  (9038,'doctorand38@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Teodora','Doctorand','student',307,1,1),
  (9039,'doctorand39@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Ursula','Doctorand','student',307,1,1),
  (9040,'doctorand40@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Valentin','Doctorand','student',307,1,1),
  (9041,'doctorand41@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Walter','Doctorand','student',307,1,1),
  (9042,'doctorand42@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Xenia','Doctorand','student',307,1,1),
  -- Grupa 308 (Doctorat Fizică an 2)
  (9043,'doctorand43@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Yvonne','Doctorand','student',308,2,1),
  (9044,'doctorand44@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Zaharia','Doctorand','student',308,2,1),
  (9045,'doctorand45@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Adrian','Doctorand','student',308,2,1),
  (9046,'doctorand46@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Beatrice','Doctorand','student',308,2,1),
  (9047,'doctorand47@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Codrin','Doctorand','student',308,2,1),
  (9048,'doctorand48@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Delia','Doctorand','student',308,2,1),
  -- Grupa 309 (Doctorat Fizică an 3)
  (9049,'doctorand49@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Edmond','Doctorand','student',309,3,1),
  (9050,'doctorand50@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Fabia','Doctorand','student',309,3,1),
  (9051,'doctorand51@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Gheorghe','Doctorand','student',309,3,1),
  (9052,'doctorand52@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Hortensia','Doctorand','student',309,3,1),
  (9053,'doctorand53@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Iancu','Doctorand','student',309,3,1),
  (9054,'doctorand54@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Jasmina','Doctorand','student',309,3,1),
  -- Grupa 310 (Doctorat Electronică an 1)
  (9055,'doctorand55@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Kalman','Doctorand','student',310,1,1),
  (9056,'doctorand56@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Loredana','Doctorand','student',310,1,1),
  (9057,'doctorand57@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Mircea','Doctorand','student',310,1,1),
  (9058,'doctorand58@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Natalia','Doctorand','student',310,1,1),
  (9059,'doctorand59@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Octav','Doctorand','student',310,1,1),
  (9060,'doctorand60@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Paula','Doctorand','student',310,1,1),
  -- Grupa 311 (Doctorat Electronică an 2)
  (9061,'doctorand61@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Quirin','Doctorand','student',311,2,1),
  (9062,'doctorand62@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Roxana','Doctorand','student',311,2,1),
  (9063,'doctorand63@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Stelian','Doctorand','student',311,2,1),
  (9064,'doctorand64@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Tatiana','Doctorand','student',311,2,1),
  (9065,'doctorand65@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Ulise','Doctorand','student',311,2,1),
  (9066,'doctorand66@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Vasilica','Doctorand','student',311,2,1),
  -- Grupa 312 (Doctorat Electronică an 3)
  (9067,'doctorand67@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Wilhelm','Doctorand','student',312,3,1),
  (9068,'doctorand68@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Xander','Doctorand','student',312,3,1),
  (9069,'doctorand69@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Yana','Doctorand','student',312,3,1),
  (9070,'doctorand70@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Zeno','Doctorand','student',312,3,1),
  (9071,'doctorand71@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Aron','Doctorand','student',312,3,1),
  (9072,'doctorand72@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Brigitta','Doctorand','student',312,3,1),
  -- Grupa 313 (Doctorat Automatică an 1)
  (9073,'doctorand73@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Costel','Doctorand','student',313,1,1),
  (9074,'doctorand74@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Daria','Doctorand','student',313,1,1),
  (9075,'doctorand75@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Emilian','Doctorand','student',313,1,1),
  (9076,'doctorand76@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Felicia','Doctorand','student',313,1,1),
  (9077,'doctorand77@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Grigore','Doctorand','student',313,1,1),
  (9078,'doctorand78@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Henrieta','Doctorand','student',313,1,1),
  -- Grupa 314 (Doctorat Automatică an 2)
  (9079,'doctorand79@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Iacob','Doctorand','student',314,2,1),
  (9080,'doctorand80@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Jenica','Doctorand','student',314,2,1),
  (9081,'doctorand81@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Kornel','Doctorand','student',314,2,1),
  (9082,'doctorand82@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Letitia','Doctorand','student',314,2,1),
  (9083,'doctorand83@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Marin','Doctorand','student',314,2,1),
  (9084,'doctorand84@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Nadia','Doctorand','student',314,2,1),
  -- Grupa 315 (Doctorat Automatică an 3)
  (9085,'doctorand85@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Olimpia','Doctorand','student',315,3,1),
  (9086,'doctorand86@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Pavel','Doctorand','student',315,3,1),
  (9087,'doctorand87@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Romulus','Doctorand','student',315,3,1),
  (9088,'doctorand88@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Silvana','Doctorand','student',315,3,1),
  (9089,'doctorand89@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Toma','Doctorand','student',315,3,1),
  (9090,'doctorand90@univ.ro','$2a$10$4jnKhf7XJO7RR6k7k4QgzuS3T7wG7OQSfx8JosbXLGzo9BjOc44TG','Veronica','Doctorand','student',315,3,1);
