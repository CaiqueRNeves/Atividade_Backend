const TourService = require('../services/TourService');
const { validationResult } = require('express-validator');

// Mostrar detalhe público de um tour
exports.showPublicTour = async (req, res) => {
  try {
    const tourId = req.params.id;
    const tourData = await TourService.getPublicTourDetails(tourId);
    
    res.render('pages/public-tour-details', {
      title: `Tour: ${tourData.tour.title} - MyBestAngel`,
      description: `Detalhes do tour ${tourData.tour.title} com o guia ${tourData.tour.angel_name}`,
      tour: tourData.tour,
      formattedDate: tourData.formattedDate,
      isPast: tourData.isPast,
      isFullyBooked: tourData.isFullyBooked,
      reviews: tourData.reviews,
      isAuthenticated: req.session.user ? true : false,
      userType: req.session.userType
    });
  } catch (error) {
    console.error('Erro ao buscar tour:', error);
    req.flash('error', error.message || 'Tour não encontrado');
    return res.redirect('/');
  }
};

// Buscar tours com base em critérios
exports.searchTours = async (req, res) => {
  try {
    const { search, date, location } = req.query;
    const searchData = await TourService.searchTours({ search, date, location });
    
    // Formatar datas dos tours
    searchData.tours.forEach(tour => {
      tour.formattedDate = tour.getFormattedDate();
      tour.relativeDate = tour.getRelativeDate();
      tour.isFullyBooked = tour.isFullyBooked();
    });
    
    res.render('pages/search-tours', {
      title: 'Buscar Tours - MyBestAngel',
      description: 'Encontre tours em Belém do Pará durante a COP30',
      tours: searchData.tours,
      locations: searchData.locations,
      searchParams: searchData.searchParams
    });
  } catch (error) {
    console.error('Erro ao buscar tours:', error);
    req.flash('error', error.message || 'Erro ao buscar tours');
    return res.redirect('/');
  }
};

// Listar tours em destaque na homepage
exports.getFeaturedTours = async (callback) => {
  try {
    const tours = await TourService.getFeaturedTours();
    
    // Formatar datas dos tours
    tours.forEach(tour => {
      tour.formattedDate = tour.getFormattedDate();
      tour.relativeDate = tour.getRelativeDate();
      tour.isFullyBooked = tour.isFullyBooked();
    });
    
    return callback(tours);
  } catch (error) {
    console.error('Erro ao buscar tours em destaque:', error);
    return callback([]);
  }
};