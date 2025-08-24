const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Check if email is configured
  if (!process.env.SMTP_USER || process.env.SMTP_USER === 'your_email@gmail.com' || 
      !process.env.SMTP_PASS || process.env.SMTP_PASS === 'your_email_password') {
    console.log('Email not configured - skipping email send to:', options.email);
    return { messageId: 'email-disabled' };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  const mailOptions = {
    from: `${process.env.FROM_NAME || 'Balsampada LMS'} <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html || options.message
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ', info.messageId);
    return info;
  } catch (error) {
    console.error('Email send error:', error);
    // Don't throw error, just log it and return
    return { messageId: 'email-failed', error: error.message };
  }
};

module.exports = sendEmail;