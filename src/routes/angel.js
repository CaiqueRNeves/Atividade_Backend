const express = require('express');
const router = express.Router();
const angelController = require('../controllers/angelController');
const { isAuthenticated, isAngel } = require('../middleware/auth');
const { 
  validateAngelProfileUpdate, 
  validateTour, 
  validateMessage 
} = require('../middleware/validation');

// Middleware para verificar autenticação e tipo de usuário
router.use(isAuthenticated);
router.use(isAngel);

// Dashboard
router.get('/dashboard', angelController.dashboard);

// Perfil
router.get('/profile', angelController.showProfile);
router.get('/profile/:id', angelController.showProfile);
router.get('/edit-profile', angelController.showEditProfileForm);
router.post('/update-profile', validateAngelProfileUpdate, angelController.updateProfile);

// Tours
router.get('/create-tour', angelController.showCreateTourForm);
router.post('/create-tour', validateTour, angelController.createTour);
router.get('/tours', angelController.showTours);
router.get('/tour/:id', angelController.showTour);
router.get('/edit-tour/:id', angelController.showEditTourForm);
router.post('/update-tour/:id', validateTour, angelController.updateTour);
router.post('/cancel-tour/:id', angelController.cancelTour);

// Visitantes
router.get('/visitors', angelController.showVisitors);

// Mensagens
router.get('/messages', angelController.showMessages);
router.post('/send-message', validateMessage, angelController.sendMessage);

// Insights
router.get('/insights', angelController.showInsights);

module.exports = router;