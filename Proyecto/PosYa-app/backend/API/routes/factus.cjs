const express = require('express');
const router = express.Router();
const { enviarFactura } = require('../services/sendFactura.cjs');

router.post('/', async (req, res) => {
  try {
    const payload = req.body;
    const respuesta = await enviarFactura(payload);
    res.json(respuesta);
  } catch (error) {
    console.error('Error al enviar factura:', error.message);
    res.status(500).json({ error: 'No se pudo enviar la factura' });
  }
});

module.exports = router;
