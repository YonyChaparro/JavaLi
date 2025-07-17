const axios = require('axios');
require('dotenv').config();

async function getFactusToken() {
  try {
    const response = await axios.post(`${process.env.FACTUS_API}/auth/token`, {
      client_id: process.env.FACTUS_CLIENT_ID,
      client_secret: process.env.FACTUS_CLIENT_SECRET
    });
    return response.data.access_token;
  } catch (err) {
    console.error('Error al autenticar con Factus:', err.response?.data || err.message);
    throw new Error('No se pudo obtener el token de Factus');
  }
}

module.exports = { getFactusToken };
