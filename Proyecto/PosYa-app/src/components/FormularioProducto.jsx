import { useState, useEffect } from 'react';
import { FiChevronLeft } from 'react-icons/fi';

const FormularioProducto = ({ productoEditado = null, onClose, onBack, onSave }) => {
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    tipoProducto: '',
    tipoIVA: '19',
    precioUnitario: '',
    costoUnitario: '',
    descripcion: '',
    exentoIVA: false
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (productoEditado) {
      setFormData({
        codigo: productoEditado.codigo || '',
        nombre: productoEditado.nombre || '',
        tipoProducto: productoEditado.tipoProducto || '',
        tipoIVA: productoEditado.tipoIVA || '19',
        precioUnitario: productoEditado.precioUnitario || '',
        costoUnitario: productoEditado.costoUnitario || '',
        descripcion: productoEditado.descripcion || '',
        exentoIVA: productoEditado.exentoIVA || false
      });
    }
  }, [productoEditado]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nombre.trim()) newErrors.nombre = 'Nombre es obligatorio';

    if (!formData.precioUnitario) {
      newErrors.precioUnitario = 'Precio unitario es obligatorio';
    } else if (isNaN(formData.precioUnitario)) {
      newErrors.precioUnitario = 'Debe ser un número válido';
    } else if (parseFloat(formData.precioUnitario) <= 0) {
      newErrors.precioUnitario = 'Debe ser mayor que cero';
    }

    if (!formData.costoUnitario) {
      newErrors.costoUnitario = 'Costo unitario es obligatorio';
    } else if (isNaN(formData.costoUnitario)) {
      newErrors.costoUnitario = 'Debe ser un número válido';
    } else if (parseFloat(formData.costoUnitario) <= 0) {
      newErrors.costoUnitario = 'Debe ser mayor que cero';
    }

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
        const productoData = {
            codigo: formData.codigo || `PROD-${Date.now()}`,
            nombre: formData.nombre,
            costoUnitario: parseFloat(formData.costoUnitario),
            precioUnitario: parseFloat(formData.precioUnitario),
            descripcion: formData.descripcion,
            exentoIVA: formData.exentoIVA,
            tipoIVA: formData.tipoIVA
        };

        // Verifica que todos los campos requeridos estén presentes
        if (!productoData.nombre || !productoData.costoUnitario || !productoData.precioUnitario) {
            throw new Error('Faltan campos obligatorios');
        }

        const response = await fetch(`/api/productos${productoEditado ? '/' + productoData.codigo : ''}`, {
            method: productoEditado ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(productoData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al guardar el producto');
        }

        const data = await response.json();
        setSubmitMessage({ type: 'success', text: productoEditado ? 'Producto actualizado exitosamente' : 'Producto creado exitosamente' });
        onSave(data);
    } catch (error) {
        console.error('Error:', error);
        setSubmitMessage({ type: 'error', text: error.message || 'Error desconocido al guardar el producto' });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">{productoEditado ? 'Editar Producto' : 'Nuevo Producto'}</h2>
        {onClose && (
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
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
        {/* Nombre del Producto e Impuestos en una sola fila */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">
              Nombre del Producto*
            </label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              className={`mt-1 block w-full border ${
                errors.nombre ? 'border-red-500' : 'border-gray-300'
              } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
            />
            {errors.nombre && (
              <p className="mt-1 text-sm text-red-600">{errors.nombre}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Impuestos
            </label>
            <div className="mt-1 space-y-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="exentoIVA"
                  name="exentoIVA"
                  checked={formData.exentoIVA}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="exentoIVA" className="ml-2 block text-sm text-gray-700">
                  Exento de IVA
                </label>
              </div>
              {!formData.exentoIVA && (
                <div className="flex items-center space-x-2">
                  <label htmlFor="tipoIVA" className="block text-sm text-gray-700">
                    Porcentaje de IVA:
                  </label>
                  <select
                    id="tipoIVA"
                    name="tipoIVA"
                    value={formData.tipoIVA}
                    onChange={handleChange}
                    className="block border border-gray-300 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="19">19% (General)</option>
                    <option value="5">5% (Reducido)</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="precioUnitario" className="block text-sm font-medium text-gray-700">
              Precio Unitario (COP)*
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="text"
                id="precioUnitario"
                name="precioUnitario"
                value={formData.precioUnitario}
                onChange={handleChange}
                className={`block w-full pl-7 pr-12 border ${
                  errors.precioUnitario ? 'border-red-500' : 'border-gray-300'
                } rounded-md py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                placeholder="0.00"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">COP</span>
              </div>
            </div>
            {errors.precioUnitario && (
              <p className="mt-1 text-sm text-red-600">{errors.precioUnitario}</p>
            )}
          </div>

          <div>
            <label htmlFor="costoUnitario" className="block text-sm font-medium text-gray-700">
              Costo Unitario (COP)*
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="text"
                id="costoUnitario"
                name="costoUnitario"
                value={formData.costoUnitario}
                onChange={handleChange}
                className={`block w-full pl-7 pr-12 border ${
                  errors.costoUnitario ? 'border-red-500' : 'border-gray-300'
                } rounded-md py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                placeholder="0.00"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">COP</span>
              </div>
            </div>
            {errors.costoUnitario && (
              <p className="mt-1 text-sm text-red-600">{errors.costoUnitario}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700">
            Descripción
          </label>
          <textarea
            id="descripcion"
            name="descripcion"
            rows={3}
            value={formData.descripcion}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <button 
            type="button"
            onClick={onBack}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition"
          >
            <FiChevronLeft className="inline mr-1" /> Volver
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
                Guardar Producto
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FormularioProducto;