import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import type { UserRole } from '../types';

interface Property {
  img: string;
  title: string;
  price: string;
}

const properties: Property[] = [
  {
    img: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=400&q=80",
    title: "3 Marla House – Lahore",
    price: "PKR 85 Lac – DHA Phase 5"
  },
  {
    img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80",
    title: "5 Marla Plot – Islamabad",
    price: "PKR 45 Lac – B-17 Sector"
  },
  {
    img: "https://images.unsplash.com/photo-1599423300746-b62533397364?auto=format&fit=crop&w=400&q=80",
    title: "Apartment for Rent – Karachi",
    price: "PKR 1.2 Lac/Month – Clifton"
  },
  {
    img: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=400&q=80",
    title: "3 Marla House – Lahore",
    price: "PKR 85 Lac – DHA Phase 5"
  },
  {
    img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80",
    title: "5 Marla Plot – Islamabad",
    price: "PKR 45 Lac – B-17 Sector"
  },
  {
    img: "https://images.unsplash.com/photo-1599423300746-b62533397364?auto=format&fit=crop&w=400&q=80",
    title: "Apartment for Rent – Karachi",
    price: "PKR 1.2 Lac/Month – Clifton"
  },
  {
    img: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=400&q=80",
    title: "3 Marla House – Lahore",
    price: "PKR 85 Lac – DHA Phase 5"
  },
  {
    img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80",
    title: "5 Marla Plot – Islamabad",
    price: "PKR 45 Lac – B-17 Sector"
  },
  {
    img: "https://images.unsplash.com/photo-1599423300746-b62533397364?auto=format&fit=crop&w=400&q=80",
    title: "Apartment for Rent – Karachi",
    price: "PKR 1.2 Lac/Month – Clifton"
  },
  {
    img: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=400&q=80",
    title: "3 Marla House – Lahore",
    price: "PKR 85 Lac – DHA Phase 5"
  },
  {
    img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80",
    title: "5 Marla Plot – Islamabad",
    price: "PKR 45 Lac – B-17 Sector"
  },
  {
    img: "https://images.unsplash.com/photo-1599423300746-b62533397364?auto=format&fit=crop&w=400&q=80",
    title: "Apartment for Rent – Karachi",
    price: "PKR 1.2 Lac/Month – Clifton"
  },
  {
    img: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=400&q=80",
    title: "3 Marla House – Lahore",
    price: "PKR 85 Lac – DHA Phase 5"
  },
  {
    img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80",
    title: "5 Marla Plot – Islamabad",
    price: "PKR 45 Lac – B-17 Sector"
  },
  {
    img: "https://images.unsplash.com/photo-1599423300746-b62533397364?auto=format&fit=crop&w=400&q=80",
    title: "Apartment for Rent – Karachi",
    price: "PKR 1.2 Lac/Month – Clifton"
  }
];

export default function Home() {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      const roleRoutes: Record<UserRole, string> = {
        admin: '/dashboard/admin',
        user: '/dashboard/buyer',
        builder: '/dashboard/builder',
      };
      navigate(roleRoutes[user.role] || '/dashboard', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif", backgroundColor: '#111827', minHeight: '100vh' }}>
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-light shadow-sm px-4" style={{ backgroundColor: '#1f2937' }}>
        <Link to="/" className="navbar-brand fw-bold" style={{ fontSize: '26px', fontWeight: 'bold', color: '#60a5fa' }}>
          Land Registry
        </Link>
        <div className="ms-auto d-flex gap-2 align-items-center">
          <Link to="/about" className="btn btn-link text-decoration-none" style={{ color: '#d1d5db' }}>About</Link>
          <Link to="/contact" className="btn btn-link text-decoration-none" style={{ color: '#d1d5db' }}>Contact</Link>
          <Link to="/login" className="btn me-2" style={{ backgroundColor: 'transparent', border: '2px solid #60a5fa', color: '#60a5fa' }}>Login</Link>
          <Link to="/register" className="btn" style={{ backgroundColor: '#2563eb', color: 'white', border: 'none' }}>Sign Up</Link>
        </div>
      </nav>

      {/* Hero */}
      <header 
        className="text-center text-light py-5"
        style={{ 
          background: 'linear-gradient(to bottom right, #0d6efd, #6610f2)',
          padding: '3rem 0'
        }}
      >
        <div className="container">
          <h1 className="display-5 fw-bold mb-3">Find, Sell & Explore Properties</h1>
          <p className="lead">Search homes, flats, plots & more — all in one platform.</p>
        </div>
      </header>

      {/* Featured Listings */}
      <section className="container py-5">
        <h2 className="text-center mb-4 fw-bold" style={{ color: '#ffffff' }}>Featured Listings</h2>
        <div className="row g-4">
          {properties.map((property, index) => (
            <div key={index} className="col-md-4">
              <div className="card shadow-sm h-100" style={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}>
                <img 
                  src={property.img} 
                  className="card-img-top" 
                  alt={property.title}
                  style={{ height: '180px', objectFit: 'cover' }}
                />
                <div className="card-body">
                  <h5 className="card-title" style={{ fontSize: '18px', fontWeight: 600, color: '#ffffff' }}>
                    {property.title}
                  </h5>
                  <p className="card-text" style={{ color: '#9ca3af' }}>{property.price}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-3 mt-5" style={{ backgroundColor: '#0f172a', color: '#d1d5db' }}>
        <small>© 2025 Land Registry — All rights reserved</small>
      </footer>
    </div>
  );
}

