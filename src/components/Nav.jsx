import { useNavigate } from 'react-router-dom';

export default function Nav({ backTo = null, isAdmin = false }) {
  const navigate = useNavigate();

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="navbar-left">
          {backTo && (
            <button className="nav-back" onClick={() => navigate(backTo)}>← Back</button>
          )}
          <button className="logo" onClick={() => navigate('/')}>
            <span>Kindred</span>
            {isAdmin && <span className="admin-badge">ADMIN</span>}
          </button>
        </div>
      </div>
    </nav>
  );
}