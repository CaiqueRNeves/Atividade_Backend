const Angel = require('../models/Angel');
const Tour = require('../models/Tour');
const Visitor = require('../models/Visitor');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const Message = require('../models/Message');
const MessageService = require('../services/MessageService');
const TourService = require('../services/TourService');
const { validationResult } = require('express-validator');

// Exibir dashboard do Angel
exports.dashboard = async (req, res) => {
  try {
    const angelId = req.session.user.id;
    
    // Buscar informações do Angel
    const angel = await Angel.findById(angelId);
    if (!angel) {
      req.flash('error', 'Erro ao carregar informações do guia');
      return res.redirect('/');
    }
    
    // Buscar próximos tours
    const upcomingTours = await Tour.findUpcomingByAngelId(angelId, 5);
    
    // Buscar visitors afiliados
    const visitors = await Visitor.findByAngelId(angelId);
    
    // Buscar mensagens não lidas
    const unreadMessages = await Message.countUnread(angelId, 'angel');
    
    // Buscar avaliações recentes
    const reviews = await Review.findByAngelId(angelId, 5);
    
    // Formatar datas dos tours
    upcomingTours.forEach(tour => {
      tour.formattedDate = tour.getFormattedDate();
      tour.relativeDate = tour.getRelativeDate();
    });
    
    res.render('pages/angel-dashboard', {
      title: 'Dashboard do Guia - MyBestAngel',
      description: 'Gerencie seus tours e visitantes',
      angel: angel,
      upcomingTours: upcomingTours,
      visitors: visitors,
      unreadMessages: unreadMessages,
      reviews: reviews
    });
  } catch (error) {
    console.error('Erro no dashboard do Angel:', error);
    req.flash('error', 'Erro ao carregar dashboard');
    return res.redirect('/');
  }
};

// Mostrar perfil do Angel
exports.showProfile = async (req, res) => {
  try {
    const angelId = req.params.id || req.session.user.id;
    
    // Buscar Angel
    const angel = await Angel.findById(angelId);
    if (!angel) {
      req.flash('error', 'Guia não encontrado');
      return res.redirect('/');
    }
    
    // Buscar tours disponíveis
    const tours = await Tour.findUpcomingByAngelId(angelId);
    
    // Buscar avaliações
    const reviews = await Review.findByAngelId(angelId);
    
    // Formatar datas dos tours
    tours.forEach(tour => {
      tour.formattedDate = tour.getFormattedDate();
      tour.relativeDate = tour.getRelativeDate();
    });
    
    res.render('pages/angel-profile', {
      title: `Guia ${angel.name} - MyBestAngel`,
      description: `Perfil do guia turístico ${angel.name}`,
      angel: angel,
      tours: tours,
      reviews: reviews,
      isOwnProfile: req.session.user && req.session.user.id === angel.id
    });
  } catch (error) {
    console.error('Erro ao mostrar perfil:', error);
    req.flash('error', 'Erro ao carregar perfil');
    return res.redirect('/');
  }
};

// Mostrar formulário para editar perfil
exports.showEditProfileForm = async (req, res) => {
  try {
    const angelId = req.session.user.id;
    
    // Buscar Angel
    const angel = await Angel.findById(angelId);
    if (!angel) {
      req.flash('error', 'Erro ao carregar informações do guia');
      return res.redirect('/angel/dashboard');
    }
    
    res.render('pages/angel-edit-profile', {
      title: 'Editar Perfil - MyBestAngel',
      description: 'Atualize suas informações de perfil',
      angel: angel
    });
  } catch (error) {
    console.error('Erro ao mostrar formulário de edição:', error);
    req.flash('error', 'Erro ao carregar formulário');
    return res.redirect('/angel/dashboard');
  }
};

// Processar atualização de perfil
exports.updateProfile = async (req, res) => {
  try {
    const angelId = req.session.user.id;
    const { name, phone, bio, languages, specialty } = req.body;
    
    // Validar entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash('error', errors.array()[0].msg);
      return res.redirect('/angel/edit-profile');
    }
    
    // Buscar Angel
    const angel = await Angel.findById(angelId);
    if (!angel) {
      req.flash('error', 'Erro ao carregar informações do guia');
      return res.redirect('/angel/dashboard');
    }
    
    // Atualizar dados
    angel.name = name;
    angel.phone = phone || '';
    angel.bio = bio || '';
    angel.languages = languages || '';
    angel.specialty = specialty || '';
    
    // Salvar alterações
    await angel.save();
    
    // Atualizar nome na sessão
    req.session.user.name = name;
    
    req.flash('success', 'Perfil atualizado com sucesso!');
    return res.redirect('/angel/dashboard');
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    req.flash('error', 'Erro ao atualizar perfil');
    return res.redirect('/angel/edit-profile');
  }
};

// Mostrar formulário para criar novo tour
exports.showCreateTourForm = (req, res) => {
  res.render('pages/angel-create-tour', {
    title: 'Criar Tour - MyBestAngel',
    description: 'Crie um novo tour turístico'
  });
};

// Processar criação de tour
exports.createTour = async (req, res) => {
  try {
    const angelId = req.session.user.id;
    
    // Validar entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash('error', errors.array()[0].msg);
      return res.redirect('/angel/create-tour');
    }
    
    // Criar tour
    await TourService.createTour(angelId, req.body);
    
    req.flash('success', 'Tour criado com sucesso!');
    return res.redirect('/angel/dashboard');
  } catch (error) {
    console.error('Erro ao criar tour:', error);
    req.flash('error', error.message || 'Erro ao criar tour');
    return res.redirect('/angel/create-tour');
  }
};

// Mostrar todos os tours do Angel
exports.showTours = async (req, res) => {
  try {
    const angelId = req.session.user.id;
    
    // Buscar todos os tours do Angel
    const tours = await Tour.findAllByAngelId(angelId);
    
    // Formatar datas dos tours
    tours.forEach(tour => {
      tour.formattedDate = tour.getFormattedDate();
      tour.isPast = tour.isPast();
    });
    
    // Separar tours futuros e passados
    const upcomingTours = tours.filter(tour => !tour.isPast);
    const pastTours = tours.filter(tour => tour.isPast);
    
    res.render('pages/angel-tours', {
      title: 'Meus Tours - MyBestAngel',
      description: 'Gerencie seus tours turísticos',
      upcomingTours: upcomingTours,
      pastTours: pastTours
    });
  } catch (error) {
    console.error('Erro ao mostrar tours:', error);
    req.flash('error', 'Erro ao carregar tours');
    return res.redirect('/angel/dashboard');
  }
};

// Mostrar detalhes de um tour específico
exports.showTour = async (req, res) => {
  try {
    const tourId = req.params.id;
    const angelId = req.session.user.id;
    
    // Buscar detalhes do tour
    const tour = await Tour.findByIdAndAngelId(tourId, angelId);
    if (!tour) {
      req.flash('error', 'Tour não encontrado');
      return res.redirect('/angel/tours');
    }
    
    // Buscar reservas para este tour
    const bookings = await Booking.findByTourId(tourId);
    
    // Formatar data do tour
    tour.formattedDate = tour.getFormattedDate();
    tour.isPast = tour.isPast();
    
    res.render('pages/angel-tour-details', {
      title: `Tour: ${tour.title} - MyBestAngel`,
      description: `Detalhes do tour ${tour.title}`,
      tour: tour,
      bookings: bookings
    });
  } catch (error) {
    console.error('Erro ao mostrar detalhes do tour:', error);
    req.flash('error', 'Erro ao carregar detalhes do tour');
    return res.redirect('/angel/tours');
  }
};

// Mostrar formulário para editar tour
exports.showEditTourForm = async (req, res) => {
  try {
    const tourId = req.params.id;
    const angelId = req.session.user.id;
    
    // Buscar detalhes do tour
    const tour = await Tour.findByIdAndAngelId(tourId, angelId);
    if (!tour) {
      req.flash('error', 'Tour não encontrado');
      return res.redirect('/angel/tours');
    }
    
    // Formatar data e hora para o formulário
    const tourDate = tour.date.split(' ')[0];
    const tourTime = tour.date.split(' ')[1].substring(0, 5);
    
    res.render('pages/angel-edit-tour', {
      title: `Editar Tour: ${tour.title} - MyBestAngel`,
      description: `Editar detalhes do tour ${tour.title}`,
      tour: tour,
      tourDate: tourDate,
      tourTime: tourTime
    });
  } catch (error) {
    console.error('Erro ao mostrar formulário de edição:', error);
    req.flash('error', 'Erro ao carregar formulário');
    return res.redirect('/angel/tours');
  }
};

// Processar atualização de tour
exports.updateTour = async (req, res) => {
  try {
    const tourId = req.params.id;
    const angelId = req.session.user.id;
    
    // Validar entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash('error', errors.array()[0].msg);
      return res.redirect(`/angel/edit-tour/${tourId}`);
    }
    
    // Atualizar tour
    await TourService.updateTour(tourId, angelId, req.body);
    
    req.flash('success', 'Tour atualizado com sucesso!');
    return res.redirect(`/angel/tour/${tourId}`);
  } catch (error) {
    console.error('Erro ao atualizar tour:', error);
    req.flash('error', error.message || 'Erro ao atualizar tour');
    return res.redirect(`/angel/edit-tour/${req.params.id}`);
  }
};

// Cancelar tour
exports.cancelTour = async (req, res) => {
  try {
    const tourId = req.params.id;
    const angelId = req.session.user.id;
    
    // Cancelar tour
    await TourService.cancelTour(tourId, angelId);
    
    req.flash('success', 'Tour cancelado com sucesso!');
    return res.redirect('/angel/tours');
  } catch (error) {
    console.error('Erro ao cancelar tour:', error);
    req.flash('error', error.message || 'Erro ao cancelar tour');
    return res.redirect(`/angel/tour/${req.params.id}`);
  }
};

// Mostrar todos os visitantes afiliados
exports.showVisitors = async (req, res) => {
  try {
    const angelId = req.session.user.id;
    
    // Buscar todos os visitantes afiliados
    const visitors = await Visitor.findByAngelId(angelId);
    
    res.render('pages/angel-visitors', {
      title: 'Meus Visitantes - MyBestAngel',
      description: 'Gerencie seus visitantes afiliados',
      visitors: visitors
    });
  } catch (error) {
    console.error('Erro ao mostrar visitantes:', error);
    req.flash('error', 'Erro ao carregar visitantes');
    return res.redirect('/angel/dashboard');
  }
};

// Mostrar todas as mensagens
exports.showMessages = async (req, res) => {
  try {
    const angelId = req.session.user.id;
    
    // Buscar mensagens do Angel
    const messageData = await MessageService.getAngelMessages(angelId);
    
    res.render('pages/angel-messages', {
      title: 'Minhas Mensagens - MyBestAngel',
      description: 'Gerencie suas conversas com visitantes',
      conversations: messageData.conversations,
      availableVisitors: messageData.availableVisitors
    });
  } catch (error) {
    console.error('Erro ao mostrar mensagens:', error);
    req.flash('error', 'Erro ao carregar mensagens');
    return res.redirect('/angel/dashboard');
  }
};

// Enviar mensagem para visitante
exports.sendMessage = async (req, res) => {
  try {
    const angelId = req.session.user.id;
    const { visitorId, content } = req.body;
    
    // Validar entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash('error', errors.array()[0].msg);
      return res.redirect('/angel/messages');
    }
    
    // Enviar mensagem
    await MessageService.sendAngelMessage(angelId, visitorId, content);
    
    req.flash('success', 'Mensagem enviada com sucesso!');
    return res.redirect('/angel/messages');
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    req.flash('error', error.message || 'Erro ao enviar mensagem');
    return res.redirect('/angel/messages');
  }
};

// Mostrar dashboard com insights
exports.showInsights = async (req, res) => {
  try {
    const angelId = req.session.user.id;
    
    // Buscar estatísticas de tours
    const tourStats = {
      totalTours: 0,
      upcomingTours: 0, 
      pastTours: 0,
      uniqueLocations: 0
    };
    
    // Buscar todos os tours do Angel
    const tours = await Tour.findAllByAngelId(angelId);
    
    // Calcular estatísticas
    tourStats.totalTours = tours.length;
    tourStats.upcomingTours = tours.filter(tour => !tour.isPast()).length;
    tourStats.pastTours = tours.filter(tour => tour.isPast()).length;
    
    // Locais únicos
    const locations = new Set(tours.map(tour => tour.location));
    tourStats.uniqueLocations = locations.size;
    
    // Popular locais mais frequentes
    const locationCount = {};
    tours.forEach(tour => {
      if (!locationCount[tour.location]) {
        locationCount[tour.location] = 0;
      }
      locationCount[tour.location]++;
    });
    
    const popularLocations = Object.entries(locationCount)
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // Buscar estatísticas de avaliações
    const reviewStats = {
      averageRating: '0.0',
      totalReviews: 0
    };
    
    // Buscar Angel para obter avaliação média
    const angel = await Angel.findById(angelId);
    if (angel) {
      reviewStats.averageRating = angel.rating.toFixed(1);
      reviewStats.totalReviews = angel.reviews_count;
    }
    
    // Sugestões de passeios populares em Belém
    const popularTours = [
      {
        title: 'Mercado Ver-o-Peso',
        description: 'O famoso mercado Ver-o-Peso é o maior mercado a céu aberto da América Latina e um símbolo de Belém.',
        image: '/images/ver-o-peso.jpg'
      },
      {
        title: 'Estação das Docas',
        description: 'Um complexo turístico à beira do rio com restaurantes, bares e lojas em antigos galpões portuários.',
        image: '/images/estacao-docas.jpg'
      },
      {
        title: 'Museu Emílio Goeldi',
        description: 'Um dos mais importantes museus de história natural e etnografia da Amazônia.',
        image: '/images/museu-goeldi.jpg'
      },
      {
        title: 'Basílica de Nazaré',
        description: 'Santuário que abriga a imagem de Nossa Senhora de Nazaré, padroeira dos paraenses.',
        image: '/images/basilica-nazare.jpg'
      },
      {
        title: 'Mangal das Garças',
        description: 'Parque naturalístico com fauna e flora amazônicas, incluindo um borboletário e um mirante.',
        image: '/images/mangal-garcas.jpg'
      }
    ];
    
    // Sugestões de pratos típicos paraenses
    const typicalDishes = [
      {
        name: 'Pato no Tucupi',
        description: 'Pato assado servido com molho de tucupi (líquido extraído da mandioca) e jambu (erva típica).',
        image: '/images/pato-tucupi.jpg'
      },
      {
        name: 'Tacacá',
        description: 'Caldo quente feito com tucupi, jambu, camarão seco e goma de tapioca.',
        image: '/images/tacaca.jpg'
      },
      {
        name: 'Maniçoba',
        description: 'Prato feito com folhas de mandioca moídas e cozidas por dias, servido com carnes variadas.',
        image: '/images/manicoba.jpg'
      },
      {
        name: 'Açaí',
        description: 'Servido como uma pasta espessa, geralmente acompanhado de farinha de tapioca e peixe frito.',
        image: '/images/acai.jpg'
      },
      {
        name: 'Vatapá',
        description: 'Creme à base de pão, camarão seco, amendoim, castanha de caju, leite de coco e dendê.',
        image: '/images/vatapa.jpg'
      }
    ];
    
    res.render('pages/angel-insights', {
      title: 'Insights e Sugestões - MyBestAngel',
      description: 'Insights e sugestões para melhorar seus tours',
      tourStats: tourStats,
      popularLocations: popularLocations,
      reviewStats: reviewStats,
      popularTours: popularTours,
      typicalDishes: typicalDishes
    });
  } catch (error) {
    console.error('Erro ao mostrar insights:', error);
    req.flash('error', 'Erro ao carregar insights');
    return res.redirect('/angel/dashboard');
  }
};