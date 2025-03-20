const nodemailer = require('nodemailer');
const AppError = require('../utils/appError');
const { htmlToText } = require('nodemailer-html-to-text');
const inlineCss = require('nodemailer-juice');

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: process.env.NODE_ENV === 'production'
  }
});

// Add plugins
transporter.use('compile', htmlToText());
transporter.use('compile', inlineCss());

const sendEmail = async options => {
  try {
    await transporter.sendMail({
      from: `MoCreatives Admin <${process.env.EMAIL_USER}>`,
      ...options
    });
  } catch (err) {
    console.error('Email send error:', err);
    throw new AppError('There was an error sending the email. Try again later!', 500);
  }
};

exports.sendAdminCredentials = async ({ email, password, name }) => {
  const html = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      
      <div style="padding: 30px 20px;">
        <h1 style="color: #2c3e50; margin-bottom: 25px;">Welcome ${name}!</h1>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
          <p style="margin: 0 0 15px;">Your admin account has been created successfully.</p>
          <div style="margin-bottom: 20px;">
            <strong>Email:</strong> ${email}<br>
            <strong>Temporary Password:</strong> ${password}
          </div>
          <a href="${process.env.CLIENT_URL}/login" 
             style="display: inline-block; background: #3498db; color: white; 
                    padding: 10px 20px; text-decoration: none; border-radius: 4px;">
            Login to Your Account
          </a>
        </div>

        <footer style="margin-top: 30px; color: #7f8c8d; font-size: 0.9em; text-align: center;">
          <p>This is an automated message. Please do not reply.</p>
          <p>&copy; ${new Date().getFullYear()} MoCreatives. All rights reserved.</p>
        </footer>
      </div>
    </div>
  `;

  await sendEmail({
    to: email,
    subject: 'MoCreatives Admin Account Created',
    html,
    priority: 'high'
  });
};

exports.sendPasswordReset = async ({ email, name, resetUrl }) => {
  const html = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="padding: 30px 20px;">
        <h1 style="color: #2c3e50; margin-bottom: 25px;">Hi ${name},</h1>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
          <p style="margin: 0 0 15px;">We received a password reset request for your account.</p>
          <p style="margin: 0 0 20px;">Click the button below to reset your password (valid for 10 minutes):</p>
          
          <a href="${resetUrl}" 
             style="display: inline-block; background: #3498db; color: white; 
                    padding: 10px 20px; text-decoration: none; border-radius: 4px;
                    margin-bottom: 20px;">
            Reset Password
          </a>
          
          <p style="margin: 0; color: #7f8c8d; font-size: 0.9em;">
            Can't click the button? Copy this link:<br>
            <span style="word-break: break-all;">${resetUrl}</span>
          </p>
        </div>

        <footer style="margin-top: 30px; color: #7f8c8d; font-size: 0.9em; text-align: center;">
          <p>If you didn't request this password reset, please ignore this email.</p>
          <p>&copy; ${new Date().getFullYear()} MoCreatives. All rights reserved.</p>
        </footer>
      </div>
    </div>
  `;

  await sendEmail({
    to: email,
    subject: 'MoCreatives Password Reset Request',
    html
  });
};

exports.sendContactConfirmation = async ({ name, email, message }) => {
  const html = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="padding: 30px 20px;">
        <h1 style="color: #2c3e50; margin-bottom: 25px;">Hi ${name},</h1>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
          <p>We've received your message and will respond within 24 hours.</p>
          <p style="margin-top: 20px;"><strong>Your message:</strong></p>
          <div style="background: #fff; padding: 15px; border-radius: 4px; margin: 15px 0;">
            ${message}
          </div>
        </div>

        <footer style="margin-top: 30px; color: #7f8c8d; font-size: 0.9em; text-align: center;">
          <p>This is an automated message. Please do not reply.</p>
          <p>&copy; ${new Date().getFullYear()} MoCreatives. All rights reserved.</p>
        </footer>
      </div>
    </div>
  `;

  await sendEmail({
    to: email,
    subject: 'Thank you for contacting MoCreatives!',
    html
  });
};

exports.sendContactNotification = async ({ name, email, subject, message, contactId }) => {
  const html = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="padding: 30px 20px;">
        <h1 style="color: #2c3e50; margin-bottom: 25px;">New Contact Form Submission</h1>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
          <p><strong>From:</strong> ${name} &lt;${email}&gt;</p>
          <p><strong>Subject:</strong> ${subject}</p>
          
          <div style="margin-top: 20px; background: #fff; padding: 15px; border-radius: 4px;">
            ${message}
          </div>
          
          <div style="margin-top: 25px;">
            <a href="${process.env.CLIENT_URL}/admin/contacts/${contactId}" 
              style="display: inline-block; background: #3498db; color: white; 
                    padding: 10px 20px; text-decoration: none; border-radius: 4px;">
              View in Dashboard
            </a>
          </div>
        </div>

        <footer style="margin-top: 30px; color: #7f8c8d; font-size: 0.9em; text-align: center;">
          <p>This is an automated notification from MoCreatives CMS</p>
        </footer>
      </div>
    </div>
  `;

  await sendEmail({
    to: process.env.SUPERADMIN_EMAIL,
    subject: `New Contact Submission: ${subject}`,
    html,
    priority: 'high'
  });
};