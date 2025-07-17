const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { enviarFactura } = require('../services/sendFactura.cjs');

// Ruta al archivo SQLite
const dbPath = path.join(__dirname, '../base_de_datos.db');
const db = new sqlite3.Database(dbPath);

// POST /api/factura/:codigoVenta
router.post('/:codigoVenta', async (req, res) => {
  const codigoVenta = req.params.codigoVenta;

  try {
    // 1. Obtener datos de la venta
    const venta = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM VENTA WHERE codigo = ?', [codigoVenta], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    if (!venta) return res.status(404).json({ error: 'Venta no encontrada' });

    // 2. Obtener productos vendidos
    const productos = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM DETALLE_PRODUCTO_VENDIDO WHERE codigo_venta = ?', [codigoVenta], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    // 3. Construir el payload según estructura de Factus
    const payload = {
      tipoDocumento: 'FACTURA_ELECTRONICA',
      cliente: {
        nombre: venta.nombre_cliente || venta.razon_social_cliente || 'Cliente',
        identificacion: venta.identificacion_cliente,
        tipoIdentificacion: venta.tipo_identificacion_cliente || 'CC',
        direccion: venta.direccion_cliente,
        ciudad: venta.ciudad_cliente,
        email: venta.correo_electronico_cliente
      },
      items: productos.map(p => ({
        descripcion: p.nombre_producto,
        cantidad: p.cantidad,
        valorUnitario: p.precio_unitario,
        impuesto: p.IVA_unitario
      })),
      total: venta.total,
      formaPago: 'CONTADO'
    };

    // 4. Enviar a Factus
    const respuesta = await enviarFactura(payload);

    // Puedes guardar UUID, CUFE o PDF en base de datos aquí si quieres

    // 5. Devolver respuesta
    res.json({ ok: true, respuesta });


  } catch (error) {
    console.error('Error al enviar factura:', error.message);
    res.status(500).json({ error: 'Error interno al generar factura electrónica' });
  }
});

module.exports = router;
