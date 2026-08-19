const nodemailer = require('nodemailer');

const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.zyronova.com',
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: false,
        auth: {
            user: process.env.SMTP_USER || 'info@zyronova.com',
            pass: process.env.SMTP_PASS || 'placeholder_pass',
        },
        tls: { rejectUnauthorized: true }
    });
};

const sendSecurityEmail = async (toEmail, subject, type, data) => {
    try {
        const transporter = createTransporter();
        let contentHtml = '';

        if (type === 'NEW_LOGIN') {
            contentHtml = `
                <p>Sayın Kullanıcımız,</p>
                <p>Hesabınıza yeni bir cihazdan veya konumdan giriş yapıldığını tespit ettik. Eğer bu işlemi siz yapmadıysanız, lütfen derhal şifrenizi değiştirin.</p>
                <p><b>Tarih/Saat:</b> ${data.time}</p>
                <p><b>IP Adresi:</b> ${data.ip}</p>
            `;
        } else if (type === 'PASSWORD_CHANGED') {
            contentHtml = `
                <p>Sayın Kullanıcımız,</p>
                <p>Hesabınızın şifresi başarıyla değiştirildi. Eğer bu işlemi siz yapmadıysanız, acil olarak destek ekibiyle iletişime geçin.</p>
                <p><b>Tarih/Saat:</b> ${data.time}</p>
            `;
        } else if (type === '2FA_ENABLED') {
            contentHtml = `
                <p>Sayın Kullanıcımız,</p>
                <p>Hesabınızda İki Aşamalı Doğrulama (2FA - Google Authenticator) başarıyla aktifleştirildi.</p>
                <p>Artık giriş yaparken doğrulama kodunuz gerekecektir.</p>
            `;
        } else if (type === '2FA_DISABLED') {
            contentHtml = `
                <p>Sayın Kullanıcımız,</p>
                <p>Hesabınızdaki İki Aşamalı Doğrulama (2FA) özelliği devre dışı bırakıldı.</p>
                <p>Güvenliğiniz için bu işlemi siz yapmadıysanız lütfen hemen şifrenizi değiştirin!</p>
            `;
        }

        const mailOptions = {
            from: `"Zyronova Güvenlik" <${process.env.SMTP_USER || 'info@zyronova.com'}>`,
            to: toEmail,
            subject: `🔒 ${subject}`,
            html: `
            <div style="font-family: 'Outfit', 'Inter', sans-serif; max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 20px; text-align: center; border-radius: 8px 8px 0 0; color: #ffffff;">
                    <h2 style="margin: 0; font-size: 20px; font-weight: 700;">Zyronova Güvenlik Uyarısı</h2>
                </div>
                <div style="padding: 20px; color: #334155; line-height: 1.6;">
                    ${contentHtml}
                    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                    <p style="font-size: 12px; color: #94a3b8; text-align: center;">Bu otomatik bir bilgilendirme mesajıdır. Lütfen cevaplamayınız.</p>
                </div>
            </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`[SECURITY EMAIL] Sent to: ${toEmail} | Type: ${type}`);
    } catch (err) {
        console.error('[SECURITY EMAIL ERROR]:', err);
    }
};

module.exports = {
    createTransporter,
    sendSecurityEmail
};
