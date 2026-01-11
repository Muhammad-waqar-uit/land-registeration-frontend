import { Link } from 'react-router-dom';
import { FaHouseUser, FaUsers, FaMapMarkedAlt } from 'react-icons/fa';

export default function About() {
  return (
    <div style={{ fontFamily: "'Poppins', sans-serif", backgroundColor: '#111827', minHeight: '100vh' }}>
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg shadow-sm px-4" style={{ backgroundColor: '#1f2937' }}>
        <Link to="/" className="navbar-brand fw-bold" style={{ fontSize: '26px', fontWeight: 'bold', color: '#60a5fa' }}>
          Land Registry
        </Link>
        <div className="ms-auto d-flex gap-2 align-items-center">
          <Link to="/" className="btn btn-link text-decoration-none" style={{ color: '#d1d5db' }}>Home</Link>
          <Link to="/contact" className="btn btn-link text-decoration-none" style={{ color: '#d1d5db' }}>Contact</Link>
          <Link to="/login" className="btn me-2" style={{ backgroundColor: 'transparent', border: '2px solid #60a5fa', color: '#60a5fa' }}>Login</Link>
          <Link to="/register" className="btn" style={{ backgroundColor: '#2563eb', color: 'white', border: 'none' }}>Sign Up</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section 
        className="text-center text-white py-5 position-relative"
        style={{
          background: 'linear-gradient(135deg, #0d6efd, #6610f2)',
          padding: '4rem 0',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div 
          style={{
            position: 'absolute',
            top: 0,
            right: '-60px',
            width: '180px',
            height: '100%',
            background: 'rgba(255,255,255,0.08)',
            transform: 'skewX(-25deg)'
          }}
        ></div>
        <div className="container position-relative" style={{ zIndex: 1 }}>
          <h1 style={{ fontSize: '48px', fontWeight: 'bold' }}>
            Welcome to <span style={{ color: '#ffc107' }}>Land Registry</span>
          </h1>
          <p className="lead mt-3">Revolutionizing real estate — one click at a time.</p>
        </div>
      </section>

      {/* About Content */}
      <section className="container my-5">
        <div className="text-center mb-5">
          <h2 className="fw-bold mb-3" style={{ color: '#ffffff' }}>Our Mission</h2>
          <p style={{ color: '#d1d5db' }}>
            To simplify the property market. No more outdated listings, shady brokers, or information gaps. 
            Just verified listings, smart search tools, and a dashboard that makes everything easier for buyers and sellers.
          </p>

          <h2 className="fw-bold mt-5 mb-3" style={{ color: '#ffffff' }}>Why Land Registry?</h2>
          <p style={{ color: '#d1d5db' }}>
            - Verified, updated listings from across the region<br />
            - Simple, clean interface for posting & browsing<br />
            - A growing network of trusted users & agents<br />
            - No hidden charges, no confusion — just property done right
          </p>
        </div>

        <div className="row g-4">
          <div className="col-md-4">
            <div 
              className="p-4 shadow-sm"
              style={{
                transition: 'all 0.3s ease',
                borderLeft: '5px solid #2563eb',
                borderRadius: '8px',
                backgroundColor: '#1f2937'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#374151';
                e.currentTarget.style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#1f2937';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <div 
                style={{
                  width: '60px',
                  height: '60px',
                  backgroundColor: '#2563eb',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                  color: 'white',
                  fontSize: '24px'
                }}
              >
                <FaHouseUser />
              </div>
              <h5 style={{ color: '#ffffff' }}>Smart Listings</h5>
              <p style={{ color: '#9ca3af' }}>
                Our platform offers detailed and verified property listings that help users explore, compare, and decide with confidence.
              </p>
            </div>
          </div>

          <div className="col-md-4">
            <div 
              className="p-4 shadow-sm"
              style={{
                transition: 'all 0.3s ease',
                borderLeft: '5px solid #2563eb',
                borderRadius: '8px',
                backgroundColor: '#1f2937'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#374151';
                e.currentTarget.style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#1f2937';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <div 
                style={{
                  width: '60px',
                  height: '60px',
                  backgroundColor: '#2563eb',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                  color: 'white',
                  fontSize: '24px'
                }}
              >
                <FaUsers />
              </div>
              <h5 style={{ color: '#ffffff' }}>Trusted Community</h5>
              <p style={{ color: '#9ca3af' }}>
                Join thousands of users who trust us to buy, sell, and rent their homes nationwide — with real reviews and secure processes.
              </p>
            </div>
          </div>

          <div className="col-md-4">
            <div 
              className="p-4 shadow-sm"
              style={{
                transition: 'all 0.3s ease',
                borderLeft: '5px solid #2563eb',
                borderRadius: '8px',
                backgroundColor: '#1f2937'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#374151';
                e.currentTarget.style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#1f2937';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <div 
                style={{
                  width: '60px',
                  height: '60px',
                  backgroundColor: '#2563eb',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                  color: 'white',
                  fontSize: '24px'
                }}
              >
                <FaMapMarkedAlt />
              </div>
              <h5 style={{ color: '#ffffff' }}>Nationwide Reach</h5>
              <p style={{ color: '#9ca3af' }}>
                Whether you're in major cities or smaller towns — we've got listings and leads all across the region.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-3 mt-5" style={{ backgroundColor: '#0f172a', color: '#d1d5db' }}>
        <small>© 2025 Land Registry — Built with 💙</small>
      </footer>
    </div>
  );
}

