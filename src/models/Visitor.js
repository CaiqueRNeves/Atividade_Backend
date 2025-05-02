const { db } = require('../config/db');
const bcrypt = require('bcrypt');

class Visitor {
  constructor(data) {
    this.id = data.id;
    this.angel_id = data.angel_id;
    this.name = data.name;
    this.email = data.email;
    this.password = data.password;
    this.phone = data.phone;
    this.nationality = data.nationality;
    this.language_preference = data.language_preference;
    this.profile_image = data.profile_image;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
    
    // Propriedades adicionais que podem vir de joins
    this.angel_name = data.angel_name;
    this.angel_email = data.angel_email;
    this.angel_phone = data.angel_phone;
  }

  // Encontrar Visitor por ID
  static findById(id) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM visitors WHERE id = ?', [id], (err, row) => {
        if (err) return reject(err);
        if (!row) return resolve(null);
        resolve(new Visitor(row));
      });
    });
  }

  // Encontrar Visitor por ID com detalhes do Angel
  static findByIdWithAngelDetails(id) {
    return new Promise((resolve, reject) => {
      db.get(`SELECT v.*, a.name as angel_name, a.email as angel_email, a.phone as angel_phone 
              FROM visitors v 
              JOIN angels a ON v.angel_id = a.id 
              WHERE v.id = ?`, [id], (err, row) => {
        if (err) return reject(err);
        if (!row) return resolve(null);
        resolve(new Visitor(row));
      });
    });
  }

  // Encontrar Visitor por email
  static findByEmail(email) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM visitors WHERE email = ?', [email], (err, row) => {
        if (err) return reject(err);
        if (!row) return resolve(null);
        resolve(new Visitor(row));
      });
    });
  }

  // Encontrar todos os Visitors de um Angel
  static findByAngelId(angelId) {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM visitors WHERE angel_id = ?', [angelId], (err, rows) => {
        if (err) return reject(err);
        resolve(rows.map(row => new Visitor(row)));
      });
    });
  }

  // Verificar senha
  async verifyPassword(password) {
    return await bcrypt.compare(password, this.password);
  }

  // Salvar (criar/atualizar) Visitor
  save() {
    return new Promise(async (resolve, reject) => {
      try {
        // Se for criação de novo visitor, a senha precisa ser hash
        if (!this.id && this.password) {
          this.password = await bcrypt.hash(this.password, 10);
        }

        const query = this.id
          ? `UPDATE visitors SET name = ?, phone = ?, nationality = ?, 
              language_preference = ?, updated_at = datetime('now') WHERE id = ?`
          : `INSERT INTO visitors (angel_id, name, email, password, phone, nationality, language_preference) 
              VALUES (?, ?, ?, ?, ?, ?, ?)`;
        
        const params = this.id
          ? [this.name, this.phone || '', this.nationality || '', 
             this.language_preference || '', this.id]
          : [this.angel_id, this.name, this.email, this.password, 
             this.phone || '', this.nationality || '', this.language_preference || ''];
        
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
}

module.exports = Visitor;