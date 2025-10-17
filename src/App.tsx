import { Route, Routes, Navigate, Link } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import DashboardPage from "./pages/DashboardPage";
import AiPlaygroundPage from "./pages/AiPlaygroundPage";
import logo from "./assets/FinanceAI_Favicon.png";

function PrivateRoute({ children }: { children: JSX.Element }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
}

function Navigation() {
  const { token, user, logout } = useAuth();

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
      <div className="container">
        <Link className="navbar-brand fw-bold d-flex align-items-center" to="/">
          <img src={logo} alt="FinanceAI Logo" style={{ height: '32px', width: '32px' }} className="me-2" />
          FinanceAI
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          {token && (
            <ul className="navbar-nav me-auto">
              <li className="nav-item">
                <Link className="nav-link" to="/">
                  <i className="bi bi-house me-1"></i>Dashboard
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/ai-playground">
                  <i className="bi bi-robot me-1"></i>Ai Playground
                </Link>
              </li>
            </ul>
          )}
          <ul className="navbar-nav">
            {token ? (
              <>
                <li className="nav-item dropdown">
                  <a
                    className="nav-link dropdown-toggle"
                    href="#"
                    role="button"
                    data-bs-toggle="dropdown"
                  >
                    <i className="bi bi-person-circle me-1"></i>
                    {user?.name}
                  </a>
                  <ul className="dropdown-menu">
                    <li>
                      <button className="dropdown-item" onClick={logout}>
                        <i className="bi bi-box-arrow-right me-1"></i>Logout
                      </button>
                    </li>
                  </ul>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/login">
                    <i className="bi bi-box-arrow-in-right me-1"></i>Login
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/signup">
                    <i className="bi bi-person-plus me-1"></i>Signup
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <div className="min-vh-100 bg-light">
        <Navigation />
        <main className="container my-4">
          <Routes>
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <DashboardPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/ai-playground"
              element={
                <PrivateRoute>
                  <AiPlaygroundPage />
                </PrivateRoute>
              }
            />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
          </Routes>
        </main>
      </div>
    </AuthProvider>
  );
}
