import { Link } from 'react-router-dom';

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
  return (
    <div style={{ fontFamily: "'Poppins', sans-serif", backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm px-4">
        <Link to="/" className="navbar-brand text-primary fw-bold" style={{ fontSize: '26px', fontWeight: 'bold' }}>
          Land Registry
        </Link>
        <div className="ms-auto d-flex gap-2 align-items-center">
          <Link to="/about" className="btn btn-link text-decoration-none">About</Link>
          <Link to="/contact" className="btn btn-link text-decoration-none">Contact</Link>
          <Link to="/login" className="btn btn-outline-primary me-2">Login</Link>
          <Link to="/register" className="btn btn-primary">Sign Up</Link>
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
        <h2 className="text-center mb-4 fw-bold">Featured Listings</h2>
        <div className="row g-4">
          {properties.map((property, index) => (
            <div key={index} className="col-md-4">
              <div className="card shadow-sm h-100">
                <img 
                  src={property.img} 
                  className="card-img-top" 
                  alt={property.title}
                  style={{ height: '180px', objectFit: 'cover' }}
                />
                <div className="card-body">
                  <h5 className="card-title" style={{ fontSize: '18px', fontWeight: 600 }}>
                    {property.title}
                  </h5>
                  <p className="card-text text-muted">{property.price}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-dark text-light text-center py-3 mt-5">
        <small>© 2025 Land Registry — All rights reserved</small>
      </footer>
    </div>
  );
}

