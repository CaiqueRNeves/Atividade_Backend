const AuthService = require('../services/AuthService');
const Angel = require('../models/Angel');
const { validationResult } = require('express-validator');

// Mostrar página de login
exports.showLoginPage = (req, res) => {
  res.render('pages/login', { 
    title: 'Login - MyBestAngel',
    description: 'Faça login na sua conta MyBestAngel'
  });
};

// Mostrar página de cadastro
exports.showRegisterPage = async (req, res) => {
  try {
    // Buscar todos os Angels disponíveis para afiliação
    const angels = await Angel.findAvailableForAffiliation();
    
    res.render('pages/register', { 
      title: 'Cadastro - MyBestAngel',
      description: 'Crie sua conta no MyBestAngel',
      angels: angels,
      userType: req.query.type || 'visitor' // Tipo padrão é visitor
    });
  } catch (error) {
    console.error('Erro ao carregar página de cadastro:', error);
    req.flash('error', 'Erro ao carregar guias disponíveis');
    return res.redirect('/auth/login');
  }
};

// Processar login
exports.login = async (req, res) => {
  try {
    const { email, password, userType } = req.body;
    
    // Validar entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash('error', errors.array()[0].msg);
      return res.redirect('/auth/login');
    }
    
    // Realizar login
    const authData = await AuthService.login(email, password, userType);
    
    // Criar sessão
    req.session.user = authData.user;
    req.session.userType = authData.userType;
    
    // Definir cookie com o token
    res.cookie('token', authData.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 1 dia
    });
    
    // Redirecionar para o dashboard apropriado
    req.flash('success', 'Login realizado com sucesso!');
    if (authData.userType === 'angel') {
      return res.redirect('/angel/dashboard');
    } else {
      return res.redirect('/visitor/dashboard');
    }
  } catch (error) {
    console.error('Erro no login:', error);
    req.flash('error', error.message);
    return res.redirect('/auth/login');
  }
};

// Processar registro de Angel
exports.registerAngel = async (req, res) => {
  try {
    // Validar entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash('error', errors.array()[0].msg);
      return res.redirect('/auth/register?type=angel');
    }
    
    // Realizar registro
    const authData = await AuthService.registerAngel(req.body);
    
    // Criar sessão
    req.session.user = authData.user;
    req.session.userType = authData.userType;
    
    // Definir cookie com o token
    res.cookie('token', authData.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 1 dia
    });
    
    req.flash('success', 'Cadastro realizado com sucesso!');
    return res.redirect('/angel/dashboard');
  } catch (error) {
    console.error('Erro no registro de Angel:', error);
    req.flash('error', error.message);
    return res.redirect('/auth/register?type=angel');
  }
};

// Processar registro de Visitor
exports.registerVisitor = async (req, res) => {
  try {
    // Validar entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash('error', errors.array()[0].msg);
      return res.redirect('/auth/register?type=visitor');
    }
    
    // Realizar registro
    const authData = await AuthService.registerVisitor(req.body);
    
    // Criar sessão
    req.session.user = authData.user;
    req.session.userType = authData.userType;
    
    // Definir cookie com o token
    res.cookie('token', authData.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 1 dia
    });
    
    req.flash('success', 'Cadastro realizado com sucesso!');
    return res.redirect('/visitor/dashboard');
  } catch (error) {
    console.error('Erro no registro de Visitor:', error);
    req.flash('error', error.message);
    return res.redirect('/auth/register?type=visitor');
  }
};

// Processar logout
exports.logout = (req, res) => {
  // Limpar sessão
  req.session.destroy();
  
  // Limpar cookie do token
  res.clearCookie('token');
  
  return res.redirect('/');
};