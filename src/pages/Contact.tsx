import { Link } from 'react-router-dom';
import { FaEnvelope, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';

export default function Contact() {
  return (
    <div style={{ fontFamily: "'Poppins', sans-serif", backgroundColor: '#f5f7fa', minHeight: '100vh' }}>
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm px-4">
        <Link to="/" className="navbar-brand text-primary fw-bold" style={{ fontSize: '26px', fontWeight: 'bold' }}>
          Land Registry
        </Link>
        <div className="ms-auto d-flex gap-2 align-items-center">
          <Link to="/" className="btn btn-link text-decoration-none">Home</Link>
          <Link to="/about" className="btn btn-link text-decoration-none">About</Link>
          <Link to="/login" className="btn btn-outline-primary me-2">Login</Link>
          <Link to="/register" className="btn btn-primary">Sign Up</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section 
        className="text-center text-white py-5"
        style={{
          background: 'linear-gradient(135deg, #0d6efd, #6610f2)',
          padding: '4rem 0'
        }}
      >
        <div className="container">
          <h1 className="display-4 fw-bold mb-3">Contact Us</h1>
          <p className="lead">Get in touch with our team</p>
        </div>
      </section>

      {/* Contact Content */}
      <section className="container my-5">
        <div className="row g-4">
          <div className="col-md-8">
            <div className="bg-white p-5 shadow-sm rounded">
              <h3 className="mb-4">Send us a Message</h3>
              <form>
                <div className="mb-3">
                  <label className="form-label">Name</label>
                  <input type="text" className="form-control" placeholder="Your name" required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-control" placeholder="your.email@example.com" required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Message</label>
                  <textarea className="form-control" rows={5} placeholder="Your message" required></textarea>
                </div>
                <button type="submit" className="btn btn-primary">Send Message</button>
              </form>
            </div>
          </div>

          <div className="col-md-4">
            <div className="bg-white p-4 shadow-sm rounded h-100">
              <h4 className="mb-4">Contact Information</h4>
              <div className="mb-4">
                <FaEnvelope className="text-primary me-2" />
                <strong>Email:</strong>
                <p className="text-muted">info@landregistry.com</p>
              </div>
              <div className="mb-4">
                <FaPhone className="text-primary me-2" />
                <strong>Phone:</strong>
                <p className="text-muted">+1 (555) 123-4567</p>
              </div>
              <div>
                <FaMapMarkerAlt className="text-primary me-2" />
                <strong>Address:</strong>
                <p className="text-muted">123 Property Street<br />City, State 12345</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-dark text-light text-center py-3 mt-5">
        <small>© 2025 Land Registry — All rights reserved</small>
      </footer>
    </div>
  );
}

