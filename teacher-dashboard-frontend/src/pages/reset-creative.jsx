import React from 'react'
import ResetForm from '@/components/authentication/ResetForm'

const ResetCreative = () => {
    return (
        <main className="auth-creative-wrapper">
            <div className="auth-creative-inner">
                <div className="creative-card-wrapper">
                    <div
                        className="card my-4 overflow-hidden border-0"
                        style={{
                            zIndex: 1,
                            borderRadius: '24px',
                            background: '#ffffff',
                            boxShadow: '0 24px 70px rgba(15, 23, 42, 0.16)'
                        }}
                    >
                        <div className="row flex-1 g-0">
                            <div className="col-lg-6 h-100 my-auto order-1 order-lg-0 position-relative">
                                <div
                                    className="position-absolute top-50 start-100 translate-middle d-none d-lg-flex align-items-center justify-content-center"
                                    style={{
                                        width: '88px',
                                        height: '88px',
                                        borderRadius: '50%',
                                        background: '#ffffff',
                                        border: '5px solid #dbeafe',
                                        boxShadow: '0 14px 30px rgba(15, 23, 42, 0.18)',
                                        overflow: 'hidden',
                                        zIndex: 3
                                    }}
                                >
                                    <img
                                        src="/images/LIXRLogo.png"
                                        alt="MathsBuddy logo"
                                        className="img-fluid"
                                        style={{
                                            width: '78%',
                                            height: '78%',
                                            objectFit: 'contain'
                                        }}
                                    />
                                </div>
                                <div
                                    className="creative-card-body card-body p-sm-5"
                                    style={{
                                        padding: '44px 40px'
                                    }}
                                >
                                    <ResetForm path={"/authentication/login/creative"} />
                                </div>
                            </div>
                            <div
                                className="col-lg-6 order-0 order-lg-1"
                                style={{
                                    background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                            >
                                <div
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        background: 'radial-gradient(circle at top right, rgba(255,255,255,0.24), transparent 34%), radial-gradient(circle at bottom left, rgba(255,255,255,0.14), transparent 38%)'
                                    }}
                                ></div>
                                <div
                                    className="h-100 d-flex flex-column justify-content-center"
                                    style={{ padding: '48px 42px', position: 'relative', minHeight: '100%' }}
                                >
                                    <div className="mb-4">
                                        <h1
                                            className="mb-3"
                                            style={{
                                                color: '#ffffff',
                                                fontSize: '2.1rem',
                                                fontWeight: 800,
                                                lineHeight: 1.2
                                            }}
                                        >
                                            Reset Password
                                        </h1>
                                        <p
                                            className="mb-0"
                                            style={{
                                                color: 'rgba(255,255,255,0.86)',
                                                fontSize: '0.98rem',
                                                lineHeight: 1.75,
                                                maxWidth: '420px',
                                                fontWeight: 500
                                            }}
                                        >
                                            Enter your admin email address and we will send you the reset instructions needed to regain access safely.
                                        </p>
                                    </div>

                                    <div className="text-center text-lg-end">
                                        <img
                                            src="/images/auth/auth-user.png"
                                            alt="Admin dashboard illustration"
                                            className="img-fluid"
                                            style={{
                                                maxHeight: '280px',
                                                objectFit: 'contain',
                                                filter: 'drop-shadow(0 18px 34px rgba(15, 23, 42, 0.28))'
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>

    )
}

export default ResetCreative
