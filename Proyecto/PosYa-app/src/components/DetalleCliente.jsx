import React from 'react';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';

const DetalleCliente = ({ cliente, onClose, onEdit, onDelete }) => {
  if (!cliente) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start">
            <h3 className="text-lg font-medium text-gray-900">Detalle del Cliente</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mt-4 space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500">Tipo</h4>
              <p className="mt-1 text-sm text-gray-900 capitalize">
                {cliente.tipo === 'juridica' ? 'Persona Jurídica' : 'Persona Natural'}
              </p>
            </div>

            {cliente.tipo === 'natural' ? (
              <>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Nombre Completo</h4>
                  <p className="mt-1 text-sm text-gray-900">
                    {`${cliente.primerNombre || ''} ${cliente.segundoNombre || ''} ${cliente.primerApellido || ''} ${cliente.segundoApellido || ''}`.trim()}
                  </p>
                </div>
              </>
            ) : (
              <div>
                <h4 className="text-sm font-medium text-gray-500">Razón Social</h4>
                <p className="mt-1 text-sm text-gray-900">{cliente.razonSocial}</p>
              </div>
            )}

            <div>
              <h4 className="text-sm font-medium text-gray-500">Documento</h4>
              <p className="mt-1 text-sm text-gray-900">
                {`${cliente.tipoDocumento || ''}: ${cliente.numeroDocumento || ''}`.trim()}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-500">Dirección</h4>
              <p className="mt-1 text-sm text-gray-900">{cliente.direccion || '-'}</p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-500">Ciudad</h4>
              <p className="mt-1 text-sm text-gray-900">{cliente.ciudad || '-'}</p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-500">Teléfono</h4>
              <p className="mt-1 text-sm text-gray-900">{cliente.numero_telefonico || '-'}</p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-500">Correo electronico</h4>
              <p className="mt-1 text-sm text-gray-900">{cliente.correo_electronico || '-'}</p>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                onEdit(cliente);
                onClose();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition flex items-center"
            >
              <FiEdit2 className="inline mr-2" />
              Editar
            </button>
            <button
              type="button"
              onClick={() => {
                onDelete(cliente);
                onClose();
              }}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition flex items-center"
            >
              <FiTrash2 className="inline mr-2" />
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetalleCliente;