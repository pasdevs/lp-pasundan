import React from 'react';
import { BrowserRouter, Route, Routes, Navigate} from 'react-router-dom'
import Home from './pages/Home.jsx';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/lp-pasundan" exact element={<Home />} />
        <Route path="*" element={<Navigate replace to="/lp-pasundan" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

