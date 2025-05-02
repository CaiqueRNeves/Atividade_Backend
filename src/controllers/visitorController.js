const Visitor = require('../models/Visitor');
const Tour = require('../models/Tour');
const Booking = require('../models/Booking');
const MessageService = require('../services/MessageService');
const TourService = require('../services/TourService');
const { validationResult } = require('express-validator');

// Exibir dashboard do Visitor
exports.dashboard = async (req, res) => {
  try {
    const visitorId = req.session.user.id;
    
    // Buscar informações do Visitor com detalhes do Angel
    const visitor = await Visitor.findByIdWithAngelDetails(visitorId);
    if (!visitor) {
      req.flash('error', 'Erro ao carregar informações do visitante');
      return res.redirect('/');
    }
    
    // Buscar próximos tours agendados
    const upcomingTours = await Booking.findUpcomingByVisitorId(visitorId);
    
    // Buscar histórico de agendamentos
    const bookingHistory = await Booking.findHistoryByVisitorId(visitorId);
    
    // Buscar mensagens não lidas
    const unreadMessages = await MessageService.countUnreadMessages(visitorId, 'visitor');
    
    // Buscar Angel para obter ID
    const angelId = visitor.angel_id;
    
    // Buscar tours recentes do Angel
    
    const recentTours = await Tour.findUpcomingByAngelId(angelId, 10);
    
    // Formatar datas
    for (const tour of upcomingTours) {
      tour.formattedDate = new Date(tour.tour_date).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      tour.relativeDate = getRelativeTime(tour.tour_date);
    }
    
    for (const booking of bookingHistory) {
      booking.formattedDate = new Date(booking.tour_date).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      booking.isPast = new Date(booking.tour_date) < new Date();
    }
    
    // Transformar tours recentes em atualizações
    const recentUpdates = recentTours.map(tour => ({
      id: tour.id,
      title: tour.title,
      location: tour.location,
      date: tour.date,
      updated_at: tour.updated_at,
      type: 'tour_created',
      formattedDate: new Date(tour.date).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      formattedUpdateDate: new Date(tour.updated_at).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      relativeUpdateDate: getRelativeTime(tour.updated_at)
    }));
    
    res.render('pages/visitor-dashboard', {
      title: 'Dashboard do Visitante - MyBestAngel',
      description: 'Gerencie seus passeios turísticos e veja atualizações do seu guia',
      visitor: visitor,
      upcomingTours: upcomingTours,
      bookingHistory: bookingHistory,
      unreadMessages: unreadMessages,
      recentUpdates: recentUpdates
    });
  } catch (error) {
    console.error('Erro no dashboard do Visitor:', error);
    req.flash('error', 'Erro ao carregar dashboard');
    return res.redirect('/');
  }
};

// Função auxiliar para calcular tempo relativo
function getRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    if (date > now) {
      return 'Hoje';
    } else {
      return 'Hoje (já passou)';
    }
  } else if (diffDays === 1) {
    if (date > now) {
      return 'Amanhã';
    } else {
      return 'Ontem';
    }
  } else if (diffDays < 7) {
    if (date > now) {
      return `Em ${diffDays} dias`;
    } else {
      return `Há ${diffDays} dias`;
    }
  } else if (diffDays < 30) {
    const diffWeeks = Math.floor(diffDays / 7);
    if (date > now) {
      return `Em ${diffWeeks} ${diffWeeks === 1 ? 'semana' : 'semanas'}`;
    } else {
      return `Há ${diffWeeks} ${diffWeeks === 1 ? 'semana' : 'semanas'}`;
    }
  } else {
    const diffMonths = Math.floor(diffDays / 30);
    if (date > now) {
      return `Em ${diffMonths} ${diffMonths === 1 ? 'mês' : 'meses'}`;
    } else {
      return `Há ${diffMonths} ${diffMonths === 1 ? 'mês' : 'meses'}`;
    }
  }
}

// Mostrar perfil do Visitor
exports.showProfile = async (req, res) => {
  try {
    const visitorId = req.session.user.id;
    
    // Buscar Visitor com dados do Angel
    const visitor = await Visitor.findByIdWithAngelDetails(visitorId);
    if (!visitor) {
      req.flash('error', 'Erro ao carregar informações do visitante');
      return res.redirect('/');
    }
    
    res.render('pages/visitor-profile', {
      title: 'Meu Perfil - MyBestAngel',
      description: 'Visualize e edite seu perfil',
      visitor: visitor
    });
  } catch (error) {
    console.error('Erro ao mostrar perfil:', error);
    req.flash('error', 'Erro ao carregar perfil');
    return res.redirect('/visitor/dashboard');
  }
};

// Mostrar formulário para editar perfil
exports.showEditProfileForm = async (req, res) => {
  try {
    const visitorId = req.session.user.id;
    
    // Buscar Visitor
    const visitor = await Visitor.findById(visitorId);
    if (!visitor) {
      req.flash('error', 'Erro ao carregar informações do visitante');
      return res.redirect('/visitor/dashboard');
    }
    
    res.render('pages/visitor-edit-profile', {
      title: 'Editar Perfil - MyBestAngel',
      description: 'Atualize suas informações de perfil',
      visitor: visitor
    });
  } catch (error) {
    console.error('Erro ao mostrar formulário de edição:', error);
    req.flash('error', 'Erro ao carregar formulário');
    return res.redirect('/visitor/dashboard');
  }
};

// Processar atualização de perfil
exports.updateProfile = async (req, res) => {
  try {
    const visitorId = req.session.user.id;
    const { name, phone, nationality, languagePreference } = req.body;
    
    // Validar entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash('error', errors.array()[0].msg);
      return res.redirect('/visitor/edit-profile');
    }
    
    // Buscar Visitor
    const visitor = await Visitor.findById(visitorId);
    if (!visitor) {
      req.flash('error', 'Erro ao carregar informações do visitante');
      return res.redirect('/visitor/dashboard');
    }
    
    // Atualizar dados
    visitor.name = name;
    visitor.phone = phone || '';
    visitor.nationality = nationality || '';
    visitor.language_preference = languagePreference || '';
    
    // Salvar alterações
    await visitor.save();
    
    // Atualizar nome na sessão
    req.session.user.name = name;
    
    req.flash('success', 'Perfil atualizado com sucesso!');
    return res.redirect('/visitor/profile');
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    req.flash('error', 'Erro ao atualizar perfil');
    return res.redirect('/visitor/edit-profile');
  }
};

// Mostrar tours disponíveis
exports.showAvailableTours = async (req, res) => {
  try {
    const visitorId = req.session.user.id;
    
    // Buscar o Visitor para obter o Angel associado
    const visitor = await Visitor.findById(visitorId);
    if (!visitor) {
      req.flash('error', 'Erro ao carregar informações do visitante');
      return res.redirect('/visitor/dashboard');
    }
    
    // Buscar tours disponíveis do Angel associado
    const tours = await Tour.findAvailableForVisitor(visitorId, visitor.angel_id);
    
    // Formatar datas dos tours
    tours.forEach(tour => {
      tour.formattedDate = tour.getFormattedDate();
      tour.relativeDate = tour.getRelativeDate();
      tour.isFullyBooked = tour.isFullyBooked();
    });
    
    res.render('pages/visitor-available-tours', {
      title: 'Tours Disponíveis - MyBestAngel',
      description: 'Veja os tours disponíveis do seu guia',
      tours: tours
    });
  } catch (error) {
    console.error('Erro ao mostrar tours disponíveis:', error);
    req.flash('error', 'Erro ao carregar tours disponíveis');
    return res.redirect('/visitor/dashboard');
  }
};

// Mostrar detalhes de um tour específico
exports.showTour = async (req, res) => {
  try {
    const tourId = req.params.id;
    const visitorId = req.session.user.id;
    
    // Buscar detalhes do tour
    const tour = await Tour.findById(tourId);
    if (!tour) {
      req.flash('error', 'Tour não encontrado');
      return res.redirect('/visitor/available-tours');
    }
    
    // Verificar se já reservou este tour
    const alreadyBooked = await Booking.checkExistingBooking(tourId, visitorId);
    
    // Formatar data do tour
    tour.formattedDate = tour.getFormattedDate();
    tour.isPast = tour.isPast();
    tour.isFullyBooked = tour.isFullyBooked();
    tour.already_booked = alreadyBooked;
    
    res.render('pages/visitor-tour-details', {
      title: `Tour: ${tour.title} - MyBestAngel`,
      description: `Detalhes do tour ${tour.title}`,
      tour: tour
    });
  } catch (error) {
    console.error('Erro ao mostrar detalhes do tour:', error);
    req.flash('error', 'Erro ao carregar detalhes do tour');
    return res.redirect('/visitor/available-tours');
  }
};

// Reservar um tour
exports.bookTour = async (req, res) => {
  try {
    const tourId = req.params.id;
    const visitorId = req.session.user.id;
    const { notes } = req.body;
    
    // Reservar tour
    await TourService.bookTour(tourId, visitorId, notes);
    
    req.flash('success', 'Tour reservado com sucesso!');
    return res.redirect('/visitor/dashboard');
  } catch (error) {
    console.error('Erro ao reservar tour:', error);
    req.flash('error', error.message || 'Erro ao reservar tour');
    return res.redirect(`/visitor/tour/${tourId}`);
  }
};

// Cancelar reserva de um tour
exports.cancelBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const visitorId = req.session.user.id;
    
    // Cancelar reserva
    await TourService.cancelBooking(bookingId, visitorId);
    
    req.flash('success', 'Reserva cancelada com sucesso!');
    return res.redirect('/visitor/dashboard');
  } catch (error) {
    console.error('Erro ao cancelar reserva:', error);
    req.flash('error', error.message || 'Erro ao cancelar reserva');
    return res.redirect('/visitor/dashboard');
  }
};

// Mostrar todas as mensagens
exports.showMessages = async (req, res) => {
  try {
    const visitorId = req.session.user.id;
    
    // Buscar mensagens do Visitor
    const messageData = await MessageService.getVisitorMessages(visitorId);
    
    // Buscar o Visitor para obter o nome do Angel
    const visitor = await Visitor.findByIdWithAngelDetails(visitorId);
    if (!visitor) {
      req.flash('error', 'Erro ao carregar informações do visitante');
      return res.redirect('/visitor/dashboard');
    }
    
    res.render('pages/visitor-messages', {
      title: 'Mensagens - MyBestAngel',
      description: 'Mensagens com seu guia turístico',
      messages: messageData.messages,
      angelId: visitor.angel_id,
      angelName: visitor.angel_name
    });
  } catch (error) {
    console.error('Erro ao mostrar mensagens:', error);
    req.flash('error', 'Erro ao carregar mensagens');
    return res.redirect('/visitor/dashboard');
  }
};

// Enviar mensagem para Angel
exports.sendMessage = async (req, res) => {
  try {
    const visitorId = req.session.user.id;
    const { content } = req.body;
    
    // Validar entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash('error', errors.array()[0].msg);
      return res.redirect('/visitor/messages');
    }
    
    // Enviar mensagem
    await MessageService.sendVisitorMessage(visitorId, content);
    
    req.flash('success', 'Mensagem enviada com sucesso!');
    return res.redirect('/visitor/messages');
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    req.flash('error', error.message || 'Erro ao enviar mensagem');
    return res.redirect('/visitor/messages');
  }
};

// Avaliar um tour após a realização
exports.rateTour = async (req, res) => {
  try {
    const tourId = req.params.id;
    const visitorId = req.session.user.id;
    const { rating, comment } = req.body;
    
    // Avaliar tour
    await TourService.rateTour(tourId, visitorId, rating, comment);
    
    req.flash('success', 'Avaliação enviada com sucesso!');
    return res.redirect('/visitor/dashboard');
  } catch (error) {
    console.error('Erro ao avaliar tour:', error);
    req.flash('error', error.message || 'Erro ao enviar avaliação');
    return res.redirect('/visitor/dashboard');
  }
};