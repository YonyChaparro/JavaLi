import { useState, useEffect } from 'react';
import { FiChevronLeft } from 'react-icons/fi';

const FormularioCliente = ({ onClose, onBack, onSave, cliente }) => {
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
      // Reset form if no client is provided (for new client creation)
      setTipoCliente('natural');
      setFormData({
        primerNombre: '', segundoNombre: '', primerApellido: '', segundoApellido: '',
        razonSocial: '', tipoDocumento: '', numeroDocumento: '', direccion: '',
        ciudad: '', telefono: '', email: ''
      });
    }
  }, [cliente]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for the field being changed
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleTipoClienteChange = (e) => {
    setTipoCliente(e.target.value);
    // Reset form data specific to client type when changing type
    if (e.target.value === 'natural') {
      setFormData(prev => ({ ...prev, razonSocial: '' }));
    } else {
      setFormData(prev => ({ ...prev, primerNombre: '', segundoNombre: '', primerApellido: '', segundoApellido: '' }));
    }
    setErrors({}); // Clear all errors when changing type, as validation rules might change
  };

  const validate = () => {
    let newErrors = {};
    const commonFields = ['tipoDocumento', 'numeroDocumento', 'direccion', 'ciudad', 'telefono', 'email'];

    if (tipoCliente === 'natural') {
      if (!formData.primerNombre.trim()) newErrors.primerNombre = 'El primer nombre es obligatorio.';
      if (!formData.primerApellido.trim()) newErrors.primerApellido = 'El primer apellido es obligatorio.';
    } else {
      if (!formData.razonSocial.trim()) newErrors.razonSocial = 'La razón social es obligatoria.';
    }

    commonFields.forEach(field => {
      if (!formData[field].trim()) newErrors[field] = 'Este campo es obligatorio.';
    });

    // Basic email validation
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El formato del email es inválido.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitMessage({ type: '', text: '' }); // Clear previous messages

    if (!validate()) {
      setSubmitMessage({ type: 'error', text: 'Por favor, corrija los errores en el formulario.' });
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepare data to send
      const dataToSend = {
        ...formData,
        tipo: tipoCliente,
        // Ensure only relevant fields are sent based on typeCliente
        ...(tipoCliente === 'natural' ? {} : { primerNombre: undefined, segundoNombre: undefined, primerApellido: undefined, segundoApellido: undefined }),
        ...(tipoCliente === 'juridica' ? {} : { razonSocial: undefined }),
      };

      await onSave(dataToSend);
      setSubmitMessage({ type: 'success', text: 'Cliente guardado exitosamente!' });
      setTimeout(() => {
        setSubmitMessage({ type: '', text: '' });
        onClose(); // Close the modal after successful save
      }, 2000);
    } catch (err) {
      setSubmitMessage({ type: 'error', text: `Error al guardar cliente: ${err.message}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">{cliente ? 'Editar Cliente' : 'Crear Nuevo Cliente'}</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-500"
          aria-label="Cerrar formulario"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {submitMessage.text && (
          <div className={`p-4 rounded-md mb-4 ${submitMessage.type === 'success' ? 'bg-green-50 border border-green-500 text-green-800' : 'bg-red-50 border border-red-500 text-red-700'}`}> {/* Updated styling */}
            {submitMessage.text}
          </div>
        )}

        <fieldset className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <legend className="text-lg font-semibold text-gray-700 mb-4 px-2">Tipo de Cliente</legend>
          <div className="flex space-x-4 mt-2"> {/* Added mt-2 for spacing after legend */}
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio h-4 w-4 text-blue-600 transition duration-150 ease-in-out"
                name="tipoCliente"
                value="natural"
                checked={tipoCliente === 'natural'}
                onChange={handleTipoClienteChange}
              />
              <span className="ml-2 text-gray-700">Persona Natural</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio h-4 w-4 text-blue-600 transition duration-150 ease-in-out"
                name="tipoCliente"
                value="juridica"
                checked={tipoCliente === 'juridica'}
                onChange={handleTipoClienteChange}
              />
              <span className="ml-2 text-gray-700">Persona Jurídica</span>
            </label>
          </div>
        </fieldset>

        <fieldset className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <legend className="text-lg font-semibold text-gray-700 mb-4 px-2">Datos Generales</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tipoCliente === 'natural' ? (
              <>
                <div>
                  <label htmlFor="primerNombre" className="block text-sm font-medium text-gray-700">Primer Nombre <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    id="primerNombre"
                    name="primerNombre"
                    value={formData.primerNombre}
                    onChange={handleChange}
                    className={`block w-full sm:text-sm border ${errors.primerNombre ? 'border-red-500' : 'border-gray-300'} rounded-md py-2 px-3 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500`} // Updated styling
                  />
                  {errors.primerNombre && <p className="mt-1 text-sm text-red-600">{errors.primerNombre}</p>}
                </div>
                <div>
                  <label htmlFor="segundoNombre" className="block text-sm font-medium text-gray-700">Segundo Nombre</label>
                  <input
                    type="text"
                    id="segundoNombre"
                    name="segundoNombre"
                    value={formData.segundoNombre}
                    onChange={handleChange}
                    className="block w-full sm:text-sm border border-gray-300 rounded-md py-2 px-3 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" // Updated styling
                  />
                </div>
                <div>
                  <label htmlFor="primerApellido" className="block text-sm font-medium text-gray-700">Primer Apellido <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    id="primerApellido"
                    name="primerApellido"
                    value={formData.primerApellido}
                    onChange={handleChange}
                    className={`block w-full sm:text-sm border ${errors.primerApellido ? 'border-red-500' : 'border-gray-300'} rounded-md py-2 px-3 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500`} // Updated styling
                  />
                  {errors.primerApellido && <p className="mt-1 text-sm text-red-600">{errors.primerApellido}</p>}
                </div>
                <div>
                  <label htmlFor="segundoApellido" className="block text-sm font-medium text-gray-700">Segundo Apellido</label>
                  <input
                    type="text"
                    id="segundoApellido"
                    name="segundoApellido"
                    value={formData.segundoApellido}
                    onChange={handleChange}
                    className="block w-full sm:text-sm border border-gray-300 rounded-md py-2 px-3 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" // Updated styling
                  />
                </div>
              </>
            ) : (
              <div>
                <label htmlFor="razonSocial" className="block text-sm font-medium text-gray-700">Razón Social <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  id="razonSocial"
                  name="razonSocial"
                  value={formData.razonSocial}
                  onChange={handleChange}
                  className={`block w-full sm:text-sm border ${errors.razonSocial ? 'border-red-500' : 'border-gray-300'} rounded-md py-2 px-3 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500`} // Updated styling
                />
                {errors.razonSocial && <p className="mt-1 text-sm text-red-600">{errors.razonSocial}</p>}
              </div>
            )}

            <div>
              <label htmlFor="tipoDocumento" className="block text-sm font-medium text-gray-700">Tipo de Documento <span className="text-red-500">*</span></label>
              <select
                id="tipoDocumento"
                name="tipoDocumento"
                value={formData.tipoDocumento}
                onChange={handleChange}
                className={`block w-full sm:text-sm border ${errors.tipoDocumento ? 'border-red-500' : 'border-gray-300'} rounded-md py-2 px-3 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500`} // Updated styling
              >
                <option value="">Seleccione...</option>
                <option value="CC">Cédula de Ciudadanía (CC)</option>
                <option value="NIT">NIT</option>
                <option value="CE">Cédula de Extranjería (CE)</option>
                <option value="Pasaporte">Pasaporte</option>
              </select>
              {errors.tipoDocumento && <p className="mt-1 text-sm text-red-600">{errors.tipoDocumento}</p>}
            </div>
            <div>
              <label htmlFor="numeroDocumento" className="block text-sm font-medium text-gray-700">Número de Documento <span className="text-red-500">*</span></label>
              <input
                type="text"
                id="numeroDocumento"
                name="numeroDocumento"
                value={formData.numeroDocumento}
                onChange={handleChange}
                className={`block w-full sm:text-sm border ${errors.numeroDocumento ? 'border-red-500' : 'border-gray-300'} rounded-md py-2 px-3 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500`} // Updated styling
              />
              {errors.numeroDocumento && <p className="mt-1 text-sm text-red-600">{errors.numeroDocumento}</p>}
            </div>
          </div>
        </fieldset>

        <fieldset className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <legend className="text-lg font-semibold text-gray-700 mb-4 px-2">Información de Contacto</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="direccion" className="block text-sm font-medium text-gray-700">Dirección <span className="text-red-500">*</span></label>
              <input
                type="text"
                id="direccion"
                name="direccion"
                value={formData.direccion}
                onChange={handleChange}
                className={`block w-full sm:text-sm border ${errors.direccion ? 'border-red-500' : 'border-gray-300'} rounded-md py-2 px-3 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500`} // Updated styling
              />
              {errors.direccion && <p className="mt-1 text-sm text-red-600">{errors.direccion}</p>}
            </div>
            <div>
              <label htmlFor="ciudad" className="block text-sm font-medium text-gray-700">Ciudad <span className="text-red-500">*</span></label>
              <input
                type="text"
                id="ciudad"
                name="ciudad"
                value={formData.ciudad}
                onChange={handleChange}
                className={`block w-full sm:text-sm border ${errors.ciudad ? 'border-red-500' : 'border-gray-300'} rounded-md py-2 px-3 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500`} // Updated styling
              />
              {errors.ciudad && <p className="mt-1 text-sm text-red-600">{errors.ciudad}</p>}
            </div>
            <div>
              <label htmlFor="telefono" className="block text-sm font-medium text-gray-700">Teléfono <span className="text-red-500">*</span></label>
              <input
                type="tel"
                id="telefono"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                className={`block w-full sm:text-sm border ${errors.telefono ? 'border-red-500' : 'border-gray-300'} rounded-md py-2 px-3 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500`} // Updated styling
              />
              {errors.telefono && <p className="mt-1 text-sm text-red-600">{errors.telefono}</p>}
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email <span className="text-red-500">*</span></label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`block w-full sm:text-sm border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-md py-2 px-3 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500`} // Updated styling
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>
          </div>
        </fieldset>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition shadow" // Updated to rounded-md and added shadow
            disabled={isSubmitting}
          >
            <FiChevronLeft className="inline mr-1" /> Volver
          </button>
          <button
            type="submit"
            className={`px-4 py-2 text-white rounded-md transition flex items-center shadow ${isSubmitting // Added shadow
              ? 'bg-blue-400 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700'
              }`}
            disabled={isSubmitting}
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
                  <path d="M7.707 10.293a1 1 0 010-1.414l3-3a1 1 0 011.414 0 1 1 0 010 1.414L9.414 9H16a1 1 0 110 2H9.414l2.707 2.707a1 1 0 01-1.414 1.414l-3-3z" />
                </svg>
                Guardar
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FormularioCliente;