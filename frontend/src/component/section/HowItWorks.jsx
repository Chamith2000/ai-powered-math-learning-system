import React from 'react';

const HowItWorks = () => {
    const steps = [
        {
            number: "01",
            title: "Choose Your Topic",
            desc: "Pick your favorite maths adventure—from fractions to fun algebra. We've got everything!",
            icon: "icofont-search-map",
            bg: "#8B5CF6",
            shadow: "0 10px 0 #6D28D9"
        },
        {
            number: "02",
            title: "Play and Learn",
            desc: "Watch magic videos, play games, and solve puzzles to grow your maths superpowers.",
            icon: "icofont-magic",
            bg: "#10B981",
            shadow: "0 10px 0 #059669"
        },
        {
            number: "03",
            title: "Level Up!",
            desc: "Earn shiny badges and unlock secret levels as you become a true Maths Hero.",
            icon: "icofont-trophy-alt",
            bg: "#F59E0B",
            shadow: "0 10px 0 #D97706"
        }
    ];

    return (
        <section className="how-it-works-section padding-tb" style={{ backgroundColor: "#FDFCF6", position: "relative", padding: "80px 0" }}>
            <div className="container">
                <div className="section-header text-center mb-5 px-3">
                    <span className="subtitle" style={{ color: "var(--lms-primary)", fontWeight: "800", background: "rgba(139,92,246,0.1)", padding: "5px 15px", borderRadius: "50px" }}>3 Simple Steps</span>
                    <h2 className="title mt-3" style={{ fontSize: "2.5rem", fontFamily: "'Baloo 2', sans-serif" }}>How to Start Your Journey</h2>
                </div>
                
                <div className="row g-4 justify-content-center">
                    {steps.map((step, i) => (
                        <div className="col-lg-4 col-md-6" key={i}>
                            <div className="how-step-card text-center" style={{
                                background: "#fff",
                                borderRadius: "32px",
                                padding: "60px 30px",
                                border: "2px solid #F3F4F6",
                                position: "relative",
                                transition: "all 0.3s ease",
                                overflow: "hidden",
                                height: "100%"
                            }}>
                                {/* THE SHINE EFFECT */}
                                <div className="shine-effect"></div>

                                <div className="step-number" style={{
                                    position: "absolute",
                                    top: "20px",
                                    right: "20px",
                                    width: "45px",
                                    height: "45px",
                                    background: step.bg,
                                    color: "#fff",
                                    borderRadius: "50%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "1.2rem",
                                    fontWeight: "800",
                                    boxShadow: `0 5px 15px ${step.bg}40`
                                }}>
                                    {step.number}
                                </div>
                                
                                <div className="step-icon mb-4 mt-2" style={{
                                    fontSize: "4.5rem",
                                    color: step.bg,
                                    filter: `drop-shadow(0 10px 10px ${step.bg}20)`
                                }}>
                                    <i className={step.icon}></i>
                                </div>
                                
                                <h4 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: "800", marginBottom: "16px", color: "#1F2937" }}>
                                    {step.title}
                                </h4>
                                <p style={{ color: "#6B7280", margin: 0, lineHeight: "1.7", fontSize: "1rem" }}>
                                    {step.desc}
                                </p>

                                <style>{`
                                    .how-step-card:hover {
                                        transform: translateY(-12px);
                                        border-color: ${step.bg}50;
                                        box-shadow: 0 30px 60px rgba(0,0,0,0.08);
                                    }
                                    
                                    .how-step-card .shine-effect {
                                        position: absolute;
                                        top: 0;
                                        left: -150%;
                                        width: 50%;
                                        height: 100%;
                                        background: linear-gradient(
                                            to right, 
                                            transparent 0%, 
                                            rgba(255, 255, 255, 0.4) 50%, 
                                            transparent 100%
                                        );
                                        transform: skewX(-25deg);
                                        transition: 0s;
                                        z-index: 1;
                                    }
                                    
                                    .how-step-card:hover .shine-effect {
                                        left: 200%;
                                        transition: 0.7s ease-in-out;
                                    }

                                    @media (max-width: 575px) {
                                        .how-step-card {
                                            padding: 40px 20px;
                                        }
                                        .how-it-works-section .title {
                                            font-size: 2rem !important;
                                        }
                                    }
                                `}</style>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default HowItWorks;
