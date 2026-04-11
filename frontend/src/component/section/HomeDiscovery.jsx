import React from 'react';
import { Link } from 'react-router-dom';

const HomeDiscovery = () => {
    const discoveryFeatures = [
        {
            title: "Learn by Building",
            desc: "Create cool apps and games while mastering maths step-by-step!",
            icon: "/assets/images/discovery/building.png",
            bg: "linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)", // Deep Navy
            color: "#FFFFFF",
            accent: "#4F46E5",
            delay: "0.1s",
            gridArea: "span 2 / span 2"
        },
        {
            title: "Maths Playground",
            desc: "Run code in your browser and get magic instant feedback!",
            icon: "/assets/images/discovery/playground.png",
            bg: "#ffffff",
            color: "#1E1B4B",
            accent: "#0EA5E9",
            delay: "0.2s",
            gridArea: "span 1 / span 2"
        },
        {
            title: "Friendly Mentors",
            desc: "Our kind guides explain everything with stories.",
            icon: "/assets/images/discovery/mentor.png",
            bg: "linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)", // Deep Navy (Swapped for balance)
            color: "#FFFFFF",
            accent: "#8B5CF6",
            delay: "0.3s",
            gridArea: "span 1 / span 1"
        },
        {
            title: "Magic Badges",
            desc: "Collect shiny badges and earn certificates!",
            icon: "/assets/images/discovery/badge.png",
            bg: "#ffffff", // Swapped for balance
            color: "#1E1B4B",
            accent: "#F59E0B",
            delay: "0.4s",
            gridArea: "span 1 / span 1"
        },
        {
            title: "Fun Lessons",
            desc: "Short, gamified activities that feel like a game.",
            icon: "/assets/images/discovery/lesson.png",
            bg: "linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)", // Deep Navy
            color: "#FFFFFF",
            accent: "#10B981",
            delay: "0.5s",
            gridArea: "span 1 / span 2"
        },
        {
            title: "Helpful Hints",
            desc: "Get step-by-step hints whenever you're stuck.",
            icon: null,
            bg: "#ffffff",
            color: "#1E1B4B",
            accent: "#F43F5E",
            delay: "0.6s",
            isLucide: true,
            gridArea: "span 1 / span 2"
        }
    ];

    return (
        <section className="discovery-section" style={{ 
            backgroundColor: "#F9FAFB", 
            position: "relative", 
            overflow: "hidden", 
            padding: "100px 0" 
        }}>
            {/* Ambient Background Decorative Elements */}
            <div className="discovery-bg-shapes" style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none", opacity: 0.4 }}>
                <div style={{ position: "absolute", top: "10%", left: "5%", width: "300px", height: "300px", borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)" }} />
                <div style={{ position: "absolute", bottom: "10%", right: "5%", width: "400px", height: "400px", borderRadius: "50%", background: "radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)" }} />
            </div>

            <div className="container" style={{ position: "relative", zIndex: 1 }}>
                <div className="text-center mb-5 px-3">
                    <span className="subtitle" style={{ 
                        color: "var(--lms-primary)", 
                        fontWeight: "900", 
                        textTransform: "uppercase", 
                        letterSpacing: "4px", 
                        fontSize: "0.9rem",
                        background: "rgba(139,92,246,0.12)",
                        padding: "10px 24px",
                        borderRadius: "50px",
                        display: "inline-block",
                        marginBottom: "24px"
                    }}>
                        Explore the Fun Zone
                    </span>
                    <h2 className="display-4 fw-bold mb-4" style={{ 
                        fontFamily: "'Baloo 2', sans-serif", 
                        color: "var(--lms-text)",
                        lineHeight: "1.2",
                        letterSpacing: "-1px"
                    }}>
                        Your Premium <span style={{ color: "var(--lms-primary)" }}>Learning Adventure</span>
                    </h2>
                    <p className="lead text-muted mx-auto" style={{ maxWidth: "750px", fontSize: "1.15rem", lineHeight: "1.7" }}>
                        Bored of traditional learning? We've built an interactive, gamified universe where you 
                        master math by building real magic. Every click is a high-speed adventure!
                    </p>
                </div>

                {/* Bento Grid Layout - Highly Optimized */}
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gridAutoRows: "minmax(240px, auto)",
                    gap: "30px",
                    marginTop: "60px"
                }}>
                    {discoveryFeatures.map((feat, i) => (
                        <div key={i} className="bento-container" style={{ 
                            gridArea: feat.gridArea 
                        }}>
                            <div className={`discovery-bento-card ${feat.color === "#FFFFFF" ? "lms-force-white" : ""}`} style={{
                                height: "100%",
                                background: feat.bg,
                                color: feat.color,
                                border: feat.bg === "#ffffff" ? "2px solid #F3F4F6" : "none",
                                borderRadius: "40px",
                                padding: "40px",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "center",
                                transition: "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
                                boxShadow: feat.bg === "#ffffff" ? "0 15px 35px rgba(0,0,0,0.03)" : "0 25px 50px rgba(30,27,75,0.25)",
                                position: "relative",
                                overflow: "hidden"
                            }}>

                                {/* GLOW EFFECT OVERLAY */}
                                <div className="shine-glow" style={{
                                    position: "absolute",
                                    top: "0", left: "0", right: "0", bottom: "0",
                                    background: `radial-gradient(circle at 10% 10%, ${feat.accent}20 0%, transparent 80%)`,
                                    pointerEvents: "none"
                                }}></div>

                                <div className="d-flex align-items-center gap-4">
                                    <div className="bento-icon-box" style={{
                                        width: "85px",
                                        height: "85px",
                                        borderRadius: "24px",
                                        background: feat.accent,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flexShrink: 0,
                                        boxShadow: `0 12px 24px ${feat.accent}40`,
                                        position: "relative"
                                    }}>
                                        {feat.isLucide ? (
                                            <i className="icofont-light-bulb" style={{ fontSize: "2.5rem", color: "#fff" }}></i>
                                        ) : (
                                            <img src={feat.icon} alt={feat.title} style={{ 
                                                width: "55px", 
                                                height: "55px", 
                                                objectFit: "contain",
                                                filter: "drop-shadow(0 5px 10px rgba(0,0,0,0.1))"
                                            }} />
                                        )}
                                        {/* Dynamic Icon Pulse Glow */}
                                        <div style={{
                                            position: "absolute",
                                            inset: "-10px",
                                            border: `2px solid ${feat.accent}`,
                                            borderRadius: "28px",
                                            opacity: 0,
                                            scale: 0.8,
                                            transition: "all 0.4s ease"
                                        }} className="icon-pulse-border"></div>
                                    </div>
                                    <div className="bento-text" style={{ position: "relative", zIndex: 2 }}>
                                        <h3 style={{ 
                                            fontFamily: "'Baloo 2', sans-serif", 
                                            fontWeight: "800", 
                                            marginBottom: "10px", 
                                            fontSize: feat.gridArea.includes("2 / span 2") ? "2.2rem" : "1.5rem",
                                            color: feat.color, /* FORCED WHITE/DARK */
                                            letterSpacing: "-0.5px"
                                        }}>
                                            {feat.title}
                                        </h3>
                                        <p style={{ 
                                            color: feat.color === "#FFFFFF" ? "rgba(255,255,255,0.85)" : "#4B5563", 
                                            fontSize: "1.05rem",
                                            lineHeight: "1.6",
                                            margin: 0
                                        }}>
                                            {feat.desc}
                                        </p>
                                    </div>
                                </div>

                                <style>{`
                                    .discovery-bento-card:hover {
                                        transform: translateY(-12px) scale(1.02);
                                        box-shadow: 0 40px 80px rgba(30, 27, 75, 0.35) !important;
                                    }
                                    
                                    .discovery-bento-card:hover .icon-pulse-border {
                                        opacity: 0.3;
                                        scale: 1.1;
                                    }

                                    .discovery-bento-card:hover .bento-icon-box {
                                        transform: rotate(-5deg) scale(1.05);
                                        transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                                    }

                                    @media (max-width: 1200px) {
                                        .container-fluid { padding: 0 30px; }
                                    }

                                    @media (max-width: 991px) {
                                        .discovery-section > .container > div:nth-child(2) {
                                            grid-template-columns: repeat(1, 1fr) !important;
                                            gap: 20px !important;
                                        }
                                        .bento-container {
                                            grid-area: auto !important;
                                        }
                                        .discovery-section {
                                            padding: 80px 0;
                                        }
                                        .display-4 {
                                            font-size: 2.5rem !important;
                                        }
                                    }
                                    
                                    @media (max-width: 575px) {
                                        .discovery-bento-card {
                                            padding: 40px 25px;
                                        }
                                        .discovery-bento-card .d-flex {
                                            flex-direction: column;
                                            text-align: center;
                                            gap: 20px;
                                        }
                                        .discovery-bento-card .bento-icon-box {
                                            margin: 0 auto;
                                        }
                                    }
                                `}</style>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="text-center mt-5 pt-4">
                    <Link to="/signup" className="lab-btn" style={{ fontSize: "1.2rem", padding: "18px 48px" }}>
                        <span>Start Your Free Adventure ✨</span>
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default HomeDiscovery;
