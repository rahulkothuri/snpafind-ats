import { useState, type FormEvent } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import authService from '../services/auth.service';

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  
  // Get success message from navigation state (e.g., after registration)
  const successMessage = (location.state as { message?: string })?.message;

  // Redirect if already authenticated
  if (isAuthenticated) {
    navigate('/dashboard', { replace: true });
    return null;
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setErrors({});
    
    try {
      const response = await authService.login({ email, password });
      login(response.token, response.user);
      navigate('/dashboard', { replace: true });
    } catch (error: unknown) {
      // Generic error message to not reveal which credential was wrong
      // This satisfies Requirement 1.2
      const apiError = error as { response?: { data?: { message?: string } } };
      setErrors({
        general: apiError.response?.data?.message || 'Invalid credentials',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f8fafc' }}>
      <div className="w-full max-w-md px-4">
        {/* Logo Section - Requirement 11.4: Logo centered above form */}
        <div className="text-center mb-8">
          <div 
            className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
            style={{ backgroundColor: '#0b6cf0' }}
          >
            <span className="text-white text-xl font-bold">SF</span>
          </div>
          <h1 className="text-2xl font-semibold" style={{ color: '#111827' }}>SnapFind ATS</h1>
          <p className="mt-2" style={{ color: '#64748b' }}>Sign in to your account</p>
        </div>

        {/* Login Form Card - Requirement 11.1: Centered card with white background and subtle shadow */}
        <div 
          className="rounded-xl p-8"
          style={{ 
            backgroundColor: '#ffffff',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
            border: '1px solid #e2e8f0'
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Success Message from Registration */}
            {successMessage && (
              <div 
                className="p-3 rounded-lg"
                style={{ backgroundColor: '#dcfce7', border: '1px solid #bbf7d0' }}
              >
                <p className="text-sm" style={{ color: '#166534' }}>{successMessage}</p>
              </div>
            )}

            {/* General Error Message */}
            {errors.general && (
              <div 
                className="p-3 rounded-lg"
                style={{ backgroundColor: '#fee2e2', border: '1px solid #fecaca' }}
              >
                <p className="text-sm" style={{ color: '#991b1b' }}>{errors.general}</p>
              </div>
            )}

            {/* Email Field - Requirement 11.2: Inputs with new form styling */}
            <div className="form-group">
              <label 
                htmlFor="email" 
                className="form-label"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`form-input ${errors.email ? 'error' : ''}`}
                placeholder="you@company.com"
                disabled={isLoading}
                autoComplete="email"
              />
              {errors.email && (
                <p className="form-error">{errors.email}</p>
              )}
            </div>

            {/* Password Field - Requirement 11.2: Inputs with new form styling */}
            <div className="form-group">
              <label 
                htmlFor="password" 
                className="form-label"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`form-input ${errors.password ? 'error' : ''}`}
                placeholder="Enter your password"
                disabled={isLoading}
                autoComplete="current-password"
              />
              {errors.password && (
                <p className="form-error">{errors.password}</p>
              )}
            </div>

            {/* Submit Button - Requirement 11.3: Blue rounded pill button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 font-medium rounded-full focus:outline-none focus:ring-2 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              style={{ 
                backgroundColor: '#0b6cf0',
                color: '#ffffff',
                borderRadius: '9999px'
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.backgroundColor = '#0958c7';
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.backgroundColor = '#0b6cf0';
                }
              }}
            >
              {isLoading ? (
                <span className="inline-flex items-center justify-center">
                  <svg 
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24"
                  >
                    <circle 
                      className="opacity-25" 
                      cx="12" 
                      cy="12" 
                      r="10" 
                      stroke="currentColor" 
                      strokeWidth="4"
                    />
                    <path 
                      className="opacity-75" 
                      fill="currentColor" 
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* Link to Sign-up - Requirement 1.6 */}
          <div className="mt-6 text-center">
            <p className="text-sm" style={{ color: '#64748b' }}>
              Don't have an account?{' '}
              <Link 
                to="/signup" 
                className="font-medium hover:underline"
                style={{ color: '#0b6cf0' }}
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm mt-6" style={{ color: '#64748b' }}>
          SnapFind ATS · Applicant Tracking System
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
