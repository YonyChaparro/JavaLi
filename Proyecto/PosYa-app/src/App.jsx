import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomeMenu from './pages/HomeMenu';
import CrearVentaPage from './pages/CrearVenta';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeMenu />} />
        <Route path="/crear-venta" element={<CrearVentaPage />} />
      </Routes>
    </BrowserRouter>
  );
}
