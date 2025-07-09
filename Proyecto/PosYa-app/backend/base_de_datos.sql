CREATE TABLE IF NOT EXISTS PRODUCTO (
  codigo TEXT PRIMARY KEY,
  nombre TEXT,
  costo_unitario REAL,
  precio REAL,
  descripcion TEXT,
  estado TEXT,
  tasa_IVA REAL
);

CREATE TABLE IF NOT EXISTS TIPO_MOVIMIENTO_INVENTARIO (
  codigo INTEGER PRIMARY KEY,
  nombre TEXT,
  tipo_flujo TEXT -- 'Entrada' o 'Salida'
);

-- Insertar tipos de movimiento por defecto
INSERT OR IGNORE INTO TIPO_MOVIMIENTO_INVENTARIO (codigo, nombre, tipo_flujo) VALUES
  (1, 'Entrada voluntaria de productos', 'Entrada'),
  (2, 'Salida voluntaria de productos', 'Salida'),
  (3, 'Deterioro de productos', 'Salida'),
  (4, 'Venta de productos', 'Salida');

CREATE TABLE IF NOT EXISTS MOVIMIENTO_INVENTARIO (
  id INTEGER PRIMARY KEY,
  fecha TEXT,
  cantidad INTEGER,
  codigo_tipo_movimiento INTEGER,
  codigo_producto TEXT
);

CREATE TABLE IF NOT EXISTS CLIENTE (
  identificacion TEXT PRIMARY KEY,
  direccion TEXT,
  correo_electronico TEXT,
  ciudad TEXT,
  numero_telefonico INTEGER
);

CREATE TABLE IF NOT EXISTS CLIENTE_NATURAL (
  identificacion TEXT PRIMARY KEY,
  tipo_de_documento TEXT,
  nombre TEXT,
  apellido TEXT
);

CREATE TABLE IF NOT EXISTS CLIENTE_JURIDICO (
  identificacion TEXT PRIMARY KEY,
  razon_social TEXT
);

CREATE TABLE IF NOT EXISTS VENDEDOR (
  NIT TEXT PRIMARY KEY,
  nombre_o_razon_social TEXT,
  direccion TEXT,
  numero_de_contacto TEXT,
  municipio TEXT,
  responsabilidad_fiscal TEXT
);

CREATE TABLE IF NOT EXISTS VENTA (
  codigo TEXT PRIMARY KEY,
  fecha TEXT,
  hora TEXT,
  subtotal REAL,
  total REAL,
  identificacion_cliente TEXT,
  tipo_identificacion_cliente TEXT,
  nombre_cliente TEXT,
  apellido_cliente TEXT,
  razon_social_cliente TEXT,
  direccion_cliente TEXT,
  numero_telefonico_cliente TEXT,
  ciudad_cliente TEXT,
  correo_electronico_cliente TEXT,
  nombre_o_razon_social_vendedor TEXT,
  NIT_vendedor TEXT,
  direccion_vendedor TEXT,
  numero_de_contacto_vendedor TEXT,
  municipio_vendedor TEXT,
  responsabilidad_fiscal_vendedor TEXT
);

CREATE TABLE IF NOT EXISTS DETALLE_PRODUCTO_VENDIDO (
  numero INTEGER PRIMARY KEY,
  nombre_producto TEXT,
  cantidad INTEGER,
  precio_unitario REAL,
  costo_unitario REAL,
  IVA_unitario REAL,
  submonto REAL,
  monto REAL,
  codigo_venta TEXT
);