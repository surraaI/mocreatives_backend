const nodemailer = require('nodemailer');
const AppError = require('../utils/appError');
const { htmlToText } = require('nodemailer-html-to-text');
const inlineCss = require('nodemailer-juice');

// Create transporter with explicit settings
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  tls: {
    ciphers: 'SSLv3'
  }
});

// Verify connection on startup
transporter.verify((error) => {
  if (error) {
    console.error('SMTP Connection Error:', error);
  } else {
    console.log('SMTP server is ready to send emails');
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
    console.error('Email send error details:', {
      errorCode: err.code,
      command: err.command,
      response: err.response
    });
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

exports.sendVerificationEmail = async ({ email, verificationUrl, unsubscribeUrl }) => {
  const html = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="padding: 30px 20px;">
        <h1 style="color: #2c3e50; margin-bottom: 25px;">Confirm Your Subscription</h1>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
          <p style="margin: 0 0 15px;">Thank you for subscribing to our weekly blogs!</p>
          <p style="margin: 0 0 20px;">Please click the button below to confirm your subscription:</p>
          
          <a href="${verificationUrl}" 
             style="display: inline-block; background: #3498db; color: white; 
                    padding: 10px 20px; text-decoration: none; border-radius: 4px;">
            Verify Email
          </a>

          <p style="margin-top: 20px; color: #7f8c8d; font-size: 0.9em;">
            Or use this link: <span style="word-break: break-all;">${verificationUrl}</span>
          </p>
        </div>

        <footer style="margin-top: 30px; color: #7f8c8d; font-size: 0.9em; text-align: center;">
          <p>This is an automated message. If you didn't request this, you can 
            <a href="${unsubscribeUrl}" style="color: #3498db; text-decoration: none;">unsubscribe immediately</a>.
          </p>
        </footer>
      </div>
    </div>
  `;

  await sendEmail({
    to: email,
    subject: 'Confirm Your Subscription',
    html
  });
};

exports.sendWeeklyBlogs = async (email, blogs, unsubscribeUrl) => {
  const html = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="padding: 30px 20px;">
        <h1 style="color: #2c3e50; margin-bottom: 25px;">Weekly Blog Digest</h1>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
          <p>Here are this week's latest blog posts:</p>
          
          ${blogs.map(blog => `
            <div style="margin: 20px 0; padding: 15px; background: white; border-radius: 4px;">
              <h2 style="color: #2c3e50; margin: 0 0 10px;">${blog.title}</h2>
              <p style="margin: 0 0 10px;">${blog.description}</p>
              <a href="${process.env.CLIENT_URL}/blogs/${blog._id}" 
                 style="display: inline-block; background: #3498db; color: white; 
                        padding: 8px 16px; text-decoration: none; border-radius: 4px;">
                Read More
              </a>
            </div>
          `).join('')}

          <div style="margin-top: 25px; text-align: center;">
            <a href="${unsubscribeUrl}" 
               style="color: #7f8c8d; font-size: 0.9em; text-decoration: none;">
              Unsubscribe from weekly emails
            </a>
          </div>
        </div>
      </div>
    </div>
  `;

  await sendEmail({
    to: email,
    subject: 'Your Weekly Blog Digest',
    html
  });
};