-- Migration 034: 3 studenți de test cu parola Test1234! pentru validare live
-- Atribuiți în grupa 1 (Informatică an 1, seria A — 9 cursuri active).
-- INSERT OR IGNORE → idempotent la fiecare boot.

INSERT OR IGNORE INTO users (id, email, password_hash, first_name, last_name, role, group_id, program_id, year, is_active) VALUES
  (9091, 'test.student1@ecd.ro', '$2a$10$015p2FN5/JKkkjzTNBN3DuVInchOs0ra1Z5LIT0q8/ldcHX/Vka3K', 'Test', 'Student1', 'student', 1, 1, 1, 1),
  (9092, 'test.student2@ecd.ro', '$2a$10$015p2FN5/JKkkjzTNBN3DuVInchOs0ra1Z5LIT0q8/ldcHX/Vka3K', 'Test', 'Student2', 'student', 2, 1, 1, 1),
  (9093, 'test.student3@ecd.ro', '$2a$10$015p2FN5/JKkkjzTNBN3DuVInchOs0ra1Z5LIT0q8/ldcHX/Vka3K', 'Test', 'Student3', 'student', 3, 1, 1, 1);
