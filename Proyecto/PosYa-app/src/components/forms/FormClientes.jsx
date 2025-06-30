// src/components/forms/FormClientes.jsx
export default function FormClientes() {
    return (
        <div>
            <h2 className="text-2xl font-bold mb-4">Formulario de Clientes</h2>
            <form className="space-y-4">
                <input type="text" placeholder="Nombre del cliente" className="w-full p-2 border rounded" />
                <input type="email" placeholder="Correo electrónico" className="w-full p-2 border rounded" />
                <input type="text" placeholder="Teléfono" className="w-full p-2 border rounded" />
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Guardar</button>
            </form>
        </div>
    );
}
