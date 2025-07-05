import { useState, useEffect } from 'react';

const FormularioCliente = ({ onCancel, onSave, cliente }) => {
  const [tipoCliente, setTipoCliente] = useState('natural');
  const [formData, setFormData] = useState({
    primerNombre: '',
    segundoNombre: '',
    primerApellido: '',
    segundoApellido: '',
    razonSocial: '',
    tipoDocumento: '',
    numeroDocumento: '',
    direccion: '',
    ciudad: '',
    telefono: '',
    email: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState({ type: '', text: '' });

  // Sincronizar datos al abrir edición
  useEffect(() => {
    if (cliente) {
      setTipoCliente(cliente.tipo === 'juridica' ? 'juridica' : 'natural');
      setFormData({
        primerNombre: cliente.primerNombre || '',
        segundoNombre: cliente.segundoNombre || '',
        primerApellido: cliente.primerApellido || '',
        segundoApellido: cliente.segundoApellido || '',
        razonSocial: cliente.razonSocial || '',
        tipoDocumento: cliente.tipoDocumento || '',
        numeroDocumento: cliente.numeroDocumento || '',
        direccion: cliente.direccion || '',
        ciudad: cliente.ciudad || '',
        telefono: cliente.telefono || '',
        email: cliente.email || ''
      });
    } else {
      setTipoCliente('natural');
      setFormData({
        primerNombre: '',
        segundoNombre: '',
        primerApellido: '',
        segundoApellido: '',
        razonSocial: '',
        tipoDocumento: '',
        numeroDocumento: '',
        direccion: '',
        ciudad: '',
        telefono: '',
        email: ''
      });
    }
  }, [cliente]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleTipoClienteChange = (nuevoTipo) => {
    setTipoCliente(nuevoTipo);
    setFormData({
      primerNombre: '',
      segundoNombre: '',
      primerApellido: '',
      segundoApellido: '',
      razonSocial: '',
      tipoDocumento: '',
      numeroDocumento: '',
      direccion: '',
      ciudad: '',
      telefono: '',
      email: ''
    });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (tipoCliente === 'natural') {
      if (!formData.primerNombre.trim()) newErrors.primerNombre = 'Primer nombre es obligatorio';
      if (!formData.primerApellido.trim()) newErrors.primerApellido = 'Primer apellido es obligatorio';
      if (!formData.tipoDocumento) newErrors.tipoDocumento = 'Tipo de documento es obligatorio';
    } else {
      if (!formData.razonSocial.trim()) newErrors.razonSocial = 'Razón social es obligatoria';
    }
    
    if (!formData.numeroDocumento.trim()) newErrors.numeroDocumento = 'Número de documento es obligatorio';
    if (!formData.email.trim()) newErrors.email = 'Correo electrónico es obligatorio';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitMessage({ type: '', text: '' });

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const datosEnviar = {
        ...formData,
        tipoCliente: tipoCliente,
        tipoDocumento: tipoCliente === 'juridica' ? 'NIT' : formData.tipoDocumento
      };
      
      onSave(datosEnviar);
    } catch (error) {
      console.error('Error:', error);
      setSubmitMessage({ type: 'error', text: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">
          {cliente ? 'Actualizar Cliente' : 'Nuevo Cliente'}
        </h2>
        <button 
          onClick={onCancel}
          className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition"
        >
          ← Volver
        </button>
      </div>

      {submitMessage.text && (
        <div className={`mb-4 p-3 rounded ${
          submitMessage.type === 'success' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {submitMessage.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Toggle entre persona natural/jurídica */}
        <div className="flex items-center space-x-4 mb-4">
          <span className="text-gray-700">Tipo de cliente:</span>
          <div className="flex">
            <button
              type="button"
              onClick={() => handleTipoClienteChange('natural')}
              disabled={!!cliente}
              className={
                `px-4 py-2 rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500 ` +
                (tipoCliente === 'natural'
                  ? 'bg-blue-600 text-white'
                  : cliente
                    ? 'bg-gray-300 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-300 text-gray-800 hover:bg-gray-400')
              }
            >
              Persona Natural
            </button>
            <button
              type="button"
              onClick={() => handleTipoClienteChange('juridica')}
              disabled={!!cliente}
              className={
                `px-4 py-2 rounded-r focus:outline-none focus:ring-2 focus:ring-blue-500 ` +
                (tipoCliente === 'juridica'
                  ? 'bg-blue-600 text-white'
                  : cliente
                    ? 'bg-gray-300 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-300 text-gray-800 hover:bg-gray-400')
              }
            >
              Persona Jurídica
            </button>
          </div>
        </div>

        {/* Contenedor de campos del tipo de cliente */}
        <div>
          {/* Campos para persona natural */}
          {tipoCliente === 'natural' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="primerNombre" className="block text-sm font-medium text-gray-700">
                  Primer Nombre*
                </label>
                <input
                  type="text"
                  id="primerNombre"
                  name="primerNombre"
                  value={formData.primerNombre}
                  onChange={handleChange}
                  className={`mt-1 block w-full border ${
                    errors.primerNombre ? 'border-red-500' : 'border-gray-300'
                  } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                />
                {errors.primerNombre && (
                  <p className="mt-1 text-sm text-red-600">{errors.primerNombre}</p>
                )}
              </div>

              <div>
                <label htmlFor="segundoNombre" className="block text-sm font-medium text-gray-700">
                  Segundo Nombre
                </label>
                <input
                  type="text"
                  id="segundoNombre"
                  name="segundoNombre"
                  value={formData.segundoNombre}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="primerApellido" className="block text-sm font-medium text-gray-700">
                  Primer Apellido*
                </label>
                <input
                  type="text"
                  id="primerApellido"
                  name="primerApellido"
                  value={formData.primerApellido}
                  onChange={handleChange}
                  className={`mt-1 block w-full border ${
                    errors.primerApellido ? 'border-red-500' : 'border-gray-300'
                  } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                />
                {errors.primerApellido && (
                  <p className="mt-1 text-sm text-red-600">{errors.primerApellido}</p>
                )}
              </div>

              <div>
                <label htmlFor="segundoApellido" className="block text-sm font-medium text-gray-700">
                  Segundo Apellido
                </label>
                <input
                  type="text"
                  id="segundoApellido"
                  name="segundoApellido"
                  value={formData.segundoApellido}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="tipoDocumento" className="block text-sm font-medium text-gray-700">
                  Tipo de Documento*
                </label>
                <select
                  id="tipoDocumento"
                  name="tipoDocumento"
                  value={formData.tipoDocumento}
                  onChange={handleChange}
                  className={`mt-1 block w-full border ${
                    errors.tipoDocumento ? 'border-red-500' : 'border-gray-300'
                  } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                >
                  <option value="">Seleccione...</option>
                  <option value="CC">Cédula de Ciudadanía</option>
                  <option value="CE">Cédula de Extranjería</option>
                  <option value="TI">Tarjeta de Identidad</option>
                  <option value="NIT">NIT</option>
                  <option value="PAS">Pasaporte</option>
                </select>
                {errors.tipoDocumento && (
                  <p className="mt-1 text-sm text-red-600">{errors.tipoDocumento}</p>
                )}
              </div>

              <div>
                <label htmlFor="numeroDocumento" className="block text-sm font-medium text-gray-700">
                  Número de Documento*
                </label>
                <input
                  type="text"
                  id="numeroDocumento"
                  name="numeroDocumento"
                  value={formData.numeroDocumento}
                  onChange={handleChange}
                  className={`mt-1 block w-full border ${
                    errors.numeroDocumento ? 'border-red-500' : 'border-gray-300'
                  } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                />
                {errors.numeroDocumento && (
                  <p className="mt-1 text-sm text-red-600">{errors.numeroDocumento}</p>
                )}
              </div>
            </div>
          )}

          {/* Campos para persona jurídica */}
          {tipoCliente === 'juridica' && (
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label htmlFor="razonSocial" className="block text-sm font-medium text-gray-700">
                  Razón Social*
                </label>
                <input
                  type="text"
                  id="razonSocial"
                  name="razonSocial"
                  value={formData.razonSocial}
                  onChange={handleChange}
                  className={`mt-1 block w-full border ${
                    errors.razonSocial ? 'border-red-500' : 'border-gray-300'
                  } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                />
                {errors.razonSocial && (
                  <p className="mt-1 text-sm text-red-600">{errors.razonSocial}</p>
                )}
              </div>
              <div>
                <label htmlFor="numeroDocumento" className="block text-sm font-medium text-gray-700">
                  Número de Documento*
                </label>
                <input
                  type="text"
                  id="numeroDocumento"
                  name="numeroDocumento"
                  value={formData.numeroDocumento}
                  onChange={handleChange}
                  className={`mt-1 block w-full border ${
                    errors.numeroDocumento ? 'border-red-500' : 'border-gray-300'
                  } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                />
                {errors.numeroDocumento && (
                  <p className="mt-1 text-sm text-red-600">{errors.numeroDocumento}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Campos comunes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="direccion" className="block text-sm font-medium text-gray-700">
              Dirección
            </label>
            <input
              type="text"
              id="direccion"
              name="direccion"
              value={formData.direccion}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="ciudad" className="block text-sm font-medium text-gray-700">
              Ciudad
            </label>
            <input
              type="text"
              id="ciudad"
              name="ciudad"
              value={formData.ciudad}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="telefono" className="block text-sm font-medium text-gray-700">
              Teléfono
            </label>
            <input
              type="tel"
              id="telefono"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Correo Electrónico*
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`mt-1 block w-full border ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end gap-2 pt-4">
          <button 
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition"
          >
            ← Volver
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-4 py-2 text-white rounded transition flex items-center ${
              isSubmitting 
                ? 'bg-blue-400 cursor-not-allowed' 
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Guardando...
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                {cliente ? 'Actualizar Cliente' : 'Guardar Cliente'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FormularioCliente;