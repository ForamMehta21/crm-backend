const nodemailer = require('nodemailer');
const { formatDateIST, formatTimeIST, isMidnightIST } = require('./dateIST');

const createTransporter = () =>
  nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

const isEmailConfigured = () => Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);

const esc = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const appUrl = () => (process.env.FRONTEND_URL || '').replace(/\/$/, '');

const leadLink = (lead) => {
  const base = appUrl();
  const name = esc(lead.fullName || 'N/A');
  return base ? `<a href="${esc(`${base}/leads/view/${lead._id}`)}" style="color:#1e40af">${name}</a>` : name;
};

const callTime = (lead) => {
  if (!lead.nextCallDate) return '—';
  return isMidnightIST(lead.nextCallDate) ? 'Any time' : formatTimeIST(lead.nextCallDate);
};

const cell = 'padding:10px 12px;border:1px solid #e5e7eb';
const head = 'padding:10px 12px;border:1px solid #1d4ed8;text-align:left';

const leadTable = (leads, { showCallTime }) => {
  const rows = leads
    .map((lead, i) => `
      <tr style="background:${i % 2 === 0 ? '#f9fafb' : '#ffffff'}">
        <td style="${cell};text-align:center">${i + 1}</td>
        <td style="${cell}">${leadLink(lead)}</td>
        <td style="${cell}">${esc(lead.phoneNumber || 'N/A')}</td>
        <td style="${cell}">${esc(lead.leadStatus || 'N/A')}</td>
        ${showCallTime ? `<td style="${cell}">${esc(callTime(lead))}</td>` : ''}
        <td style="${cell}">${esc(lead.assignedTo?.name || 'Unassigned')}</td>
      </tr>`)
    .join('');

  return `
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <thead>
        <tr style="background:#1e40af;color:#ffffff">
          <th style="${head};text-align:center">#</th>
          <th style="${head}">Name</th>
          <th style="${head}">Phone</th>
          <th style="${head}">Status</th>
          ${showCallTime ? `<th style="${head}">Call time</th>` : ''}
          <th style="${head}">Assigned to</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
};

const wrap = (title, subtitle, body) => `
  <div style="font-family:Arial,sans-serif;max-width:860px;margin:0 auto;padding:24px;background:#ffffff">
    <div style="background:linear-gradient(135deg,#1e40af,#3b82f6);padding:20px 24px;border-radius:8px 8px 0 0">
      <h2 style="color:#ffffff;margin:0;font-size:22px">${title}</h2>
      <p style="color:#bfdbfe;margin:4px 0 0">${esc(subtitle)}</p>
    </div>
    <div style="border:1px solid #e5e7eb;border-top:none;padding:20px 24px;border-radius:0 0 8px 8px">
      ${body}
      <p style="color:#9ca3af;margin-top:24px;font-size:12px;text-align:center">
        This is an automated reminder from <strong>Real Estate CRM</strong>. Do not reply to this email.
      </p>
    </div>
  </div>`;

const send = async ({ to, subject, html }) => {
  if (!isEmailConfigured()) {
    console.log('[EmailService] GMAIL_USER / GMAIL_APP_PASSWORD not set — skipping email');
    return false;
  }
  const recipients = (Array.isArray(to) ? to : [to]).filter(Boolean);
  if (recipients.length === 0) {
    console.log('[EmailService] No recipients — skipping email');
    return false;
  }
  await createTransporter().sendMail({
    from: `"Real Estate CRM" <${process.env.GMAIL_USER}>`,
    to: recipients.join(', '),
    subject,
    html,
  });
  console.log(`[EmailService] "${subject}" sent to ${recipients.join(', ')}`);
  return true;
};

// Morning digest: the 5 random follow-ups plus today's scheduled calls
const sendDailyDigestEmail = async ({ to, followUps, calls }) => {
  if (followUps.length === 0 && calls.length === 0) {
    console.log('[EmailService] Nothing to send in the daily digest — skipping email');
    return false;
  }
  const today = formatDateIST();

  const followUpSection = followUps.length
    ? `<h3 style="color:#111827;margin:0 0 8px">🎯 Today's ${followUps.length} follow-up${followUps.length === 1 ? '' : 's'}</h3>
       <p style="color:#374151;margin:0 0 12px">Picked at random from open leads. None of them were picked in the last 7 days.</p>
       ${leadTable(followUps, { showCallTime: false })}`
    : '<p style="color:#374151">No open leads were available for random follow-up today.</p>';

  const callSection = calls.length
    ? `<h3 style="color:#111827;margin:24px 0 8px">📞 ${calls.length} call${calls.length === 1 ? '' : 's'} scheduled today</h3>
       ${leadTable(calls, { showCallTime: true })}`
    : '<p style="color:#374151;margin-top:24px">No calls are scheduled for today.</p>';

  const parts = [];
  if (followUps.length) parts.push(`${followUps.length} follow-up${followUps.length === 1 ? '' : 's'}`);
  if (calls.length) parts.push(`${calls.length} call${calls.length === 1 ? '' : 's'}`);

  return send({
    to,
    subject: `🎯 Today: ${parts.join(' + ')} — ${today}`,
    html: wrap('Your follow-ups for today', today, followUpSection + callSection),
  });
};

// Sent about 15 minutes before a scheduled call
const sendCallReminderEmail = async ({ to, lead }) => {
  const time = callTime(lead);
  const body = `
    <p style="color:#374151;margin-top:0">You have a call with <strong>${leadLink(lead)}</strong> at <strong>${esc(time)}</strong>.</p>
    ${leadTable([lead], { showCallTime: true })}`;
  return send({
    to,
    subject: `⏰ Call at ${time}: ${lead.fullName || lead.phoneNumber}`,
    html: wrap('Upcoming call', formatDateIST(lead.nextCallDate), body),
  });
};

module.exports = { sendDailyDigestEmail, sendCallReminderEmail, isEmailConfigured };
