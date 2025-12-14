import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { FaEnvelope, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';
import { contactAPI } from '../services/api';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear errors when user types
    if (error) setError(null);
    if (success) setSuccess(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      const response = await contactAPI.sendMessage(formData);
      setSuccess(response.message || 'Message sent successfully! We will get back to you soon.');
      // Clear form on success
      setFormData({
        name: '',
        email: '',
        message: '',
      });
    } catch (err: any) {
      setError(
        err.response?.data?.message || 
        err.message || 
        'Failed to send message. Please try again later.'
      );
    } finally {
      setIsLoading(false);
    }
  };

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
              
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}
              
              {success && (
                <div className="alert alert-success" role="alert">
                  {success}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Name</label>
                  <input 
                    type="text" 
                    name="name"
                    className="form-control" 
                    placeholder="Your name" 
                    value={formData.name}
                    onChange={handleChange}
                    required 
                    disabled={isLoading}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input 
                    type="email" 
                    name="email"
                    className="form-control" 
                    placeholder="your.email@example.com" 
                    value={formData.email}
                    onChange={handleChange}
                    required 
                    disabled={isLoading}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Message</label>
                  <textarea 
                    className="form-control" 
                    name="message"
                    rows={5} 
                    placeholder="Your message" 
                    value={formData.message}
                    onChange={handleChange}
                    required 
                    disabled={isLoading}
                  ></textarea>
                </div>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Sending...
                    </>
                  ) : (
                    'Send Message'
                  )}
                </button>
              </form>
            </div>
          </div>

          <div className="col-md-4">
            <div className="bg-white p-4 shadow-sm rounded h-100">
              <h4 className="mb-4">Contact Information</h4>
              <div className="mb-4">
                <FaEnvelope className="text-primary me-2" />
                <strong>Email:</strong>
                <p className="text-muted">abdul1977ghaffar@gmail.com</p>
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

