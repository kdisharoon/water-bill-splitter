export interface Carrier {
  id: string;
  name: string;
  gateway: string; // domain for email-to-sms
}

export const CARRIERS: Carrier[] = [
  { id: "verizon", name: "Verizon Wireless", gateway: "vtext.com" },
  { id: "att", name: "AT&T", gateway: "txt.att.net" },
  { id: "tmobile", name: "T-Mobile", gateway: "tmomail.net" },
  { id: "sprint", name: "Sprint", gateway: "messaging.sprintpcs.com" },
  { id: "uscellular", name: "US Cellular", gateway: "email.uscc.net" },
  { id: "boost", name: "Boost Mobile", gateway: "sms.myboostmobile.com" },
  { id: "cricket", name: "Cricket Wireless", gateway: "mms.cricketwireless.net" },
  { id: "metro", name: "Metro by T-Mobile", gateway: "mymetropcs.com" },
  { id: "googlefi", name: "Google Fi", gateway: "msg.fi.google.com" },
  { id: "mint", name: "Mint Mobile", gateway: "mailmymobile.net" },
  { id: "consumercellular", name: "Consumer Cellular", gateway: "mailmymobile.net" },
  { id: "xfinity", name: "Xfinity Mobile", gateway: "vtext.com" },
  { id: "spectrum", name: "Spectrum Mobile", gateway: "vtext.com" },
];

/**
 * Normalizes a 10-digit US phone number.
 * Strips non-digits and leading +1 / 1.
 */
export function cleanPhoneNumber(rawPhone: string): string | null {
  if (!rawPhone) return null;
  const digits = rawPhone.replace(/\D/g, "");
  if (digits.length === 10) return digits;
  if (digits.length === 11 && digits.startsWith("1")) return digits.slice(1);
  return null;
}

/**
 * Generates the email address for an SMS gateway.
 * e.g. 5551234567@vtext.com
 */
export function getEmailToSmsAddress(phone: string, carrierId: string): string | null {
  const cleanPhone = cleanPhoneNumber(phone);
  if (!cleanPhone) return null;

  const carrier = CARRIERS.find((c) => c.id.toLowerCase() === carrierId.toLowerCase());
  if (!carrier) return null;

  return `${cleanPhone}@${carrier.gateway}`;
}

export interface BillNotificationMessageData {
  tenantName: string;
  monthName: string; // e.g. "October 2026"
  apartmentName: string; // e.g. "Apartment 1"
  cost: number;
  totalBill: number;
  usage?: number | null;
  totalUsage?: number | null;
  ratio?: number | null;
  isVacantOverride?: boolean;
}

/**
 * Formats a clean, concise SMS message.
 * Keep under 160 characters when possible for standard SMS delivery.
 */
export function formatSmsMessage(data: BillNotificationMessageData): string {
  const amountStr = `$${data.cost.toFixed(2)}`;
  return `Water Bill for ${data.monthName} (${data.apartmentName}): Your share is ${amountStr} (Total building bill: $${data.totalBill.toFixed(2)}). Thank you!`;
}

/**
 * Formats a clean HTML email message.
 */
export function formatEmailMessage(data: BillNotificationMessageData): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `Water Bill for ${data.monthName} - ${data.apartmentName}: $${data.cost.toFixed(2)}`;
  const ratioPercent = data.ratio !== undefined && data.ratio !== null ? (data.ratio * 100).toFixed(1) : null;

  const text = `Hello ${data.tenantName},

Here is the water bill breakdown for ${data.monthName} (${data.apartmentName}):

Your Amount Due: $${data.cost.toFixed(2)}
Building Total Bill: $${data.totalBill.toFixed(2)}
${data.usage !== undefined && data.usage !== null ? `Your Water Usage: ${data.usage} units` : ""}
${data.totalUsage !== undefined && data.totalUsage !== null ? `Total Building Usage: ${data.totalUsage} units` : ""}
${ratioPercent ? `Your Share: ${ratioPercent}%` : ""}

Please submit your payment at your earliest convenience.
Thank you!`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #0284c7; margin-top: 0;">Water Bill Notice</h2>
      <p style="font-size: 16px; color: #334155;">Hello <strong>${data.tenantName}</strong>,</p>
      <p style="font-size: 15px; color: #475569;">Here is the water bill breakdown for <strong>${data.monthName}</strong> for <strong>${data.apartmentName}</strong>:</p>
      
      <div style="background-color: #f0f9ff; border-left: 4px solid #0284c7; padding: 16px; margin: 20px 0; border-radius: 4px;">
        <div style="font-size: 13px; color: #64748b; text-transform: uppercase; font-weight: 600;">Your Amount Due</div>
        <div style="font-size: 32px; font-weight: 700; color: #0369a1; margin-top: 4px;">$${data.cost.toFixed(2)}</div>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 14px;">
        <tbody>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 8px 0; color: #64748b;">Building Total Bill</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #1e293b;">$${data.totalBill.toFixed(2)}</td>
          </tr>
          ${
            data.usage !== undefined && data.usage !== null
              ? `<tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 8px 0; color: #64748b;">Your Usage</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #1e293b;">${data.usage} units</td>
                </tr>`
              : ""
          }
          ${
            data.totalUsage !== undefined && data.totalUsage !== null
              ? `<tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 8px 0; color: #64748b;">Total Building Usage</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #1e293b;">${data.totalUsage} units</td>
                </tr>`
              : ""
          }
          ${
            ratioPercent
              ? `<tr>
                  <td style="padding: 8px 0; color: #64748b;">Share Percentage</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #1e293b;">${ratioPercent}%</td>
                </tr>`
              : ""
          }
        </tbody>
      </table>

      <p style="font-size: 14px; color: #64748b; margin-top: 24px;">Please submit payment according to your standard lease terms. Thank you!</p>
    </div>
  `;

  return { subject, html, text };
}
