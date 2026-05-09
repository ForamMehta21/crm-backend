const nodemailer = require('nodemailer');

const createTransporter = () =>
  nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

const sendTodayCallsEmail = async (leads) => {
  if (!leads || leads.length === 0) {
    console.log('[EmailService] No leads for today — skipping email');
    return;
  }

  const transporter = createTransporter();

  const today = new Date().toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'long',
  });

  const leadRows = leads
    .map(
      (lead, i) => `
      <tr style="background:${i % 2 === 0 ? '#f9fafb' : '#ffffff'}">
        <td style="padding:10px 12px;border:1px solid #e5e7eb;text-align:center">${i + 1}</td>
        <td style="padding:10px 12px;border:1px solid #e5e7eb">${lead.fullName || 'N/A'}</td>
        <td style="padding:10px 12px;border:1px solid #e5e7eb">${lead.phoneNumber || 'N/A'}</td>
        <td style="padding:10px 12px;border:1px solid #e5e7eb">${lead.email || '—'}</td>
        <td style="padding:10px 12px;border:1px solid #e5e7eb">${lead.leadStatus || 'N/A'}</td>
        <td style="padding:10px 12px;border:1px solid #e5e7eb">${
          lead.nextCallDate
            ? new Date(lead.nextCallDate).toLocaleTimeString('en-IN', {
                timeZone: 'Asia/Kolkata',
                hour: '2-digit',
                minute: '2-digit',
              })
            : '—'
        }</td>
        <td style="padding:10px 12px;border:1px solid #e5e7eb">${lead.assignedTo?.name || 'Unassigned'}</td>
      </tr>
    `
    )
    .join('');

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:860px;margin:0 auto;padding:24px;background:#ffffff">
      <div style="background:linear-gradient(135deg,#1e40af,#3b82f6);padding:20px 24px;border-radius:8px 8px 0 0">
        <h2 style="color:#ffffff;margin:0;font-size:22px">📞 Today's Follow-up Calls</h2>
        <p style="color:#bfdbfe;margin:4px 0 0">${today}</p>
      </div>
      <div style="border:1px solid #e5e7eb;border-top:none;padding:20px 24px;border-radius:0 0 8px 8px">
        <p style="color:#374151;margin-top:0">
          You have <strong style="color:#1e40af">${leads.length}</strong> lead(s) scheduled for a call today.
        </p>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <thead>
            <tr style="background:#1e40af;color:#ffffff">
              <th style="padding:10px 12px;border:1px solid #1d4ed8;text-align:center">#</th>
              <th style="padding:10px 12px;border:1px solid #1d4ed8;text-align:left">Name</th>
              <th style="padding:10px 12px;border:1px solid #1d4ed8;text-align:left">Phone</th>
              <th style="padding:10px 12px;border:1px solid #1d4ed8;text-align:left">Email</th>
              <th style="padding:10px 12px;border:1px solid #1d4ed8;text-align:left">Status</th>
              <th style="padding:10px 12px;border:1px solid #1d4ed8;text-align:left">Call Time</th>
              <th style="padding:10px 12px;border:1px solid #1d4ed8;text-align:left">Assigned To</th>
            </tr>
          </thead>
          <tbody>${leadRows}</tbody>
        </table>
        <p style="color:#9ca3af;margin-top:24px;font-size:12px;text-align:center">
          This is an automated daily reminder from <strong>Real Estate CRM</strong>. Do not reply to this email.
        </p>
      </div>
    </div>
  `;

  const toEmail = process.env.NOTIFY_EMAIL || 'goyamconsultancy@gmail.com';

  await transporter.sendMail({
    from: `"Real Estate CRM" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: `📞 ${leads.length} Call(s) Scheduled for Today — ${today}`,
    html,
  });

  console.log(`[EmailService] Email sent to ${toEmail} for ${leads.length} lead(s)`);
};

module.exports = { sendTodayCallsEmail };
