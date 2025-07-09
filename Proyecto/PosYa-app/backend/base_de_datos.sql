CREATE TABLE IF NOT EXISTS PRODUCTO (
  pro_codigo TEXT PRIMARY KEY,
  pro_nombre TEXT,
  pro_costo_unitario REAL,
  pro_precio REAL,
  pro_descripcion TEXT,
  pro_estado TEXT,
  pro_tasa_IVA REAL
);

CREATE TABLE IF NOT EXISTS PRODUCTO_BIEN (
  pro_codigo TEXT PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS PRODUCTO_SERVICIO (
  pro_codigo TEXT PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS TIPO_MOVIMIENTO_INVENTARIO (
  tip_codigo INTEGER PRIMARY KEY,
  tip_nombre TEXT,
  tip_tipo_flujo TEXT -- 'Entrada' o 'Salida'
);

-- Insertar tipos de movimiento por defecto
INSERT OR IGNORE INTO TIPO_MOVIMIENTO_INVENTARIO (tip_codigo, tip_nombre, tip_tipo_flujo) VALUES
  (1, 'Entrada voluntaria de productos', 'Entrada'),
  (2, 'Salida voluntaria de productos', 'Salida'),
  (3, 'Deterioro de productos', 'Salida'),
  (4, 'Venta de productos', 'Salida');

CREATE TABLE IF NOT EXISTS MOVIMIENTO_INVENTARIO (
  mov_id INTEGER PRIMARY KEY,
  mov_fecha TEXT,
  mov_cantidad INTEGER,
  tip_codigo INTEGER,
  pro_codigo TEXT
);

CREATE TABLE IF NOT EXISTS CLIENTE (
  cli_identificacion TEXT PRIMARY KEY,
  cli_direccion TEXT,
  cli_correo_electronico TEXT,
  cli_ciudad TEXT,
  cli_numero_telefonico INTEGER
);

CREATE TABLE IF NOT EXISTS CLIENTE_NATURAL (
  cli_identificacion TEXT PRIMARY KEY,
  cli_tipo_de_documento TEXT,
  cli_nombre TEXT,
  cli_apellido TEXT
);

CREATE TABLE IF NOT EXISTS CLIENTE_JURIDICO (
  cli_identificacion TEXT PRIMARY KEY,
  cli_razon_social TEXT
);

CREATE TABLE IF NOT EXISTS VENDEDOR (
  ven_NIT TEXT PRIMARY KEY,
  ven_nombre_o_razon_social TEXT,
  ven_direccion TEXT,
  ven_numero_de_contacto TEXT,
  ven_municipio TEXT,
  ven_responsabilidad_fiscal TEXT
);

CREATE TABLE IF NOT EXISTS VENTA (
  ven_codigo TEXT PRIMARY KEY,
  ven_fecha TEXT,
  ven_hora TEXT,
  ven_subtotal REAL,
  ven_total REAL,
  ven_identificacion_cliente TEXT,
  ven_tipo_identificacion_cliente TEXT,
  ven_nombre_cliente TEXT,
  ven_apellido_cliente TEXT,
  ven_razon_social_cliente TEXT,
  ven_direccion_cliente TEXT,
  ven_numero_telefonico_cliente TEXT,
  ven_ciudad_cliente TEXT,
  ven_correo_electronico_cliente TEXT,
  ven_nombre_o_razon_social_vendedor TEXT,
  ven_NIT_vendedor TEXT,
  ven_direccion_vendedor TEXT,
  ven_numero_de_contacto_vendedor TEXT,
  ven_municipio_vendedor TEXT,
  ven_responsabilidad_fiscal_vendedor TEXT
);

CREATE TABLE IF NOT EXISTS DETALLE_PRODUCTO_VENDIDO (
  det_numero INTEGER PRIMARY KEY,
  det_nombre_producto TEXT,
  det_cantidad INTEGER,
  det_precio_unitario REAL,
  det_costo_unitario REAL,
  det_IVA_unitario REAL,
  det_submonto REAL,
  det_monto REAL,
  ven_codigo TEXT
);