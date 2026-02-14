-- Migration: Add email notification settings
-- This adds email configuration for sending notifications to students

ALTER TABLE platform_settings ADD COLUMN email_enabled BOOLEAN DEFAULT 0;
ALTER TABLE platform_settings ADD COLUMN email_host VARCHAR(255) DEFAULT NULL;
ALTER TABLE platform_settings ADD COLUMN email_port INTEGER DEFAULT 587;
ALTER TABLE platform_settings ADD COLUMN email_secure BOOLEAN DEFAULT 0;
ALTER TABLE platform_settings ADD COLUMN email_user VARCHAR(255) DEFAULT NULL;
ALTER TABLE platform_settings ADD COLUMN email_password VARCHAR(255) DEFAULT NULL;
ALTER TABLE platform_settings ADD COLUMN email_from_name VARCHAR(255) DEFAULT 'Platformă Evaluare';
ALTER TABLE platform_settings ADD COLUMN email_from_address VARCHAR(255) DEFAULT NULL;
ALTER TABLE platform_settings ADD COLUMN send_email_on_message BOOLEAN DEFAULT 1;

-- Notes:
-- email_enabled: Master switch for email functionality
-- email_host: SMTP server host (e.g., smtp.gmail.com)
-- email_port: SMTP port (usually 587 for TLS, 465 for SSL)
-- email_secure: Whether to use SSL/TLS
-- email_user: SMTP authentication username
-- email_password: SMTP authentication password
-- email_from_name: Display name for sent emails
-- email_from_address: Email address to send from
-- send_email_on_message: Whether to send email notifications when messages are posted
