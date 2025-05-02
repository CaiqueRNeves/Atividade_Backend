const moment = require('moment');
moment.locale('pt-br');

// Formatadores de data
exports.formatDate = (date) => {
  return moment(date).format('DD/MM/YYYY HH:mm');
};

exports.formatDateOnly = (date) => {
  return moment(date).format('DD/MM/YYYY');
};

exports.formatTimeOnly = (date) => {
  return moment(date).format('HH:mm');
};

exports.relativeDate = (date) => {
  return moment(date).fromNow();
};

// Formatar preço
exports.formatPrice = (price) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(price);
};

// Truncar texto
exports.truncateText = (text, length = 100) => {
  if (!text) return '';
  return text.length > length ? `${text.substring(0, length)}...` : text;
};

// Gerar rating em estrelas
exports.generateStars = (rating) => {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
  
  let starsHtml = '';
  
  // Estrelas cheias
  for (let i = 0; i < fullStars; i++) {
    starsHtml += '<i class="fas fa-star"></i>';
  }
  
  // Meia estrela
  if (halfStar) {
    starsHtml += '<i class="fas fa-star-half-alt"></i>';
  }
  
  // Estrelas vazias
  for (let i = 0; i < emptyStars; i++) {
    starsHtml += '<i class="far fa-star"></i>';
  }
  
  return starsHtml;
};

// Verificar se um objeto está vazio
exports.isEmpty = (obj) => {
  return Object.keys(obj).length === 0;
};

// Limitar string a um número máximo de palavras
exports.limitWords = (text, wordCount) => {
  if (!text) return '';
  const words = text.split(' ');
  if (words.length <= wordCount) return text;
  return words.slice(0, wordCount).join(' ') + '...';
};

// Converter string para URL amigável (slug)
exports.slugify = (text) => {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
};

// Capitalizar a primeira letra de cada palavra
exports.capitalizeWords = (text) => {
  if (!text) return '';
  return text.replace(/\b\w/g, char => char.toUpperCase());
};

// Gerar ID único
exports.generateUniqueId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
};