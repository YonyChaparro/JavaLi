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

// Endpoint: generar reporte
app.get('/api/reportes', (req, res) => {
  const { producto, fechaInicio, fechaFin } = req.query;
  let query = `
    SELECT
      dpv.det_nombre_producto AS producto,
      SUM(dpv.det_monto) AS ingresos,
      SUM(dpv.det_cantidad * dpv.det_costo_unitario) AS costos,
      SUM(dpv.det_monto - (dpv.det_cantidad * dpv.det_costo_unitario)) AS utilidades,
      SUM(dpv.det_IVA_unitario) AS iva
    FROM DETALLE_PRODUCTO_VENDIDO dpv
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

// Endpoint: insertar datos de prueba
app.get('/api/insertar-datos-prueba', (req, res) => {
  // Insertar productos
  const productos = [
    ["P001", "Muñeca inflable", 892399, 90822020, "Muñeca de vinilo", "activo", "IVA1"],
    ["P002", "Robot de cocina", 3200000, 45000000, "Robot multifunción", "activo", "IVA2"]
  ];
  const stmtProd = db.prepare('INSERT OR IGNORE INTO PRODUCTO (pro_codigo, pro_nombre, pro_costo_unitario, pro_precio, pro_descripcion, pro_estado, tip_codigo_iva) VALUES (?, ?, ?, ?, ?, ?, ?)');
  productos.forEach(p => stmtProd.run(p));
  stmtProd.finalize();

  // Insertar IVA
  const ivas = [
    ["IVA1", "IVA General", 0.16],
    ["IVA2", "IVA Reducido", 0.08]
  ];
  const stmtIva = db.prepare('INSERT OR IGNORE INTO TIPO_IVA (tip_codigo, tip_nombre, tip_porcentaje) VALUES (?, ?, ?)');
  ivas.forEach(i => stmtIva.run(i));
  stmtIva.finalize();

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

  // Insertar tipos de movimiento de inventario
  const tiposMovimiento = [
    [1, "Entrada por compra", "Entrada"],
    [2, "Salida por venta", "Salida"],
    [3, "Ajuste positivo", "Entrada"],
    [4, "Ajuste negativo", "Salida"]
  ];
  const stmtTipoMov = db.prepare('INSERT OR IGNORE INTO TIPO_MOVIMIENTO_INVENTARIO (tip_codigo, tip_nombre, tip_tipo_flujo) VALUES (?, ?, ?)');
  tiposMovimiento.forEach(t => stmtTipoMov.run(t));
  stmtTipoMov.finalize();

  res.json({ ok: true });
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

app.listen(PORT, () => {
  console.log(`Servidor backend escuchando en http://localhost:${PORT}`);
});