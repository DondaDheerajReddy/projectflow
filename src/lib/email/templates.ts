export function invitationEmailTemplate({
  invitedByName,
  workspaceName,
  inviteLink,
  role,
}: {
  invitedByName: string;
  workspaceName: string;
  inviteLink: string;
  role: string;
}) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>You're invited to ${workspaceName}</title>
      </head>
      <body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
          <tr>
            <td align="center">
              <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;">
                
                <!-- Header -->
                <tr>
                  <td style="background:#1d4ed8;padding:32px;text-align:center;">
                    <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">
                      ProjectFlow
                    </h1>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding:40px 32px;">
                    <h2 style="margin:0 0 8px;color:#0f172a;font-size:20px;font-weight:600;">
                      You've been invited!
                    </h2>
                    <p style="margin:0 0 24px;color:#64748b;font-size:15px;line-height:1.6;">
                      <strong style="color:#0f172a;">${invitedByName}</strong> has invited you to join
                      <strong style="color:#0f172a;">${workspaceName}</strong> as a
                      <strong style="color:#0f172a;">${role === "OWNER" ? "Owner" : "Member"}</strong>.
                    </p>

                    <!-- CTA Button -->
                    <table cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
                        <tr>
                            <td style="background:#1d4ed8;border-radius:8px;">
                            <a href="${inviteLink}" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;">Accept Invitation</a>
                            </td>
                        </tr>
                    </table>

                    <p style="margin:0 0 8px;color:#64748b;font-size:13px;">
                      Or copy and paste this link into your browser:
                    </p>
                    <p style="margin:0;color:#1d4ed8;font-size:13px;word-break:break-all;">
                      ${inviteLink}
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding:24px 32px;border-top:1px solid #e2e8f0;background:#f8fafc;">
                    <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;">
                      This invitation will expire in 7 days. If you did not expect this invitation you can safely ignore this email.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}