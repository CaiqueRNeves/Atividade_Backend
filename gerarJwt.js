const jwt = require('jsonwebtoken');

const payload = { id: 123, nome: 'Caique' };
const segredo = 'seu_segredo_super_seguro'; // Substitua por um segredo forte

const token = jwt.sign(payload, segredo, { expiresIn: '1h' });

console.log('Token JWT:', token);