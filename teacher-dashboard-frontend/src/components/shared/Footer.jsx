import React from 'react'
import { Link } from 'react-router-dom'

const Footer = () => {
    return (
        <footer className="footer">
            <p className="fs-11 text-muted fw-medium text-uppercase mb-0 copyright">
                <span>Copyright ©</span>
                {new Date().getFullYear()} MathsBuddy
            </p>
            <div className="d-flex align-items-center gap-4">
                <Link to="/admin/help" className="fs-11 fw-semibold text-uppercase">Help</Link>
                <Link to="/admin/terms" className="fs-11 fw-semibold text-uppercase">Terms</Link>
                <Link to="/admin/privacy" className="fs-11 fw-semibold text-uppercase">Privacy</Link>
            </div>
        </footer>
    )
}

export default Footer
