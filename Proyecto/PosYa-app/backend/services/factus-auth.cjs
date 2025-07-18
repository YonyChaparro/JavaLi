const axios = require('axios');
const dotenv = require('dotenv');
const process = require('process');
dotenv.config();

const BASE_URL = 'https://api-sandbox.factus.com.co/oauth/token';

let cachedToken = null;
let tokenExpiration = null;

async function obtenerTokenFactus() {
  const ahora = Date.now();

  // ✅ Token aún válido
  if (cachedToken && tokenExpiration && ahora < tokenExpiration) {
    return cachedToken;
  }

  // 🔁 Intentar con refresh_token si hay
  if (cachedToken?.refresh_token) {
    try {
      return await renovarConRefreshToken(cachedToken.refresh_token);
    } catch {
      console.warn('Falló el refresh_token. Usando login completo...');
    }
  }

  // 🔐 Si no hay refresh_token o falló, usar login completo
  return await loginConCredenciales();
}

async function loginConCredenciales() {
  const params = new URLSearchParams();
  params.append('grant_type', 'password');
  params.append('client_id', process.env.FACTUS_CLIENT_ID);
  params.append('client_secret', process.env.FACTUS_CLIENT_SECRET);
  params.append('username', process.env.FACTUS_USERNAME);
  params.append('password', process.env.FACTUS_PASSWORD);

  return await solicitarTokenDesdeFactus(params);
}

async function renovarConRefreshToken(refreshToken) {
  const params = new URLSearchParams();
  params.append('grant_type', 'refresh_token');
  params.append('client_id', process.env.FACTUS_CLIENT_ID);
  params.append('client_secret', process.env.FACTUS_CLIENT_SECRET);
  params.append('refresh_token', refreshToken);

  return await solicitarTokenDesdeFactus(params);
}

async function solicitarTokenDesdeFactus(params) {
  try {
    const response = await axios.post(BASE_URL, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const { access_token, refresh_token, expires_in } = response.data;

    if (!access_token) {
      throw new Error('No se recibió access_token');
    }

    // Guardar token en caché
    const ahora = Date.now();
    cachedToken = {
      access_token,
      refresh_token,
      expires_in
    };
    tokenExpiration = ahora + (expires_in - 60) * 1000;

    return cachedToken;
  } catch (error) {
    console.error('Error al obtener token:', error.response?.data || error.message);
    throw new Error('No se pudo obtener el token de Factus');
  }
}

module.exports = { obtenerTokenFactus };
