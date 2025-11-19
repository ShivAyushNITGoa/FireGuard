import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createHmac } from "https://deno.land/std@0.208.0/crypto/mod.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const WEBHOOK_SECRET = Deno.env.get("WEBHOOK_SECRET");

interface AlertPayload {
  device_id: string;
  message: string;
  severity: string;
  temp?: number;
  gas?: number;
  humidity?: number;
  flame?: number;
  location?: string;
  email?: string;
  time?: string;
  alert_id?: string;
  severity_emoji?: string;
  severity_color?: string;
  temperature?: string;
  gas_reading?: string;
  humidity_formatted?: string;
  flame_status?: string;
}

interface WebhookPayload {
  type: string;
  table: string;
  record: AlertPayload;
  schema: string;
  old_record: null | AlertPayload;
}

// Verify webhook signature
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const encoder = new TextEncoder();
  const key = encoder.encode(secret);
  const data = encoder.encode(payload);

  const hmac = createHmac("sha256", key);
  hmac.update(data);
  const digest = hmac.digest("hex");

  return digest === signature;
}

// Format sensor values
function formatSensorValue(value: number | undefined, unit: string): string {
  if (value === undefined || value === null) return "";
  return `${value.toFixed(1)}${unit}`;
}

// Map severity to emoji and color
function getSeverityStyle(severity: string): { emoji: string; color: string } {
  const styles: Record<string, { emoji: string; color: string }> = {
    critical: { emoji: "🚨", color: "#DC2626" },
    high: { emoji: "⚠️", color: "#EA580C" },
    medium: { emoji: "⚡", color: "#F59E0B" },
    low: { emoji: "ℹ️", color: "#10B981" },
  };
  return styles[severity] || { emoji: "🔔", color: "#6B7280" };
}

// Generate HTML email
function generateEmailHTML(alert: AlertPayload): string {
  const { emoji, color } = getSeverityStyle(alert.severity || "low");
  const location = alert.location || "Building A - Floor 1";
  const timestamp = alert.time ? new Date(alert.time).toLocaleString() : new Date().toLocaleString();

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; }
    .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
    .header { background: linear-gradient(135deg, ${color} 0%, ${color}cc 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; }
    .header .emoji { font-size: 40px; margin-bottom: 10px; }
    .content { padding: 20px 0; }
    .alert-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 15px 0; border-radius: 4px; }
    .sensor-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
    .sensor-card { background: #f8f9fa; border: 1px solid #dee2e6; padding: 15px; border-radius: 6px; }
    .sensor-label { font-size: 12px; color: #6c757d; text-transform: uppercase; font-weight: bold; }
    .sensor-value { font-size: 20px; font-weight: bold; color: #212529; margin-top: 8px; }
    .location-banner { background: #3b82f6; color: white; padding: 15px; border-radius: 6px; margin: 20px 0; text-align: center; }
    .location-banner strong { font-size: 18px; display: block; margin-top: 8px; }
    .device-info { background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0; font-size: 14px; }
    .buttons { text-align: center; margin: 25px 0; }
    .button { display: inline-block; background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin: 0 5px; }
    .footer { text-align: center; padding-top: 20px; border-top: 1px solid #dee2e6; font-size: 12px; color: #6c757d; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="emoji">${emoji}</div>
      <h1>FireGuard Alert</h1>
      <p>${(alert.severity || "low").toUpperCase()} Severity</p>
    </div>

    <div class="content">
      <div class="alert-box">
        <strong>Alert:</strong> ${alert.message || "No message"}
      </div>

      <div class="location-banner">
        📍 Location<br>
        <strong>${location}</strong>
      </div>

      <h3 style="margin-top: 25px; margin-bottom: 15px;">🌡️ Sensor Readings</h3>
      <div class="sensor-grid">
        ${alert.temp !== undefined ? `
        <div class="sensor-card">
          <div class="sensor-label">Temperature</div>
          <div class="sensor-value">${formatSensorValue(alert.temp, "°C")}</div>
        </div>
        ` : ""}
        ${alert.humidity !== undefined ? `
        <div class="sensor-card">
          <div class="sensor-label">Humidity</div>
          <div class="sensor-value">${formatSensorValue(alert.humidity, "%")}</div>
        </div>
        ` : ""}
        ${alert.gas !== undefined ? `
        <div class="sensor-card">
          <div class="sensor-label">Air Quality</div>
          <div class="sensor-value">${formatSensorValue(alert.gas, " AQI")}</div>
        </div>
        ` : ""}
        ${alert.flame !== undefined ? `
        <div class="sensor-card">
          <div class="sensor-label">Flame Detection</div>
          <div class="sensor-value">${alert.flame === 0 ? "🔥 DETECTED" : "✓ Clear"}</div>
        </div>
        ` : ""}
      </div>

      <div class="device-info">
        <strong>Device ID:</strong> ${alert.device_id || "Unknown"}<br>
        <strong>Time:</strong> ${timestamp}<br>
        ${alert.alert_id ? `<strong>Alert ID:</strong> ${alert.alert_id}` : ""}
      </div>

      <div class="buttons">
        <a href="https://fireguard.thegdevelopers.online/dashboard" class="button">📊 View Dashboard</a>
        <a href="https://fireguard.thegdevelopers.online/settings" class="button">⚙️ Settings</a>
      </div>
    </div>

    <div class="footer">
      <p>🔥 FireGuard - Advanced Fire & Safety Monitoring System</p>
      <p>This is an automated alert from your FireGuard system</p>
    </div>
  </div>
</body>
</html>
  `;
}

// Send email via Resend
async function sendEmailViaResend(
  to: string,
  subject: string,
  html: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "FireGuard Alerts <alerts@fireguard.thegdevelopers.online>",
        to: to,
        subject: subject,
        html: html,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Main handler
serve(async (req) => {
  // Only accept POST
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    // Get signature from headers
    const signature = req.headers.get("x-webhook-signature");
    if (!signature) {
      return new Response("Missing webhook signature", { status: 401 });
    }

    // Get raw body for signature verification
    const body = await req.text();

    // Verify signature
    if (WEBHOOK_SECRET && !verifyWebhookSignature(body, signature, WEBHOOK_SECRET)) {
      return new Response("Invalid webhook signature", { status: 401 });
    }

    // Parse payload
    const payload: WebhookPayload = JSON.parse(body);

    // Only process INSERT events
    if (payload.type !== "INSERT") {
      return new Response("Event type not supported", { status: 200 });
    }

    const alert = payload.record;

    // Validate required fields
    if (!alert.email || !alert.message) {
      return new Response("Missing required fields", { status: 400 });
    }

    // Generate email
    const severity = alert.severity || "low";
    const emoji = getSeverityStyle(severity).emoji;
    const subject = `${emoji} FireGuard Alert: ${severity.toUpperCase()} - ${alert.message}`;
    const html = generateEmailHTML(alert);

    // Send email
    const emailResult = await sendEmailViaResend(alert.email, subject, html);

    if (!emailResult.success) {
      console.error("Email send failed:", emailResult.error);
      return new Response(
        JSON.stringify({ error: emailResult.error }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Email sent" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
