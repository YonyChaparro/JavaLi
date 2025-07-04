import React from 'react';

const DetalleCliente = ({ cliente, onClose }) => {
  if (!cliente) return null;
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 min-w-[320px] max-w-[90vw]">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Detalle del Cliente</h2>
        <button onClick={onClose} className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300">Cerrar</button>
      </div>
      <div className="space-y-2">
        <div><b>Tipo:</b> {cliente.tipo === 'juridica' ? 'Persona Jurídica' : 'Persona Natural'}</div>
        {cliente.tipo === 'natural' ? (
          <>
            <div><b>Nombre:</b> {cliente.primerNombre} {cliente.segundoNombre}</div>
            <div><b>Apellido:</b> {cliente.primerApellido} {cliente.segundoApellido}</div>
            <div><b>Tipo de Documento:</b> {cliente.tipoDocumento}</div>
          </>
        ) : (
          <div><b>Razón Social:</b> {cliente.razonSocial}</div>
        )}
        <div><b>Número de Documento:</b> {cliente.numeroDocumento}</div>
        <div><b>Dirección:</b> {cliente.direccion}</div>
        <div><b>Ciudad:</b> {cliente.ciudad}</div>
        <div><b>Teléfono:</b> {cliente.telefono}</div>
        <div><b>Email:</b> {cliente.email}</div>
      </div>
    </div>
  );
};

export default DetalleCliente;
