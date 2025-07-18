const axios = require('axios');
const { obtenerTokenFactus } = require('./factus-auth.cjs');
const { obtenerUltimoRangoActivoFactura } = require('./factus-rangos.cjs');

const FACTURA_URL = 'https://api-sandbox.factus.com.co/v1/bills/validate';

async function enviarFacturaAFactus(facturaData) {
  try {
    // Obtener access token
    const { access_token } = await obtenerTokenFactus();

    // Obtener el último rango activo válido
    const rangoId = await obtenerUltimoRangoActivoFactura();

    // Construir la factura final con el rango agregado
    const facturaFinal = {
      ...facturaData,
      numbering_range_id: rangoId
    };

    // Enviar la factura a Factus
    const response = await axios.post(FACTURA_URL, facturaFinal, {
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      }
    });

    return response.data;

  } catch (error) {
    console.error('❌ Error al enviar la factura:', error.response?.data || error.message);
    throw new Error(
      error.response?.data?.message || 'No se pudo enviar la factura'
    );
  }
}

/**
 * Descarga el PDF de una factura por su número.
 * @param {string} numeroFactura El número de la factura (ej: "SETP990000049").
 * @returns {Promise<{fileName: string, pdfBase64: string}>} Objeto con el nombre del archivo y el contenido PDF en Base64.
 * @throws {Error} Si no se puede descargar el PDF de la factura.
 */
async function descargarFacturaPdf(numeroFactura) {
  try {
    const { access_token } = await obtenerTokenFactus();
    const url = `https://api-sandbox.factus.com.co/v1/bills/download-pdf/${numeroFactura}`;

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${access_token}`,
        Accept: 'application/json' // La API devuelve un JSON con el Base64
      }
    });

    const data = response.data.data;
    if (!data || !data.pdf_base_64_encoded) {
      throw new Error('No se recibió el contenido PDF de la factura.');
    }

    return {
      fileName: data.file_name,
      pdfBase64: data.pdf_base_64_encoded
    };

  } catch (error) {
    console.error('❌ Error al descargar el PDF de la factura:', error.response?.data || error.message);
    throw new Error(
      error.response?.data?.message || 'No se pudo descargar el PDF de la factura'
    );
  }
}

/**
 * Descarga el XML de una factura por su número.
 * @param {string} numeroFactura El número de la factura (ej: "SETP990000049").
 * @returns {Promise<{fileName: string, xmlBase64: string}>} Objeto con el nombre del archivo y el contenido XML en Base64.
 * @throws {Error} Si no se puede descargar el XML de la factura.
 */
async function descargarFacturaXml(numeroFactura) {
  try {
    const { access_token } = await obtenerTokenFactus();
    const url = `https://api-sandbox.factus.com.co/v1/bills/download-xml/${numeroFactura}`;

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${access_token}`,
        Accept: 'application/json' // La API devuelve un JSON con el Base64
      }
    });

    const data = response.data.data;
    if (!data || !data.xml_base_64_encoded) {
      throw new Error('No se recibió el contenido XML de la factura.');
    }

    return {
      fileName: data.file_name,
      xmlBase64: data.xml_base_64_encoded
    };

  } catch (error) {
    console.error('❌ Error al descargar el XML de la factura:', error.response?.data || error.message);
    throw new Error(
      error.response?.data?.message || 'No se pudo descargar el XML de la factura'
    );
  }
}

module.exports = {
  enviarFacturaAFactus,
  descargarFacturaPdf,
  descargarFacturaXml
};