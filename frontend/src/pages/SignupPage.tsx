import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import authService from '../services/auth.service';

interface FormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  companyName: string;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  companyName?: string;
  general?: string;
}

export function SignupPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  // Redirect if already authenticated
  if (isAuthenticated) {
    navigate('/dashboard', { replace: true });
    return null;
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setErrors({});
    
    try {
      await authService.register(formData);
      // Redirect to login with success message
      navigate('/login', { 
        replace: true,
        state: { message: 'Registration successful! Please sign in.' }
      });
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: { message?: string; details?: Record<string, string[]> } } };
      
      // Handle validation errors from backend
      if (apiError.response?.data?.details) {
        const backendErrors: FormErrors = {};
        const details = apiError.response.data.details;
        if (details.email) backendErrors.email = details.email[0];
        if (details.password) backendErrors.password = details.password[0];
        if (details.confirmPassword) backendErrors.confirmPassword = details.confirmPassword[0];
        if (details.fullName) backendErrors.fullName = details.fullName[0];
        if (details.companyName) backendErrors.companyName = details.companyName[0];
        setErrors(backendErrors);
      } else {
        setErrors({
          general: apiError.response?.data?.message || 'Registration failed. Please try again.',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f8fafc' }}>
      <div className="w-full max-w-md px-4">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div 
            className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
            style={{ backgroundColor: '#0b6cf0' }}
          >
            <span className="text-white text-xl font-bold">SF</span>
          </div>
          <h1 className="text-2xl font-semibold" style={{ color: '#111827' }}>SnapFind ATS</h1>
          <p className="mt-2" style={{ color: '#64748b' }}>Create your account</p>
        </div>

        {/* Sign-up Form Card */}
        <div 
          className="rounded-xl p-8"
          style={{ 
            backgroundColor: '#ffffff',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
            border: '1px solid #e2e8f0'
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* General Error Message */}
            {errors.general && (
              <div 
                className="p-3 rounded-lg"
                style={{ backgroundColor: '#fee2e2', border: '1px solid #fecaca' }}
              >
                <p className="text-sm" style={{ color: '#991b1b' }}>{errors.general}</p>
              </div>
            )}

            {/* Full Name Field */}
            <div className="form-group">
              <label htmlFor="fullName" className="form-label">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleChange('fullName')}
                className={`form-input ${errors.fullName ? 'error' : ''}`}
                placeholder="John Doe"
                disabled={isLoading}
                autoComplete="name"
              />
              {errors.fullName && (
                <p className="form-error">{errors.fullName}</p>
              )}
            </div>

            {/* Email Field */}
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={handleChange('email')}
                className={`form-input ${errors.email ? 'error' : ''}`}
                placeholder="you@company.com"
                disabled={isLoading}
                autoComplete="email"
              />
              {errors.email && (
                <p className="form-error">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={formData.password}
                onChange={handleChange('password')}
                className={`form-input ${errors.password ? 'error' : ''}`}
                placeholder="At least 8 characters"
                disabled={isLoading}
                autoComplete="new-password"
              />
              {errors.password && (
                <p className="form-error">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange('confirmPassword')}
                className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                placeholder="Confirm your password"
                disabled={isLoading}
                autoComplete="new-password"
              />
              {errors.confirmPassword && (
                <p className="form-error">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Company Name Field */}
            <div className="form-group">
              <label htmlFor="companyName" className="form-label">
                Company Name
              </label>
              <input
                id="companyName"
                type="text"
                value={formData.companyName}
                onChange={handleChange('companyName')}
                className={`form-input ${errors.companyName ? 'error' : ''}`}
                placeholder="Your company name"
                disabled={isLoading}
                autoComplete="organization"
              />
              {errors.companyName && (
                <p className="form-error">{errors.companyName}</p>
              )}
            </div>

            {/* Submit Button */}
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
                  Creating account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Link to Login - Requirement 1.6 */}
          <div className="mt-6 text-center">
            <p className="text-sm" style={{ color: '#64748b' }}>
              Already have an account?{' '}
              <Link 
                to="/login" 
                className="font-medium hover:underline"
                style={{ color: '#0b6cf0' }}
              >
                Sign in
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

export default SignupPage;
