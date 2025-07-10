import React, { useEffect, useState } from 'react';

// Modelo/Schema del vendedor
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
    pattern: '(\\+57\\s?3[0-9]{2}\\s?[0-9]{3}\\s?[0-9]{4}|3[0-9]{2}\\s?[0-9]{3}\\s?[0-9]{4})',
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
  // Inicializar el estado con las claves del schema
  const initialFormState = Object.keys(vendedorSchema).reduce((acc, key) => {
    acc[key] = '';
    return acc;
  }, {});

  const [form, setForm] = useState(initialFormState);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    const fetchVendedor = async () => {
      setLoading(true);
      try {
        const resp = await fetch('http://localhost:3000/api/vendedor');
        if (resp.ok) {
          const vendedor = await resp.json();
          if (vendedor) {
            setForm(vendedor);
          }
        }
      } catch (e) {
        console.error("Error al cargar datos del vendedor:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchVendedor();
  }, []);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    
    // Validación en tiempo real
    if (vendedorSchema[name]?.validation) {
      const isValid = vendedorSchema[name].validation(value);
      setFieldErrors(prev => ({
        ...prev,
        [name]: isValid ? null : vendedorSchema[name].errorMessage
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    let isValid = true;

    Object.keys(vendedorSchema).forEach(key => {
      const field = vendedorSchema[key];
      const value = form[key];
      
      if (field.required && !value.trim()) {
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
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const resp = await fetch('http://localhost:3000/api/vendedor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (resp.ok) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          if (onClose) onClose();
        }, 2000);
      } else {
        const errorData = await resp.json();
        throw new Error(errorData.message || 'Error al guardar los datos del vendedor');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          aria-label="Cerrar"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Datos del Vendedor</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
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
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className={`w-full border ${fieldErrors[key] ? 'border-red-500' : 'border-gray-300'} rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder={field.placeholder}
                  maxLength={field.maxLength}
                  required={field.required}
                />
              )}
              
              {fieldErrors[key] && (
                <p className="text-sm text-red-600">{fieldErrors[key]}</p>
              )}
            </div>
          ))}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`px-4 py-2 text-white rounded-md transition ${loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}`}
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

          {success && (
            <div className="p-3 bg-green-100 text-green-800 rounded-md text-center">
              Datos guardados correctamente
            </div>
          )}
          {error && (
            <div className="p-3 bg-red-100 text-red-800 rounded-md text-center">
              {error}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}