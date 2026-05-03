import React from 'react'
import { Link } from 'react-router-dom'

const ResetForm = ({ path }) => {
    return (
        <>
            <div className="mb-4">
                <h2 className="fw-bolder mb-2" style={{ fontSize: '2rem', color: '#0f172a' }}>
                    Reset password
                </h2>
                <h4 className="fw-bold mb-3" style={{ fontSize: '1rem', color: '#334155' }}>
                    Recover your MathsBuddy admin access
                </h4>
                <p className="fw-medium mb-0" style={{ color: '#64748b', lineHeight: 1.7 }}>
                    Enter the email address linked to your admin account and we will send a password reset link.
                </p>
            </div>
            <form className="w-100 mt-4 pt-2">
                <div className="mb-4">
                    <label className="form-label fw-semibold" style={{ color: '#334155' }}>
                        Work Email
                    </label>
                    <input
                        className="form-control"
                        placeholder="name@mathsbuddy.com"
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
                <div className="mt-4 pt-2">
                    <button
                        type="submit"
                        className="btn btn-lg w-100"
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
                        Send Reset Link
                    </button>
                </div>
            </form>
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
                Reset links are sent only to authorized admin accounts.
            </div>
            <div className="mt-4 text-center" style={{ color: '#64748b' }}>
                <span>Remembered your password? </span>
                <Link to={path} className="fw-bold text-decoration-none" style={{ color: '#2563eb' }}>
                    Back to login
                </Link>
            </div>
        </>
    )
}

export default ResetForm
