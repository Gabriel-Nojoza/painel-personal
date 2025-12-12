import { BrowserRouter, Routes, Route } from "react-router-dom";

import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";

import Dashboard from "./pages/Dashboard";
import Alunos from "./pages/Alunos";
import Exercicios from "./pages/Exercicios";
import Treinos from "./pages/Treinos";
import TreinoEditar from "./pages/TreinoEditar";

import "./styles/layout.css";

export default function App() {
  return (
    <BrowserRouter>
      <div className="layout">
        <Sidebar />

        <div className="content">
          <Navbar />

          <div className="page">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/alunos" element={<Alunos />} />
              <Route path="/exercicios" element={<Exercicios />} />
              <Route path="/treinos" element={<Treinos />} />
              <Route path="/treinos-editar/:id" element={<TreinoEditar />} />
            </Routes>
          </div>
        </div>
      </div>
    </BrowserRouter>
  );
}
