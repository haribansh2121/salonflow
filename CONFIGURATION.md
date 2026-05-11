# SalonFlow Platform Configuration Guide

This document outlines all the necessary configurations, environment variables, and system settings required to run and manage the SalonFlow SaaS platform.

## 1. Environment Variables (`.env`)

These are the core environment variables required for the backend server (`backend/.env`).

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `PORT` | The port the Node.js backend runs on. | `5005` |
| `DB_HOST` | MySQL database host address. | `localhost` |
| `DB_USER` | MySQL database user. | `root` |
| `DB_PASS` | MySQL database password. | `password` |
| `DB_NAME` | MySQL database name. | `salon_flow` |
| `JWT_SECRET` | Secret key used for signing authentication tokens. | `your_super_secret_key` |

---

## 2. Global Tenant Settings (SaaS Main Salon)

These settings are managed in the database (`TenantSetting` table) and affect the global operations of the main salon. They can be configured via the **Settings Dashboard**.

### Feature Toggles
*   **`enableRegistration`**: (Numeric: `1` or `0`). Determines if the "Setup New Salon" feature is visible in the frontend to admins. `1` = Enabled, `0` = Disabled.

### Branding & Billing Configuration
*   **`salonName`**: The display name of the main salon (e.g., "Glow Up Salon").
*   **`billHeader` / `billFooter`**: Custom text printed on invoices and receipts.
*   **`billDesign`**: Receipt layout style (`classic`, `modern`, `minimal`).
*   **`pageSize`**: Print format (`A4`, `A5`, `Thermal80`, `Thermal58`).
*   **`currency`**: The primary currency code (e.g., `INR`, `USD`).

---

## 3. Communication & External APIs

The platform uses a plug-and-play architecture for external services. **These can be configured globally (Tenant level) OR overridden at the Branch level.**

### Messaging APIs
*   **`whatsappApiKey`**: API key for sending WhatsApp messages (e.g., Meta Graph API integration).
*   **`smsApiKey`**: API key for sending standard SMS (e.g., Twilio).

### Email SMTP Configuration (Default Priority)
Used for sending booking confirmations, reports, and marketing emails.
*   **`smtpHost`**: Your SMTP server (e.g., `smtp.hostinger.com` or `smtp.gmail.com`).
*   **`smtpPort`**: Port number (usually `465` for secure SSL).
*   **`smtpUser`**: The email address used for authentication.
*   **`smtpPass`**: The App Password or SMTP password.

### Payment Gateway
*   **`stripePublishableKey`**: Public key for Stripe checkout integrations.
*   **`stripeSecretKey`**: Secret key for server-side Stripe processing.

---

## 4. Branch-Level Configurations (Overrides)

The system supports granular control for multi-branch operations. Settings configured at the branch level will **override** the global tenant settings for actions performed within that specific branch.

| Branch Setting | Description |
| :--- | :--- |
| **`openingTime`** | Branch opening hours (e.g., `09:00`). Appointments cannot be booked before this. |
| **`closingTime`** | Branch closing hours (e.g., `21:00`). Appointments cannot be booked after this. |
| **`enableAutomation`** | Boolean toggle. If `false`, automated campaigns (like birthday wishes) will not be sent to customers associated with this branch. |
| **`whatsappApiKey`** | Overrides the global WhatsApp API key for this branch. |
| **`smsApiKey`** | Overrides the global SMS API key for this branch. |
| **`smtpHost`, `smtpUser`, etc.** | Allows a branch to send emails from its own dedicated email address/server. |
| **`stripePublishableKey` / `SecretKey`** | Allows a branch to route payments to its own dedicated Stripe account. |

---

## 5. Automation Configuration

Automated tasks (like birthday wishes) are managed via a cron job in the backend (`backend/services/automation.js`). 

*   **`autoBirthdayWish`**: Boolean toggle in the main settings to globally enable/disable birthday messages.
*   **`birthdayMessage`**: Custom template string. Use `{name}` as a placeholder to dynamically inject the customer's name.
*   **`autoBookingConfirm`**: Boolean toggle to automatically dispatch WhatsApp/Email confirmations when an appointment is created.

*Note: Automation execution checks both the global `autoBirthdayWish` flag AND the specific branch's `enableAutomation` flag before dispatching.*

---

## 6. Online Booking Configuration

The platform provides a public-facing booking widget that can be embedded into any external website (e.g., WordPress, custom HTML). 

### External Website Integration
To embed the booking flow on your website, copy and paste the following `iframe` code into your site's HTML editor:

```html
<!-- SalonFlow Booking Widget -->
<iframe 
  src="https://your-salonflow-domain.com/book/YOUR_TENANT_ID" 
  width="100%" 
  height="800px" 
  style="border: none; border-radius: 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);"
  title="Book Appointment"
></iframe>
```

### Embed Configuration Variables

| Variable | Description | Example |
| :--- | :--- | :--- |
| `your-salonflow-domain.com` | The exact URL where your Next.js frontend is hosted. | `app.mysalon.com` |
| `YOUR_TENANT_ID` | The unique identifier for the specific salon/tenant. | `default-salon` |

### Dual-Notification Flow
Upon a successful booking from the widget, the system triggers the following real-time alerts:

*   **Customer Alert**: Instantly dispatches an Email/WhatsApp confirmation containing the appointment date, time, and service details.
*   **Staff/Admin Alert**: Automatically notifies the assigned Staff Member via email. If no staff is assigned, the alert falls back to the main `smtpUser` configured in the global settings.
