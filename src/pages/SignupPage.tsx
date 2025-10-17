import { FormEvent, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../auth/AuthContext';

export default function SignupPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.signup({ name, email, password });
      login(res.token, res.user);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to signup');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="row justify-content-center">
      <div className="col-md-6 col-lg-4">
        <div className="card shadow">
          <div className="card-body p-4">
            <div className="text-center mb-4">
              <i className="bi bi-person-plus text-success" style={{ fontSize: '3rem' }}></i>
              <h2 className="mt-3 mb-1">Create Account</h2>
              <p className="text-muted">Join us to start tracking your finances</p>
            </div>
            
            <form onSubmit={onSubmit}>
              <div className="mb-3">
                <label htmlFor="name" className="form-label">Full Name</label>
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="bi bi-person"></i>
                  </span>
                  <input
                    id="name"
                    type="text"
                    className="form-control"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="mb-3">
                <label htmlFor="email" className="form-label">Email</label>
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="bi bi-envelope"></i>
                  </span>
                  <input
                    id="email"
                    type="email"
                    className="form-control"
                    placeholder="Enter your email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="mb-3">
                <label htmlFor="password" className="form-label">Password</label>
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="bi bi-lock"></i>
                  </span>
                  <input
                    id="password"
                    type="password"
                    className="form-control"
                    placeholder="Create a password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <div className="form-text">Password must be at least 6 characters long</div>
              </div>

              {error && (
                <div className="alert alert-danger" role="alert">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  {error}
                </div>
              )}

              <button 
                className="btn btn-success w-100 mb-3" 
                type="submit" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Creating account...
                  </>
                ) : (
                  <>
                    <i className="bi bi-person-plus me-2"></i>
                    Create Account
                  </>
                )}
              </button>
            </form>

            <div className="text-center">
              <p className="mb-0">
                Already have an account? 
                <Link to="/login" className="text-decoration-none ms-1">
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


