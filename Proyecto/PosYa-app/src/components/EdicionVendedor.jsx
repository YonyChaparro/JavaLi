import React, { useEffect, useState } from 'react';

// Modelo del vendedor
const vendedorSchema = {
  NIT: {
    label: 'NIT',
    type: 'text',
    required: true,
    validation: value => /^\d{9}-\d$/.test(value), // Formato NIT colombiano: 123456789-1
    errorMessage: 'Formato de NIT inválido (ej: 123456789-1)'
  },
  nombre_o_razon_social: {
    label: 'Nombre o Razón Social',
    type: 'text',
    required: true,
    maxLength: 100
  },
  direccion: {
    label: 'Dirección',
    type: 'text',
    required: true,
    maxLength: 150
  },
  numero_de_contacto: {
    label: 'Número de Contacto',
    type: 'tel',
    pattern: '(\\+57\\s?3[0-9]{2}\\s?[0-9]{3}\\s?[0-9]{4}|3[0-9]{2}\s?[0-9]{3}\s?[0-9]{4})',
    placeholder: '+57 3XX XXX XXXX o 3XX XXX XXXX',
    maxLength: 17,
    validation: value => /^(\+57\s?)?3[0-9]{2}\s?[0-9]{3}\s?[0-9]{4}$/.test(value)
  },
  municipio: {
    label: 'Municipio',
    type: 'text',
    required: true,
    maxLength: 50
  },
  responsabilidad_fiscal: {
    label: 'Responsabilidad Fiscal',
    type: 'text',
    required: true,
    options: ['Común', 'Gran contribuyente', 'Autorretenedor', 'Régimen simple']
  }
};

export default function EdicionVendedor({ onClose }) {
  const initialFormState = Object.keys(vendedorSchema).reduce((acc, key) => {
    acc[key] = '';
    return acc;
  }, {});

  const [form, setForm] = useState(initialFormState);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [noVendedor, setNoVendedor] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    const fetchVendedor = async () => {
      setLoading(true);
      try {
        const resp = await fetch('http://localhost:3000/api/vendedor');
        if (resp.ok) {
          const vendedor = await resp.json();
          if (vendedor && Object.keys(vendedor).length > 0) {
            setForm(vendedor);
            setNoVendedor(false);
          } else {
            setNoVendedor(true);
            setError(null);
          }
        } else {
          // Intenta leer el mensaje de error del backend
          let backendMsg = '';
          try {
            const data = await resp.json();
            backendMsg = data?.message?.toLowerCase?.() || '';
          } catch {}
          if (resp.status === 404 || backendMsg.includes('no existe') || backendMsg.includes('not found') || backendMsg.includes('no hay')) {
            setNoVendedor(true);
            setError(null);
          } else {
            setError('Error al cargar datos del vendedor.');
          }
        }
      } catch (e) {
        // Si el error es de tipo not found, también mostrar el mensaje amigable
        const msg = e?.message?.toLowerCase?.() || '';
        // Si el error es de tipo not found, o si el formulario está vacío (primera vez)
        const isFormEmpty = Object.values(initialFormState).every((v, i) => !form[Object.keys(initialFormState)[i]]);
        if (msg.includes('not found') || msg.includes('no existe') || msg.includes('no hay') || isFormEmpty) {
          setNoVendedor(true);
          setError(null);
        } else {
          console.error('Error al cargar datos del vendedor:', e);
          setError('Error al cargar datos del vendedor.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchVendedor();
  }, []);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));

    if (vendedorSchema[name]?.validation) {
      const isValid = vendedorSchema[name].validation(value);
      setFieldErrors(prev => ({
        ...prev,
        [name]: isValid ? null : vendedorSchema[name].errorMessage
      }));
    } else {
      setFieldErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const errors = {};
    let isValid = true;

    Object.keys(vendedorSchema).forEach(key => {
      const field = vendedorSchema[key];
      const value = form[key];

      if (field.required && (!value || value.trim() === '')) { 
        errors[key] = 'Este campo es obligatorio';
        isValid = false;
      } else if (field.validation && !field.validation(value)) {
        errors[key] = field.errorMessage;
        isValid = false;
      }
    });

    setFieldErrors(errors);
    return isValid;
  };

  const handleSubmit = async e => {
    e.preventDefault();

    if (!validateForm()) {
      setError('Por favor, corrija los errores en el formulario.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      let method;
      let url;
      if (form.ven_NIT) {
        method = 'PUT';
        url = `http://localhost:3000/api/vendedor/${form.ven_NIT}`;
      } else {
        method = 'POST';
        url = 'http://localhost:3000/api/vendedor';
      }

      const resp = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (resp.ok) {
        setSuccess(true);
        setNoVendedor(false); // Oculta el mensaje de noVendedor al guardar
        setTimeout(() => {
          setSuccess(false);
          if (onClose) onClose();
        }, 2000);
      } else {
        const errorData = await resp.json();
        throw new Error(errorData.message || `Error al ${method === 'PUT' ? 'actualizar' : 'guardar'} los datos del vendedor`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-xl p-6 w-full h-full relative">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Datos del Vendedor</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6"> 
        <fieldset className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <legend className="text-lg font-semibold text-gray-800 px-2">Información del Vendedor</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {Object.entries(vendedorSchema).map(([key, field]) => (
              <div key={key} className="space-y-1">
                <label htmlFor={key} className="block text-sm font-medium text-gray-700">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>

                {field.options ? (
                  <select
                    id={key}
                    name={key}
                    value={form[key] || ''}
                    onChange={handleChange}
                    className="block w-full sm:text-sm border border-gray-300 rounded-md py-2 px-3 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" // Improved styling
                    required={field.required}
                  >
                    <option value="">Seleccione...</option>
                    {field.options.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type}
                    id={key}
                    name={key}
                    value={form[key] || ''}
                    onChange={handleChange}
                    className={`block w-full sm:text-sm border ${fieldErrors[key] ? 'border-red-500' : 'border-gray-300'} rounded-md py-2 px-3 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500`} // Improved styling
                    placeholder={field.placeholder}
                    maxLength={field.maxLength}
                    required={field.required}
                  />
                )}

                {fieldErrors[key] && (
                  <p className="text-sm text-red-600 mt-1">{fieldErrors[key]}</p>
                )}
              </div>
            ))}
          </div>
        </fieldset>

        {success && (
          <div className="md:col-span-2 bg-green-50 border border-green-500 text-green-800 p-4 rounded-md" role="alert"> {/* Consistent styling */}
            <p>Datos guardados correctamente</p>
          </div>
        )}
        {noVendedor && !error && (
          <div className="md:col-span-2 bg-blue-50 border border-blue-400 text-blue-700 p-4 rounded-md text-center" role="status">
            <p>Aun no has registrado tus datos</p>
          </div>
        )}
        {error && (
          <div className="md:col-span-2 bg-red-50 border border-red-500 text-red-700 p-4 rounded-md" role="alert"> {/* Consistent styling */}
            <p>{error}</p>
          </div>
        )}

        <div className="md:col-span-2 flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition shadow" // Consistent styling
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className={`px-4 py-2 text-white rounded-md transition shadow ${loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}`} // Consistent styling
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Guardando...
              </span>
            ) : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
}