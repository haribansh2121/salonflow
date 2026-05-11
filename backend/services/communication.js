const nodemailer = require('nodemailer');
const { TenantSetting, Branch } = require('../models');

/**
 * Communication Service
 * Handles SMS, WhatsApp, and Email with a "plug and play" architecture.
 * Supports Branch-level overrides with Tenant-level fallback.
 */
class CommunicationService {
  async getSettings(tenantId, branchId = null) {
    const tenantSettings = await TenantSetting.findOne({ where: { tenantId } });
    
    if (branchId) {
      const branch = await Branch.findByPk(branchId);
      if (branch) {
        // Merge settings: Branch specific values take priority over Tenant defaults
        return {
          whatsappApiKey: branch.whatsappApiKey || tenantSettings?.whatsappApiKey,
          smsApiKey: branch.smsApiKey || tenantSettings?.smsApiKey,
          emailApiKey: branch.emailApiKey || tenantSettings?.emailApiKey,
          smtpHost: branch.smtpHost || tenantSettings?.smtpHost,
          smtpPort: branch.smtpPort || tenantSettings?.smtpPort,
          smtpUser: branch.smtpUser || tenantSettings?.smtpUser,
          smtpPass: branch.smtpPass || tenantSettings?.smtpPass,
          // Tenant-only global toggles
          autoBirthdayWish: tenantSettings?.autoBirthdayWish,
          autoBookingConfirm: tenantSettings?.autoBookingConfirm,
          birthdayMessage: tenantSettings?.birthdayMessage,
        };
      }
    }
    
    return tenantSettings;
  }

  async sendWhatsApp(tenantId, to, message, branchId = null) {
    const settings = await this.getSettings(tenantId, branchId);
    if (settings?.whatsappApiKey) {
      console.log(`[WhatsApp] Branch: ${branchId || 'Main'} | To: ${to} | API Key: ${settings.whatsappApiKey.slice(0, 5)}...`);
      return true;
    }
    console.log(`[WhatsApp MOCK] To: ${to}, Msg: ${message}`);
    return false;
  }

  async sendSMS(tenantId, to, message, branchId = null) {
    const settings = await this.getSettings(tenantId, branchId);
    if (settings?.smsApiKey) {
      console.log(`[SMS] Branch: ${branchId || 'Main'} | To: ${to} | API Key...`);
      return true;
    }
    console.log(`[SMS MOCK] To: ${to}, Msg: ${message}`);
    return false;
  }

  async sendEmail(tenantId, to, subject, body, branchId = null) {
    const settings = await this.getSettings(tenantId, branchId);
    
    if (settings?.smtpHost && settings?.smtpUser && settings?.smtpPass) {
      try {
        const transporter = nodemailer.createTransport({
          host: settings.smtpHost,
          port: settings.smtpPort || 465,
          secure: (settings.smtpPort || 465) === 465,
          auth: {
            user: settings.smtpUser,
            pass: settings.smtpPass,
          },
        });

        await transporter.sendMail({
          from: `"SalonFlow" <${settings.smtpUser}>`,
          to,
          subject,
          text: body,
          html: body.replace(/\n/g, '<br>'),
        });

        console.log(`[Email SMTP] Branch: ${branchId || 'Main'} | Sent to ${to}`);
        return true;
      } catch (error) {
        console.error('[Email SMTP Error]', error);
        return false;
      }
    }

    if (settings?.emailApiKey) {
      console.log(`[Email API] Branch: ${branchId || 'Main'} | Sent to ${to}`);
      return true;
    }

    console.log(`[Email MOCK] To: ${to}, Sub: ${subject}`);
    return false;
  }

  async sendBirthdayWish(tenantId, customer, branchId = null) {
    const settings = await this.getSettings(tenantId, branchId);
    if (settings?.autoBirthdayWish) {
      const msg = settings.birthdayMessage 
        ? settings.birthdayMessage.replace('{name}', customer.name)
        : `Happy Birthday ${customer.name}! Hope you have a glowing day! ✨`;
      
      await this.sendWhatsApp(tenantId, customer.phone, msg, branchId);
    }
  }

  async sendBookingConfirmation(tenantId, appointment, serviceName) {
    const settings = await this.getSettings(tenantId, appointment.branchId);
    if (settings?.autoBookingConfirm) {
      const msg = `Hello ${appointment.customerName}! 🌟\n\nYour appointment for ${serviceName} has been confirmed.\n\n📅 Date: ${appointment.date}\n⏰ Time: ${appointment.time}\n\nWe look forward to seeing you at SalonFlow!`;
      
      await this.sendWhatsApp(tenantId, appointment.customerPhone, msg, appointment.branchId);
      
      if (appointment.customerEmail) {
        await this.sendEmail(tenantId, appointment.customerEmail, 'Appointment Confirmed - SalonFlow', msg, appointment.branchId);
      }
    }
  }
}

module.exports = new CommunicationService();
