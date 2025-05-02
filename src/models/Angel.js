const { db } = require('../config/db');
const bcrypt = require('bcrypt');

class Angel {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.email = data.email;
    this.password = data.password;
    this.phone = data.phone;
    this.bio = data.bio;
    this.languages = data.languages;
    this.profile_image = data.profile_image;
    this.specialty = data.specialty;
    this.rating = data.rating || 5.0;
    this.reviews_count = data.reviews_count || 0;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Encontrar Angel por ID
  static findById(id) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM angels WHERE id = ?', [id], (err, row) => {
        if (err) return reject(err);
        if (!row) return resolve(null);
        resolve(new Angel(row));
      });
    });
  }

  // Encontrar Angel por email
  static findByEmail(email) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM angels WHERE email = ?', [email], (err, row) => {
        if (err) return reject(err);
        if (!row) return resolve(null);
        resolve(new Angel(row));
      });
    });
  }

  // Obter todos os Angels disponíveis para afiliação
  static findAvailableForAffiliation() {
    return new Promise((resolve, reject) => {
      db.all(`SELECT id, name, specialty, languages, bio FROM angels 
              WHERE (SELECT COUNT(*) FROM visitors WHERE angel_id = angels.id) < 3`, 
              [], (err, rows) => {
        if (err) return reject(err);
        resolve(rows.map(row => new Angel(row)));
      });
    });
  }

  // Obter Angels em destaque
  static findFeatured(limit = 4) {
    return new Promise((resolve, reject) => {
      db.all(`SELECT a.*, 
              (SELECT COUNT(*) FROM visitors v WHERE v.angel_id = a.id) as visitors_count,
              (SELECT COUNT(*) FROM tours t WHERE t.angel_id = a.id AND t.date > datetime('now')) as upcoming_tours_count
              FROM angels a 
              ORDER BY a.rating DESC, a.reviews_count DESC 
              LIMIT ?`, [limit], (err, rows) => {
        if (err) return reject(err);
        resolve(rows.map(row => new Angel(row)));
      });
    });
  }

  // Verificar senha
  async verifyPassword(password) {
    return await bcrypt.compare(password, this.password);
  }

  // Salvar (criar/atualizar) Angel
  save() {
    return new Promise(async (resolve, reject) => {
      try {
        // Se for criação de novo angel, a senha precisa ser hash
        if (!this.id && this.password) {
          this.password = await bcrypt.hash(this.password, 10);
        }

        const query = this.id
          ? `UPDATE angels SET name = ?, phone = ?, bio = ?, languages = ?, 
              specialty = ?, updated_at = datetime('now') WHERE id = ?`
          : `INSERT INTO angels (name, email, password, phone, bio, languages, specialty) 
              VALUES (?, ?, ?, ?, ?, ?, ?)`;
        
        const params = this.id
          ? [this.name, this.phone || '', this.bio || '', this.languages || '', 
             this.specialty || '', this.id]
          : [this.name, this.email, this.password, this.phone || '', 
             this.bio || '', this.languages || '', this.specialty || ''];
        
        db.run(query, params, function(err) {
          if (err) return reject(err);
          if (!this.id) {
            resolve(this.lastID);
          } else {
            resolve(this.changes > 0);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  // Atualizar rating do Angel
  static updateRating(angelId) {
    return new Promise((resolve, reject) => {
      db.get('SELECT AVG(rating) as avg_rating, COUNT(*) as count FROM reviews WHERE angel_id = ?', 
              [angelId], (err, result) => {
        if (err) return reject(err);
        
        if (!result.avg_rating) {
          return resolve({ rating: 5.0, count: 0 }); // Rating padrão se não houver avaliações
        }
        
        db.run(`UPDATE angels SET rating = ?, reviews_count = ? WHERE id = ?`, 
                [result.avg_rating, result.count, angelId], function(err) {
          if (err) return reject(err);
          resolve({ rating: result.avg_rating, count: result.count });
        });
      });
    });
  }
}

module.exports = Angel;