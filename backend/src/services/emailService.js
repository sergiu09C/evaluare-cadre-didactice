const nodemailer = require('nodemailer');
const { getDatabase } = require('../config/database');

/**
 * Email Service for sending notifications
 * Uses nodemailer with SMTP configuration from platform settings
 */

class EmailService {
  constructor() {
    this.transporter = null;
  }

  /**
   * Initialize email transporter with settings from database
   */
  async initializeTransporter() {
    try {
      const db = getDatabase();
      const settings = db.prepare(`
        SELECT email_enabled, email_host, email_port, email_secure,
               email_user, email_password, email_from_name, email_from_address
        FROM platform_settings
        WHERE id = 1
      `).get();

      if (!settings || !settings.email_enabled) {
        console.log('📧 Email notifications are disabled');
        this.transporter = null;
        return false;
      }

      // Create transporter
      this.transporter = nodemailer.createTransporter({
        host: settings.email_host,
        port: settings.email_port,
        secure: settings.email_secure === 1, // true for 465, false for other ports
        auth: {
          user: settings.email_user,
          pass: settings.email_password
        }
      });

      // Verify connection
      await this.transporter.verify();
      console.log('✅ Email service initialized successfully');
      return true;

    } catch (error) {
      console.error('❌ Email service initialization failed:', error.message);
      this.transporter = null;
      return false;
    }
  }

  /**
   * Send a test email to verify configuration
   * @param {string} testEmail - Email address to send test message to
   */
  async sendTestEmail(testEmail) {
    await this.initializeTransporter();

    if (!this.transporter) {
      throw new Error('Email service not configured or disabled');
    }

    const db = getDatabase();
    const settings = db.prepare('SELECT email_from_name, email_from_address FROM platform_settings WHERE id = 1').get();

    const mailOptions = {
      from: `"${settings.email_from_name}" <${settings.email_from_address}>`,
      to: testEmail,
      subject: 'Test Email - Platformă Evaluare Cadre Didactice',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3b82f6;">Email de Test</h2>
          <p>Acesta este un email de test pentru a verifica configurația sistemului de notificări.</p>
          <p>Dacă primiți acest mesaj, înseamnă că sistemul de email funcționează corect.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 12px;">
            Platformă Evaluare Cadre Didactice<br>
            ${new Date().toLocaleString('ro-RO')}
          </p>
        </div>
      `
    };

    const info = await this.transporter.sendMail(mailOptions);
    console.log('📧 Test email sent:', info.messageId);
    return info;
  }

  /**
   * Send notification email to students when a new message is posted
   * @param {Object} message - Message object with title, content, etc.
   * @param {Array} recipients - Array of user objects with email addresses
   */
  async sendMessageNotification(message, recipients) {
    await this.initializeTransporter();

    if (!this.transporter || !recipients || recipients.length === 0) {
      console.log('📧 Email notifications skipped (disabled or no recipients)');
      return;
    }

    const db = getDatabase();
    const settings = db.prepare('SELECT email_from_name, email_from_address FROM platform_settings WHERE id = 1').get();

    // Get base URL from environment or use default
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    const mailOptions = {
      from: `"${settings.email_from_name}" <${settings.email_from_address}>`,
      subject: `Mesaj nou: ${message.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Mesaj Nou</h1>
          </div>

          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #1f2937; margin-top: 0;">${message.title}</h2>
            <div style="color: #4b5563; line-height: 1.6; margin: 20px 0;">
              ${message.content.replace(/\n/g, '<br>')}
            </div>

            <div style="margin: 30px 0; padding: 15px; background: #f3f4f6; border-radius: 8px;">
              <p style="margin: 0; color: #6b7280; font-size: 14px;">
                <strong>Trimis de:</strong> Administrator<br>
                <strong>Data:</strong> ${new Date(message.created_at).toLocaleString('ro-RO')}
              </p>
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <a href="${baseUrl}"
                 style="display: inline-block; padding: 12px 30px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">
                Accesează Platforma
              </a>
            </div>
          </div>

          <div style="margin-top: 20px; padding: 20px; background: #f9fafb; border-radius: 8px; text-align: center;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">
              Platformă Evaluare Cadre Didactice<br>
              Acest email a fost trimis automat. Nu răspundeți la acest mesaj.
            </p>
          </div>
        </div>
      `
    };

    // Send emails in batches to avoid overwhelming the SMTP server
    const batchSize = 50;
    let sentCount = 0;
    let failedCount = 0;

    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);

      try {
        // Send to each recipient in batch
        await Promise.all(
          batch.map(async (recipient) => {
            try {
              await this.transporter.sendMail({
                ...mailOptions,
                to: recipient.email
              });
              sentCount++;
            } catch (err) {
              console.error(`Failed to send email to ${recipient.email}:`, err.message);
              failedCount++;
            }
          })
        );

        // Small delay between batches to avoid rate limiting
        if (i + batchSize < recipients.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error('Batch email sending error:', error);
        failedCount += batch.length;
      }
    }

    console.log(`📧 Message notification sent: ${sentCount} successful, ${failedCount} failed`);
    return { sent: sentCount, failed: failedCount };
  }

  /**
   * Send reminder email to students about pending evaluations
   * @param {Array} students - Array of students with pending evaluations
   */
  async sendReminderEmails(students) {
    await this.initializeTransporter();

    if (!this.transporter || !students || students.length === 0) {
      console.log('📧 Reminder emails skipped (disabled or no recipients)');
      return;
    }

    const db = getDatabase();
    const settings = db.prepare('SELECT email_from_name, email_from_address FROM platform_settings WHERE id = 1').get();
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    let sentCount = 0;
    let failedCount = 0;

    for (const student of students) {
      try {
        const mailOptions = {
          from: `"${settings.email_from_name}" <${settings.email_from_address}>`,
          to: student.email,
          subject: 'Reminder: Evaluări Incomplete',
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">⏰ Reminder Evaluări</h1>
              </div>

              <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
                <p style="color: #1f2937; font-size: 16px;">Bună, ${student.firstName}!</p>

                <p style="color: #4b5563; line-height: 1.6;">
                  Ai <strong>${student.pendingCount}</strong> evaluări incomplete pentru cadrele didactice.
                </p>

                <p style="color: #4b5563; line-height: 1.6;">
                  Feedback-ul tău este important pentru îmbunătățirea calității procesului de predare.
                  Te rugăm să completezi evaluările cât mai curând posibil.
                </p>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="${baseUrl}"
                     style="display: inline-block; padding: 12px 30px; background: #f59e0b; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">
                    Completează Evaluările
                  </a>
                </div>
              </div>

              <div style="margin-top: 20px; padding: 20px; background: #f9fafb; border-radius: 8px; text-align: center;">
                <p style="color: #6b7280; font-size: 12px; margin: 0;">
                  Platformă Evaluare Cadre Didactice
                </p>
              </div>
            </div>
          `
        };

        await this.transporter.sendMail(mailOptions);
        sentCount++;
      } catch (error) {
        console.error(`Failed to send reminder to ${student.email}:`, error.message);
        failedCount++;
      }

      // Small delay between emails
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`📧 Reminder emails sent: ${sentCount} successful, ${failedCount} failed`);
    return { sent: sentCount, failed: failedCount };
  }

  /**
   * Trimite link-ul de resetare parolă către user.
   * Fallback la log în consolă dacă SMTP nu e configurat.
   */
  async sendPasswordReset(toEmail, resetUrl) {
    await this.initializeTransporter();
    if (!this.transporter) {
      console.log(`[email/fallback] Reset password pentru ${toEmail}: ${resetUrl}`);
      return { ok: false, reason: 'smtp_not_configured' };
    }
    try {
      const db = getDatabase();
      const settings = db.prepare('SELECT email_from_name, email_from_address FROM platform_settings WHERE id = 1').get();
      const from = settings
        ? `"${settings.email_from_name}" <${settings.email_from_address}>`
        : 'noreply@univ.ro';
      await this.transporter.sendMail({
        from,
        to: toEmail,
        subject: 'Resetare parolă — Platforma ECD',
        html: `
          <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: auto;">
            <h2 style="color: #0E2233;">Resetare parolă</h2>
            <p>Ai solicitat resetarea parolei pentru contul tău pe platforma ECD.</p>
            <p>Apasă pe link-ul de mai jos pentru a-ți seta o parolă nouă (valabil 1 oră):</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="display: inline-block; padding: 12px 30px; background: #7C3AED; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">
                Resetează parola
              </a>
            </p>
            <p style="color: #6b7280; font-size: 12px;">
              Dacă nu ai cerut tu această resetare, ignoră acest email.
              Link-ul: <span style="word-break: break-all;">${resetUrl}</span>
            </p>
          </div>
        `,
      });
      return { ok: true };
    } catch (e) {
      console.error('[email] sendPasswordReset failed:', e.message);
      return { ok: false, reason: e.message };
    }
  }
}

// Export singleton instance
module.exports = new EmailService();
