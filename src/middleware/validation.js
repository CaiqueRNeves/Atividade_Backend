const { body } = require('express-validator');

// Validação para login
exports.validateLogin = [
  body('email')
    .notEmpty().withMessage('E-mail é obrigatório')
    .isEmail().withMessage('E-mail inválido'),
  body('password')
    .notEmpty().withMessage('Senha é obrigatória'),
  body('userType')
    .notEmpty().withMessage('Tipo de usuário é obrigatório')
    .isIn(['angel', 'visitor']).withMessage('Tipo de usuário inválido')
];

// Validação para registro de Angel
exports.validateAngelRegister = [
  body('name')
    .notEmpty().withMessage('Nome é obrigatório')
    .isLength({ min: 3 }).withMessage('Nome deve ter pelo menos 3 caracteres'),
  body('email')
    .notEmpty().withMessage('E-mail é obrigatório')
    .isEmail().withMessage('E-mail inválido'),
  body('password')
    .notEmpty().withMessage('Senha é obrigatória')
    .isLength({ min: 6 }).withMessage('Senha deve ter pelo menos 6 caracteres'),
  body('confirmPassword')
    .notEmpty().withMessage('Confirmação de senha é obrigatória')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('As senhas não coincidem');
      }
      return true;
    }),
  body('phone')
    .notEmpty().withMessage('Telefone é obrigatório')
];

// Validação para registro de Visitor
exports.validateVisitorRegister = [
      body('name')
        .notEmpty().withMessage('Nome é obrigatório')
        .isLength({ min: 3 }).withMessage('Nome deve ter pelo menos 3 caracteres'),
      body('email')
        .notEmpty().withMessage('E-mail é obrigatório')
        .isEmail().withMessage('E-mail inválido'),
      body('password')
        .notEmpty().withMessage('Senha é obrigatória')
        .isLength({ min: 6 }).withMessage('Senha deve ter pelo menos 6 caracteres'),
      body('confirmPassword')
        .notEmpty().withMessage('Confirmação de senha é obrigatória')
        .custom((value, { req }) => {
          if (value !== req.body.password) {
            throw new Error('As senhas não coincidem');
          }
          return true;
        }),
      body('angelId')
        .notEmpty().withMessage('Guia é obrigatório')
        .isInt().withMessage('ID do guia inválido')
    ];
    
    // Validação para atualização de perfil de Angel
    exports.validateAngelProfileUpdate = [
      body('name')
        .notEmpty().withMessage('Nome é obrigatório')
        .isLength({ min: 3 }).withMessage('Nome deve ter pelo menos 3 caracteres'),
      body('phone')
        .optional()
        .isLength({ min: 10 }).withMessage('Telefone inválido')
    ];
    
    // Validação para atualização de perfil de Visitor
    exports.validateVisitorProfileUpdate = [
      body('name')
        .notEmpty().withMessage('Nome é obrigatório')
        .isLength({ min: 3 }).withMessage('Nome deve ter pelo menos 3 caracteres')
    ];
    
    // Validação para criação/atualização de tour
    exports.validateTour = [
      body('title')
        .notEmpty().withMessage('Título é obrigatório')
        .isLength({ min: 5, max: 100 }).withMessage('Título deve ter entre 5 e 100 caracteres'),
      body('location')
        .notEmpty().withMessage('Local é obrigatório'),
      body('date')
        .notEmpty().withMessage('Data é obrigatória')
        .isDate().withMessage('Data inválida'),
      body('time')
        .notEmpty().withMessage('Hora é obrigatória')
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Hora inválida'),
      body('duration')
        .optional()
        .isInt({ min: 15, max: 480 }).withMessage('Duração deve estar entre 15 e 480 minutos'),
      body('price')
        .optional()
        .isFloat({ min: 0 }).withMessage('Preço deve ser maior ou igual a zero'),
      body('maxParticipants')
        .optional()
        .isInt({ min: 1, max: 50 }).withMessage('Número de participantes deve estar entre 1 e 50')
    ];
    
    // Validação para envio de mensagem
    exports.validateMessage = [
      body('content')
        .notEmpty().withMessage('Mensagem não pode estar vazia')
        .isLength({ max: 1000 }).withMessage('Mensagem deve ter no máximo 1000 caracteres')
    ];
    
    // Validação para avaliação de tour
    exports.validateReview = [
      body('rating')
        .notEmpty().withMessage('Avaliação é obrigatória')
        .isInt({ min: 1, max: 5 }).withMessage('Avaliação deve estar entre 1 e 5 estrelas'),
      body('comment')
        .optional()
        .isLength({ max: 500 }).withMessage('Comentário deve ter no máximo 500 caracteres')
    ];