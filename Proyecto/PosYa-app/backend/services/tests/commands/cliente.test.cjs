// cliente.test.cjs

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Accede a la clase desde "commands.cjs"
const {
  CreateClienteCommand
} = require('../../../commands.cjs');

let db;

// 1. Crear base de datos en memoria antes de cada test
beforeEach((done) => {
  // Crear la base de datos en memoria
  db = new sqlite3.Database(':memory:');

  // Cargar y ejecutar el esquema de base_de_datos.sql
  const schemaPath = path.resolve(__dirname, '../../../base_de_datos.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schema, done); // Jest espera que se llame a done() para continuar
});

// 2. Cerrar base de datos después de cada test
afterEach(() => {
  db.close();
});

test('Debe crear un cliente tipo natural correctamente', async () => {
  // 1. Crear cliente tipo natural
  const clienteData = {
    numeroDocumento: '123456789',
    direccion: 'Calle 1',
    correo_electronico: 'cliente@correo.com',
    ciudad: 'CiudadX',
    numero_telefonico: '1234567890',
    tipoCliente: 'natural',
    tipoDocumento: 'CC',
    primerNombre: 'Juan',
    segundoNombre: 'Carlos',
    primerApellido: 'Pérez',
    segundoApellido: 'López'
  };

  const cmd = new CreateClienteCommand(db, clienteData);
  const result = await cmd.execute();

  // 2. Verificar datos del cliente natural
  expect(result).toMatchObject({
    tipo: 'natural',
    id: '123456789',
    primerNombre: 'Juan',
    segundoNombre: 'Carlos',
    primerApellido: 'Pérez',
    segundoApellido: 'López',
    correo_electronico: 'cliente@correo.com'
  });
});

test('Debe crear un cliente tipo jurídica correctamente', async () => {
  // 1. Crear cliente tipo jurídica
  const clienteData = {
    numeroDocumento: '900999888',
    direccion: 'Carrera 10',
    correo_electronico: 'empresa@correo.com',
    ciudad: 'Medellín',
    numero_telefonico: '9876543210',
    tipoCliente: 'juridica',
    razonSocial: 'Empresa XYZ S.A.S.'
  };

  const cmd = new CreateClienteCommand(db, clienteData);
  const result = await cmd.execute();

  // 2. Verificar datos del cliente jurídica
  expect(result).toMatchObject({
    tipo: 'juridica',
    id: '900999888',
    razonSocial: 'Empresa XYZ S.A.S.',
    correo_electronico: 'empresa@correo.com'
  });
});

test('Debe fallar si tipoCliente es desconocido', async () => {
  // 1. Intentar crear cliente con tipo inválido
  const clienteData = {
    numeroDocumento: '888999000',
    direccion: 'Calle 8',
    correo_electronico: 'otro@correo.com',
    ciudad: 'Cali',
    numero_telefonico: '111222333',
    tipoCliente: 'otro'
  };

  const cmd = new CreateClienteCommand(db, clienteData);

  // 2. Verificar que lanza error por tipo de cliente desconocido
  await expect(cmd.execute()).rejects.toThrow('Tipo de cliente desconocido');
});