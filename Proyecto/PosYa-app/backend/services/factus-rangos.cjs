const axios = require('axios');
const { obtenerTokenFactus } = require('./factus-auth.cjs');

const RANGOS_URL = 'https://api-sandbox.factus.com.co/v1/numbering-ranges';

// Función para obtener todos los rangos activos
async function obtenerRangosDeNumeracion() {
  const { access_token } = await obtenerTokenFactus();

  const response = await axios.get(RANGOS_URL, {
    headers: {
      Authorization: `Bearer ${access_token}`,
      Accept: 'application/json'
    }
  });

  return response.data.data; // solo retornamos el arreglo de rangos
}

// Función para filtrar y devolver el ID del último rango activo para facturas
async function obtenerUltimoRangoActivoFactura() {
  const rangos = await obtenerRangosDeNumeracion();

  const posiblesNombres = ['Factura de Venta', 'Factura Electrónica', '01'];

  const rangoFactura = rangos
    .filter(r => posiblesNombres.includes(r.document) && r.is_active)
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))[0];

  if (!rangoFactura) {
    throw new Error('No hay rangos activos disponibles para facturas.');
  }

  return rangoFactura.id;
}

module.exports = {
  obtenerRangosDeNumeracion,
  obtenerUltimoRangoActivoFactura
};
