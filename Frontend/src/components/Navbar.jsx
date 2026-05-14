import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ChevronDown, Menu, X, Home } from 'lucide-react';

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

  // eslint-disable-next-line no-unused-vars
  const toggleDropdown = (name) => {
    setActiveDropdown(activeDropdown === name ? null : name);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&family=Great+Vibes&family=Nunito+Sans:wght@400;600;700;800&display=swap');

        .navbar-root {
          position: sticky; top: 0; z-index: 50;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(26, 35, 64, 0.1);
          font-family: 'Nunito Sans', sans-serif;
          transition: all 0.3s ease;
        }
        .navbar-inner {
          max-width: 1400px; margin: 0 auto;
          padding: 0 24px;
          display: flex; align-items: center; justify-content: space-between;
          height: 80px;
        }

        /* Logo */
        .logo { display: flex; flex-direction: column; align-items: center; text-decoration: none; line-height: 1; padding: 4px 0; transition: transform 0.2s; }
        .logo:hover { transform: scale(1.03); }
        .logo-main { display: flex; align-items: center; justify-content: center; }
        .logo-svg { height: 78px; width: auto; }
        .logo-text-svg { font-family: 'Nunito Sans', sans-serif; font-weight: 800; text-transform: uppercase; }

        /* Desktop nav */
        .nav-desktop { display: flex; align-items: center; gap: 4px; }
        .nav-link { font-size: 15px; font-weight: 700; color: #1a2340; text-decoration: none; padding: 10px 16px; border-radius: 8px; letter-spacing: 0.5px; text-transform: uppercase; transition: background 0.15s, color 0.15s; white-space: nowrap; }
        .nav-link:hover { background: #f0f4ff; color: #c9a84c; }
        .nav-dropdown { position: relative; }
        .nav-dropdown-btn { display: flex; align-items: center; gap: 4px; font-size: 15px; font-weight: 700; color: #1a2340; background: none; border: none; cursor: pointer; padding: 10px 16px; border-radius: 8px; letter-spacing: 0.5px; text-transform: uppercase; transition: background 0.15s, color 0.15s; white-space: nowrap; }
        .nav-dropdown-btn:hover, .nav-dropdown-btn.active { background: #f0f4ff; color: #c9a84c; }
        .chevron { transition: transform 0.2s; }
        .chevron.open { transform: rotate(180deg); }
        .dropdown-menu { position: absolute; top: calc(100% + 1px); left: 0; background: #fff; border: 1px solid #e2e8f0; border-top: 3px solid #c9a84c; border-radius: 8px; min-width: 180px; box-shadow: 0 8px 24px rgba(0,0,0,0.1); padding: 6px 0; z-index: 100; }
        .dropdown-item { display: block; padding: 10px 18px; font-size: 13px; font-weight: 600; color: #1a2340; text-decoration: none; transition: background 0.12s; }
        .dropdown-item:hover { background: #f8f5ee; color: #c9a84c; }
        .nav-divider { width: 1px; height: 24px; background: #d1d5db; margin: 0 6px; }
        .btn-login { font-size: 14px; font-weight: 700; color: #1a2340; text-decoration: none; padding: 8px 16px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.5px; transition: background 0.15s; }
        .btn-login:hover { background: #f0f4ff; }
        .btn-signup { font-size: 13px; font-weight: 700; color: #fff; background: #1a2340; text-decoration: none; padding: 9px 20px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.5px; transition: background 0.15s; border: 2px solid #1a2340; }
        .btn-signup:hover { background: #c9a84c; border-color: #c9a84c; }
        .btn-dashboard { font-size: 13px; font-weight: 700; color: #1a2340; text-decoration: none; padding: 9px 18px; border-radius: 6px; border: 2px solid #1a2340; text-transform: uppercase; letter-spacing: 0.5px; transition: all 0.15s; }
        .btn-dashboard:hover { background: #1a2340; color: #fff; }
        .btn-logout { font-size: 13px; font-weight: 700; color: #fff; background: #c9a84c; border: 2px solid #c9a84c; padding: 9px 18px; border-radius: 6px; cursor: pointer; text-transform: uppercase; letter-spacing: 0.5px; transition: all 0.15s; }
        .btn-logout:hover { background: #b8933a; border-color: #b8933a; }

        /* User Menu Styles */
        .user-dropdown-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 14px;
          border-radius: 12px;
          background: #f8f9ff;
          border: 1px solid rgba(201, 168, 76, 0.2);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .user-dropdown-btn:hover {
          background: #f0f4ff;
          border-color: #c9a84c;
          box-shadow: 0 4px 12px rgba(26, 35, 64, 0.08);
        }
        .user-name {
          font-size: 16px;
          font-weight: 800;
          color: #c19b33ff;
          max-width: 120px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          text-transform: capitalize;
        }
        .dropdown-menu.user-menu {
          right: 0;
          left: auto;
          min-width: 200px;
          padding: 8px;
        }
        .user-menu-header {
          padding: 10px 14px;
          border-bottom: 1px solid #f0f4ff;
          margin-bottom: 6px;
        }
        .user-menu-role {
          font-size: 10px;
          font-weight: 800;
          color: #c9a84c;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .logout-item {
          color: #dc2626 !important;
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          text-align: left;
          background: none;
          border: none;
          cursor: pointer;
        }
        .logout-item:hover {
          background: #fff1f1 !important;
          color: #b91c1c !important;
        }

        /* Mobile toggle */
        .hamburger { display: none; background: none; border: none; cursor: pointer; color: #1a2340; padding: 4px; }
        @media (max-width: 900px) { .nav-desktop { display: none; } .hamburger { display: flex; } }
        .mobile-actions { display: none; align-items: center; gap: 16px; }
        @media (max-width: 900px) { .mobile-actions { display: flex; } }
        .mob-quick-link { color: #1a2340; display: flex; align-items: center; justify-content: center; transition: color 0.2s; }
        .mob-quick-link:hover { color: #c9a84c; }

        /* ── Mobile Menu ── */
        .mobile-menu { display: none; background: #fff; border-top: 2px solid #1a2340; }
        .mobile-menu.open { display: block; }

        /* Section category label */
        .mob-category {
          font-size: 9px;
          font-weight: 800;
          color: #c9a84c;
          text-transform: uppercase;
          letter-spacing: 2px;
          padding: 10px 18px 3px;
          background: #f8f5ee;
          border-top: 1px solid #e2d9c5;
          display: block;
        }

        /* Every single menu item — identical style */
        .mob-item {
          display: flex;
          align-items: center;
          padding: 11px 18px;
          font-size: 12px;
          font-weight: 700;
          color: #1a2340;
          text-decoration: none;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          border-bottom: 1px solid #f0ebe0;
          background: #fff;
          transition: color 0.15s, background 0.15s;
          gap: 8px;
        }
        .mob-item:hover { color: #c9a84c; background: #fdfaf5; }

        /* Sub-items — same size, just indented with a left accent */
        .mob-sub-item {
          display: flex;
          align-items: center;
          padding: 11px 18px 11px 28px;
          font-size: 12px;
          font-weight: 700;
          color: #1a2340;
          text-decoration: none;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          border-bottom: 1px solid #f0ebe0;
          background: #fff;
          transition: color 0.15s, background 0.15s;
          gap: 8px;
          border-left: 3px solid transparent;
        }
        .mob-sub-item:hover { color: #c9a84c; background: #fdfaf5; border-left-color: #c9a84c; }

        /* Auth bottom strip */
        .mob-auth-strip {
          padding: 12px 18px;
          display: flex;
          gap: 10px;
          border-top: 2px solid #1a2340;
          background: #f8f5ee;
        }
        .mob-btn-login {
          flex: 1; text-align: center;
          padding: 11px 8px;
          font-size: 11px; font-weight: 800;
          color: #1a2340;
          border: 2px solid #1a2340;
          border-radius: 8px;
          text-decoration: none;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          transition: all 0.15s;
        }
        .mob-btn-login:hover { background: #1a2340; color: #fff; }

        .mob-btn-signup {
          flex: 1; text-align: center;
          padding: 11px 8px;
          font-size: 11px; font-weight: 800;
          color: #fff;
          background: #1a2340;
          border: 2px solid #1a2340;
          border-radius: 8px;
          text-decoration: none;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          transition: all 0.15s;
        }
        .mob-btn-signup:hover { background: #c9a84c; border-color: #c9a84c; }

        .mob-btn-logout {
          flex: 1; text-align: center;
          padding: 11px 8px;
          font-size: 11px; font-weight: 800;
          color: #1a1200;
          background: #c9a84c;
          border: 2px solid #c9a84c;
          border-radius: 8px;
          cursor: pointer;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          transition: all 0.15s;
        }
        .mob-btn-logout:hover { background: #b8933a; border-color: #b8933a; }
      `}</style>

      <nav className="navbar-root">
        <div className="navbar-inner">

          {/* Logo */}
          <Link to="/" className="logo" onClick={() => setIsOpen(false)}>
            <div className="logo-main">
              <svg viewBox="0 0 500 500" className="logo-svg" xmlns="http://www.w3.org/2000/svg">
                {/* Background Accent - Soft Blue/Grey Rect */}
                <rect x="165" y="105" width="85" height="215" fill="#d1d9e6" />
                
                {/* Architectural Lines - Dark Navy */}
                <g stroke="#1a2340" strokeWidth="10" fill="none" strokeLinecap="square" strokeLinejoin="miter">
                  {/* Left building part */}
                  <path d="M25 320 H90 V225 L190 150" />
                  {/* Center building part */}
                  <path d="M190 320 V75 H295 V320" />
                  {/* Right building part */}
                  <path d="M295 185 L395 245 V320 H495" />
                  {/* Base line for center */}
                  <path d="M190 320 H295" strokeWidth="12" />
                </g>
                
                {/* Branding Text */}
                <text 
                  x="250" 
                  y="415" 
                  textAnchor="middle" 
                  className="logo-text-svg" 
                  fill="#c9a84c" 
                  style={{ fontSize: '82px', fontWeight: '900', fontFamily: 'Nunito Sans, sans-serif' }}
                >
                  KHARSAN
                </text>
                <text 
                  x="250" 
                  y="470" 
                  textAnchor="middle" 
                  className="logo-text-svg" 
                  fill="#1a2340" 
                  style={{ fontSize: '32px', fontWeight: '800', letterSpacing: '24px', fontFamily: 'Nunito Sans, sans-serif' }}
                >
                  PROPERTIES
                </text>
              </svg>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="nav-desktop">
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/about" className="nav-link">About</Link>

            {/* Properties dropdown */}
            <div className="nav-dropdown" onMouseLeave={() => setActiveDropdown(null)}>
              <button
                className={`nav-dropdown-btn ${activeDropdown === 'search' ? 'active' : ''}`}
                onMouseEnter={() => setActiveDropdown('search')}
              >
                Properties <ChevronDown size={14} className={`chevron ${activeDropdown === 'search' ? 'open' : ''}`} />
              </button>
              {activeDropdown === 'search' && (
                <div className="dropdown-menu">
                  <Link to="/search?type=buy" className="dropdown-item" onClick={() => setActiveDropdown(null)}>Buy</Link>
                  {isAuthenticated ? (
                    <Link to="/create-listing" className="dropdown-item" onClick={() => setActiveDropdown(null)}>Sell</Link>
                  ) : (
                    <Link to="/login" className="dropdown-item" onClick={() => setActiveDropdown(null)}>Sell</Link>
                  )}
                  <Link to="/brokers" className="dropdown-item" onClick={() => setActiveDropdown(null)}>Contact Brokers</Link>
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
                  <Link to="/calculator" className="dropdown-item" onClick={() => setActiveDropdown(null)}>Calculator (FN + F9)</Link>
                  <Link to="/boundary-map" className="dropdown-item" onClick={() => setActiveDropdown(null)}>Boundary Map</Link>
                  {isAuthenticated && <Link to="/saved-maps" className="dropdown-item" onClick={() => setActiveDropdown(null)}>Saved Boundaries</Link>}
                </div>
              )}
            </div>

            {isAuthenticated && (
              <>
                <Link to="/favorites" className="nav-link">My Favourites</Link>
                <Link to="/my-visits" className="nav-link">Site Visits</Link>
              </>
            )}

            <div className="nav-divider" />

            {isAuthenticated ? (
              <>
                <Link to={user?.role === 'Admin' ? '/admin' : '/dashboard'} className="nav-link">Dashboard</Link>
                <div className="nav-dropdown" onMouseLeave={() => setActiveDropdown(null)}>
                  <button
                    className="user-dropdown-btn"
                    onMouseEnter={() => setActiveDropdown('user')}
                    onClick={() => setActiveDropdown(activeDropdown === 'user' ? null : 'user')}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                      <span className="user-name">{user.name.split(' ')[0]}</span>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#6b7280' }}>{user.role}</span>
                    </div>
                    <ChevronDown size={14} className={`chevron ${activeDropdown === 'user' ? 'open' : ''}`} color="#c9a84c" />
                  </button>
                  {activeDropdown === 'user' && (
                    <div className="dropdown-menu user-menu" style={{ minWidth: '150px' }}>
                      <button onClick={handleLogout} className="dropdown-item logout-item">
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-login">Login</Link>
                <Link to="/register" className="btn-signup">Sign Up</Link>
              </>
            )}
          </div>

          {/* Mobile: Quick icon + hamburger */}
          <div className="mobile-actions">
            {isAuthenticated && (
              <Link
                to={user?.role === 'Admin' ? '/admin' : '/dashboard'}
                className="mob-quick-link"
                onClick={() => setIsOpen(false)}
                title="Dashboard"
              >
                <Home size={24} />
              </Link>
            )}
            <button className="hamburger" onClick={() => setIsOpen(!isOpen)} aria-label="Toggle menu">
              {isOpen ? <X size={26} /> : <Menu size={26} />}
            </button>
          </div>
        </div>

        {/* ── Mobile Menu — all items same font-size and padding ── */}
        <div className={`mobile-menu ${isOpen ? 'open' : ''}`}>
          {isAuthenticated && (
            <div style={{ padding: '20px 18px', background: '#f8f5ee', borderBottom: '1px solid #e2d9c5' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#c9a84c', textTransform: 'uppercase', marginBottom: '4px' }}>Logged in as</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#1a2340' }}>{user.name}</div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280' }}>{user.role}</div>
            </div>
          )}

          {/* Main */}
          <Link to="/" className="mob-item" onClick={() => setIsOpen(false)}>Home</Link>
          <Link to="/about" className="mob-item" onClick={() => setIsOpen(false)}>About</Link>

          {/* Properties */}
          <span className="mob-category">Properties</span>
          <Link to="/search?type=buy" className="mob-sub-item" onClick={() => setIsOpen(false)}>Buy Property</Link>
          {isAuthenticated ? (
            <Link to="/create-listing" className="mob-sub-item" onClick={() => setIsOpen(false)}>Sell / List Property</Link>
          ) : (
            <Link to="/login" className="mob-sub-item" onClick={() => setIsOpen(false)}>Sell / List Property</Link>
          )}
          <Link to="/brokers" className="mob-sub-item" onClick={() => setIsOpen(false)}>Contact Brokers</Link>

          {/* Tools */}
          <span className="mob-category">Tools</span>
          <Link to="/area-converter" className="mob-sub-item" onClick={() => setIsOpen(false)}>Area Converter</Link>
          <Link to="/calculator" className="mob-sub-item" onClick={() => setIsOpen(false)}>Calculator</Link>
          <Link to="/boundary-map" className="mob-sub-item" onClick={() => setIsOpen(false)}>Boundary Map</Link>
          {isAuthenticated && <Link to="/saved-maps" className="mob-sub-item" onClick={() => setIsOpen(false)}>Saved Boundaries</Link>}

          {/* Auth-only */}
          {isAuthenticated && (
            <>
              <span className="mob-category">My Account</span>
              <Link to="/favorites" className="mob-sub-item" onClick={() => setIsOpen(false)}>My Favourites</Link>
              <Link to="/my-visits" className="mob-sub-item" onClick={() => setIsOpen(false)}>Site Visits</Link>

              <span className="mob-category">Dashboard</span>
              <Link to="/dashboard?tab=overview" className="mob-sub-item" onClick={() => setIsOpen(false)}>Overview</Link>
              <Link to="/dashboard?tab=listings" className="mob-sub-item" onClick={() => setIsOpen(false)}>My Listings</Link>
              <Link to="/dashboard?tab=transactions" className="mob-sub-item" onClick={() => setIsOpen(false)}>Token History</Link>
              {(user?.role === 'Seller' || user?.role === 'Broker') && (
                <Link to="/dashboard?tab=payouts" className="mob-sub-item" onClick={() => setIsOpen(false)}>Payout Accounts</Link>
              )}
            </>
          )}

          {/* Auth strip at bottom */}
          <div className="mob-auth-strip">
            {isAuthenticated ? (
              <button onClick={handleLogout} className="mob-btn-logout">Logout</button>
            ) : (
              <>
                <Link to="/login" className="mob-btn-login" onClick={() => setIsOpen(false)}>Login</Link>
                <Link to="/register" className="mob-btn-signup" onClick={() => setIsOpen(false)}>Sign Up</Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;