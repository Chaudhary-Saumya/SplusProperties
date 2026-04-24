import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ChevronDown, Menu, X } from 'lucide-react';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsOpen(false);
  };

  const toggleDropdown = (name) => {
    setActiveDropdown(activeDropdown === name ? null : name);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Nunito+Sans:wght@400;600;700&display=swap');

        .navbar-root {
          position: sticky;
          top: 0;
          z-index: 50;
          background: #ffffff;
          border-bottom: 2px solid #1a2340;
          font-family: 'Nunito Sans', sans-serif;
        }

        .navbar-inner {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 80px;
        }

        /* ── Logo ── */
        .logo {
          font-family: 'Playfair Display', serif;
          font-size: 26px;
          font-weight: 700;
          color: #1a2340;
          text-decoration: none;
          letter-spacing: 0.5px;
          white-space: nowrap;
        }
        .logo span {
          color: #c9a84c;
        }

        /* ── Desktop nav ── */
        .nav-desktop {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        /* plain nav link */
        .nav-link {
          font-size: 15px;
          font-weight: 700;
          color: #1a2340;
          text-decoration: none;
          padding: 10px 16px;
          border-radius: 8px;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          transition: background 0.15s, color 0.15s;
          white-space: nowrap;
        }
        .nav-link:hover {
          background: #f0f4ff;
          color: #c9a84c;
        }

        /* dropdown trigger */
        .nav-dropdown {
          position: relative;
        }
        .nav-dropdown-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 15px;
          font-weight: 700;
          color: #1a2340;
          background: none;
          border: none;
          cursor: pointer;
          padding: 10px 16px;
          border-radius: 8px;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          transition: background 0.15s, color 0.15s;
          white-space: nowrap;
        }
        .nav-dropdown-btn:hover,
        .nav-dropdown-btn.active {
          background: #f0f4ff;
          color: #c9a84c;
        }
        .chevron {
          transition: transform 0.2s;
        }
        .chevron.open {
          transform: rotate(180deg);
        }
        .dropdown-menu {
          position: absolute;
          top: calc(100% + 1px);
          left: 0;
          background: #fff;
          border: 1px solid #e2e8f0;
          border-top: 3px solid #c9a84c;
          border-radius: 8px;
          min-width: 180px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.1);
          padding: 6px 0;
          z-index: 100;
        }
        .dropdown-item {
          display: block;
          padding: 10px 18px;
          font-size: 13px;
          font-weight: 600;
          color: #1a2340;
          text-decoration: none;
          transition: background 0.12s;
        }
        .dropdown-item:hover {
          background: #f8f5ee;
          color: #c9a84c;
        }

        /* divider */
        .nav-divider {
          width: 1px;
          height: 24px;
          background: #d1d5db;
          margin: 0 6px;
        }

        /* auth buttons */
        .btn-login {
          font-size: 14px;
          font-weight: 700;
          color: #1a2340;
          text-decoration: none;
          padding: 8px 16px;
          border-radius: 6px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          transition: background 0.15s;
        }
        .btn-login:hover { background: #f0f4ff; }

        .btn-signup {
          font-size: 13px;
          font-weight: 700;
          color: #fff;
          background: #1a2340;
          text-decoration: none;
          padding: 9px 20px;
          border-radius: 6px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          transition: background 0.15s;
          border: 2px solid #1a2340;
        }
        .btn-signup:hover { background: #c9a84c; border-color: #c9a84c; }

        .btn-dashboard {
          font-size: 13px;
          font-weight: 700;
          color: #1a2340;
          text-decoration: none;
          padding: 9px 18px;
          border-radius: 6px;
          border: 2px solid #1a2340;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          transition: all 0.15s;
        }
        .btn-dashboard:hover { background: #1a2340; color: #fff; }

        .btn-logout {
          font-size: 13px;
          font-weight: 700;
          color: #fff;
          background: #c9a84c;
          border: 2px solid #c9a84c;
          padding: 9px 18px;
          border-radius: 6px;
          cursor: pointer;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          transition: all 0.15s;
        }
        .btn-logout:hover { background: #b8933a; border-color: #b8933a; }

        /* ── Mobile ── */
        .hamburger {
          display: none;
          background: none;
          border: none;
          cursor: pointer;
          color: #1a2340;
          padding: 4px;
        }

        @media (max-width: 900px) {
          .nav-desktop { display: none; }
          .hamburger { display: flex; }
        }

        /* mobile menu */
        .mobile-menu {
          display: none;
          background: #fff;
          border-top: 2px solid #1a2340;
          padding: 12px 24px 20px;
        }
        .mobile-menu.open { display: block; }

        .mob-link {
          display: block;
          padding: 12px 8px;
          font-size: 15px;
          font-weight: 700;
          color: #1a2340;
          text-decoration: none;
          border-bottom: 1px solid #f1f5f9;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .mob-link:hover { color: #c9a84c; }

        .mob-section-label {
          font-size: 11px;
          font-weight: 700;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 1px;
          padding: 16px 8px 4px;
        }

        .mob-sub-link {
          display: block;
          padding: 10px 16px;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          text-decoration: none;
          border-bottom: 1px solid #f8fafc;
        }
        .mob-sub-link:hover { color: #c9a84c; background: #fdf8ef; }

        .mob-auth {
          display: flex;
          gap: 12px;
          margin-top: 16px;
        }
        .mob-btn-login {
          flex: 1;
          text-align: center;
          padding: 12px;
          font-size: 14px;
          font-weight: 700;
          color: #1a2340;
          border: 2px solid #1a2340;
          border-radius: 8px;
          text-decoration: none;
          text-transform: uppercase;
        }
        .mob-btn-signup {
          flex: 1;
          text-align: center;
          padding: 12px;
          font-size: 14px;
          font-weight: 700;
          color: #fff;
          background: #1a2340;
          border: 2px solid #1a2340;
          border-radius: 8px;
          text-decoration: none;
          text-transform: uppercase;
        }
        .mob-btn-logout {
          width: 100%;
          margin-top: 12px;
          padding: 12px;
          font-size: 14px;
          font-weight: 700;
          color: #fff;
          background: #c9a84c;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          text-transform: uppercase;
        }
      `}</style>

      <nav className="navbar-root">
        <div className="navbar-inner">
          {/* Logo */}
          <Link to="/" className="logo" onClick={() => setIsOpen(false)}>
            Splus<span>Propertys</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="nav-desktop">
            <Link to="/" className="nav-link">Home</Link>

            {/* Search / Buy dropdown */}
            <div className="nav-dropdown" onMouseLeave={() => setActiveDropdown(null)}>
              <button
                className={`nav-dropdown-btn ${activeDropdown === 'search' ? 'active' : ''}`}
                onMouseEnter={() => setActiveDropdown('search')}
              >
                Properties <ChevronDown size={14} className={`chevron ${activeDropdown === 'search' ? 'open' : ''}`} />
              </button>
              {activeDropdown === 'search' && (
                <div className="dropdown-menu">
                  <Link to="/search" className="dropdown-item" onClick={() => setActiveDropdown(null)}>All Properties</Link>
                  <Link to="/brokers" className="dropdown-item" onClick={() => setActiveDropdown(null)}>Contact Brokers</Link>
                  <Link to="/search?type=buy" className="dropdown-item" onClick={() => setActiveDropdown(null)}>Buy</Link>
                  {isAuthenticated ? (
                    <Link to="/create-listing" className="dropdown-item" onClick={() => setActiveDropdown(null)}>Sell</Link>
                  ) : (
                    <Link to="/login" className="dropdown-item" onClick={() => setActiveDropdown(null)}>Sell</Link>
                  )}
                </div>
              )}
            </div>

            {/* Tools dropdown */}
            <div className="nav-dropdown" onMouseLeave={() => setActiveDropdown(null)}>
              <button
                className={`nav-dropdown-btn ${activeDropdown === 'tools' ? 'active' : ''}`}
                onMouseEnter={() => setActiveDropdown('tools')}
              >
                Tools <ChevronDown size={14} className={`chevron ${activeDropdown === 'tools' ? 'open' : ''}`} />
              </button>
              {activeDropdown === 'tools' && (
                <div className="dropdown-menu">
                  <Link to="/area-converter" className="dropdown-item" onClick={() => setActiveDropdown(null)}>Area Converter</Link>
                  <Link to="/boundary-map" className="dropdown-item" onClick={() => setActiveDropdown(null)}>Boundary Map</Link>
                </div>
              )}
            </div>

            {isAuthenticated && (
              <>
                <Link to="/favorites" className="nav-link">My Favourites</Link>
                <Link to="/my-visits" className="nav-link">Site Visits</Link>

                {/* Dashboard dropdown
                <div className="nav-dropdown" onMouseLeave={() => setActiveDropdown(null)}>
                  <button
                    className={`nav-dropdown-btn ${activeDropdown === 'dashboard' ? 'active' : ''}`}
                    onMouseEnter={() => setActiveDropdown('dashboard')}
                  >
                    Dashboard <ChevronDown size={14} className={`chevron ${activeDropdown === 'dashboard' ? 'open' : ''}`} />
                  </button>
                  {activeDropdown === 'dashboard' && (
                    <div className="dropdown-menu">
                      <Link to="/dashboard?tab=overview" className="dropdown-item" onClick={() => setActiveDropdown(null)}>Overview</Link>
                      <Link to="/dashboard?tab=listings" className="dropdown-item" onClick={() => setActiveDropdown(null)}>My Listings</Link>
                      <Link to="/dashboard?tab=transactions" className="dropdown-item" onClick={() => setActiveDropdown(null)}>Token History</Link>
                      {(user?.role === 'Seller' || user?.role === 'Broker') && (
                        <Link to="/dashboard?tab=payouts" className="dropdown-item" onClick={() => setActiveDropdown(null)}>Payout Accounts</Link>
                      )}
                    </div>
                  )}
                </div> */}
              </>
            )}

            <div className="nav-divider" />

            {isAuthenticated ? (
              <>
                <Link
                  to={user?.role === 'Admin' ? '/admin' : '/dashboard'}
                  className="btn-dashboard"
                >
                  Dashboard
                </Link>
                <button onClick={handleLogout} className="btn-logout">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-login">Login</Link>
                <Link to="/register" className="btn-signup">Sign Up</Link>
              </>
            )}
          </div>

          {/* Hamburger */}
          <button className="hamburger" onClick={() => setIsOpen(!isOpen)} aria-label="Toggle menu">
            {isOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>

        {/* Mobile Menu */}
        <div className={`mobile-menu ${isOpen ? 'open' : ''}`}>
          <Link to="/" className="mob-link" onClick={() => setIsOpen(false)}>Home</Link>

          <div className="mob-section-label">Properties</div>
          <Link to="/search" className="mob-sub-link" onClick={() => setIsOpen(false)}>All Properties</Link>
          <Link to="/brokers" className="mob-sub-link" onClick={() => setIsOpen(false)}>Contact Brokers</Link>
          <Link to="/search?type=buy" className="mob-sub-link" onClick={() => setIsOpen(false)}>Buy</Link>
          {isAuthenticated ? (
            <Link to="/create-listing" className="mob-sub-link" onClick={() => setIsOpen(false)}>Sell</Link>
          ) : (
            <Link to="/login" className="mob-sub-link" onClick={() => setIsOpen(false)}>Sell</Link>
          )}

          <div className="mob-section-label">Tools</div>
          <Link to="/area-converter" className="mob-sub-link" onClick={() => setIsOpen(false)}>Area Converter</Link>
          <Link to="/boundary-map" className="mob-sub-link" onClick={() => setIsOpen(false)}>Boundary Map</Link>

          {isAuthenticated && (
            <>
              <Link to="/favorites" className="mob-link" onClick={() => setIsOpen(false)}>My Favourites</Link>
              <Link to="/my-visits" className="mob-link" onClick={() => setIsOpen(false)}>Site Visits</Link>

              <div className="mob-section-label">Dashboard</div>
              <Link to="/dashboard?tab=overview" className="mob-sub-link" onClick={() => setIsOpen(false)}>Overview</Link>
              <Link to="/dashboard?tab=listings" className="mob-sub-link" onClick={() => setIsOpen(false)}>My Listings</Link>
              <Link to="/dashboard?tab=transactions" className="mob-sub-link" onClick={() => setIsOpen(false)}>Token History</Link>
              {(user?.role === 'Seller' || user?.role === 'Broker') && (
                <Link to="/dashboard?tab=payouts" className="mob-sub-link" onClick={() => setIsOpen(false)}>Payout Accounts</Link>
              )}
            </>
          )}

          {isAuthenticated ? (
            <>
              <Link
                to={user?.role === 'Admin' ? '/admin' : '/dashboard'}
                className="mob-link"
                onClick={() => setIsOpen(false)}
              >
                Dashboard
              </Link>
              <button onClick={handleLogout} className="mob-btn-logout">Logout</button>
            </>
          ) : (
            <div className="mob-auth">
              <Link to="/login" className="mob-btn-login" onClick={() => setIsOpen(false)}>Login</Link>
              <Link to="/register" className="mob-btn-signup" onClick={() => setIsOpen(false)}>Sign Up</Link>
            </div>
          )}
        </div>
      </nav>
    </>
  );
};

export default Navbar;