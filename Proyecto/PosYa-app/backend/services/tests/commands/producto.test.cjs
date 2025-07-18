const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const {
  CreateProductoCommand,
  DeleteProductoCommand,
  GetProductosCommand
} = require('../../../commands.cjs');

let db;

beforeEach((done) => {
  db = new sqlite3.Database(':memory:');
  const schemaPath = path.resolve(__dirname, '../../../base_de_datos.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schema, done);
});

afterEach(() => {
  db.close();
});

test('Debe crear un producto correctamente', async () => {
  const productoData = {
    codigo: 'P001',
    nombre: 'Producto 1',
    costoUnitario: 1000,
    precioUnitario: 1500,
    descripcion: 'Producto de prueba',
    exentoIVA: false,
    tipoIVA: '19'
  };

  const cmd = new CreateProductoCommand(db, productoData);
  const result = await cmd.execute();

  expect(result).toMatchObject({
    codigo: 'P001',
    nombre: 'Producto 1',
    costoUnitario: 1000,
    precioUnitario: 1500,
    estado: 'activo',
    tipoIVA: 19,
    exentoIVA: false
  });
});

test('Debe fallar si faltan campos obligatorios', async () => {
  const productoData = {
    codigo: 'P002',
    // nombre: 'Sin nombre',
    costoUnitario: 500,
    precioUnitario: 800
  };

  const cmd = new CreateProductoCommand(db, productoData);
  await expect(cmd.execute()).rejects.toThrow('Faltan campos obligatorios');
});

test('Debe eliminar un producto correctamente', async () => {
  const producto = {
    codigo: 'P004',
    nombre: 'Producto 4',
    costoUnitario: 1000,
    precioUnitario: 1200
  };

  await new CreateProductoCommand(db, producto).execute();

  const deleteCmd = new DeleteProductoCommand(db, 'P004');
  const result = await deleteCmd.execute();

  expect(result).toEqual({ ok: true });

  // Comprobar que ya no aparece en la lista
  const productos = await new GetProductosCommand(db).execute();
  const existe = productos.some(p => p.codigo === 'P004');
  expect(existe).toBe(false);
});

test('Debe fallar al eliminar producto inexistente', async () => {
  const deleteCmd = new DeleteProductoCommand(db, 'NO_EXISTE');
  await expect(deleteCmd.execute()).rejects.toThrow('Producto no encontrado');
});
