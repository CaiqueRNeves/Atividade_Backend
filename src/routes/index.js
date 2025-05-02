const express = require('express');
const router = express.Router();
const tourController = require('../controllers/tourController');
const Angel = require('../models/Angel');

// Página inicial
router.get('/', async (req, res) => {
  // Buscar tours em destaque
  tourController.getFeaturedTours((featuredTours) => {
    // Buscar guias em destaque
    Angel.findFeatured(4).then((featuredAngels) => {
      res.render('pages/home', { 
        title: 'MyBestAngel - Seu guia turístico em Belém durante a COP30',
        description: 'Descubra Belém do Pará durante a COP30 com os melhores guias turísticos locais.',
        featuredTours: featuredTours,
        featuredAngels: featuredAngels
      });
    }).catch(error => {
      console.error('Erro ao buscar guias em destaque:', error);
      res.render('pages/home', { 
        title: 'MyBestAngel - Seu guia turístico em Belém durante a COP30',
        description: 'Descubra Belém do Pará durante a COP30 com os melhores guias turísticos locais.',
        featuredTours: featuredTours,
        featuredAngels: []
      });
    });
  });
});

// Página de contatos de emergência
router.get('/emergency', (req, res) => {
  res.render('pages/emergency', { 
    title: 'Contatos de Emergência - MyBestAngel',
    description: 'Contatos de emergência em Belém do Pará'
  });
});

// Página de SAC
router.get('/sac', (req, res) => {
  res.render('pages/sac', { 
    title: 'SAC - MyBestAngel',
    description: 'Serviço de Atendimento ao Cliente'
  });
});

// Página de mapa
router.get('/map', (req, res) => {
  res.render('pages/map', { 
    title: 'Mapa de Belém - MyBestAngel',
    description: 'Mapa de Belém do Pará com pontos turísticos'
  });
});

// Sobre a COP30
router.get('/cop30', (req, res) => {
  res.render('pages/cop30', { 
    title: 'COP30 em Belém - MyBestAngel',
    description: 'Informações sobre a COP30 em Belém do Pará'
  });
});

// Sobre o projeto
router.get('/about', (req, res) => {
  res.render('pages/about', { 
    title: 'Sobre o MyBestAngel',
    description: 'Conheça mais sobre o projeto MyBestAngel'
  });
});

module.exports = router;