// cliente.test.cjs

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const {
  CreateClienteCommand
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

test('Debe crear un cliente tipo natural correctamente', async () => {
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

  expect(result).toMatchObject({
    tipo: 'juridica',
    id: '900999888',
    razonSocial: 'Empresa XYZ S.A.S.',
    correo_electronico: 'empresa@correo.com'
  });
});

test('Debe fallar si tipoCliente es desconocido', async () => {
  const clienteData = {
    numeroDocumento: '888999000',
    direccion: 'Calle 8',
    correo_electronico: 'otro@correo.com',
    ciudad: 'Cali',
    numero_telefonico: '111222333',
    tipoCliente: 'otro'
  };

  const cmd = new CreateClienteCommand(db, clienteData);
  await expect(cmd.execute()).rejects.toThrow('Tipo de cliente desconocido');
});
