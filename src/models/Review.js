const { db } = require('../config/db');
const moment = require('moment');
const Angel = require('./Angel');

class Review {
  constructor(data) {
    this.id = data.id;
    this.tour_id = data.tour_id;
    this.visitor_id = data.visitor_id;
    this.angel_id = data.angel_id;
    this.rating = data.rating;
    this.comment = data.comment;
    this.created_at = data.created_at;
    
    // Propriedades adicionais que podem vir de joins
    this.visitor_name = data.visitor_name;
    this.tour_title = data.tour_title;
  }

  // Formatar data para exibição
  getFormattedDate() {
    return moment(this.created_at).format('DD/MM/YYYY HH:mm');
  }

  // Buscar reviews de um Angel
  static findByAngelId(angelId, limit = null) {
    return new Promise((resolve, reject) => {
      let query = `SELECT r.*, v.name as visitor_name, t.title as tour_title
                  FROM reviews r 
                  JOIN visitors v ON r.visitor_id = v.id 
                  JOIN tours t ON r.tour_id = t.id
                  WHERE r.angel_id = ? 
                  ORDER BY r.created_at DESC`;
      
      if (limit) {
        query += ` LIMIT ?`;
      }
      
      const params = limit ? [angelId, limit] : [angelId];
      
      db.all(query, params, (err, rows) => {
        if (err) return reject(err);
        resolve(rows.map(row => new Review(row)));
      });
    });
  }

  // Verificar se um visitante já avaliou um tour
  static hasReviewed(tourId, visitorId) {
    return new Promise((resolve, reject) => {
      db.get('SELECT id FROM reviews WHERE tour_id = ? AND visitor_id = ?', 
              [tourId, visitorId], (err, row) => {
        if (err) return reject(err);
        resolve(!!row);
      });
    });
  }

  // Criar uma nova avaliação (com atualização do rating do Angel)
  static create(tourId, visitorId, angelId, rating, comment) {
    return new Promise((resolve, reject) => {
      // Verificar se já avaliou este tour
      this.hasReviewed(tourId, visitorId).then(hasReviewed => {
        if (hasReviewed) {
          return reject(new Error('Você já avaliou este tour'));
        }
        
        // Iniciar transação
        db.serialize(() => {
          db.run('BEGIN TRANSACTION');
          
          // Inserir avaliação
          db.run(`INSERT INTO reviews (tour_id, visitor_id, angel_id, rating, comment) 
                  VALUES (?, ?, ?, ?, ?)`, 
                  [tourId, visitorId, angelId, rating, comment || ''], 
                  function(err) {
            if (err) {
              db.run('ROLLBACK');
              return reject(err);
            }
            
            const reviewId = this.lastID;
            
            // Atualizar status da reserva para 'realizado'
            db.run(`UPDATE bookings SET status = 'realizado' 
                    WHERE tour_id = ? AND visitor_id = ?`, 
                    [tourId, visitorId], function(err) {
              if (err) {
                console.error('Erro ao atualizar status da reserva:', err.message);
              }
              
              // Atualizar avaliação média do Angel
              Angel.updateRating(angelId).then(() => {
                db.run('COMMIT');
                resolve(reviewId);
              }).catch(err => {
                db.run('ROLLBACK');
                reject(err);
              });
            });
          });
        });
      }).catch(reject);
    });
  }
}

module.exports = Review;