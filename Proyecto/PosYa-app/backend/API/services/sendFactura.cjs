const axios = require('axios');
const { getFactusToken } = require('./factusAuth.cjs');
require('dotenv').config();

async function enviarFactura(payload) {
  try {
    const token = await getFactusToken();

    const response = await axios.post(
      `${process.env.FACTUS_API}/invoice`, // Ajusta si Factus usa otro endpoint
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;

  } catch (error) {
    console.error('Error al enviar factura a Factus:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Error al enviar factura a Factus');
  }
}

module.exports = { enviarFactura };
