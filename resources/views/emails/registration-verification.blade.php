<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>MSEUF Theater Email Verification</title>
</head>
<body style="margin: 0; padding: 24px; background-color: #F8FAFC; font-family: Arial, Helvetica, sans-serif; color: #1E293B;">
    <div style="max-width: 520px; margin: 0 auto; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; border: 1px solid #E2E8F0;">
        <div style="background-color: #800000; padding: 24px; text-align: center; border-bottom: 3px solid #D97706;">
            <div style="font-size: 12px; font-weight: bold; color: #FCD34D; letter-spacing: 1px; text-transform: uppercase;">
                Manuel S. Enverga University Foundation
            </div>
            <h1 style="margin: 8px 0 0; font-size: 20px; color: #FFFFFF;">
                Verify Your Email Address
            </h1>
        </div>

        <div style="padding: 28px 24px;">
            <p style="margin: 0 0 12px; font-size: 14px; line-height: 1.6;">
                Hello <strong>{{ $recipientName }}</strong>,
            </p>
            <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #475569;">
                Use the 6-digit verification code below to verify your email address and complete creating your MSEUF University Theater account:
            </p>

            <div style="background-color: #FBF0F0; border: 2px dashed #800000; border-radius: 12px; padding: 18px; text-align: center; margin-bottom: 20px;">
                <div style="font-size: 11px; font-weight: bold; color: #800000; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">
                    Verification Code
                </div>
                <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #5A0000; font-family: 'Courier New', Courier, monospace;">
                    {{ $code }}
                </div>
            </div>

            <p style="margin: 0 0 8px; font-size: 12px; color: #64748B;">
                This code will expire in <strong>{{ $expiresInMinutes }} minutes</strong>.
            </p>
            <p style="margin: 0; font-size: 12px; color: #94A3B8;">
                If you did not request an account on the MSEUF Theater Ticketing Portal, you may safely ignore this email.
            </p>
        </div>
    </div>
</body>
</html>
