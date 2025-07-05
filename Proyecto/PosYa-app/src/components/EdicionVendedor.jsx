import React, { useEffect, useState } from 'react';

const campos = [
  { id: 'ven_NIT', label: 'NIT', type: 'text' },
  { id: 'ven_nombre_o_razon_social', label: 'Nombre o Razón Social', type: 'text' },
  { id: 'ven_direccion', label: 'Dirección', type: 'text' },
  { id: 'ven_numero_de_contacto', label: 'Número de Contacto', type: 'tel', pattern: '(\\+57\\s?3[0-9]{2}\\s?[0-9]{3}\\s?[0-9]{4}|3[0-9]{2}\\s?[0-9]{3}\\s?[0-9]{4})', placeholder: '+57 3XX XXX XXXX o 3XX XXX XXXX', maxLength: 17 },
  { id: 'ven_municipio', label: 'Municipio', type: 'text' },
  { id: 'ven_responsabilidad_fiscal', label: 'Responsabilidad Fiscal', type: 'text' },
];

export default function EdicionVendedor({ onClose }) {
  const [form, setForm] = useState({
    ven_NIT: '',
    ven_nombre_o_razon_social: '',
    ven_direccion: '',
    ven_numero_de_contacto: '',
    ven_municipio: '',
    ven_responsabilidad_fiscal: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const resp = await fetch('http://localhost:3000/api/vendedor');
        if (resp.ok) {
          const vendedor = await resp.json();
          if (vendedor) {
            setForm(f => ({ ...f, ...vendedor }));
          }
        }
      } catch (e) {
        // No hay vendedor o error, no hacer nada
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
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
        setTimeout(() => setSuccess(false), 2000);
        if (onClose) onClose();
      } else {
        setError('Error al guardar los datos del vendedor.');
      }
    } catch (e) {
      setError('Error al guardar los datos del vendedor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay oscuro */}
      <div className="fixed inset-0 bg-black bg-opacity-40" onClick={onClose} />
      {/* Modal */}
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-xs w-full mx-auto relative z-10">
        {onClose && (
          <button onClick={onClose} className="absolute top-4 right-4 bg-gray-200 hover:bg-gray-300 rounded-full w-8 h-8 flex items-center justify-center text-xl font-bold">×</button>
        )}
        <h2 className="text-2xl font-bold mb-6 text-center">Editar Datos del Vendedor</h2>
        <form id="form-vendedor" onSubmit={handleSubmit} className="space-y-4">
          {campos.map(campo => (
            <div key={campo.id}>
              <label htmlFor={campo.id} className="block font-semibold mb-1">{campo.label}</label>
              <input
                type={campo.type}
                id={campo.id}
                name={campo.id}
                value={form[campo.id] || ''}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-400"
                {...(campo.pattern ? { pattern: campo.pattern } : {})}
                {...(campo.placeholder ? { placeholder: campo.placeholder } : {})}
                {...(campo.maxLength ? { maxLength: campo.maxLength } : {})}
                required
              />
            </div>
          ))}
          <div className="flex justify-end">
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-semibold" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
          {success && <div className="text-green-600 mt-2">Datos guardados correctamente.</div>}
          {error && <div className="text-red-600 mt-2">{error}</div>}
        </form>
      </div>
    </div>
  );
}
