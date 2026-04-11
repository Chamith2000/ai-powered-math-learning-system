import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '../../contentApi/authApi';
import { setToken } from '../../utils/token';
import Swal from 'sweetalert2';

const LoginForm = ({ registerPath, resetPath }) => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

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
      <h2 className="fs-20 fw-bolder mb-4">Login</h2>
      <h4 className="fs-13 fw-bold mb-2">Login to your account</h4>
      <p className="fs-12 fw-medium text-muted">
        Thank you for get back <strong>MathsBuddy </strong> Admin applications.
      </p>

      <form className="w-100 mt-4 pt-2" onSubmit={handleSubmit}>
        {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}

        <div className="mb-4">
          <input
            type="email"
            className="form-control"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
          />
        </div>
        <div className="mb-3">
          <input
            type="password"
            className="form-control"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>

        If you want to bring this back later:
        <div className="d-flex align-items-center justify-content-between">
          <div>
            <div className="custom-control custom-checkbox">
              <input type="checkbox" className="custom-control-input" id="rememberMe" />
              <label className="custom-control-label c-pointer" htmlFor="rememberMe">Remember Me</label>
            </div>
          </div>
          <div>
            <Link to={resetPath} className="fs-11 text-primary">Forget password?</Link>
          </div>
        </div>
       

        <div className="mt-5">
          <button type="submit" className="btn btn-lg btn-primary w-100" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </div>
      </form>
    </>
  );
};

export default LoginForm;
