import React, { useState, useEffect } from 'react';

// Modelo/Schema del tipo de movimiento
const tipoMovimientoSchema = {
  nombre: {
    label: 'Nombre',
    type: 'text',
    required: true,
    minLength: 3,
    maxLength: 50,
    errorMessage: 'El nombre debe tener entre 3 y 50 caracteres.'
  },
  tipo_flujo: {
    label: 'Tipo de flujo',
    type: 'select',
    required: true,
    options: ['Entrada', 'Salida'],
    errorMessage: 'Tipo de flujo inválido.'
  }
};

export default function CrearTipoMovimiento({ onClose, onSuccess }) {
  const initialFormState = Object.keys(tipoMovimientoSchema).reduce((acc, key) => {
    acc[key] = tipoMovimientoSchema[key].type === 'select' ? tipoMovimientoSchema[key].options[0] : '';
    return acc;
  }, {});

  const [form, setForm] = useState(initialFormState);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  // Reinicia el formulario cada vez que se muestre el modal
  useEffect(() => {
    setForm(initialFormState);
    setError(null);
    setSuccess(false);
    setLoading(false);
    setFieldErrors({});
  }, [onClose, initialFormState]);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));

    // Real-time validation
    const field = tipoMovimientoSchema[name];
    if (field) {
      let isValid = true;
      let errorMessage = null;

      if (field.required && (!value || String(value).trim() === '')) {
        isValid = false;
        errorMessage = 'Este campo es obligatorio';
      } else if (field.minLength && String(value).trim().length < field.minLength) {
        isValid = false;
        errorMessage = field.errorMessage;
      } else if (field.maxLength && String(value).trim().length > field.maxLength) {
        isValid = false;
        errorMessage = field.errorMessage;
      } else if (field.options && !field.options.includes(value)) {
        isValid = false;
        errorMessage = field.errorMessage;
      }

      setFieldErrors(prev => ({
        ...prev,
        [name]: isValid ? null : errorMessage
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    let isValid = true;

    Object.keys(tipoMovimientoSchema).forEach(key => {
      const field = tipoMovimientoSchema[key];
      const value = form[key];

      if (field.required && (!value || String(value).trim() === '')) {
        errors[key] = 'Este campo es obligatorio';
        isValid = false;
      } else if (field.minLength && String(value).trim().length < field.minLength) {
        errors[key] = field.errorMessage;
        isValid = false;
      } else if (field.maxLength && String(value).trim().length > field.maxLength) {
        errors[key] = field.errorMessage;
        isValid = false;
      } else if (field.options && !field.options.includes(value)) {
        errors[key] = field.errorMessage;
        isValid = false;
      }
    });

    setFieldErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setError("Por favor, corrija los errores en el formulario.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const resp = await fetch('http://localhost:3000/api/tipos-movimiento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: form.nombre.trim(),
          tipo_flujo: form.tipo_flujo
        })
      });

      if (resp.ok) {
        setSuccess(true);
        if (onSuccess) onSuccess();
        setTimeout(() => {
          setSuccess(false);
          if (onClose) onClose();
        }, 2000);
      } else {
        const data = await resp.json();
        throw new Error(data.error || 'Error desconocido al crear el tipo de movimiento');
      }
    } catch (err) {
      setError(err.message || 'Error de red al crear: ' + err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-auto">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Crear tipo de movimiento de inventario</h2>

        <fieldset className="p-4 bg-gray-50 rounded-lg border border-gray-200 mb-4">
          <legend className="text-lg font-semibold text-gray-800 px-2">Detalles del Tipo de Movimiento</legend>
          <div className="space-y-4 mt-4">
            {Object.entries(tipoMovimientoSchema).map(([key, field]) => (
              <div key={key} className="space-y-1">
                <label htmlFor={key} className="block text-sm font-medium text-gray-700">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>

                {field.type === 'select' ? (
                  <select
                    id={key}
                    name={key}
                    value={form[key] || ''}
                    onChange={handleChange}
                    className={`block w-full sm:text-sm border ${fieldErrors[key] ? 'border-red-500' : 'border-gray-300'} rounded-md py-2 px-3 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500`}
                    required={field.required}
                    disabled={loading}
                  >
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
                    className={`block w-full sm:text-sm border ${fieldErrors[key] ? 'border-red-500' : 'border-gray-300'} rounded-md py-2 px-3 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500`}
                    maxLength={field.maxLength}
                    required={field.required}
                    disabled={loading}
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
          <div className="mb-4 bg-green-50 border border-green-500 text-green-800 p-4 rounded-md" role="alert">
            <p>Tipo de movimiento creado correctamente</p>
          </div>
        )}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-500 text-red-700 p-4 rounded-md" role="alert">
            <p>{error}</p>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition shadow"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className={`px-4 py-2 text-white rounded-md transition shadow ${loading ? 'bg-green-400' : 'bg-green-600 hover:bg-green-700'}`}
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creando...
              </span>
            ) : 'Crear'}
          </button>
        </div>
      </form>
    </div>
  );
}