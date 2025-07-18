// vendedor.test.cjs

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const {
  CreateVendedorCommand,
  GetVendedorCommand
} = require('../../../commands.cjs');

let db;

// Configuración de Jest para usar una base de datos SQLite en memoria
beforeEach((done) => {
  // Crear la base de datos en memoria
  db = new sqlite3.Database(':memory:');

  // Cargar y ejecutar el esquema de base_de_datos.sql
  const schemaPath = path.resolve(__dirname, '../../../base_de_datos.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schema, done); // Jest espera que se llame a done() para continuar
});

afterEach(() => {
  // Cerrar la base de datos al finalizar cada test
  db.close();
});

test('Debe crear un vendedor y devolverlo correctamente', async () => {
  const vendedorData = {
    NIT: '900123456-7',
    nombre_o_razon_social: 'Mi Empresa S.A.S.',
    direccion: 'Cra 45 #123',
    numero_de_contacto: '3216549870',
    municipio: 'Bogotá',
    responsabilidad_fiscal: 'Responsable de IVA'
  };

  // Ejecutar comando para insertar vendedor
  const createCmd = new CreateVendedorCommand(db, vendedorData);
  const result = await createCmd.execute();

  // Verificar que la inserción fue exitosa
  expect(result).toEqual({ ok: true });

  // Ejecutar comando para recuperar al vendedor
  const getCmd = new GetVendedorCommand(db);
  const vendedor = await getCmd.execute();

  // Verificar que los datos coinciden
  expect(vendedor).toMatchObject(vendedorData);
});

test('Debe fallar si se intenta crear el vendedor dos veces', async () => {
  const vendedorData = {
    NIT: '999999999-9',
    nombre_o_razon_social: 'Empresa Única',
    direccion: 'Carrera 99',
    numero_de_contacto: '4444444444',
    municipio: 'Medellín',
    responsabilidad_fiscal: 'IVA'
  };

  // Primer intento: debe funcionar
  const createCmd1 = new CreateVendedorCommand(db, vendedorData);
  await expect(createCmd1.execute()).resolves.toEqual({ ok: true });

  // Segundo intento: se sobreescribe, pero no debería fallar
  const createCmd2 = new CreateVendedorCommand(db, vendedorData);
  await expect(createCmd2.execute()).resolves.toEqual({ ok: true });

  // Confirmamos que solo hay un registro en la tabla
  const rowCount = await new Promise((resolve, reject) => {
    db.get('SELECT COUNT(*) as total FROM VENDEDOR', [], (err, row) => {
      if (err) reject(err);
      else resolve(row.total);
    });
  });

  expect(rowCount).toBe(1);
});
