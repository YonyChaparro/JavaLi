// servidor.cjs
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

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

// Endpoint para consultar existencias actuales de un producto
app.get('/api/existencias/:pro_codigo', (req, res) => {
  const pro_codigo = req.params.pro_codigo;
  // Suma todas las entradas y salidas para ese producto
  const query = `
    SELECT IFNULL(SUM(CASE WHEN t.tip_tipo_flujo = 'Entrada' THEN m.mov_cantidad
                           WHEN t.tip_tipo_flujo = 'Salida' THEN -m.mov_cantidad
                           ELSE 0 END), 0) AS existencias
    FROM MOVIMIENTO_INVENTARIO m
    JOIN TIPO_MOVIMIENTO_INVENTARIO t ON m.tip_codigo = t.tip_codigo
    WHERE m.pro_codigo = ?
  `;
  db.get(query, [pro_codigo], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ existencias: row ? row.existencias : 0 });
  });
});

// Endpoint para guardar movimientos de inventario (tip_codigo ahora es INTEGER)
app.post('/api/movimientos-inventario', express.json(), (req, res) => {
  const movimientos = req.body;
  if (!Array.isArray(movimientos) || movimientos.length === 0) {
    return res.status(400).json({ error: 'No hay movimientos para guardar.' });
  }
  const stmt = db.prepare('INSERT INTO MOVIMIENTO_INVENTARIO (mov_fecha, mov_cantidad, tip_codigo, pro_codigo) VALUES (?, ?, ?, ?)');
  const fecha = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  try {
    movimientos.forEach(mov => {
      // tip_codigo puede venir como string, lo convertimos a entero
      const tip_codigo_int = parseInt(mov.tip_codigo, 10);
      stmt.run(fecha, mov.cantidad, tip_codigo_int, mov.pro_codigo);
    });
    stmt.finalize();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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
      `INSERT INTO VENDEDOR (ven_NIT, ven_nombre_o_razon_social, ven_direccion, ven_numero_de_contacto, ven_municipio, ven_responsabilidad_fiscal)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        v.ven_NIT,
        v.ven_nombre_o_razon_social,
        v.ven_direccion,
        v.ven_numero_de_contacto,
        v.ven_municipio,
        v.ven_responsabilidad_fiscal
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
      dpv.det_nombre_producto AS producto,
      SUM(dpv.det_monto) AS ingresos,
      SUM(dpv.det_cantidad * dpv.det_costo_unitario) AS costos,
      SUM(dpv.det_monto - (dpv.det_cantidad * dpv.det_costo_unitario)) AS utilidades,
      SUM(dpv.det_IVA_unitario * dpv.det_cantidad) AS iva
    FROM DETALLE_PRODUCTO_VENDIDO dpv
    JOIN VENTA v ON dpv.ven_codigo = v.ven_codigo
    WHERE 1=1`;

  const params = [];

  if (producto) {
    query += ' AND dpv.det_nombre_producto = ?';
    params.push(producto);
  }

  if (fechaInicio && fechaFin) {
    query += ' AND v.ven_fecha BETWEEN ? AND ?';
    params.push(fechaInicio, fechaFin);
  }

  query += ' GROUP BY dpv.det_nombre_producto';

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
    SELECT DISTINCT dpv.det_nombre_producto AS nombre
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
      ven_codigo AS numero,
      ven_fecha AS fecha,
      ven_hora AS hora,
      ven_nombre_cliente || ' ' || IFNULL(ven_apellido_cliente, '') AS cliente,
      ven_razon_social_cliente,
      ven_total AS total
    FROM VENTA
    ORDER BY ven_fecha DESC, ven_hora DESC
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
      det_nombre_producto,
      det_cantidad,
      det_precio_unitario,
      det_submonto,
      det_IVA_unitario,
      det_monto
    FROM DETALLE_PRODUCTO_VENDIDO
    WHERE ven_codigo = ?
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
      ven_codigo AS numero,
      ven_fecha AS fecha,
      ven_hora AS hora,
      ven_nombre_cliente || ' ' || IFNULL(ven_apellido_cliente, '') AS cliente,
      ven_total AS total,
      ven_direccion_cliente AS direccion_cliente,
      ven_correo_electronico_cliente AS correo_cliente,
      ven_numero_telefonico_cliente AS telefono_cliente,
      ven_nombre_o_razon_social_vendedor AS vendedor,
      ven_NIT_vendedor AS nit_vendedor,
      ven_direccion_vendedor AS direccion_vendedor,
      ven_numero_de_contacto_vendedor AS contacto_vendedor,
      ven_municipio_vendedor AS municipio_vendedor,
      ven_responsabilidad_fiscal_vendedor AS responsabilidad_fiscal_vendedor
    FROM VENTA
    WHERE ven_codigo = ?
  `;
  db.get(query, [codigo], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Venta no encontrada' });
    row.total = typeof row.total === 'number' ? `$${row.total.toFixed(2)}` : row.total;
    res.json(row);
  });
});

// Endpoint: insertar datos de prueba
app.get('/api/insertar-datos-prueba', (req, res) => {
  // Insertar productos
  const productos = [
    ["P001", "Muñeca inflable", 892399, 90822020, "Muñeca de vinilo", "activo", 0.19],
    ["P002", "Robot de cocina", 3200000, 45000000, "Robot multifunción", "activo", 0.05]
  ];
  const stmtProd = db.prepare('INSERT OR IGNORE INTO PRODUCTO (pro_codigo, pro_nombre, pro_costo_unitario, pro_precio, pro_descripcion, pro_estado, pro_tasa_IVA) VALUES (?, ?, ?, ?, ?, ?, ?)');
  productos.forEach(p => stmtProd.run(p));
  stmtProd.finalize();

  // Insertar cliente de prueba (natural)
  const cliente = [
    "1234567890", // cli_identificacion
    "Calle Falsa 123", // cli_direccion
    "cliente@correo.com", // cli_correo_electronico
    "Bogotá", // cli_ciudad
    "3001234567" // cli_numero_telefonico
  ];
  db.run('INSERT OR IGNORE INTO CLIENTE (cli_identificacion, cli_direccion, cli_correo_electronico, cli_ciudad, cli_numero_telefonico) VALUES (?, ?, ?, ?, ?)', cliente);
  db.run('INSERT OR IGNORE INTO CLIENTE_NATURAL (cli_identificacion, cli_tipo_de_documento, cli_nombre, cli_apellido) VALUES (?, ?, ?, ?)', [
    "1234567890", // cli_identificacion
    "CC", // cli_tipo_de_documento
    "Juan Carlos", // cli_nombre
    "Pérez Gómez" // cli_apellido
  ]);

  // Insertar cliente de prueba (jurídico)
  const clienteJuridico = [
    "900123456", // cli_identificacion (NIT)
    "Avenida Siempre Viva 742", // cli_direccion
    "empresa@correo.com", // cli_correo_electronico
    "Medellín", // cli_ciudad
    "6041234567" // cli_numero_telefonico
  ];
  db.run('INSERT OR IGNORE INTO CLIENTE (cli_identificacion, cli_direccion, cli_correo_electronico, cli_ciudad, cli_numero_telefonico) VALUES (?, ?, ?, ?, ?)', clienteJuridico);
  db.run('INSERT OR IGNORE INTO CLIENTE_JURIDICO (cli_identificacion, cli_razon_social) VALUES (?, ?)', [
    "900123456", // cli_identificacion
    "Soluciones Empresariales S.A.S." // cli_razon_social
  ]);

  // Insertar venta
  const ventas = [
    ["V002", "2025-06-21", "10:49", 181644040, 184550344, "C001", "CC", "Juan", "Pérez", null, "Calle 1", "555-1234", "Bogotá", "juan@mail.com", "Pedro S.A.", "V001", "Calle 2", "555-5678", "Bogotá", "Responsable"]
  ];
  const stmtVenta = db.prepare('INSERT OR IGNORE INTO VENTA (ven_codigo, ven_fecha, ven_hora, ven_subtotal, ven_total, ven_identificacion_cliente, ven_tipo_identificacion_cliente, ven_nombre_cliente, ven_apellido_cliente, ven_razon_social_cliente, ven_direccion_cliente, ven_numero_telefonico_cliente, ven_ciudad_cliente, ven_correo_electronico_cliente, ven_nombre_o_razon_social_vendedor, ven_NIT_vendedor, ven_direccion_vendedor, ven_numero_de_contacto_vendedor, ven_municipio_vendedor, ven_responsabilidad_fiscal_vendedor) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  ventas.forEach(v => stmtVenta.run(v));
  stmtVenta.finalize();

  // Insertar detalle
  const detalles = [
    ["Argolla analizadora", 23, 90000, 900, 9000, 818272, 289892, "V002"]
  ];
  const stmtDet = db.prepare('INSERT OR IGNORE INTO DETALLE_PRODUCTO_VENDIDO (det_nombre_producto, det_cantidad, det_precio_unitario, det_costo_unitario, det_IVA_unitario, det_submonto, det_monto, ven_codigo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  detalles.forEach(d => stmtDet.run(d));
  stmtDet.finalize();

  res.json({ ok: true });
});

// Endpoint para obtener tipos de movimiento de inventario
app.get('/api/tipos-movimiento', (req, res) => {
  const query = 'SELECT tip_codigo, tip_nombre, tip_tipo_flujo FROM TIPO_MOVIMIENTO_INVENTARIO';
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
  db.run('DELETE FROM TIPO_MOVIMIENTO_INVENTARIO WHERE tip_codigo = ?', [codigo], function(err) {
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
  const { tip_nombre, tip_tipo_flujo } = req.body;
  if (!tip_nombre || !tip_tipo_flujo) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }
  db.run(
  'INSERT INTO TIPO_MOVIMIENTO_INVENTARIO (tip_nombre, tip_tipo_flujo) VALUES (?, ?)',
  [tip_nombre, tip_tipo_flujo],
  function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ ok: true, tip_codigo: this.lastID });
  });
});

// Endpoint para obtener un tipo de movimiento por código
app.get('/api/tipos-movimiento/:codigo', (req, res) => {
  const codigo = req.params.codigo;
  db.get('SELECT tip_codigo, tip_nombre, tip_tipo_flujo FROM TIPO_MOVIMIENTO_INVENTARIO WHERE tip_codigo = ?', [codigo], (err, row) => {
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
  const { tip_nombre, tip_tipo_flujo } = req.body;
  if (!tip_nombre || !tip_tipo_flujo) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }
  db.run(
    'UPDATE TIPO_MOVIMIENTO_INVENTARIO SET tip_nombre = ?, tip_tipo_flujo = ? WHERE tip_codigo = ?',
    [tip_nombre, tip_tipo_flujo, codigo],
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
    telefono, 
    email
  } = req.body;

  if (!numeroDocumento || !email) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  db.serialize(() => {
    // Insertar en CLIENTE
    db.run(
      'INSERT OR REPLACE INTO CLIENTE (cli_identificacion, cli_direccion, cli_correo_electronico, cli_ciudad, cli_numero_telefonico) VALUES (?, ?, ?, ?, ?)',
      [numeroDocumento, direccion || '', email, ciudad || '', telefono || ''],
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
            'INSERT OR REPLACE INTO CLIENTE_NATURAL (cli_identificacion, cli_tipo_de_documento, cli_nombre, cli_apellido) VALUES (?, ?, ?, ?)',
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
                telefono,
                email
              });
            }
          );
        } else if (tipoCliente === 'juridica') {
          // Insertar en CLIENTE_JURIDICO
          db.run(
            'INSERT OR REPLACE INTO CLIENTE_JURIDICO (cli_identificacion, cli_razon_social) VALUES (?, ?)',
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
                telefono,
                email
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
  const queryClientes = `SELECT cli_identificacion, cli_direccion, cli_correo_electronico, cli_ciudad, cli_numero_telefonico FROM CLIENTE`;
  db.all(queryClientes, [], (err, clientes) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!clientes.length) return res.json([]);

    // Consultar detalles de naturales y jurídicos
    const ids = clientes.map(c => `'${c.cli_identificacion}'`).join(',');
    const queryNaturales = `SELECT * FROM CLIENTE_NATURAL WHERE cli_identificacion IN (${ids})`;
    const queryJuridicos = `SELECT * FROM CLIENTE_JURIDICO WHERE cli_identificacion IN (${ids})`;

    db.all(queryNaturales, [], (err2, naturales) => {
      if (err2) return res.status(500).json({ error: err2.message });
      db.all(queryJuridicos, [], (err3, juridicos) => {
        if (err3) return res.status(500).json({ error: err3.message });
        // Unir datos
        const naturalesMap = Object.fromEntries(naturales.map(n => [n.cli_identificacion, n]));
        const juridicosMap = Object.fromEntries(juridicos.map(j => [j.cli_identificacion, j]));
        const resultado = clientes.map(c => {
          if (naturalesMap[c.cli_identificacion]) {
            const n = naturalesMap[c.cli_identificacion];
            return {
              tipo: 'natural',
              id: c.cli_identificacion,
              primerNombre: (n.cli_nombre || '').split(' ')[0] || '',
              segundoNombre: (n.cli_nombre || '').split(' ').slice(1).join(' '),
              primerApellido: (n.cli_apellido || '').split(' ')[0] || '',
              segundoApellido: (n.cli_apellido || '').split(' ').slice(1).join(' '),
              tipoDocumento: n.cli_tipo_de_documento,
              numeroDocumento: c.cli_identificacion,
              direccion: c.cli_direccion,
              ciudad: c.cli_ciudad,
              telefono: c.cli_numero_telefonico,
              email: c.cli_correo_electronico
            };
          } else if (juridicosMap[c.cli_identificacion]) {
            const j = juridicosMap[c.cli_identificacion];
            return {
              tipo: 'juridica', // Siempre 'juridica' (femenino)
              id: c.cli_identificacion,
              razonSocial: j.cli_razon_social,
              tipoDocumento: 'NIT',
              numeroDocumento: c.cli_identificacion,
              direccion: c.cli_direccion,
              ciudad: c.cli_ciudad,
              telefono: c.cli_numero_telefonico,
              email: c.cli_correo_electronico
            };
          } else {
            // Cliente sin detalle
            return {
              tipo: 'desconocido',
              id: c.cli_identificacion,
              numeroDocumento: c.cli_identificacion,
              direccion: c.cli_direccion,
              ciudad: c.cli_ciudad,
              telefono: c.cli_numero_telefonico,
              email: c.cli_correo_electronico
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
    telefono,
    email
  } = req.body;

  if (!numeroDocumento || !email) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  db.serialize(() => {
    // Actualizar CLIENTE
    db.run(
      'UPDATE CLIENTE SET cli_direccion = ?, cli_correo_electronico = ?, cli_ciudad = ?, cli_numero_telefonico = ? WHERE cli_identificacion = ?',
      [direccion || '', email, ciudad || '', telefono || '', id],
      function (err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        if (tipoCliente === 'natural') {
          // Actualizar CLIENTE_NATURAL
          const nombreCompleto = [primerNombre, segundoNombre].filter(Boolean).join(' ');
          const apellidoCompleto = [primerApellido, segundoApellido].filter(Boolean).join(' ');
          db.run(
            'UPDATE CLIENTE_NATURAL SET cli_tipo_de_documento = ?, cli_nombre = ?, cli_apellido = ? WHERE cli_identificacion = ?',
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
                telefono,
                email
              });
            }
          );
        } else if (tipoCliente === 'juridica') {
          // Actualizar CLIENTE_JURIDICO
          db.run(
            'UPDATE CLIENTE_JURIDICO SET cli_razon_social = ? WHERE cli_identificacion = ?',
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
                telefono,
                email
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
    db.run('DELETE FROM CLIENTE_NATURAL WHERE cli_identificacion = ?', [id]);
    db.run('DELETE FROM CLIENTE_JURIDICO WHERE cli_identificacion = ?', [id]);
    db.run('DELETE FROM CLIENTE WHERE cli_identificacion = ?', [id], function(err) {
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
      pro_codigo, pro_nombre, pro_costo_unitario, pro_precio, 
      pro_descripcion, pro_estado, pro_tasa_IVA
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
      p.pro_codigo AS codigo,
      p.pro_nombre AS nombre,
      p.pro_precio AS precioUnitario,
      p.pro_costo_unitario AS costoUnitario,
      p.pro_descripcion AS descripcion,
      p.pro_tasa_IVA AS tipoIVA,
      p.pro_estado AS estado,
      CASE 
        WHEN pb.pro_codigo IS NOT NULL THEN 'bien'
        WHEN ps.pro_codigo IS NOT NULL THEN 'servicio'
        ELSE 'desconocido'
      END AS tipoProducto
    FROM PRODUCTO p
    LEFT JOIN PRODUCTO_BIEN pb ON p.pro_codigo = pb.pro_codigo
    LEFT JOIN PRODUCTO_SERVICIO ps ON p.pro_codigo = ps.pro_codigo
    ORDER BY p.pro_nombre
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
      db.get('SELECT * FROM CLIENTE WHERE cli_identificacion = ?', [v.identificacion_cliente], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    if (!cliente) return res.status(400).json({ error: 'Cliente no encontrado' });

    // Buscar si es natural o jurídico
    const clienteNatural = await new Promise((resolve) => {
      db.get('SELECT * FROM CLIENTE_NATURAL WHERE cli_identificacion = ?', [v.identificacion_cliente], (err, row) => {
        resolve(row);
      });
    });
    const clienteJuridico = await new Promise((resolve) => {
      db.get('SELECT * FROM CLIENTE_JURIDICO WHERE cli_identificacion = ?', [v.identificacion_cliente], (err, row) => {
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
          ven_codigo, ven_fecha, ven_hora, ven_subtotal, ven_total,
          ven_identificacion_cliente, ven_tipo_identificacion_cliente,
          ven_nombre_cliente, ven_apellido_cliente, ven_razon_social_cliente,
          ven_direccion_cliente, ven_numero_telefonico_cliente, ven_ciudad_cliente, ven_correo_electronico_cliente,
          ven_nombre_o_razon_social_vendedor, ven_NIT_vendedor, ven_direccion_vendedor, ven_numero_de_contacto_vendedor, ven_municipio_vendedor, ven_responsabilidad_fiscal_vendedor
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          codigoVenta,
          v.fecha,
          v.hora,
          subtotal,
          total,
          v.identificacion_cliente,
          clienteNatural ? (clienteNatural.cli_tipo_de_documento || 'CC') : 'NIT',
          clienteNatural ? clienteNatural.cli_nombre : null,
          clienteNatural ? clienteNatural.cli_apellido : null,
          clienteJuridico ? clienteJuridico.cli_razon_social : null,
          cliente.cli_direccion,
          cliente.cli_numero_telefonico,
          cliente.cli_ciudad,
          cliente.cli_correo_electronico,
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
    const stmtDet = db.prepare('INSERT INTO DETALLE_PRODUCTO_VENDIDO (det_nombre_producto, det_cantidad, det_precio_unitario, det_costo_unitario, det_IVA_unitario, det_submonto, det_monto, ven_codigo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    for (const p of v.productos) {
      // Para asegurar que el costo es el correcto, lo traemos de la BD
      const prodInfo = await new Promise((resolve) => {
        db.get('SELECT pro_costo_unitario FROM PRODUCTO WHERE pro_nombre = ?', [p.nombre], (err, row) => {
          resolve(row); // Resuelve con la fila o undefined si no se encuentra
        });
      });

      const precio = parseFloat(p.precio_unitario) || 0;
      const iva = parseFloat(p.IVA_unitario) || 0;
      const cantidad = parseFloat(p.cantidad) || 0;
      const costo = prodInfo ? (parseFloat(prodInfo.pro_costo_unitario) || 0) : 0;
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
    // Buscar el tip_codigo para "Venta de productos"
    const tipCodigoVenta = await new Promise((resolve, reject) => {
      db.get("SELECT tip_codigo FROM TIPO_MOVIMIENTO_INVENTARIO WHERE tip_tipo_flujo = 'Salida' AND tip_nombre LIKE '%Venta%' LIMIT 1", [], (err, row) => {
        if (err) reject(err);
        else resolve(row ? row.tip_codigo : null);
      });
    });
    if (!tipCodigoVenta) {
      return res.status(500).json({ error: 'No se encontró el tipo de movimiento para venta.' });
    }
    const fechaHoy = new Date().toISOString().slice(0, 10);
    const stmtMov = db.prepare('INSERT INTO MOVIMIENTO_INVENTARIO (mov_fecha, mov_cantidad, tip_codigo, pro_codigo) VALUES (?, ?, ?, ?)');
    for (const p of v.productos) {
      // Buscar el código del producto
      const prod = await new Promise((resolve) => {
        db.get('SELECT pro_codigo FROM PRODUCTO WHERE pro_nombre = ?', [p.nombre], (err, row) => {
          resolve(row);
        });
      });
      if (prod && prod.pro_codigo) {
        stmtMov.run(fechaHoy, Number(p.cantidad), tipCodigoVenta, prod.pro_codigo);
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
      db.all('SELECT det_nombre_producto, det_cantidad FROM DETALLE_PRODUCTO_VENDIDO WHERE ven_codigo = ?', [codigo], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    // Buscar tip_codigo para "Venta de productos"
    const tipCodigoVenta = await new Promise((resolve, reject) => {
      db.get("SELECT tip_codigo FROM TIPO_MOVIMIENTO_INVENTARIO WHERE tip_tipo_flujo = 'Salida' AND tip_nombre LIKE '%Venta%' LIMIT 1", [], (err, row) => {
        if (err) reject(err);
        else resolve(row ? row.tip_codigo : null);
      });
    });
    if (tipCodigoVenta) {
      for (const p of productos) {
        // Buscar el código del producto
        const prod = await new Promise((resolve) => {
          db.get('SELECT pro_codigo FROM PRODUCTO WHERE pro_nombre = ?', [p.det_nombre_producto], (err, row) => {
            resolve(row);
          });
        });
        if (prod && prod.pro_codigo) {
          // Eliminar movimientos de inventario de salida por venta para este producto y venta
          await new Promise((resolve, reject) => {
            db.run('DELETE FROM MOVIMIENTO_INVENTARIO WHERE pro_codigo = ? AND tip_codigo = ? AND mov_cantidad = ? AND mov_fecha = (SELECT ven_fecha FROM VENTA WHERE ven_codigo = ?)', [prod.pro_codigo, tipCodigoVenta, p.det_cantidad, codigo], function(err) {
              if (err) reject(err);
              else resolve();
            });
          });
        }
      }
    }
    // Eliminar detalle de productos vendidos
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM DETALLE_PRODUCTO_VENDIDO WHERE ven_codigo = ?', [codigo], function(err) {
        if (err) reject(err);
        else resolve();
      });
    });
    // Eliminar la venta
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM VENTA WHERE ven_codigo = ?', [codigo], function(err) {
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
    // Eliminar de las tablas específicas primero
    db.run('DELETE FROM PRODUCTO_BIEN WHERE pro_codigo = ?', [codigo]);
    db.run('DELETE FROM PRODUCTO_SERVICIO WHERE pro_codigo = ?', [codigo]);
    
    // Luego eliminar de la tabla principal
    db.run('DELETE FROM PRODUCTO WHERE pro_codigo = ?', [codigo], function(err) {
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
     SET pro_nombre = ?, pro_costo_unitario = ?, pro_precio = ?, pro_descripcion = ?, pro_estado = ?, pro_tasa_IVA = ?
     WHERE pro_codigo = ?`,
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
