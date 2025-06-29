
export default function HomeMenu() {
    return (
        <div className="w-screen h-screen bg-[#002F6C] grid grid-cols-4 grid-rows-2 gap-4 p-4 text-black">

            {/* Columna 1: Logo + Botón Pagar */}
            <div className="row-span-2 flex flex-col justify-between bg-white rounded-2xl p-4">
                {/* Logo */}
                <div className="bg-white rounded-xl p-4 text-center shadow">
                    <h1 className="text-2xl font-mono font-bold text-[#1A1AFF]">POS<br />GENÉRICO</h1>
                    <p className="text-sm tracking-widest text-[#1A1AFF] mt-2">PUNTO DE VENTA</p>
                </div>

                {/* Botón Pagar */}
                <div className="flex flex-col items-center justify-between h-full mt-6">
                    <div className="relative">
                        <img
                            src="/icons/pagar.png"
                            alt="Pagar"
                            className="h-24 mx-auto"
                        />
                        <div className="absolute top-0 right-0 w-6 h-6 rounded-full bg-white border border-blue-500 flex items-center justify-center">+</div>
                    </div>
                    <p className="text-lg font-semibold mt-2">Pagar</p>
                    <button className="mt-4 w-10 h-10 rounded-full border-2 border-blue-900 text-blue-900 text-xl">→</button>
                </div>
            </div>

            {/* Otras 6 funcionalidades */}
            {[
                { label: 'Clientes', icon: '/icons/clientes.png' },
                { label: 'Inventario', icon: '/icons/inventario.png' },
                { label: 'Factura ordinaria', icon: '/icons/factura-ordinaria.png' },
                { label: 'Reportes', icon: '/icons/reportes.png' },
                { label: 'Personaliza', icon: '/icons/personaliza.png' },
                { label: 'Factura Electrónica', icon: '/icons/factura-electronica.png' },
            ].map((item, i) => (
                <div key={i} className="bg-white rounded-2xl flex flex-col items-center justify-between p-4 relative">
                    <img src={item.icon} alt={item.label} className="h-24" />
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white border border-blue-500 flex items-center justify-center">+</div>
                    <p className="mt-2 text-lg font-semibold text-center">{item.label}</p>
                </div>
            ))}

        </div>
    );
}
