-- Migration: Add platform deadline functionality
-- This adds the ability to set a specific deadline date/time for platform closure

-- Add new columns to platform_settings
ALTER TABLE platform_settings ADD COLUMN evaluation_deadline_enabled BOOLEAN DEFAULT 0;
ALTER TABLE platform_settings ADD COLUMN evaluation_deadline_date DATETIME DEFAULT NULL;
ALTER TABLE platform_settings ADD COLUMN auto_close_on_deadline BOOLEAN DEFAULT 0;

-- Notes:
-- evaluation_deadline_enabled: Whether the deadline feature is active
-- evaluation_deadline_date: The exact date/time when evaluations should close
-- auto_close_on_deadline: Whether to automatically close platform when deadline is reached
-- reminder_days: Still used to send reminders X days before the deadline
