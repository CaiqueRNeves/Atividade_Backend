const Message = require('../models/Message');
const Visitor = require('../models/Visitor');

class MessageService {
  // Buscar mensagens de um Angel
  static async getAngelMessages(angelId) {
    try {
      const messages = await Message.findByAngelId(angelId);
      
      // Agrupar mensagens por conversas (contato)
      const conversations = {};
      
      messages.forEach(message => {
        let contactId, contactType, contactName;
        
        if (message.isFromAngel(angelId)) {
          contactId = message.receiver_id;
          contactType = message.receiver_type;
          contactName = message.receiver_name;
        } else {
          contactId = message.sender_id;
          contactType = message.sender_type;
          contactName = message.sender_name;
        }
        
        const conversationKey = `${contactType}-${contactId}`;
        
        if (!conversations[conversationKey]) {
          conversations[conversationKey] = {
            id: contactId,
            type: contactType,
            name: contactName,
            messages: []
          };
        }
        
        conversations[conversationKey].messages.push(message);
      });
      
      // Marcar mensagens como lidas
      await Message.markAsRead(angelId, 'angel');
      
      // Converter objeto de conversas para array
      const conversationsArray = Object.values(conversations);
      
      // Buscar visitantes afiliados que ainda não têm conversa
      const allVisitors = await Visitor.findByAngelId(angelId);
      const visitorsWithConversation = new Set(
        conversationsArray
          .filter(conv => conv.type === 'visitor')
          .map(conv => conv.id)
      );
      
      const availableVisitors = allVisitors.filter(
        visitor => !visitorsWithConversation.has(visitor.id)
      );
      
      return {
        conversations: conversationsArray,
        availableVisitors
      };
    } catch (error) {
      throw error;
    }
  }
  
  // Buscar mensagens de um Visitor
  static async getVisitorMessages(visitorId) {
    try {
      const visitor = await Visitor.findById(visitorId);
      if (!visitor) {
        throw new Error('Visitante não encontrado');
      }
      
      const messages = await Message.findByVisitorId(visitorId);
      
      // Marcar mensagens como lidas
      await Message.markAsRead(visitorId, 'visitor');
      
      return {
        messages,
        angelId: visitor.angel_id
      };
    } catch (error) {
      throw error;
    }
  }
  
  // Enviar mensagem de Angel para Visitor
  static async sendAngelMessage(angelId, visitorId, content) {
    try {
      // Validar campos obrigatórios
      if (!visitorId || !content) {
        throw new Error('Destinatário e mensagem são obrigatórios');
      }
      
      // Verificar se o visitante está afiliado ao Angel
      const visitor = await Visitor.findById(visitorId);
      if (!visitor || visitor.angel_id !== angelId) {
        throw new Error('Visitante não encontrado ou não afiliado a você');
      }
      
      // Enviar mensagem
      const messageId = await Message.send('angel', angelId, 'visitor', visitorId, content);
      return messageId;
    } catch (error) {
      throw error;
    }
  }
  
  // Enviar mensagem de Visitor para Angel
  static async// Enviar mensagem de Visitor para Angel
  static async sendVisitorMessage(visitorId, content) {
    try {
      // Validar campos obrigatórios
      if (!content) {
        throw new Error('Mensagem não pode estar vazia');
      }
      
      // Buscar o Angel associado ao visitante
      const visitor = await Visitor.findById(visitorId);
      if (!visitor) {
        throw new Error('Erro ao buscar informações do visitante');
      }
      
      // Enviar mensagem
      const messageId = await Message.send('visitor', visitorId, 'angel', visitor.angel_id, content);
      return messageId;
    } catch (error) {
      throw error;
    }
  }
  
  // Contar mensagens não lidas
  static async countUnreadMessages(userId, userType) {
    try {
      return await Message.countUnread(userId, userType);
    } catch (error) {
      throw error;
    }
  }
}

module.exports = MessageService;