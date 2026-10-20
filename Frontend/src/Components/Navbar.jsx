import { NavLink } from "react-router-dom";

const links = [
  ["Home", "/"], ["Dashboard", "/dashboard"], ["Analysis", "/analysis"],
  ["Prediction", "/prediction"], ["Forecasting", "/forecasting"], ["Sustainability", "/sustainability"],
];

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
      <NavLink to="/" className="brand">CarbonSense</NavLink>
      <div className="nav-links">
        {links.map(([label, to]) => (
          <NavLink key={to} to={to} end={to === "/"} className={({ isActive }) => (isActive ? "active" : "")}>{label}</NavLink>
        ))}
      </div>
      </div>
    </nav>
  );
}