const { db } = require('../config/db');
const moment = require('moment');
const Tour = require('./Tour');

class Booking {
  constructor(data) {
    this.id = data.id;
    this.tour_id = data.tour_id;
    this.visitor_id = data.visitor_id;
    this.status = data.status;
    this.notes = data.notes;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
    
    // Propriedades adicionais que podem vir de joins
    this.tour_title = data.tour_title;
    this.tour_location = data.tour_location;
    this.tour_date = data.tour_date;
    this.tour_price = data.tour_price;
    this.angel_name = data.angel_name;
    this.visitor_name = data.visitor_name;
    this.visitor_email = data.visitor_email;
  }

  // Encontrar reserva por ID
  static findById(id) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM bookings WHERE id = ?', [id], (err, row) => {
        if (err) return reject(err);
        if (!row) return resolve(null);
        resolve(new Booking(row));
      });
    });
  }

  // Verificar se já existe uma reserva para um tour e visitante
  static checkExistingBooking(tourId, visitorId) {
    return new Promise((resolve, reject) => {
      db.get(`SELECT id FROM bookings 
              WHERE tour_id = ? AND visitor_id = ? AND status = 'confirmado'`, 
              [tourId, visitorId], (err, row) => {
        if (err) return reject(err);
        resolve(!!row);
      });
    });
  }

  // Encontrar reservas para um tour
  static findByTourId(tourId) {
    return new Promise((resolve, reject) => {
      db.all(`SELECT b.*, v.name as visitor_name, v.email as visitor_email 
              FROM bookings b 
              JOIN visitors v ON b.visitor_id = v.id 
              WHERE b.tour_id = ?`, [tourId], (err, rows) => {
        if (err) return reject(err);
        resolve(rows.map(row => new Booking(row)));
      });
    });
  }

  // Encontrar reservas futuras de um visitante
  static findUpcomingByVisitorId(visitorId) {
    return new Promise((resolve, reject) => {
      db.all(`SELECT b.*, t.title as tour_title, t.location as tour_location, 
              t.date as tour_date, t.description, t.price as tour_price, a.name as FROM bookings b 
              JOIN tours t ON b.tour_id = t.id 
              JOIN angels a ON t.angel_id = a.id 
              WHERE b.visitor_id = ? AND t.date > datetime('now') AND b.status = 'confirmado' 
              ORDER BY t.date ASC`, [visitorId], (err, rows) => {
        if (err) return reject(err);
        resolve(rows.map(row => new Booking(row)));
      });
    });
  }

  // Encontrar histórico de reservas de um visitante
  static findHistoryByVisitorId(visitorId) {
    return new Promise((resolve, reject) => {
      db.all(`SELECT b.*, t.title as tour_title, t.location as tour_location, 
              t.date as tour_date, t.price as tour_price, a.name as angel_name, b.status  
              FROM bookings b 
              JOIN tours t ON b.tour_id = t.id 
              JOIN angels a ON t.angel_id = a.id 
              WHERE b.visitor_id = ? 
              ORDER BY t.date DESC`, [visitorId], (err, rows) => {
        if (err) return reject(err);
        resolve(rows.map(row => new Booking(row)));
      });
    });
  }

  // Criar reserva (com transação para atualizar número de participantes)
  static createBookingTransaction(tourId, visitorId, notes) {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        // Inserir reserva
        db.run(`INSERT INTO bookings (tour_id, visitor_id, notes) 
                VALUES (?, ?, ?)`, [tourId, visitorId, notes], function(err) {
          if (err) {
            db.run('ROLLBACK');
            return reject(err);
          }
          
          const bookingId = this.lastID;
          
          // Incrementar número de participantes
          db.run(`UPDATE tours SET current_participants = current_participants + 1 
                  WHERE id = ?`, [tourId], function(err) {
            if (err) {
              db.run('ROLLBACK');
              return reject(err);
            }
            
            db.run('COMMIT');
            resolve(bookingId);
          });
        });
      });
    });
  }

  // Cancelar reserva
  static cancelBooking(bookingId, visitorId) {
    return new Promise((resolve, reject) => {
      // Verificar se a reserva pertence ao visitante
      db.get(`SELECT b.*, t.id as tour_id 
              FROM bookings b 
              JOIN tours t ON b.tour_id = t.id 
              WHERE b.id = ? AND b.visitor_id = ? AND b.status = 'confirmado'`, 
              [bookingId, visitorId], (err, booking) => {
        if (err) return reject(err);
        
        if (!booking) {
          return reject(new Error('Reserva não encontrada ou já cancelada'));
        }
        
        // Iniciar transação
        db.serialize(() => {
          db.run('BEGIN TRANSACTION');
          
          // Atualizar status da reserva
          db.run(`UPDATE bookings SET status = 'cancelado' 
                  WHERE id = ?`, [bookingId], function(err) {
            if (err) {
              db.run('ROLLBACK');
              return reject(err);
            }
            
            // Decrementar número de participantes
            db.run(`UPDATE tours SET current_participants = current_participants - 1 
                    WHERE id = ? AND current_participants > 0`, [booking.tour_id], function(err) {
              if (err) {
                db.run('ROLLBACK');
                return reject(err);
              }
              
              db.run('COMMIT');
              resolve(true);
            });
          });
        });
      });
    });
  }

  // Atualizar status da reserva
  static updateStatus(bookingId, status) {
    return new Promise((resolve, reject) => {
      db.run(`UPDATE bookings SET status = ?, updated_at = datetime('now') 
              WHERE id = ?`, [status, bookingId], function(err) {
        if (err) return reject(err);
        resolve(this.changes > 0);
      });
    });
  }
}

module.exports = Booking;