// Importação de módulos necessários
require('dotenv').config();
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const methodOverride = require('method-override');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');
const helmet = require('helmet');
const compression = require('compression');


// Inicialização do Express
const app = express();
const PORT = process.env.PORT || 3000;

// Configuração do EJS como template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src/views'));

// Middlewares de proteção
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "https://maps.googleapis.com", "https://maps.gstatic.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https://maps.googleapis.com", "https://maps.gstatic.com"],
      connectSrc: ["'self'", "https://maps.googleapis.com"],
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com", "https://fonts.gstatic.com"],
      frameSrc: ["'self'", "https://www.google.com"]
    }
  }
}));
app.use(compression());

// Middlewares para parsear requisições e manipular rotas
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(methodOverride('_method'));
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || 'mybestangel_secret',
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 1 dia
  }
}));
app.use(flash());

// Inicialização do banco de dados
const initDb = require('./src/config/db');
initDb();

// Rotas
const indexRoutes = require('./src/routes/index');
const authRoutes = require('./src/routes/auth');
const angelRoutes = require('./src/routes/angel');
const visitorRoutes = require('./src/routes/visitor');
const tourRoutes = require('./src/routes/tour');

// Middleware para disponibilizar variáveis globais para as views
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.userType = req.session.userType || null;
  res.locals.errors = req.flash('error') || [];
  res.locals.success = req.flash('success') || [];
  res.locals.currentPath = req.path;
  next();
});

// Configuração das rotas
app.use('/', indexRoutes);
app.use('/auth', authRoutes);
app.use('/angel', angelRoutes);
app.use('/visitor', visitorRoutes);
app.use('/tour', tourRoutes);

// Middleware para tratar 404
app.use((req, res) => {
  res.status(404).render('pages/404', { 
    title: 'Página não encontrada - MyBestAngel',
    description: 'A página que você está procurando não existe.'
  });
});

// Middleware para tratar erros
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('pages/error', { 
    title: 'Erro - MyBestAngel',
    description: 'Ocorreu um erro no servidor.',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Inicialização do servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Acesse: http://localhost:${PORT}`);
});