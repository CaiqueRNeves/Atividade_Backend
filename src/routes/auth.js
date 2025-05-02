const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { isNotAuthenticated } = require('../middleware/auth');
const { 
  validateLogin, 
  validateAngelRegister, 
  validateVisitorRegister 
} = require('../middleware/validation');

// Rotas de autenticação
router.get('/login', isNotAuthenticated, authController.showLoginPage);
router.get('/register', isNotAuthenticated, authController.showRegisterPage);
router.post('/login', isNotAuthenticated, validateLogin, authController.login);
router.post('/register/angel', isNotAuthenticated, validateAngelRegister, authController.registerAngel);
router.post('/register/visitor', isNotAuthenticated, validateVisitorRegister, authController.registerVisitor);
router.get('/logout', authController.logout);

module.exports = router;