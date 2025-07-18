// servidor.cjs
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Importar los módulos de servicio de Factus
const { enviarFacturaAFactus, descargarFacturaPdf, descargarFacturaXml } = require('./services/factus-factura.cjs');
const { obtenerRangosDeNumeracion } = require('./services/factus-rangos.cjs'); // Puede que no necesites este directamente aquí, pero es útil tenerlo

const app = express();
const PORT = 3000;



app.use(cors());
app.use(express.json());

// Conexión a la base de datos SQLite
const dbPath = path.join(__dirname, 'base_de_datos.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err.message);
  } else {
    console.log('Conectado a la base de datos SQLite.');
  }
});

// Ejecutar script SQL para crear las tablas
const sqlPath = path.join(__dirname, 'base_de_datos.sql');
const sqlScript = fs.readFileSync(sqlPath, 'utf8');
db.exec(sqlScript, (err) => {
  if (err) {
    console.error('Error al crear las tablas desde base_de_datos.sql:', err.message);
  } else {
    console.log('Tablas creadas correctamente desde base_de_datos.sql');
  }
});

// --- ENDPOINTS DE LA API DE VENTA LOCAL (ejemplos, si los usas para obtener datos) ---
// Estos endpoints son los que tu frontend usa para obtener los detalles de la venta y productos
// Asegúrate de que estos ya existen o impleméntalos según tu base de datos
app.get('/api/venta', (req, res) => {
  const { codigo } = req.query;
  db.get(`SELECT * FROM VENTA WHERE codigo = ?`, [codigo], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ message: 'Venta no encontrada' });
    }
    res.json(row);
  });
});

app.get('/api/venta_detalle', (req, res) => {
  const { codigo } = req.query;
  db.all(`SELECT * FROM DETALLE_PRODUCTO_VENDIDO WHERE codigo_venta = ?`, [codigo], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

app.delete('/api/venta/:numero', (req, res) => {
    const { numero } = req.params;
    db.run(`DELETE FROM DETALLE_PRODUCTO_VENDIDO WHERE codigo_venta = ?`, [numero], function(err) {
        if (err) {
            console.error('Error al eliminar detalles de venta:', err.message);
            return res.status(500).json({ error: err.message });
        }
        db.run(`DELETE FROM VENTA WHERE numero = ?`, [numero], function(err) {
            if (err) {
                console.error('Error al eliminar venta:', err.message);
                return res.status(500).json({ error: err.message });
            }
            if (this.changes === 0) {
                return res.status(404).json({ message: 'Venta no encontrada.' });
            }
            res.status(200).json({ message: 'Venta eliminada exitosamente.' });
        });
    });
});


// --- NUEVOS ENDPOINTS PARA LA API DE FACTUS ---

// Endpoint para obtener rangos de numeración (opcional, si lo necesitas para otras funcionalidades)
app.get('/api/factus/rangos/facturas', async (req, res) => {
  try {
    const rangos = await obtenerRangosDeNumeracion({
      document: '01', // Solo facturas electrónicas
      is_active: true // Solo activos
    });
    res.json(rangos);
  } catch (error) {
    console.error('Error al obtener rangos:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint principal para GENERAR UNA FACTURA ELECTRÓNICA desde los datos de tu DB
app.post('/api/factus/generar-factura-db', async (req, res) => {
  const { codigoVenta } = req.body; // Esperamos el código de venta desde el frontend

  if (!codigoVenta) {
    return res.status(400).json({ error: 'Se requiere el código de venta.' });
  }

  try {
    // 1. Obtener datos de la venta y cliente desde SQLite
    const venta = await new Promise((resolve, reject) => {
      db.get(`SELECT * FROM VENTA WHERE codigo = ?`, [codigoVenta], (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });

    if (!venta) {
      return res.status(404).json({ error: 'Venta no encontrada en la base de datos.' });
    }

    // Obtener datos del cliente (natural o jurídico).
    // Esta lógica podría requerir ajustes según cómo tengas las tablas CLIENTE, CLIENTE_NATURAL, CLIENTE_JURIDICO
    let clienteDetalles;
    // Intenta buscar en CLIENTE_NATURAL
    clienteDetalles = await new Promise((resolve, reject) => {
        db.get(`SELECT * FROM CLIENTE_NATURAL WHERE identificacion = ?`, [venta.identificacion_cliente], (err, row) => {
            if (err) reject(err);
            resolve(row);
        });
    });

    // Si no se encuentra en CLIENTE_NATURAL, intenta buscar en CLIENTE_JURIDICO
    if (!clienteDetalles) {
        clienteDetalles = await new Promise((resolve, reject) => {
            db.get(`SELECT * FROM CLIENTE_JURIDICO WHERE identificacion = ?`, [venta.identificacion_cliente], (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });
    }

    // Si aún no se encuentra, busca en la tabla CLIENTE principal (podría ser para datos básicos si no es natural/jurídico)
    if (!clienteDetalles) {
        clienteDetalles = await new Promise((resolve, reject) => {
            db.get(`SELECT * FROM CLIENTE WHERE identificacion = ?`, [venta.identificacion_cliente], (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });
    }


    // 2. Obtener detalles de los productos vendidos
    const detallesProductos = await new Promise((resolve, reject) => {
      db.all(`SELECT * FROM DETALLE_PRODUCTO_VENDIDO WHERE codigo_venta = ?`, [codigoVenta], (err, rows) => {
        if (err) reject(err);
        resolve(rows);
      });
    });

        // 3. Mapear datos de la DB al formato de Factus
    // ESTA ES LA PARTE MÁS CRÍTICA Y DONDE NECESITARÁS TUS MAPEOS DE IDs DE FACTUS
    // Los valores como 3, 31, 980, 70, 1, 21, 1 son EJEMPLOS.
    // Debes reemplazarlos con los IDs numéricos de Factus que correspondan a tus datos.
    // Puedes obtener estos IDs de los catálogos de Factus API o de tu propio mapeo.
    const facturaParaFactus = {
      "document": "01",
      "reference_code": venta.codigo, // Código de referencia de su venta local
      "observation": "", // Campo de observación, puede ser mapeado desde la DB si existe
      "payment_method_code": "10", // Código de método de pago (ej. 10: Efectivo) - Mapear desde su DB si aplica
      "customer": {
        "identification": venta.identificacion_cliente, // Identificación del cliente (NIT/CC)
        // El 'dv' (dígito de verificación) a menudo se asocia con NIT.
        // Asegúrese de que su tabla de cliente tenga un campo 'dv' si es necesario.
        "dv": clienteDetalles?.dv || null,
        "company": clienteDetalles?.razon_social || "", // Razón social para clientes jurídicos
        "trade_name": clienteDetalles?.razon_social || "", // Nombre comercial para clientes jurídicos
        // Concatena nombre y apellido para clientes naturales
        "names": clienteDetalles?.nombre ? `${clienteDetalles.nombre} ${clienteDetalles.apellido || ''}`.trim() : "",
        // Dirección del cliente, priorizando la de la venta, luego la del detalle del cliente
        "address": venta.direccion_cliente || clienteDetalles?.direccion || '',
        // Correo electrónico del cliente, priorizando la de la venta, luego la del detalle del cliente
        "email": venta.correo_electronico_cliente || clienteDetalles?.correo_electronico || '',
        // Número de teléfono del cliente, priorizando la de la venta, luego la del detalle del cliente
        "phone": venta.numero_telefonico_cliente || clienteDetalles?.numero_telefonico || '',
        // *** MAPEO CRÍTICO DE IDs DE FACTUS ***
        // ID de la organización legal (1: Jurídica, 2: Natural)
        // Asume que si 'razon_social' existe, es jurídica.
        "legal_organization_id": clienteDetalles?.razon_social ? 1 : 2,
        // ID del tipo de tributo (ej. 21: No aplica, 1: IVA) - Mapear desde su DB
        "tribute_id": 21, // <<-- REEMPLAZAR con el ID real de Factus
        // ID del tipo de documento de identificación (ej. 3: CC, 31: NIT) - Mapear desde su DB
        "identification_document_id": (() => {
            switch (venta.tipo_identificacion_cliente) {
                case 'CC': return 3; // Cédula de Ciudadanía
                case 'NIT': return 31; // NIT
                // Añadir más casos según los tipos de documento en su DB y sus IDs en Factus
                default: return 3; // Valor por defecto, ajustar según su necesidad
            }
        })(),
        // ID del municipio (ej. 980: San Gil) - Mapear desde su DB
        "municipality_id": 980 // <<-- REEMPLAZAR con el ID real de Factus
      },
      "items": await Promise.all(detallesProductos.map(async item => {
        // Obtener la tasa de IVA del producto desde la tabla PRODUCTO
        const producto = await new Promise((resolve, reject) => {
            db.get(`SELECT * FROM PRODUCTO WHERE codigo = ?`, [item.codigo_producto], (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });

        return {
          "code_reference": item.codigo_producto, // Código de referencia del producto - Asegúrese de que cumpla las reglas de Factus
          "name": item.nombre_producto, // Nombre del producto
          "quantity": item.cantidad, // Cantidad vendida
          "discount_rate": 0, // Tasa de descuento del ítem - Mapear desde su DB si aplica
          "price": item.precio_unitario, // Precio unitario del producto
          "tax_rate": producto?.tasa_IVA || 0, // Tasa de IVA del producto - Obtenida de la tabla PRODUCTO
          // ID de unidad de medida (ej. 70 para 'unidad') - Mapear desde su DB
          "unit_measure_id": 70, // <<-- REEMPLAZAR con el ID real de Factus
          // ID de código estándar (ej. 1) - Mapear desde su DB
          "standard_code_id": 1, // <<-- REEMPLAZAR con el ID real de Factus
          // Indicador de exclusión de impuestos (0: No excluido, 1: Excluido) - Mapear desde su DB
          "is_excluded": 0, // 0 es el valor que funcionó en la depuración anterior
          // ID de tributo (ej. 1 para IVA) - Mapear desde su DB
          "tribute_id": 1, // <<-- REEMPLAZAR con el ID real de Factus
          "withholding_taxes": [] // Array de retenciones - Mapear desde su DB si existen retenciones por producto
        };
      }))
    };

    // 4. Enviar la factura a Factus
    const resultadoFactus = await enviarFacturaAFactus(facturaParaFactus);
    res.json(resultadoFactus);

  } catch (error) {
    console.error('❌ Error al generar factura desde DB:', error.message);
    // Si el error viene de Factus, podría tener un 'data' con más detalles
    if (error.response?.data) {
        console.error('Detalles del error de Factus:', error.response.data);
        return res.status(error.response.status || 500).json({ 
            error: error.response.data.message || 'Error de validación de Factus', 
            details: error.response.data.errors 
        });
    }
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para Descargar factura PDF por número (usado por el frontend)
app.get('/api/factus/factura/:numeroFactura/pdf', async (req, res) => {
  try {
    const { numeroFactura } = req.params;
    const { fileName, pdfBase64 } = await descargarFacturaPdf(numeroFactura);

    const pdfBuffer = Buffer.from(pdfBase64, 'base64');
    let finalFileName = fileName;
    if (!finalFileName.toLowerCase().endsWith('.pdf')) {
      finalFileName += '.pdf';
    }

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${finalFileName}"`
    });
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error en el endpoint de descarga PDF:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para Descargar factura XML por número (usado por el frontend)
app.get('/api/factus/factura/:numeroFactura/xml', async (req, res) => {
  try {
    const { numeroFactura } = req.params;
    const { fileName, xmlBase64 } = await descargarFacturaXml(numeroFactura);

    const xmlBuffer = Buffer.from(xmlBase64, 'base64');
    let finalFileName = fileName;
    if (!finalFileName.toLowerCase().endsWith('.xml')) { // Asegurar extensión .xml
      finalFileName += '.xml';
    }

    res.set({
      'Content-Type': 'application/xml',
      'Content-Disposition': `attachment; filename="${finalFileName}"`
    });
    res.send(xmlBuffer);
  } catch (error) {
    console.error('Error en el endpoint de descarga XML:', error);
    res.status(500).json({ error: error.message });
  }
});


// Endpoint para consultar existencias actuales de un producto
app.get('/api/existencias/:codigo_producto', (req, res) => {
  const codigo_producto = req.params.codigo_producto;
  // Suma todas las entradas y salidas para ese producto
  const query = `
    SELECT IFNULL(SUM(CASE WHEN t.tipo_flujo = 'Entrada' THEN m.cantidad
                           WHEN t.tipo_flujo = 'Salida' THEN -m.cantidad
                           ELSE 0 END), 0) AS existencias
    FROM MOVIMIENTO_INVENTARIO m
    JOIN TIPO_MOVIMIENTO_INVENTARIO t ON m.codigo_tipo_movimiento = t.codigo
    WHERE m.codigo_producto = ?
  `;
  db.get(query, [codigo_producto], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ existencias: row ? row.existencias : 0 });
  });
});

// Endpoint para guardar movimientos de inventario
app.post('/api/movimientos-inventario', express.json(), (req, res) => {
  const movimientos = req.body;
  if (!Array.isArray(movimientos) || movimientos.length === 0) {
    return res.status(400).json({ error: 'No hay movimientos para guardar.' });
  }
  const stmt = db.prepare('INSERT INTO MOVIMIENTO_INVENTARIO (fecha, cantidad, codigo_tipo_movimiento, codigo_producto) VALUES (?, ?, ?, ?)');
  // Guardar la fecha en UTC (por defecto, como YYYY-MM-DD)
  const fecha = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  try {
    movimientos.forEach(mov => {
      // Validar que los campos requeridos existan
      if (!mov.codigo_producto || !mov.cantidad || !mov.codigo_tipo_movimiento) {
        throw new Error('Faltan campos requeridos en algún movimiento.');
      }
      const codigo_tipo_movimiento_int = parseInt(mov.codigo_tipo_movimiento, 10);
      stmt.run(fecha, mov.cantidad, codigo_tipo_movimiento_int, mov.codigo_producto);
    });
    stmt.finalize();
    res.json({ ok: true });
  } catch (err) {
    stmt.finalize();
    res.status(500).json({ error: err.message });
  }
});

// Endpoint para obtener todos los movimientos de inventario con paginación
app.get('/api/movimientos-inventario', (req, res) => {
  const { page = 1, limit = 10, producto, tipoMovimiento, tipoFlujo, fechaInicio, fechaFin } = req.query;
  const offset = (page - 1) * limit;

  let query = `
    SELECT 
      m.id,
      m.fecha,
      m.cantidad,
      m.codigo_tipo_movimiento,
      t.nombre AS tipo_movimiento,
      t.tipo_flujo,
      m.codigo_producto,
      p.nombre AS producto
    FROM MOVIMIENTO_INVENTARIO m
    JOIN TIPO_MOVIMIENTO_INVENTARIO t ON m.codigo_tipo_movimiento = t.codigo
    JOIN PRODUCTO p ON m.codigo_producto = p.codigo
    WHERE 1=1
  `;

  const params = [];

  // Filtros
  if (producto) {
    query += ' AND (m.codigo_producto = ? OR p.nombre LIKE ?)';
    params.push(producto, `%${producto}%`);
  }

  if (tipoMovimiento) {
    query += ' AND (m.codigo_tipo_movimiento = ? OR t.nombre LIKE ?)';
    params.push(tipoMovimiento, `%${tipoMovimiento}%`);
  }

  if (tipoFlujo) {
    query += ' AND t.tipo_flujo = ?';
    params.push(tipoFlujo);
  }

  if (fechaInicio && fechaFin) {
    // Usar las fechas tal cual, sin conversión, para evitar desfases
    query += ' AND date(m.fecha) BETWEEN date(?) AND date(?)';
    params.push(fechaInicio, fechaFin);
  }


  // Ordenación por fecha más reciente primero
  query += ' ORDER BY m.fecha DESC, m.id DESC';

  // Paginación
  const queryCount = `SELECT COUNT(*) as total FROM (${query})`;
  query += ` LIMIT ? OFFSET ?`;
  params.push(Number(limit), Number(offset));

  // Primero obtener el total de registros
  db.get(queryCount, params.slice(0, -2), (errCount, countRow) => {
    if (errCount) {
      return res.status(500).json({ error: errCount.message });
    }

    // Luego obtener los datos paginados
    db.all(query, params, (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json({
        data: rows,
        pagination: {
          total: countRow.total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(countRow.total / limit)
        }
      });
    });
  });
});

// Endpoint para obtener el historial de movimientos de un producto específico
app.get('/api/movimientos-inventario/producto/:codigo_producto', (req, res) => {
  const { codigo_producto } = req.params;
  const { limit = 50 } = req.query;

  const query = `
    SELECT 
      m.id,
      m.fecha,
      m.cantidad,
      t.nombre AS tipo_movimiento,
      t.tipo_flujo,
      CASE 
        WHEN t.tipo_flujo = 'Entrada' THEN m.cantidad
        WHEN t.tipo_flujo = 'Salida' THEN -m.cantidad
        ELSE 0
      END AS cantidad_con_signo
    FROM MOVIMIENTO_INVENTARIO m
    JOIN TIPO_MOVIMIENTO_INVENTARIO t ON m.codigo_tipo_movimiento = t.codigo
    WHERE m.codigo_producto = ?
    ORDER BY m.fecha DESC, m.id DESC
    LIMIT ?
  `;

  db.all(query, [codigo_producto, Number(limit)], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Endpoint para obtener el resumen de movimientos por producto (para reportes)
app.get('/api/movimientos-inventario/resumen', (req, res) => {
  const { fechaInicio, fechaFin } = req.query;

  let query = `
    SELECT 
      p.codigo,
      p.nombre AS producto,
      SUM(CASE WHEN t.tipo_flujo = 'Entrada' THEN m.cantidad ELSE 0 END) AS entradas,
      SUM(CASE WHEN t.tipo_flujo = 'Salida' THEN m.cantidad ELSE 0 END) AS salidas,
      SUM(CASE WHEN t.tipo_flujo = 'Entrada' THEN m.cantidad ELSE -m.cantidad END) AS saldo
    FROM MOVIMIENTO_INVENTARIO m
    JOIN TIPO_MOVIMIENTO_INVENTARIO t ON m.codigo_tipo_movimiento = t.codigo
    JOIN PRODUCTO p ON m.codigo_producto = p.codigo
    WHERE 1=1
  `;

  const params = [];

  if (fechaInicio && fechaFin) {
    query += ' AND m.fecha BETWEEN ? AND ?';
    params.push(fechaInicio, fechaFin);
  }

  query += ' GROUP BY p.codigo, p.nombre ORDER BY p.nombre';

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Obtener el único vendedor (si existe)
app.get('/api/vendedor', (req, res) => {
  db.get('SELECT * FROM VENDEDOR LIMIT 1', [], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(204).send();
    res.json(row);
  });
});

// Crear o actualizar el único vendedor
app.post('/api/vendedor', express.json(), (req, res) => {
  db.run('DELETE FROM VENDEDOR', [], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    const v = req.body;
    db.run(
      `INSERT INTO VENDEDOR (NIT, nombre_o_razon_social, direccion, numero_de_contacto, municipio, responsabilidad_fiscal)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        v.NIT,
        v.nombre_o_razon_social,
        v.direccion,
        v.numero_de_contacto,
        v.municipio,
        v.responsabilidad_fiscal
      ],
      function (err2) {
        if (err2) return res.status(500).json({ error: err2.message });
        res.json({ ok: true });
      }
    );
  });
});

// Endpoint: generar reporte
app.get('/api/reportes', (req, res) => {
  const { producto, fechaInicio, fechaFin } = req.query;
  let query = `
    SELECT
      dpv.nombre_producto AS producto,
      SUM(dpv.monto) AS ingresos,
      SUM(dpv.cantidad * dpv.costo_unitario) AS costos,
      SUM(dpv.monto - (dpv.cantidad * dpv.costo_unitario)) AS utilidades,
      SUM(dpv.IVA_unitario * dpv.cantidad) AS iva
    FROM DETALLE_PRODUCTO_VENDIDO dpv
    JOIN VENTA v ON dpv.codigo_venta = v.codigo
    WHERE 1=1`;

  const params = [];

  if (producto) {
    query += ' AND dpv.nombre_producto = ?';
    params.push(producto);
  }

  if (fechaInicio && fechaFin) {
    query += ' AND v.fecha BETWEEN ? AND ?';
    params.push(fechaInicio, fechaFin);
  }

  query += ' GROUP BY dpv.nombre_producto';

  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

// Endpoint para obtener productos vendidos
app.get('/api/productos-vendidos', (req, res) => {
  const query = `
    SELECT DISTINCT dpv.nombre_producto AS nombre
    FROM DETALLE_PRODUCTO_VENDIDO dpv
    ORDER BY nombre;
  `;
  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Endpoint para obtener historial de ventas
app.get('/api/historial_ventas', (req, res) => {
  const query = `
    SELECT 
      codigo AS numero,
      fecha AS fecha,
      hora AS hora,
      nombre_cliente || ' ' || IFNULL(apellido_cliente, '') AS cliente,
      razon_social_cliente,
      total AS total
    FROM VENTA
    ORDER BY fecha DESC, hora DESC
  `;
  db.all(query, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      // Formatear el total como moneda
      const ventas = rows.map(v => ({
        ...v,
        total: typeof v.total === 'number' ? `$${v.total.toFixed(2)}` : v.total
      }));
      res.json(ventas);
    }
  });
});

// Endpoint para obtener detalle de productos vendidos en una venta
app.get('/api/venta_detalle', (req, res) => {
  const codigo = req.query.codigo;
  if (!codigo) return res.status(400).json({ error: 'Código requerido' });

  const query = `
    SELECT 
      nombre_producto,
      cantidad,
      precio_unitario,
      submonto,
      IVA_unitario,
      monto
    FROM DETALLE_PRODUCTO_VENDIDO
    WHERE codigo_venta = ?
  `;
  db.all(query, [codigo], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Endpoint para obtener información general de una venta
app.get('/api/venta', (req, res) => {
  const codigo = req.query.codigo;
  if (!codigo) return res.status(400).json({ error: 'Código requerido' });

  const query = `
    SELECT 
      codigo AS numero,
      fecha AS fecha,
      hora AS hora,
      -- Si hay razón social, úsala; si no, concatena nombre y apellido
      CASE 
        WHEN razon_social_cliente IS NOT NULL AND TRIM(razon_social_cliente) != '' THEN razon_social_cliente
        ELSE TRIM(nombre_cliente || ' ' || IFNULL(apellido_cliente, ''))
      END AS cliente,
      total AS total,
      direccion_cliente AS direccion_cliente,
      correo_electronico_cliente AS correo_cliente,
      numero_telefonico_cliente AS numero_telefonico_cliente,
      nombre_o_razon_social_vendedor AS vendedor,
      NIT_vendedor AS nit_vendedor,
      direccion_vendedor AS direccion_vendedor,
      numero_de_contacto_vendedor AS contacto_vendedor,
      municipio_vendedor AS municipio_vendedor,
      responsabilidad_fiscal_vendedor AS responsabilidad_fiscal_vendedor
    FROM VENTA
    WHERE codigo = ?
  `;
  db.get(query, [codigo], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Venta no encontrada' });
    row.total = typeof row.total === 'number' ? `$${row.total.toFixed(2)}` : row.total;
    res.json(row);
  });
});


// Endpoint para obtener tipos de movimiento de inventario
app.get('/api/tipos-movimiento', (req, res) => {
  const query = 'SELECT codigo, nombre, tipo_flujo FROM TIPO_MOVIMIENTO_INVENTARIO';
  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Endpoint para eliminar un tipo de movimiento de inventario
app.delete('/api/tipos-movimiento/:codigo', (req, res) => {
  const codigo = req.params.codigo;
  db.run('DELETE FROM TIPO_MOVIMIENTO_INVENTARIO WHERE codigo = ?', [codigo], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Tipo de movimiento no encontrado' });
    }
    res.json({ ok: true });
  });
});

// Endpoint para crear un tipo de movimiento de inventario
app.post('/api/tipos-movimiento', (req, res) => {
  const { nombre, tipo_flujo } = req.body;
  if (!nombre || !tipo_flujo) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }
  db.run(
  'INSERT INTO TIPO_MOVIMIENTO_INVENTARIO (nombre, tipo_flujo) VALUES (?, ?)',
  [nombre, tipo_flujo],
  function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ ok: true, codigo: this.lastID });
  });
});

// Endpoint para obtener un tipo de movimiento por código
app.get('/api/tipos-movimiento/:codigo', (req, res) => {
  const codigo = req.params.codigo;
  db.get('SELECT codigo, nombre, tipo_flujo FROM TIPO_MOVIMIENTO_INVENTARIO WHERE codigo = ?', [codigo], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Tipo de movimiento no encontrado' });
    }
    res.json(row);
  });
});

// Endpoint para actualizar un tipo de movimiento
app.put('/api/tipos-movimiento/:codigo', (req, res) => {
  const codigo = req.params.codigo;
  const { nombre, tipo_flujo } = req.body;
  if (!nombre || !tipo_flujo) {
    return res.status(400).json({ error: 'Faltan campos requeridos '});
  }
  db.run(
    'UPDATE TIPO_MOVIMIENTO_INVENTARIO SET nombre = ?, tipo_flujo = ? WHERE codigo = ?',
    [nombre, tipo_flujo, codigo],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Tipo de movimiento no encontrado' });
      }
      res.json({ ok: true });
    }
  );
});

// Endpoint para crear un cliente
app.post('/api/clientes', (req, res) => {
  const {
    tipoCliente,
    primerNombre,
    segundoNombre,
    primerApellido,
    segundoApellido,
    razonSocial,
    tipoDocumento,
    numeroDocumento,
    direccion,
    ciudad, 
    numero_telefonico, 
    correo_electronico
  } = req.body;

  if (!numeroDocumento || !correo_electronico) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  db.serialize(() => {
    // Insertar en CLIENTE
    db.run(
      'INSERT OR REPLACE INTO CLIENTE (identificacion, direccion, correo_electronico, ciudad, numero_telefonico) VALUES (?, ?, ?, ?, ?)',
      [numeroDocumento, direccion || '', correo_electronico, ciudad || '', numero_telefonico || ''],
      function (err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        if (tipoCliente === 'natural') {
          // Construir nombre y apellido completos
          const nombreCompleto = [primerNombre, segundoNombre].filter(Boolean).join(' ');
          const apellidoCompleto = [primerApellido, segundoApellido].filter(Boolean).join(' ');
          // Insertar en CLIENTE_NATURAL
          db.run(
            'INSERT OR REPLACE INTO CLIENTE_NATURAL (identificacion, tipo_de_documento, nombre, apellido) VALUES (?, ?, ?, ?)',
            [numeroDocumento, tipoDocumento || '', nombreCompleto, apellidoCompleto],
            function (err2) {
              if (err2) {
                return res.status(500).json({ error: err2.message });
              }
              res.status(201).json({
                tipo: 'natural',
                id: numeroDocumento,
                primerNombre,
                segundoNombre,
                primerApellido,
                segundoApellido,
                tipoDocumento,
                numeroDocumento,
                direccion,
                ciudad,
                numero_telefonico,
                correo_electronico
              });
            }
          );
        } else if (tipoCliente === 'juridica') {
          // Insertar en CLIENTE_JURIDICO
          db.run(
            'INSERT OR REPLACE INTO CLIENTE_JURIDICO (identificacion, razon_social) VALUES (?, ?)',
            [numeroDocumento, razonSocial],
            function (err2) {
              if (err2) {
                return res.status(500).json({ error: err2.message });
              }
              res.status(201).json({
                tipo: 'juridica',
                id: numeroDocumento,
                razonSocial,
                tipoDocumento: 'NIT',
                numeroDocumento,
                direccion,
                ciudad,
                numero_telefonico,
                correo_electronico
              });
            }
          );
        } else {
          res.status(400).json({ error: 'Tipo de cliente desconocido' });
        }
      }
    );
  });
});

// Endpoint para obtener todos los clientes
app.get('/api/clientes', (req, res) => {
  // Consulta clientes base
  const queryClientes = `SELECT identificacion, direccion, correo_electronico, ciudad, numero_telefonico FROM CLIENTE`;
  db.all(queryClientes, [], (err, clientes) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!clientes.length) return res.json([]);

    // Consultar detalles de naturales y jurídicos
    const ids = clientes.map(c => `'${c.identificacion}'`).join(',');
    const queryNaturales = `SELECT * FROM CLIENTE_NATURAL WHERE identificacion IN (${ids})`;
    const queryJuridicos = `SELECT * FROM CLIENTE_JURIDICO WHERE identificacion IN (${ids})`;

    db.all(queryNaturales, [], (err2, naturales) => {
      if (err2) return res.status(500).json({ error: err2.message });
      db.all(queryJuridicos, [], (err3, juridicos) => {
        if (err3) return res.status(500).json({ error: err3.message });
        // Unir datos
        const naturalesMap = Object.fromEntries(naturales.map(n => [n.identificacion, n]));
        const juridicosMap = Object.fromEntries(juridicos.map(j => [j.identificacion, j]));
        const resultado = clientes.map(c => {
          if (naturalesMap[c.identificacion]) {
            const n = naturalesMap[c.identificacion];
            return {
              tipo: 'natural',
              id: c.identificacion,
              primerNombre: (n.nombre || '').split(' ')[0] || '',
              segundoNombre: (n.nombre || '').split(' ').slice(1).join(' '),
              primerApellido: (n.apellido || '').split(' ')[0] || '',
              segundoApellido: (n.apellido || '').split(' ').slice(1).join(' '),
              tipoDocumento: n.tipo_de_documento,
              numeroDocumento: c.identificacion,
              direccion: c.direccion,
              ciudad: c.ciudad,
              numero_telefonico: c.numero_telefonico,
              correo_electronico: c.correo_electronico
            };
          } else if (juridicosMap[c.identificacion]) {
            const j = juridicosMap[c.identificacion];
            return {
              tipo: 'juridica', // Siempre 'juridica' (femenino)
              id: c.identificacion,
              razonSocial: j.razon_social,
              tipoDocumento: 'NIT',
              numeroDocumento: c.identificacion,
              direccion: c.direccion,
              ciudad: c.ciudad,
              numero_telefonico: c.numero_telefonico,
              correo_electronico: c.correo_electronico
            };
          } else {
            // Cliente sin detalle
            return {
              tipo: 'desconocido',
              id: c.identificacion,
              numeroDocumento: c.identificacion,
              direccion: c.direccion,
              ciudad: c.ciudad,
              numero_telefonico: c.numero_telefonico,
              correo_electronico: c.correo_electronico
            };
          }
        });
        res.json(resultado);
      });
    });
  });
});

// Endpoint para actualizar un cliente
app.put('/api/clientes/:id', (req, res) => {
  const id = req.params.id;
  const {
    tipoCliente,
    primerNombre,
    segundoNombre,
    primerApellido,
    segundoApellido,
    razonSocial,
    tipoDocumento,
    numeroDocumento,
    direccion,
    ciudad,
    numero_telefonico,
    correo_electronico
  } = req.body;

  if (!numeroDocumento || !correo_electronico) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  db.serialize(() => {
    // Actualizar CLIENTE
    db.run(
      'UPDATE CLIENTE SET direccion = ?, correo_electronico = ?, ciudad = ?, numero_telefonico = ? WHERE identificacion = ?',
      [direccion || '', correo_electronico, ciudad || '', numero_telefonico || '', id],
      function (err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        if (tipoCliente === 'natural') {
          // Actualizar CLIENTE_NATURAL
          const nombreCompleto = [primerNombre, segundoNombre].filter(Boolean).join(' ');
          const apellidoCompleto = [primerApellido, segundoApellido].filter(Boolean).join(' ');
          db.run(
            'UPDATE CLIENTE_NATURAL SET tipo_de_documento = ?, nombre = ?, apellido = ? WHERE identificacion = ?',
            [tipoDocumento || '', nombreCompleto, apellidoCompleto, id],
            function (err2) {
              if (err2) {
                return res.status(500).json({ error: err2.message });
              }
              // Devolver el cliente actualizado
              res.json({
                tipo: 'natural',
                id,
                primerNombre,
                segundoNombre,
                primerApellido,
                segundoApellido,
                tipoDocumento,
                numeroDocumento: id,
                direccion,
                ciudad,
                numero_telefonico,
                correo_electronico
              });
            }
          );
        } else if (tipoCliente === 'juridica') {
          // Actualizar CLIENTE_JURIDICO
          db.run(
            'UPDATE CLIENTE_JURIDICO SET razon_social = ? WHERE identificacion = ?',
            [razonSocial, id],
            function (err2) {
              if (err2) {
                return res.status(500).json({ error: err2.message });
              }
              res.json({
                tipo: 'juridica',
                id,
                razonSocial,
                tipoDocumento: 'NIT',
                numeroDocumento: id,
                direccion,
                ciudad,
                numero_telefonico,
                correo_electronico
              });
            }
          );
        } else {
          res.status(400).json({ error: `Tipo de cliente desconocido: ${tipoCliente}` });
        }
      }
    );
  });
});

// Endpoint para eliminar un cliente
app.delete('/api/clientes/:id', (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: 'Se requiere el ID del cliente' });
  }

  // Usamos serialize para asegurar que las eliminaciones se ejecuten en orden.
  // Esto elimina al cliente de las tablas de detalle y luego de la tabla principal.
  db.serialize(() => {
    db.run('DELETE FROM CLIENTE_NATURAL WHERE identificacion = ?', [id]);
    db.run('DELETE FROM CLIENTE_JURIDICO WHERE identificacion = ?', [id]);
    db.run('DELETE FROM CLIENTE WHERE identificacion = ?', [id], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Cliente no encontrado' });
      }
      res.json({ ok: true, message: 'Cliente eliminado correctamente' });
    });
  });
});

// Endpoint para crear productos
app.post('/api/productos', (req, res) => {
  const {
    codigo,
    nombre,
    costoUnitario,
    precioUnitario,
    descripcion,
    exentoIVA,
    tipoIVA
  } = req.body;

  // Validaciones
  if (!nombre || isNaN(costoUnitario) || isNaN(precioUnitario)) {
    return res.status(400).json({ error: 'Faltan campos obligatorios o son inválidos' });
  }

  // Calcular tasa de IVA
  const tasaIVA = exentoIVA ? 0 : (parseFloat(tipoIVA) || 0.19);
  
  console.log("Tasa de IVA calculada:", tasaIVA);


  db.run(
    `INSERT INTO PRODUCTO (
      codigo, nombre, costo_unitario, precio, 
      descripcion, estado, tasa_IVA
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      codigo,
      nombre,
      costoUnitario,
      precioUnitario,
      descripcion || '',
      'activo',
      tasaIVA
    ],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({
        codigo,
        nombre,
        costoUnitario,
        precioUnitario,
        descripcion,
        estado: 'activo',
        exentoIVA,
        tipoIVA: tasaIVA
      });
    }
  );
});

// Endpoint para obtener todos los productos
app.get('/api/productos', (req, res) => {
  const query = `
    SELECT 
      p.codigo AS codigo,
      p.nombre AS nombre,
      p.precio AS precioUnitario,
      p.costo_unitario AS costoUnitario,
      p.descripcion AS descripcion,
      p.tasa_IVA AS tipoIVA,
      p.estado AS estado
    FROM PRODUCTO p
    ORDER BY p.nombre
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Endpoint para registrar una nueva venta y sus productos
app.post('/api/venta', express.json(), async (req, res) => {
  try {
    const v = req.body;
    // Validaciones mínimas
    if (!v || !v.fecha || !v.hora || !v.identificacion_cliente || !Array.isArray(v.productos) || v.productos.length === 0) {
      return res.status(400).json({ error: 'Datos de venta incompletos' });
    }

    // Generar un código secuencial para la venta: V + número correlativo, total 10 caracteres
    const getNextVentaNumber = async () => {
      return await new Promise((resolve, reject) => {
        db.get('SELECT COUNT(*) as total FROM VENTA', [], (err, row) => {
          if (err) reject(err);
          else resolve(row.total + 1); // Siguiente número
        });
      });
    };
    const nextVentaNum = await getNextVentaNumber();
    // Formato: V + ceros + número, total 10 caracteres
    const codigoVenta = 'V' + String(nextVentaNum).padStart(9, '0');

    // Buscar cliente seleccionado
    const cliente = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM CLIENTE WHERE identificacion = ?', [v.identificacion_cliente], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    if (!cliente) return res.status(400).json({ error: 'Cliente no encontrado' });

    // Buscar si es natural o jurídico
    const clienteNatural = await new Promise((resolve) => {
      db.get('SELECT * FROM CLIENTE_NATURAL WHERE identificacion = ?', [v.identificacion_cliente], (err, row) => {
        resolve(row);
      });
    });
    const clienteJuridico = await new Promise((resolve) => {
      db.get('SELECT * FROM CLIENTE_JURIDICO WHERE identificacion = ?', [v.identificacion_cliente], (err, row) => {
        resolve(row);
      });
    });

    // Calcular subtotal y total
    let subtotal = 0, total = 0;
    v.productos.forEach(p => {
      const precio = parseFloat(p.precio_unitario) || 0;
      const iva = parseFloat(p.IVA_unitario) || 0;
      const cantidad = parseFloat(p.cantidad) || 0;
      subtotal += precio * cantidad;
      total += (precio + iva) * cantidad;
    });

    // Insertar la venta
    await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO VENTA (
          codigo, fecha, hora, subtotal, total,
          identificacion_cliente, tipo_identificacion_cliente,
          nombre_cliente, apellido_cliente, razon_social_cliente,
          direccion_cliente, numero_telefonico_cliente, ciudad_cliente, correo_electronico_cliente,
          nombre_o_razon_social_vendedor, NIT_vendedor, direccion_vendedor, numero_de_contacto_vendedor, municipio_vendedor, responsabilidad_fiscal_vendedor
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          codigoVenta,
          v.fecha,
          v.hora,
          subtotal,
          total,
          v.identificacion_cliente,
          clienteNatural ? (clienteNatural.tipo_de_documento || 'CC') : 'NIT',
          clienteNatural ? clienteNatural.nombre : null,
          clienteNatural ? clienteNatural.apellido : null,
          clienteJuridico ? clienteJuridico.razon_social : null,
          cliente.direccion,
          cliente.numero_telefonico,
          cliente.ciudad,
          cliente.correo_electronico,
          v.nombre_o_razon_social_vendedor,
          v.NIT_vendedor,
          v.direccion_vendedor,
          v.numero_de_contacto_vendedor,
          v.municipio_vendedor,
          v.responsabilidad_fiscal_vendedor
        ],
        function (err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    // Insertar los productos vendidos (detalle)
    const stmtDet = db.prepare('INSERT INTO DETALLE_PRODUCTO_VENDIDO (nombre_producto, cantidad, precio_unitario, costo_unitario, IVA_unitario, submonto, monto, codigo_venta) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    for (const p of v.productos) {
      // Para asegurar que el costo es el correcto, lo traemos de la BD
      const prodInfo = await new Promise((resolve) => {
        db.get('SELECT costo_unitario FROM PRODUCTO WHERE nombre = ?', [p.nombre], (err, row) => {
          resolve(row); // Resuelve con la fila o undefined si no se encuentra
        });
      });

      const precio = parseFloat(p.precio_unitario) || 0;
      const iva = parseFloat(p.IVA_unitario) || 0;
      const cantidad = parseFloat(p.cantidad) || 0;
      const costo = prodInfo ? (parseFloat(prodInfo.costo_unitario) || 0) : 0;
      const submonto = precio * cantidad;
      const monto = (precio + iva) * cantidad;
      stmtDet.run(
        p.nombre,
        cantidad,
        precio,
        costo,
        iva,
        submonto,
        monto,
        codigoVenta
      );
    }
    stmtDet.finalize();

    // Registrar movimientos de inventario (salida por venta)
    // Buscar el codigo para "Venta de productos"
    const tipCodigoVenta = await new Promise((resolve, reject) => {
      db.get("SELECT codigo FROM TIPO_MOVIMIENTO_INVENTARIO WHERE tipo_flujo = 'Salida' AND nombre LIKE '%Venta%' LIMIT 1", [], (err, row) => {
        if (err) reject(err);
        else resolve(row ? row.codigo : null);
      });
    });
    if (!tipCodigoVenta) {
      return res.status(500).json({ error: 'No se encontró el tipo de movimiento para venta.' });
    }
    const stmtMov = db.prepare('INSERT INTO MOVIMIENTO_INVENTARIO (fecha, cantidad, codigo_tipo_movimiento, codigo_producto) VALUES (?, ?, ?, ?)');
    for (const p of v.productos) {
      // Buscar el código del producto
      const prod = await new Promise((resolve) => {
        db.get('SELECT codigo FROM PRODUCTO WHERE nombre = ?', [p.nombre], (err, row) => {
          resolve(row);
        });
      });
      if (prod && prod.codigo) {
        stmtMov.run(v.fecha, Number(p.cantidad), tipCodigoVenta, prod.codigo);
      }
    }
    stmtMov.finalize();
    res.json({ ok: true, codigo: codigoVenta });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint para eliminar una venta y sus movimientos de inventario
app.delete('/api/venta/:codigo', async (req, res) => {
  const codigo = req.params.codigo;
  if (!codigo) return res.status(400).json({ error: 'Código requerido' });
  try {
    // Eliminar movimientos de inventario asociados a la venta
    // Primero obtener los productos de la venta
    const productos = await new Promise((resolve, reject) => {
      db.all('SELECT nombre_producto, cantidad FROM DETALLE_PRODUCTO_VENDIDO WHERE codigo_venta = ?', [codigo], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    // Buscar codigo para "Venta de productos"
    const tipCodigoVenta = await new Promise((resolve, reject) => {
      db.get("SELECT codigo FROM TIPO_MOVIMIENTO_INVENTARIO WHERE tipo_flujo = 'Salida' AND nombre LIKE '%Venta%' LIMIT 1", [], (err, row) => {
        if (err) reject(err);
        else resolve(row ? row.codigo : null);
      });
    });
    if (tipCodigoVenta) {
      for (const p of productos) {
        // Buscar el código del producto
        const prod = await new Promise((resolve) => {
          db.get('SELECT codigo FROM PRODUCTO WHERE nombre = ?', [p.nombre_producto], (err, row) => {
            resolve(row);
          });
        });
        if (prod && prod.codigo) {
          // Eliminar movimientos de inventario de salida por venta para este producto y venta
          await new Promise((resolve, reject) => {
            db.run('DELETE FROM MOVIMIENTO_INVENTARIO WHERE codigo_producto = ? AND codigo_tipo_movimiento = ? AND cantidad = ? AND fecha = (SELECT fecha FROM VENTA WHERE codigo = ?)', [prod.codigo, tipCodigoVenta, p.cantidad, codigo], function(err) {
              if (err) reject(err);
              else resolve();
            });
          });
        }
      }
    }
    // Eliminar detalle de productos vendidos
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM DETALLE_PRODUCTO_VENDIDO WHERE codigo_venta = ?', [codigo], function(err) {
        if (err) reject(err);
        else resolve();
      });
    });
    // Eliminar la venta
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM VENTA WHERE codigo = ?', [codigo], function(err) {
        if (err) reject(err);
        else resolve();
      });
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint para eliminar un producto
app.delete('/api/productos/:codigo', (req, res) => {
  const { codigo } = req.params;
  
  db.serialize(() => {

    // Luego eliminar de la tabla principal
    db.run('DELETE FROM PRODUCTO WHERE codigo = ?', [codigo], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }
      res.json({ ok: true });
    });
  });
});

// Endpoint para actualizar un producto
app.put('/api/productos/:codigo', (req, res) => {
  const codigo = req.params.codigo;
  const {
    nombre,
    costoUnitario,
    precioUnitario,
    descripcion,
    estado = 'activo',
    tipoIVA,
    exentoIVA
  } = req.body;

  if (!codigo || !nombre || isNaN(costoUnitario) || isNaN(precioUnitario)) {
    return res.status(400).json({ error: 'Faltan campos obligatorios o datos inválidos' });
  }

  const tasaIVA = exentoIVA ? 0 : (parseFloat(tipoIVA) || 0.19);

  db.run(
    `UPDATE PRODUCTO
     SET nombre = ?, costo_unitario = ?, precio = ?, descripcion = ?, estado = ?, tasa_IVA = ?
     WHERE codigo = ?`,
    [nombre, costoUnitario, precioUnitario, descripcion || '', estado, tasaIVA, codigo],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }
      res.json({
        codigo,
        nombre,
        costoUnitario,
        precioUnitario,
        descripcion,
        estado,
        tipoIVA: tasaIVA,
        exentoIVA
      });
    }
  );
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
