const { db } = require('../config/db');
const moment = require('moment');

class Message {
  constructor(data) {
    this.id = data.id;
    this.sender_type = data.sender_type;
    this.sender_id = data.sender_id;
    this.receiver_type = data.receiver_type;
    this.receiver_id = data.receiver_id;
    this.content = data.content;
    this.read = data.read || 0;
    this.created_at = data.created_at;
    
    // Propriedades adicionais que podem vir de joins
    this.sender_name = data.sender_name;
    this.receiver_name = data.receiver_name;
  }

  // Formatar data para exibição
  getFormattedDate() {
    return moment(this.created_at).format('DD/MM/YYYY HH:mm');
  }

  // Verificar se a mensagem é de um Angel específico
  isFromAngel(angelId) {
    return this.sender_type === 'angel' && this.sender_id === angelId;
  }

  // Verificar se a mensagem é de um Visitor específico
  isFromVisitor(visitorId) {
    return this.sender_type === 'visitor' && this.sender_id === visitorId;
  }

  // Buscar mensagens de uma conversa entre Angel e Visitor
  static findConversation(angelId, visitorId) {
    return new Promise((resolve, reject) => {
      db.all(`SELECT m.*, 
              CASE WHEN m.sender_type = 'visitor' THEN v.name ELSE a.name END as sender_name,
              CASE WHEN m.receiver_type = 'visitor' THEN v.name ELSE a.name END as receiver_name
              FROM messages m
              LEFT JOIN visitors v ON (m.sender_type = 'visitor' AND m.sender_id = v.id) OR (m.receiver_type = 'visitor' AND m.receiver_id = v.id)
              LEFT JOIN angels a ON (m.sender_type = 'angel' AND m.sender_id = a.id) OR (m.receiver_type = 'angel' AND m.receiver_id = a.id)
              WHERE (m.sender_id = ? AND m.sender_type = 'angel' AND m.receiver_id = ? AND m.receiver_type = 'visitor')
              OR (m.sender_id = ? AND m.sender_type = 'visitor' AND m.receiver_id = ? AND m.receiver_type = 'angel')
              ORDER BY m.created_at ASC`, 
              [angelId, visitorId, visitorId, angelId], (err, rows) => {
        if (err) return reject(err);
        resolve(rows.map(row => new Message(row)));
      });
    });
  }

  // Buscar todas as mensagens de um Angel
  static findByAngelId(angelId) {
    return new Promise((resolve, reject) => {
      db.all(`SELECT m.*, 
              CASE WHEN m.sender_type = 'visitor' THEN v.name ELSE a.name END as sender_name,
              CASE WHEN m.receiver_type = 'visitor' THEN v.name ELSE a.name END as receiver_name
              FROM messages m
              LEFT JOIN visitors v ON (m.sender_type = 'visitor' AND m.sender_id = v.id) OR (m.receiver_type = 'visitor' AND m.receiver_id = v.id)
              LEFT JOIN angels a ON (m.sender_type = 'angel' AND m.sender_id = a.id) OR (m.receiver_type = 'angel' AND m.receiver_id = a.id)
              WHERE (m.sender_id = ? AND m.sender_type = 'angel') OR (m.receiver_id = ? AND m.receiver_type = 'angel')
              ORDER BY m.created_at DESC`, 
              [angelId, angelId], (err, rows) => {
        if (err) return reject(err);
        resolve(rows.map(row => new Message(row)));
      });
    });
  }

  // Buscar todas as mensagens de um Visitor
  static findByVisitorId(visitorId) {
    return new Promise((resolve, reject) => {
      db.all(`SELECT m.*, 
              CASE WHEN m.sender_type = 'visitor' THEN v.name ELSE a.name END as sender_name,
              CASE WHEN m.receiver_type = 'visitor' THEN v.name ELSE a.name END as receiver_name
              FROM messages m
              LEFT JOIN visitors v ON (m.sender_type = 'visitor' AND m.sender_id = v.id) OR (m.receiver_type = 'visitor' AND m.receiver_id = v.id)
              LEFT JOIN angels a ON (m.sender_type = 'angel' AND m.sender_id = a.id) OR (m.receiver_type = 'angel' AND m.receiver_id = a.id)
              WHERE (m.sender_id = ? AND m.sender_type = 'visitor') OR (m.receiver_id = ? AND m.receiver_type = 'visitor')
              ORDER BY m.created_at ASC`, 
              [visitorId, visitorId], (err, rows) => {
        if (err) return reject(err);
        resolve(rows.map(row => new Message(row)));
      });
    });
  }

  // Contar mensagens não lidas
  static countUnread(receiverId, receiverType) {
    return new Promise((resolve, reject) => {
      db.get(`SELECT COUNT(*) as count FROM messages 
              WHERE receiver_id = ? AND receiver_type = ? AND read = 0`, 
              [receiverId, receiverType], (err, result) => {
        if (err) return reject(err);
        resolve(result ? result.count : 0);
      });
    });
  }

  // Marcar mensagens como lidas
  static markAsRead(receiverId, receiverType) {
    return new Promise((resolve, reject) => {
      db.run(`UPDATE messages SET read = 1 
              WHERE receiver_id = ? AND receiver_type = ? AND read = 0`, 
              [receiverId, receiverType], function(err) {
        if (err) return reject(err);
        resolve(this.changes);
      });
    });
  }

  // Enviar mensagem
  static send(senderType, senderId, receiverType, receiverId, content) {
    return new Promise((resolve, reject) => {
      db.run(`INSERT INTO messages 
              (sender_type, sender_id, receiver_type, receiver_id, content) 
              VALUES (?, ?, ?, ?, ?)`, 
              [senderType, senderId, receiverType, receiverId, content], 
              function(err) {
        if (err) return reject(err);
        resolve(this.lastID);
      });
    });
  }
}

module.exports = Message;