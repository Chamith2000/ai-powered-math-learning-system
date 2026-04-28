import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '../../contentApi/authApi';
import { setToken } from '../../utils/token';
import Swal from 'sweetalert2';

const LoginForm = ({ resetPath }) => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    Swal.fire({
      title: 'Please wait...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const { token, user } = await loginUser(email, password);

      const isAdmin =
        user?.role === '67c7e5882770ea591aec8bd3' ||
        (user?.roleName && user.roleName.toLowerCase().includes('admin'));

      if (!isAdmin) {
        Swal.close();
        Swal.fire({
          icon: 'error',
          title: 'Access Denied',
          text: 'You do not have permission to access the admin panel.',
        });
        return;
      }

      const displayName =
        [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
        user?.username ||
        user?.email ||
        'User';

      setToken(token, user?.id, displayName);

      Swal.close();
      await Swal.fire({
        icon: 'success',
        title: 'Login Successful',
        text: `Welcome back, ${displayName}!`,
        timer: 1500,
        showConfirmButton: false,
      });

      navigate('/');
    } catch (error) {
      Swal.close();
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        'Invalid credentials';
      setErrorMsg(msg);
      Swal.fire({
        icon: 'error',
        title: 'Login Failed',
        text: msg,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mb-4">
        <h2 className="fw-bolder mb-2" style={{ fontSize: '2rem', color: '#0f172a' }}>
          Welcome back
        </h2>
        <h4 className="fw-bold mb-3" style={{ fontSize: '1rem', color: '#334155' }}>
          Sign in to the MathsBuddy admin workspace
        </h4>
        <p className="fw-medium mb-0" style={{ color: '#64748b', lineHeight: 1.7 }}>
          Use your authorized admin account to manage content, review feedback, and keep the learning system running smoothly.
        </p>
      </div>

      <form className="w-100 mt-4 pt-2" onSubmit={handleSubmit}>
        {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}

        <div className="mb-4">
          <label className="form-label fw-semibold" style={{ color: '#334155' }}>
            Work Email
          </label>
          <input
            type="email"
            className="form-control"
            placeholder="name@mathsbuddy.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
            style={{
              minHeight: '54px',
              borderRadius: '16px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              boxShadow: 'none',
              padding: '0 16px'
            }}
          />
        </div>
        <div className="mb-3">
          <label className="form-label fw-semibold" style={{ color: '#334155' }}>
            Password
          </label>
          <div className="position-relative">
          <input
            type={showPassword ? 'text' : 'password'}
            className="form-control"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            style={{
              minHeight: '54px',
              borderRadius: '16px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              boxShadow: 'none',
              padding: '0 56px 0 16px'
            }}
          />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="btn btn-link position-absolute top-50 end-0 translate-middle-y text-decoration-none"
              style={{ color: '#475569', fontWeight: 700, paddingRight: '16px' }}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap mt-4">
          <div>
            <div className="custom-control custom-checkbox">
              <input type="checkbox" className="custom-control-input" id="rememberMe" />
              <label className="custom-control-label c-pointer fw-semibold" htmlFor="rememberMe" style={{ color: '#475569' }}>
                Keep me signed in on this device
              </label>
            </div>
          </div>
          <div>
            <Link to={resetPath} className="text-decoration-none fw-bold" style={{ color: '#2563eb', fontSize: '0.9rem' }}>
              Forgot password?
            </Link>
          </div>
        </div>

        <div className="mt-4 pt-2">
          <button
            type="submit"
            className="btn btn-lg w-100"
            disabled={loading}
            style={{
              minHeight: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #312e81 0%, #2563eb 100%)',
              border: 'none',
              color: '#ffffff',
              fontWeight: 800,
              boxShadow: '0 18px 32px rgba(37, 99, 235, 0.28)'
            }}
          >
            {loading ? 'Signing in...' : 'Login to Admin Panel'}
          </button>
        </div>

        <div
          className="mt-4 px-3 py-3 rounded-4"
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            color: '#64748b',
            fontSize: '0.88rem',
            lineHeight: 1.7,
            textAlign: 'center'
          }}
        >
          Authorized admins only.
        </div>
      </form>
    </>
  );
};

export default LoginForm;
