const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Angel = require('../models/Angel');
const Visitor = require('../models/Visitor');

class AuthService {
  // Gerar token JWT
  static generateToken(user, userType) {
    return jwt.sign(
      { id: user.id, email: user.email, name: user.name, userType },
      process.env.JWT_SECRET || 'mybestangel_secret',
      { expiresIn: '24h' }
    );
  }

  // Verificar token JWT
  static verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET || 'mybestangel_secret');
    } catch (error) {
      throw new Error('Token inválido ou expirado');
    }
  }

  // Login de usuário
  static async login(email, password, userType) {
    try {
      // Validar tipo de usuário
      if (userType !== 'angel' && userType !== 'visitor') {
        throw new Error('Tipo de usuário inválido');
      }
      
      // Buscar usuário no banco de dados
      const user = userType === 'angel' 
        ? await Angel.findByEmail(email)
        : await Visitor.findByEmail(email);
      
      if (!user) {
        throw new Error('Email ou senha incorretos');
      }
      
      // Comparar senha
      const isMatch = await user.verifyPassword(password);
      
      if (!isMatch) {
        throw new Error('Email ou senha incorretos');
      }
      
      // Gerar token JWT
      const token = this.generateToken(user, userType);
      
      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        },
        userType,
        token
      };
    } catch (error) {
      throw error;
    }
  }

  // Registro de Angel
  static async registerAngel(userData) {
    try {
      const { name, email, password, confirmPassword, phone, bio, languages, specialty } = userData;
      
      // Validar campos obrigatórios
      if (!name || !email || !password || !confirmPassword || !phone) {
        throw new Error('Todos os campos marcados são obrigatórios');
      }
      
      // Validar se as senhas coincidem
      if (password !== confirmPassword) {
        throw new Error('As senhas não coincidem');
      }
      
      // Verificar se o email já está em uso
      const existingAngel = await Angel.findByEmail(email);
      if (existingAngel) {
        throw new Error('Este email já está em uso');
      }
      
      // Criar novo Angel
      const angel = new Angel({
        name,
        email,
        password,
        phone,
        bio: bio || '',
        languages: languages || '',
        specialty: specialty || ''
      });
      
      // Salvar no banco de dados
      const angelId = await angel.save();
      
      // Buscar Angel com ID
      const newAngel = await Angel.findById(angelId);
      
      // Gerar token JWT
      const token = this.generateToken(newAngel, 'angel');
      
      return {
        user: {
          id: newAngel.id,
          name: newAngel.name,
          email: newAngel.email
        },
        userType: 'angel',
        token
      };
    } catch (error) {
      throw error;
    }
  }

  // Registro de Visitor
  static async registerVisitor(userData) {
    try {
      const { name, email, password, confirmPassword, phone, nationality, languagePreference, angelId } = userData;
      
      // Validar campos obrigatórios
      if (!name || !email || !password || !confirmPassword || !angelId) {
        throw new Error('Todos os campos marcados são obrigatórios');
      }
      
      // Validar se as senhas coincidem
      if (password !== confirmPassword) {
        throw new Error('As senhas não coincidem');
      }
      
      // Verificar se o email já está em uso
      const existingVisitor = await Visitor.findByEmail(email);
      if (existingVisitor) {
        throw new Error('Este email já está em uso');
      }
      
      // Verificar se o Angel existe e tem vagas disponíveis
      const visitors = await Visitor.findByAngelId(angelId);
      if (visitors.length >= 3) {
        throw new Error('O guia selecionado não tem vagas disponíveis');
      }
      
      // Criar novo Visitor
      const visitor = new Visitor({
        angel_id: angelId,
        name,
        email,
        password,
        phone: phone || '',
        nationality: nationality || '',
        language_preference: languagePreference || ''
      });
      
      // Salvar no banco de dados
      const visitorId = await visitor.save();
      
      // Buscar Visitor com ID
      const newVisitor = await Visitor.findById(visitorId);
      
      // Gerar token JWT
      const token = this.generateToken(newVisitor, 'visitor');
      
      return {
        user: {
          id: newVisitor.id,
          name: newVisitor.name,
          email: newVisitor.email
        },
        userType: 'visitor',
        token
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = AuthService;