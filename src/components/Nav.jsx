export default function Nav({ go, showAdmin = true, backTo = null, isAdmin = false }) {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="navbar-left">
          {backTo && (
            <button className="nav-back" onClick={() => go(backTo)}>← Back</button>
          )}
          <button className="logo" onClick={() => go({ name: 'home' })}>
            <span>Kindred</span>
            {isAdmin && <span className="admin-badge">ADMIN</span>}
          </button>
        </div>
        {showAdmin && (
          <button className="btn btn-primary btn-sm" onClick={() => go({ name: 'admin-login' })}>
            Admin
          </button>
        )}
      </div>
    </nav>
  );
}