const Tour = require('../models/Tour');
const Booking = require('../models/Booking');
const Review = require('../models/Review');

class TourService {
  // Buscar detalhes de um tour para exibição pública
  static async getPublicTourDetails(tourId) {
    try {
      const tour = await Tour.findById(tourId);
      if (!tour) {
        throw new Error('Tour não encontrado');
      }
      
      // Buscar avaliações do Angel
      const reviews = await Review.findByAngelId(tour.angel_id, 5);
      
      return {
        tour,
        formattedDate: tour.getFormattedDate(),
        relativeDate: tour.getRelativeDate(),
        isPast: tour.isPast(),
        isFullyBooked: tour.isFullyBooked(),
        reviews
      };
    } catch (error) {
      throw error;
    }
  }
  
  // Buscar tours com base em critérios
  static async searchTours(criteria) {
    try {
      const tours = await Tour.search(criteria);
      const locations = await Tour.getAvailableLocations();
      
      return {
        tours,
        locations,
        searchParams: criteria
      };
    } catch (error) {
      throw error;
    }
  }
  
  // Buscar tours em destaque para homepage
  static async getFeaturedTours() {
    try {
      return await Tour.findFeatured(6);
    } catch (error) {
      throw error;
    }
  }
  
  // Criar novo tour
  static async createTour(angelId, tourData) {
    try {
      const { title, description, location, date, time, duration, price, maxParticipants } = tourData;
      
      // Validar campos obrigatórios
      if (!title || !location || !date || !time) {
        throw new Error('Título, local, data e hora são obrigatórios');
      }
      
      // Combinar data e hora
      const dateTime = `${date} ${time}:00`;
      
      // Criar tour
      const tour = new Tour({
        angel_id: angelId,
        title,
        description: description || '',
        location,
        date: dateTime,
        duration: duration || 60,
        price: price || 0,
        max_participants: maxParticipants || 10
      });
      
      // Salvar tour
      const tourId = await tour.save();
      return tourId;
    } catch (error) {
      throw error;
    }
  }
  
  // Atualizar tour existente
  static async updateTour(tourId, angelId, tourData) {
    try {
      const { title, description, location, date, time, duration, price, maxParticipants } = tourData;
      
      // Validar campos obrigatórios
      if (!title || !location || !date || !time) {
        throw new Error('Título, local, data e hora são obrigatórios');
      }
      
      // Verificar se o tour existe e pertence ao Angel
      const existingTour = await Tour.findByIdAndAngelId(tourId, angelId);
      if (!existingTour) {
        throw new Error('Tour não encontrado ou não pertence ao guia');
      }
      
      // Combinar data e hora
      const dateTime = `${date} ${time}:00`;
      
      // Atualizar tour
      const tour = new Tour({
        id: tourId,
        angel_id: angelId,
        title,
        description: description || '',
        location,
        date: dateTime,
        duration: duration || 60,
        price: price || 0,
        max_participants: maxParticipants || 10
      });
      
      // Salvar alterações
      await tour.save();
      return true;
    } catch (error) {
      throw error;
    }
  }
  
  // Cancelar tour
  static async cancelTour(tourId, angelId) {
    try {
      return await Tour.cancel(tourId, angelId);
    } catch (error) {
      throw error;
    }
  }
  
  // Reservar um tour
  static async bookTour(tourId, visitorId, notes) {
    try {
      // Verificar se o tour existe e está disponível
      const tour = await Tour.findById(tourId);
      if (!tour) {
        throw new Error('Tour não encontrado');
      }
      
      if (tour.isPast()) {
        throw new Error('Tour já passou');
      }
      
      if (tour.isFullyBooked()) {
        throw new Error('Tour está lotado');
      }
      
      // Verificar se já tem reserva
      const hasBooking = await Booking.checkExistingBooking(tourId, visitorId);
      if (hasBooking) {
        throw new Error('Você já reservou este tour');
      }
      
      // Criar reserva
      const bookingId = await Booking.createBookingTransaction(tourId, visitorId, notes || '');
      return bookingId;
    } catch (error) {
      throw error;
    }
  }
  
  // Cancelar reserva de um tour
  static async cancelBooking(bookingId, visitorId) {
    try {
      return await Booking.cancelBooking(bookingId, visitorId);
    } catch (error) {
      throw error;
    }
  }
  
  // Avaliar um tour
  static async rateTour(tourId, visitorId, rating, comment) {
    try {
      // Validar avaliação
      if (!rating || rating < 1 || rating > 5) {
        throw new Error('Avaliação deve ser entre 1 e 5 estrelas');
      }
      
      // Verificar se o tour existe e se o visitante participou
      const booking = await Booking.findByTourIdAndVisitorId(tourId, visitorId);
      if (!booking) {
        throw new Error('Tour não encontrado ou você não participou');
      }
      
      // Verificar se o tour já passou
      const tour = await Tour.findById(tourId);
      if (!tour.isPast()) {
        throw new Error('Você só pode avaliar tours que já ocorreram');
      }
      
      // Verificar se já avaliou este tour
      const hasReviewed = await Review.hasReviewed(tourId, visitorId);
      if (hasReviewed) {
        throw new Error('Você já avaliou este tour');
      }
      
      // Criar avaliação
      const reviewId = await Review.create(tourId, visitorId, tour.angel_id, rating, comment);
      return reviewId;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = TourService;