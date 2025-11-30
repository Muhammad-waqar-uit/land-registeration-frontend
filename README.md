# Land Registration Management System (LRMS) - Frontend

A modern React.js frontend for a Blockchain-Based Land Registration Management System.

## 🚀 Features

- **Authentication**: Login, Register, and Forgot Password
- **Role-Based Dashboards**: 
  - Admin Dashboard
  - Seller Dashboard
  - Buyer Dashboard
  - Builder Dashboard
- **User Profile Management**
- **Land Management**: View and manage land properties
- **Document Verification**: IPFS integration for document storage and verification
- **Payment Management**: Installment tracking and payment processing
- **Responsive Design**: Mobile-first approach with Tailwind CSS + DaisyUI

## 🛠️ Tech Stack

- **React 19** with TypeScript
- **Redux Toolkit** for state management
- **React Router v6** for routing
- **Tailwind CSS** + **DaisyUI** for styling
- **Axios** for API calls
- **Heroicons** for icons

## 📦 Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file (optional):
```env
VITE_API_BASE_URL=http://localhost:3000/api
```

3. Start the development server:
```bash
npm run dev
```

## 📁 Project Structure

```
src/
├── components/          # Reusable components
│   ├── layouts/        # Layout components (DashboardLayout)
│   └── ProtectedRoute.tsx
├── pages/              # Page components
│   ├── auth/          # Authentication pages
│   ├── dashboard/     # Role-based dashboards
│   ├── Profile.tsx
│   ├── LandDetail.tsx
│   └── Unauthorized.tsx
├── services/          # API services
│   └── api.ts
├── store/             # Redux store
│   ├── slices/       # Redux slices
│   ├── hooks.ts      # Typed hooks
│   └── index.ts
├── types/             # TypeScript types
│   └── index.ts
├── App.tsx            # Main app component with routing
└── main.tsx           # Entry point
```

## 🔐 Authentication Flow

1. User registers/logs in
2. JWT token stored in localStorage
3. User redirected to role-based dashboard
4. Protected routes check authentication and role

## 🎨 Styling

The project uses:
- **Tailwind CSS** for utility-first styling
- **DaisyUI** for component library
- Custom color palette:
  - Primary: Deep Green (#166534)
  - Secondary: Gold (#D4AF37)

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🔗 API Integration

The frontend expects a backend API with the following endpoints:

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user
- `GET /api/lands` - Get all lands
- `GET /api/lands/:id` - Get land by ID
- `POST /api/payments` - Create payment
- `GET /api/payments/my-payments` - Get user payments
- `POST /api/payments/:id/verify` - Verify payment (builder)

## 🚧 TODO

- [ ] Implement payment modal with bank/crypto options
- [ ] Add IPFS file upload functionality
- [ ] Integrate wallet connection (Metamask)
- [ ] Add blockchain transaction handling
- [ ] Implement document hash verification
- [ ] Add loading states and error handling
- [ ] Add unit tests
- [ ] Add E2E tests with Cypress

## 📄 License

MIT
