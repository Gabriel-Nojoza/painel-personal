import { Link } from "react-router-dom";
import "./../styles/layout.css";
import logo from "../assets/logo.png";

export default function Sidebar() {
  return (
    <div className="sidebar">
      <img
        className="logo-side"
        src={logo}
        alt="Logo"
      />

      <h2 className="sidebar-title">GNC-ACADEMY</h2>

      <ul className="sidebar-menu">
        <li><Link to="/">Dashboard</Link></li>
        <li><Link to="/alunos">Alunos</Link></li>
        <li><Link to="/exercicios">Exercícios</Link></li>
        <li><Link to="/treinos">Treinos</Link></li>
      </ul>
    </div>
  );
}
