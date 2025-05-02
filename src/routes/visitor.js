const express = require('express');
const router = express.Router();
const visitorController = require('../controllers/visitorController');
const { isAuthenticated, isVisitor } = require('../middleware/auth');
const { 
  validateVisitorProfileUpdate, 
  validateMessage,
  validateReview 
} = require('../middleware/validation');

// Middleware para verificar autenticação e tipo de usuário
router.use(isAuthenticated);
router.use(isVisitor);

// Dashboard
router.get('/dashboard', visitorController.dashboard);

// Perfil
router.get('/profile', visitorController.showProfile);
router.get('/edit-profile', visitorController.showEditProfileForm);
router.post('/update-profile', validateVisitorProfileUpdate, visitorController.updateProfile);

// Tours
router.get('/available-tours', visitorController.showAvailableTours);
router.get('/tour/:id', visitorController.showTour);
router.post('/book-tour/:id', visitorController.bookTour);
router.post('/cancel-booking/:id', visitorController.cancelBooking);
router.post('/rate-tour/:id', validateReview, visitorController.rateTour);

// Mensagens
router.get('/messages', visitorController.showMessages);
router.post('/send-message', validateMessage, visitorController.sendMessage);

module.exports = router;