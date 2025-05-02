const { db } = require('../config/db');
const moment = require('moment');

class Tour {
  constructor(data) {
    this.id = data.id;
    this.angel_id = data.angel_id;
    this.title = data.title;
    this.description = data.description;
    this.location = data.location;
    this.date = data.date;
    this.duration = data.duration;
    this.price = data.price;
    this.max_participants = data.max_participants;
    this.current_participants = data.current_participants || 0;
    this.image = data.image;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
    
    // Propriedades adicionais que podem vir de joins
    this.angel_name = data.angel_name;
    this.angel_rating = data.angel_rating;
  }

  // Formatar data para exibição
  getFormattedDate() {
    return moment(this.date).format('DD/MM/YYYY HH:mm');
  }

  // Obter data relativa (ex: "em 2 dias")
  getRelativeDate() {
    return moment(this.date).fromNow();
  }

  // Verificar se o tour já passou
  isPast() {
    return moment(this.date).isBefore(moment());
  }

  // Verificar se está lotado
  isFullyBooked() {
    return this.current_participants >= this.max_participants;
  }

  // Encontrar tour por ID
  static findById(id) {
    return new Promise((resolve, reject) => {
      db.get(`SELECT t.*, a.name as angel_name, a.rating as angel_rating 
              FROM tours t 
              JOIN angels a ON t.angel_id = a.id 
              WHERE t.id = ?`, [id], (err, row) => {
        if (err) return reject(err);
        if (!row) return resolve(null);
        resolve(new Tour(row));
      });
    });
  }

  // Buscar tour por ID e verificar se pertence a um Angel específico
  static findByIdAndAngelId(id, angelId) {
    return new Promise((resolve, reject) => {
      db.get(`SELECT t.*, a.name as angel_name, a.rating as angel_rating 
              FROM tours t 
              JOIN angels a ON t.angel_id = a.id 
              WHERE t.id = ? AND t.angel_id = ?`, [id, angelId], (err, row) => {
        if (err) return reject(err);
        if (!row) return resolve(null);
        resolve(new Tour(row));
      });
    });
  }

  // Encontrar tours futuros de um Angel
  static findUpcomingByAngelId(angelId, limit = null) {
    return new Promise((resolve, reject) => {
      let query = `SELECT t.*, a.name as angel_name 
                  FROM tours t 
                  JOIN angels a ON t.angel_id = a.id 
                  WHERE t.angel_id = ? AND t.date > datetime('now') 
                  ORDER BY t.date ASC`;
      
      if (limit) {
        query += ` LIMIT ?`;
      }
      
      const params = limit ? [angelId, limit] : [angelId];
      
      db.all(query, params, (err, rows) => {
        if (err) return reject(err);
        resolve(rows.map(row => new Tour(row)));
      });
    });
  }

  // Encontrar todos os tours de um Angel
  static findAllByAngelId(angelId) {
    return new Promise((resolve, reject) => {
      db.all(`SELECT t.*, a.name as angel_name 
              FROM tours t 
              JOIN angels a ON t.angel_id = a.id 
              WHERE t.angel_id = ? 
              ORDER BY t.date DESC`, [angelId], (err, rows) => {
        if (err) return reject(err);
        resolve(rows.map(row => new Tour(row)));
      });
    });
  }

  // Encontrar tours disponíveis para um Visitor
  static findAvailableForVisitor(visitorId, angelId) {
    return new Promise((resolve, reject) => {
      db.all(`SELECT t.*, a.name as angel_name, 
              (SELECT COUNT(*) FROM bookings b WHERE b.tour_id = t.id AND b.visitor_id = ? AND b.status = 'confirmado') as already_booked 
              FROM tours t 
              JOIN angels a ON t.angel_id = a.id 
              WHERE t.angel_id = ? AND t.date > datetime('now') AND t.current_participants < t.max_participants 
              ORDER BY t.date ASC`, [visitorId, angelId], (err, rows) => {
        if (err) return reject(err);
        resolve(rows.map(row => {
          const tour = new Tour(row);
          tour.already_booked = row.already_booked > 0;
          return tour;
        }));
      });
    });
  }

  // Buscar tours em destaque
  static findFeatured(limit = 6) {
    return new Promise((resolve, reject) => {
      db.all(`SELECT t.*, a.name as angel_name, a.rating as angel_rating 
              FROM tours t 
              JOIN angels a ON t.angel_id = a.id 
              WHERE t.date > datetime('now') 
              ORDER BY t.date ASC 
              LIMIT ?`, [limit], (err, rows) => {
        if (err) return reject(err);
        resolve(rows.map(row => new Tour(row)));
      });
    });
  }

  // Buscar tours com base em critérios
  static search(criteria = {}) {
    return new Promise((resolve, reject) => {
      let query = `SELECT t.*, a.name as angel_name, a.rating as angel_rating 
                  FROM tours t 
                  JOIN angels a ON t.angel_id = a.id 
                  WHERE t.date > datetime('now')`;
      
      const params = [];
      
      if (criteria.search) {
        query += ` AND (t.title LIKE ? OR t.description LIKE ? OR t.location LIKE ?)`;
        params.push(`%${criteria.search}%`, `%${criteria.search}%`, `%${criteria.search}%`);
      }
      
      if (criteria.date) {
        query += ` AND date(t.date) = ?`;
        params.push(criteria.date);
      }
      
      if (criteria.location) {
        query += ` AND t.location LIKE ?`;
        params.push(`%${criteria.location}%`);
      }
      
      query += ` ORDER BY t.date ASC`;
      
      db.all(query, params, (err, rows) => {
        if (err) return reject(err);
        resolve(rows.map(row => new Tour(row)));
      });
    });
  }

  // Obter localizações disponíveis para filtros
  static getAvailableLocations() {
    return new Promise((resolve, reject) => {
      db.all(`SELECT DISTINCT location FROM tours 
              WHERE date > datetime('now') 
              ORDER BY location ASC`, [], (err, rows) => {
        if (err) return reject(err);
        resolve(rows.map(row => row.location));
      });
    });
  }

  // Salvar um tour
  save() {
    return new Promise((resolve, reject) => {
      const query = this.id 
        ? `UPDATE tours 
            SET title = ?, description = ?, location = ?, date = ?, 
                duration = ?, price = ?, max_participants = ?, updated_at = datetime('now') 
            WHERE id = ? AND angel_id = ?`
        : `INSERT INTO tours 
            (angel_id, title, description, location, date, duration, price, max_participants) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
      
      const params = this.id
        ? [this.title, this.description || '', this.location, this.date, 
            this.duration || 60, this.price || 0, this.max_participants || 10,
            this.id, this.angel_id]
        : [this.angel_id, this.title, this.description || '', this.location, 
            this.date, this.duration || 60, this.price || 0, this.max_participants || 10];
      
      db.run(query, params, function(err) {
        if (err) return reject(err);
        if (!this.id) {
          resolve(this.lastID);
        } else {
          resolve(this.changes > 0);
        }
      });
    });
  }

  // Cancelar tour
  static cancel(id, angelId) {
    return new Promise((resolve, reject) => {
      // Iniciar transação
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        // Deletar o tour
        db.run('DELETE FROM tours WHERE id = ? AND angel_id = ?', [id, angelId], function(err) {
          if (err) {
            db.run('ROLLBACK');
            return reject(err);
          }
          
          if (this.changes === 0) {
            db.run('ROLLBACK');
            return reject(new Error('Tour não encontrado ou não pertence ao guia'));
          }
          
          // Atualizar status das reservas
          db.run(`UPDATE bookings SET status = 'cancelado' WHERE tour_id = ?`, [id], function(err) {
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
  }

  // Incrementar número de participantes
  static incrementParticipants(id) {
    return new Promise((resolve, reject) => {
      db.run(`UPDATE tours SET current_participants = current_participants + 1 
              WHERE id = ?`, [id], function(err) {
        if (err) return reject(err);
        resolve(this.changes > 0);
      });
    });
  }

  // Decrementar número de participantes
  static decrementParticipants(id) {
    return new Promise((resolve, reject) => {
      db.run(`UPDATE tours SET current_participants = current_participants - 1 
              WHERE id = ? AND current_participants > 0`, [id], function(err) {
        if (err) return reject(err);
        resolve(this.changes > 0);
      });
    });
  }
}

module.exports = Tour;