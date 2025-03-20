const Contact = require('../models/Contact');
const { sendEmail } = require('../services/emailService');
const AppError = require('../utils/appError');

const { sendContactConfirmation, sendContactNotification } = require('../services/emailService');

exports.submitContactForm = async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;

    // Save to database
    const contact = await Contact.create({ name, email, subject, message });

    // Send emails
    await Promise.all([
      sendContactConfirmation({ name, email, message }),
      sendContactNotification({ 
        name, 
        email, 
        subject, 
        message, 
        contactId: contact._id 
      })
    ]);

    res.status(200).json({ 
      status: 'success',
      message: 'Message sent successfully' 
    });

  } catch (err) {
    console.error('Contact submission error:', err);
    next(new AppError('Failed to send message. Please try again later.', 500));
  }
};

exports.getAllContacts = async (req, res, next) => {
    try {
      const { page = 1, limit = 20 } = req.query;
      const contacts = await Contact.find()
        .sort('-createdAt')
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .select('name email subject createdAt');
  
      const count = await Contact.countDocuments();
  
      res.json({
        status: 'success',
        results: contacts.length,
        total: count,
        data: contacts
      });
    } catch (err) {
      next(new AppError('Failed to retrieve contacts', 500));
    }
  };
  
  exports.getContact = async (req, res, next) => {
    try {
      const contact = await Contact.findById(req.params.id)
        .select('name email subject message createdAt');
  
      if (!contact) {
        return next(new AppError('Contact not found', 404));
      }
  
      res.json({
        status: 'success',
        data: contact
      });
    } catch (err) {
      next(new AppError('Invalid contact ID', 400));
    }
  };