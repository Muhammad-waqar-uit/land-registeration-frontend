# Land Registration Management System (LRMS) - Frontend

A modern React.js frontend for a Blockchain-Based Land Registration Management System built with TypeScript, Redux Toolkit, and Tailwind CSS.

## 🚀 Features

### Authentication & User Management
- ✅ **User Registration** - Role-based registration (admin, seller, buyer, builder)
- ✅ **User Login** - JWT-based authentication with persistent sessions
- ✅ **Forgot Password** - Email-based password reset flow
- ✅ **Reset Password** - Token-based password reset
- ✅ **Profile Management** - Update name and email (role is read-only)
- ✅ **Password Update** - Change password with current password verification
- ✅ **Session Persistence** - Automatic login on page refresh
- ✅ **Protected Routes** - Role-based route protection

### Role-Based Dashboards
- ✅ **Admin Dashboard** - Overview of all lands, pending payments, and system statistics
- ✅ **Seller Dashboard** - Manage lands, track buyer progress, view revenue
- ✅ **Buyer Dashboard** - Browse available lands, track reservations, payment history
- ✅ **Builder Dashboard** - Payment verification and land management

### Land Management
- ✅ **Land Listing** - View all available lands
- ✅ **Land Details** - Detailed view with document verification
- ✅ **Land Registration** - Register new lands (sellers)
- ✅ **Land Status Tracking** - Available, Locked, Sold status

### Payment Management
- ✅ **Payment Creation** - Submit payment with proof documents
- ✅ **Payment History** - View all payments by buyer
- ✅ **Payment Verification** - Admin/Builder verify payments
- ✅ **Pending Payments** - Track pending payment verifications
- ✅ **Installment Tracking** - Progress tracking for land purchases

### UI/UX Features
- ✅ **Responsive Design** - Mobile-first approach
- ✅ **Dark Theme** - Consistent dark theme throughout
- ✅ **Loading States** - Spinners and loading indicators
- ✅ **Error Handling** - Comprehensive error messages
- ✅ **Form Validation** - Client-side validation
- ✅ **Auto-redirects** - Smart navigation based on auth state

## 🛠️ Tech Stack

- **React 19** with TypeScript
- **Redux Toolkit** for state management
- **React Router v6** for routing
- **Axios** for API calls
- **Tailwind CSS** + **DaisyUI** for styling
- **Heroicons** for icons
- **Vite** for build tooling

## 📦 Installation

1. **Clone the repository** (if applicable) or navigate to the project directory

2. **Install dependencies:**
```bash
npm install
```

3. **Create a `.env` file** in the root directory:
```env
VITE_API_BASE_URL=http://localhost:3000/api
```

4. **Start the development server:**
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 🔧 Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Backend API Base URL
# This should point to your NestJS backend API
# Default: http://localhost:3000/api
# Example for production: https://api.yourdomain.com/api
VITE_API_BASE_URL=http://localhost:3000/api
```

**Note:** All environment variables must be prefixed with `VITE_` to be accessible in the frontend code.

## 📁 Project Structure

```
src/
├── components/              # Reusable components
│   ├── layouts/           # Layout components
│   │   └── DashboardLayout.tsx
│   └── ProtectedRoute.tsx # Route protection component
├── pages/                  # Page components
│   ├── auth/              # Authentication pages
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── ForgotPassword.tsx
│   │   └── ResetPassword.tsx
│   ├── dashboard/         # Role-based dashboards
│   │   ├── AdminDashboard.tsx
│   │   ├── SellerDashboard.tsx
│   │   ├── BuyerDashboard.tsx
│   │   └── BuilderDashboard.tsx
│   ├── Profile.tsx        # User profile page
│   ├── LandDetail.tsx     # Land details page
│   ├── Home.tsx           # Landing page
│   ├── About.tsx
│   ├── Contact.tsx
│   └── Unauthorized.tsx
├── services/              # API services
│   └── api.ts            # Axios instance and API methods
├── store/                 # Redux store
│   ├── slices/          # Redux slices
│   │   └── authSlice.ts # Authentication state
│   ├── hooks.ts         # Typed Redux hooks
│   └── index.ts         # Store configuration
├── types/                # TypeScript types
│   └── index.ts         # Type definitions
├── App.tsx               # Main app component with routing
└── main.tsx             # Entry point
```

## 🔐 Authentication Flow

1. **Registration/Login:**
   - User submits credentials
   - Backend returns JWT token and user data
   - Token stored in `localStorage`
   - User data stored in Redux and `localStorage`
   - Redirect to role-based dashboard

2. **Session Persistence:**
   - On app load, check for token in `localStorage`
   - If token exists, fetch current user from `/api/auth/me`
   - Update Redux state with user data
   - Protected routes check authentication status

3. **Logout:**
   - Clear token and user from `localStorage`
   - Clear Redux state
   - Call logout API (non-blocking)
   - Redirect to login page

4. **Password Reset:**
   - User requests password reset via email
   - Backend sends reset link to email
   - User clicks link → navigates to `/reset-password?token=...`
   - User enters new password
   - Password updated → redirect to login

## 🔌 API Integration

The frontend expects a NestJS backend API with the following endpoints:

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | User registration | No |
| POST | `/api/auth/login` | User login | No |
| GET | `/api/auth/me` | Get current user | Yes |
| POST | `/api/auth/logout` | User logout | Yes |
| PATCH | `/api/auth/profile` | Update profile (name, email) | Yes |
| PATCH | `/api/auth/password` | Update password | Yes |
| POST | `/api/auth/forgot-password` | Request password reset | No |
| POST | `/api/auth/reset-password` | Reset password with token | No |

### Land Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/lands` | Get all lands | Yes |
| GET | `/api/lands/:id` | Get land by ID | Yes |
| POST | `/api/lands` | Create new land (multipart/form-data) | Yes |
| PUT | `/api/lands/:id` | Update land | Yes |

### Payment Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/payments` | Create payment (multipart/form-data) | Yes |
| GET | `/api/payments/my-payments` | Get buyer's payments | Yes |
| GET | `/api/payments/pending` | Get pending payments (admin/builder) | Yes |
| POST | `/api/payments/:id/verify` | Verify payment | Yes |

### Request/Response Format

**Request Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json (or multipart/form-data for file uploads)
```

**Response Format:**
The backend may return data in either format:
```json
{
  "data": { ... },
  "success": true
}
```
or directly:
```json
{ ... }
```

The frontend handles both formats automatically.

## 🎨 Styling

The project uses:
- **Tailwind CSS** for utility-first styling
- **DaisyUI** for component library
- **Dark Theme** by default with proper contrast
- Custom color palette:
  - Primary: Blue (#0d6efd)
  - Secondary: Purple (#6610f2)
  - Success: Green
  - Warning: Yellow
  - Error: Red

### Text Visibility
All text uses `text-base-content` for proper visibility against dark backgrounds. Stats use color classes (`text-primary`, `text-success`, `text-warning`) for emphasis.

## 📝 Available Scripts

- `npm run dev` - Start development server (Vite)
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🔄 State Management

### Redux Store Structure

```typescript
{
  auth: {
    user: User | null,
    token: string | null,
    isAuthenticated: boolean,
    isLoading: boolean
  }
}
```

### Redux Actions

- `loginUser` - Login with credentials
- `registerUser` - Register new user
- `fetchCurrentUser` - Fetch current user from API
- `updateProfile` - Update user profile
- `updatePassword` - Change password
- `logoutUser` - Logout user
- `clearAuth` - Clear authentication state

### LocalStorage

- `token` - JWT authentication token
- `user` - Serialized user object (JSON)

## 🛡️ Protected Routes

Routes are protected using the `ProtectedRoute` component:

- **Public Routes:** `/`, `/login`, `/register`, `/forgot-password`, `/reset-password`, `/about`, `/contact`
- **Protected Routes:** All `/dashboard/*` routes and `/profile`, `/lands/:id`
- **Role-Based Routes:** Each dashboard route checks user role

## 🔄 Data Flow

1. **Dashboard Data Fetching:**
   - On component mount, fetch data from API
   - Filter data based on user role and ID
   - Calculate statistics from fetched data
   - Display with loading states

2. **Profile Updates:**
   - User edits profile → form submission
   - API call to update profile
   - Redux state updated
   - localStorage updated
   - UI automatically reflects changes

3. **Payment Flow:**
   - Buyer creates payment → upload proof
   - Payment appears in pending list (admin/builder)
   - Admin/Builder verifies payment
   - Payment status updated
   - Buyer sees verified payment in history

## 🐛 Error Handling

- **Network Errors:** Displayed with user-friendly messages
- **API Errors:** Error messages from backend displayed
- **Validation Errors:** Client-side validation with error messages
- **Loading States:** Spinners during API calls
- **Empty States:** Messages when no data available

## 🚧 Backend Requirements

### CORS Configuration

The backend must allow requests from the frontend origin. For development:
```typescript
// In NestJS main.ts
app.enableCors({
  origin: 'http://localhost:5173', // Vite dev server
  credentials: false,
});
```

### Response Format

Backend should return responses in one of these formats:
```json
{
  "data": { ... },
  "success": true
}
```
or directly:
```json
{ ... }
```

### Authentication

- JWT tokens in `Authorization: Bearer {token}` header
- Token expiration handled by backend
- 401 responses trigger logout

## 📱 Responsive Design

- Mobile-first approach
- Breakpoints: `sm`, `md`, `lg`, `xl`
- Sidebar collapses on mobile
- Tables scroll horizontally on small screens
- Cards stack vertically on mobile

## 🔒 Security Features

- ✅ JWT token authentication
- ✅ Protected API routes
- ✅ Role-based access control
- ✅ Password validation (min 8 characters)
- ✅ Secure password reset flow
- ✅ XSS protection (React default)
- ✅ CSRF protection (via token)

## 📄 License

MIT

## 🤝 Contributing

1. Ensure backend is running on `http://localhost:3000`
2. Set up `.env` file with correct API URL
3. Install dependencies: `npm install`
4. Start dev server: `npm run dev`
5. Make changes and test thoroughly

## 📞 Support

For issues or questions:
- Check backend is running and CORS is configured
- Verify `.env` file has correct API URL
- Check browser console for errors
- Ensure backend endpoints match the API specification
