export interface SignRequestTemplateData {
  clientName: string
  companyName: string
  contractTitle: string
  signUrl: string
}

export function signRequestTemplate({
  clientName,
  companyName,
  contractTitle,
  signUrl,
}: SignRequestTemplateData): string {
  return `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>署名のお願い</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px; text-align: center; border-bottom: 1px solid #e5e7eb;">
              <h1 style="margin: 0; color: #059669; font-size: 28px; font-weight: 700;">EleSign</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 24px; color: #111827; font-size: 16px; line-height: 1.6;">
                ${clientName} 様
              </p>

              <p style="margin: 0 0 24px; color: #111827; font-size: 16px; line-height: 1.6;">
                ${companyName}より、下記契約書への署名をお願いいたします。
              </p>

              <!-- Contract Info Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 8px; color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase;">
                      契約書タイトル
                    </p>
                    <p style="margin: 0 0 16px; color: #111827; font-size: 18px; font-weight: 600;">
                      ${contractTitle}
                    </p>
                    <p style="margin: 0 0 8px; color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase;">
                      依頼元
                    </p>
                    <p style="margin: 0; color: #111827; font-size: 16px;">
                      ${companyName}
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 24px; color: #111827; font-size: 16px; line-height: 1.6;">
                下記ボタンをクリックして署名してください。
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 8px 0 24px;">
                    <a href="${signUrl}" style="display: inline-block; padding: 14px 32px; background-color: #059669; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 8px;">
                      署名する →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Notes -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border-top: 1px solid #e5e7eb; padding-top: 20px;">
                <tr>
                  <td style="padding-top: 20px;">
                    <p style="margin: 0 0 8px; color: #6b7280; font-size: 13px; line-height: 1.5;">
                      ※ このリンクの有効期限は30日間です。
                    </p>
                    <p style="margin: 0; color: #6b7280; font-size: 13px; line-height: 1.5;">
                      ※ ご不明点がございましたら、このメールにご返信ください。
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                このメールは EleSign から自動送信されています。
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

export interface CompletionTemplateData {
  recipientName: string
  contractTitle: string
  signers: Array<{
    name: string
    signedAt: string
  }>
  downloadUrl?: string
}

export function completionTemplate({
  recipientName,
  contractTitle,
  signers,
  downloadUrl,
}: CompletionTemplateData): string {
  const signersHtml = signers
    .map(
      (signer) => `
    <tr>
      <td style="padding: 8px 0;">
        <span style="color: #059669; margin-right: 8px;">✓</span>
        <span style="color: #111827;">${signer.name}</span>
        <span style="color: #6b7280; margin-left: 12px; font-size: 13px;">${signer.signedAt}</span>
      </td>
    </tr>
  `
    )
    .join('')

  return `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>署名完了</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px; text-align: center; border-bottom: 1px solid #e5e7eb;">
              <h1 style="margin: 0; color: #059669; font-size: 28px; font-weight: 700;">EleSign</h1>
            </td>
          </tr>

          <!-- Success Icon -->
          <tr>
            <td style="padding: 32px 32px 16px; text-align: center;">
              <div style="display: inline-block; width: 64px; height: 64px; background-color: #ecfdf5; border-radius: 50%; line-height: 64px;">
                <span style="color: #059669; font-size: 32px;">✓</span>
              </div>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 0 32px 32px;">
              <h2 style="margin: 0 0 16px; color: #111827; font-size: 20px; font-weight: 600; text-align: center;">
                署名が完了しました
              </h2>

              <p style="margin: 0 0 24px; color: #111827; font-size: 16px; line-height: 1.6;">
                ${recipientName} 様
              </p>

              <p style="margin: 0 0 24px; color: #111827; font-size: 16px; line-height: 1.6;">
                下記契約書への署名が完了しました。
              </p>

              <!-- Contract Info Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 8px; color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase;">
                      契約書タイトル
                    </p>
                    <p style="margin: 0 0 20px; color: #111827; font-size: 18px; font-weight: 600;">
                      ${contractTitle}
                    </p>
                    <p style="margin: 0 0 8px; color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase;">
                      署名者
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      ${signersHtml}
                    </table>
                  </td>
                </tr>
              </table>

              ${
                downloadUrl
                  ? `
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 8px 0 24px;">
                    <a href="${downloadUrl}" style="display: inline-block; padding: 14px 32px; background-color: #059669; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 8px;">
                      契約書をダウンロード →
                    </a>
                  </td>
                </tr>
              </table>
              `
                  : ''
              }

              <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6; text-align: center;">
                署名済みの契約書は添付ファイルからもご確認いただけます。
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                このメールは EleSign から自動送信されています。
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}
