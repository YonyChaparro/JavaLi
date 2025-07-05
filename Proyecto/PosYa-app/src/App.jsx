import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomeMenu from './pages/HomeMenu';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeMenu />} />
      </Routes>
    </BrowserRouter>
  );
}
