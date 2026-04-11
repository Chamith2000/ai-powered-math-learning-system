import { useState } from "react";
import { useNavigate } from "react-router-dom";
import girl3 from '../../assets/images/banner/girl3.png';
const subTitle = "🌟 Welcome to the Fun Zone 🌟";
const title = (
    <h2 className="title" style={{ fontSize: "3.5rem", lineHeight: "1.2", marginBottom: "20px", textShadow: "0 4px 10px rgba(0,0,0,0.3)" }}>
        <span className="d-lg-block" style={{ color: "var(--lms-accent)", transform: "rotate(-2deg)", display: "inline-block" }}>Unlock Your </span>
        <span style={{ color: "white" }}>Maths Superpowers </span>
        <span className="d-lg-block" style={{ color: "var(--lms-secondary-light)" }}>Today!</span>
    </h2>
);
const desc = "Embark on magical adventures, play games, and discover how wildly fun numbers can be!";


const catagoryList = [
    {
        name: 'Maths Papers',
        link: '/paper-view',
        icon: 'icofont-file-document',
        bg: '#EEF2FF',
        color: '#4F46E5',
        hoverBg: '#4F46E5',
    },
    {
        name: 'Maths Lectures',
        link: '/visual-learning',
        icon: 'icofont-video-alt',
        bg: '#F0FDF4',
        color: '#16A34A',
        hoverBg: '#16A34A',
    },
    {
        name: 'Games',
        link: '/game-launch',
        icon: 'icofont-game-controller',
        bg: '#FFF7ED',
        color: '#EA580C',
        hoverBg: '#EA580C',
    },
]


const shapeList = [
    {
        name: '100% Students Satisfaction',
        link: '#',
        className: 'ccl-shape shape-1',
    },
    {
        name: '100+ Total Maths Courses',
        link: '#',
        className: 'ccl-shape shape-2',
    },
    {
        name: '99% Successful Students',
        link: '#',
        className: 'ccl-shape shape-3',
    },
    {
        name: '100+ Learners',
        link: '#',
        className: 'ccl-shape shape-4',
    },
]

const Banner = () => {

    const [searchQuery, setSearchQuery] = useState("");
    const [hoveredIndex, setHoveredIndex] = useState(null);
    const navigate = useNavigate();

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search-page/${searchQuery.trim()}`);
        }
    };


    return (
        <section className="banner-section" style={{ position: "relative", overflow: "hidden", fontFamily: "var(--lms-font-body)" }}>

            {/*Playful Floating Background Elements */}

            {/* 1. Addition (Bright Blue) */}
            <div className="floating-anim" style={{ position: 'absolute', top: '15%', left: '8%', fontSize: '5rem', opacity: 0.7, color: '#3B82F6', textShadow: '0 0 15px rgba(59, 130, 246, 0.5)' }}>➕</div>

            {/* 2. Subtraction (Cute Pink) */}
            <div className="floating-anim" style={{ position: 'absolute', top: '75%', left: '4%', fontSize: '5.5rem', opacity: 0.6, color: '#FB7185', animationDelay: '1s' }}>➖</div>

            {/* 3. Multiplication (Sunny Yellow) */}
            <div className="floating-anim" style={{ position: 'absolute', top: '10%', left: '48%', fontSize: '4.5rem', opacity: 0.8, color: '#FBBF24', animationDelay: '2s', textShadow: '0 0 20px rgba(251, 191, 36, 0.6)' }}>✖️</div>

            {/* 4. Division (Fresh Green) */}
            <div className="floating-anim" style={{ position: 'absolute', top: '85%', left: '45%', fontSize: '4.5rem', opacity: 0.6, color: '#34D399', animationDelay: '0.5s' }}>➗</div>

            {/* 5. Percentage (Purple Glow) */}
            <div className="floating-anim" style={{
                position: 'absolute', top: '8%', right: '18%', fontSize: '4.5rem', opacity: 0.7,
                color: '#A855F7', animationDelay: '1.5s', textShadow: '0 0 15px rgba(168, 85, 247, 0.5)'
            }}>%</div>

            {/* 6. Equal Sign (Orange) */}
            <div className="floating-anim" style={{ position: 'absolute', bottom: '15%', right: '10%', fontSize: '5rem', opacity: 0.6, color: '#F97316', animationDelay: '2.8s' }}>＝</div>

            {/* 7. Numbers (Extra Large 123) */}
            <div className="floating-anim" style={{ position: 'absolute', top: '45%', right: '4%', fontSize: '6rem', opacity: 0.3, color: '#FFFFFF', fontWeight: '900', animationDelay: '1.2s' }}>123</div>

            {/* --- GEOMETRY SHAPES (MADE LARGER) --- */}

            {/* 8. Geometry Shape - Triangle (Bright Blue) */}
            <div className="floating-anim" style={{
                position: 'absolute', top: '55%', left: '55%',
                fontSize: '6rem', // Size එක වැඩි කළා
                opacity: 0.5, color: '#60A5FA', animationDelay: '1.8s',
                filter: 'drop-shadow(0 0 10px rgba(96, 165, 250, 0.5))'
            }}>▲</div>

            {/* 9. Geometry Shape - Circle (Bright Pink) */}
            <div className="floating-anim" style={{
                position: 'absolute', top: '35%', left: '3%',
                fontSize: '5.5rem', // Size එක වැඩි කළා
                opacity: 0.4, color: '#F472B6', animationDelay: '2.2s',
                filter: 'drop-shadow(0 0 10px rgba(244, 114, 182, 0.5))'
            }}>●</div>

            {/* 10. Geometry Shape - Square (Lime Green - Added for more fun) */}
            <div className="floating-anim" style={{
                position: 'absolute', top: '65%', right: '25%',
                fontSize: '5rem',
                opacity: 0.4, color: '#A3E635', animationDelay: '0.3s'
            }}>■</div>

            {/* ========================================================================================= */}
            <div className="container">
                <div className="section-wrapper">
                    <div className="row align-items-center">
                        <div className="col-xxl-5 col-xl-6 col-lg-10">
                            <div className="banner-content">
                                <span className="lms-badge" style={{ backgroundColor: "#FFFBEB", color: "var(--lms-accent)", border: "3px solid var(--lms-accent-light)", display: "inline-block", marginBottom: "15px" }}>{subTitle}</span>
                                {title}
                                <p className="desc" style={{ fontSize: "1.4rem", color: "#E5E7EB", fontWeight: "700", marginBottom: "30px" }}>{desc}</p>
                                <form onSubmit={handleSearchSubmit} style={{
                                    borderRadius: "50px",
                                    border: "4px solid var(--lms-primary-light)",
                                    background: "#FFF",
                                    boxShadow: "0 8px 0 rgba(109,40,217,0.25)",
                                    display: "flex",
                                    alignItems: "center",
                                    overflow: "hidden",
                                    padding: "0"
                                }}>
                                    {/* Icon prefix — inside the bar */}
                                    <span style={{
                                        display: "flex",
                                        alignItems: "center",
                                        paddingLeft: "22px",
                                        paddingRight: "8px",
                                        flexShrink: 0
                                    }}>
                                        <i className="icofont-search" style={{
                                            fontSize: "1.4rem",
                                            color: "var(--lms-primary-light)"
                                        }}></i>
                                    </span>

                                    <input
                                        type="text"
                                        className="lms-input-no-border"
                                        placeholder="Find your next adventure..."
                                        value={searchQuery}
                                        onChange={handleSearchChange}
                                        style={{
                                            flex: 1,
                                            boxShadow: "none",
                                            padding: "16px 8px",
                                            fontSize: "1.1rem",
                                            background: "transparent",
                                            outline: "none",
                                            color: "#1F2937"
                                        }}
                                    />


                                    <button type="submit" style={{
                                        padding: "16px 36px",
                                        fontWeight: "800",
                                        fontSize: "1.15rem",
                                        background: "var(--lms-primary)",
                                        border: "none",
                                        color: "white",
                                        borderRadius: "0 46px 46px 0",
                                        cursor: "pointer",
                                        flexShrink: 0,
                                        margin: 0,
                                        letterSpacing: "0.3px"
                                    }}>🔍 Let's Go!</button>
                                </form>

                                {/* ── Category Buttons ── */}
                                <style>{`
                                    @keyframes catFadeIn {
                                        from { opacity: 0; transform: translateY(10px); }
                                        to   { opacity: 1; transform: translateY(0); }
                                    }
                                    .cat-btn {
                                        display: inline-flex;
                                        align-items: center;
                                        gap: 8px;
                                        padding: 9px 18px;
                                        border-radius: 50px;
                                        font-family: 'Nunito', sans-serif;
                                        font-weight: 800;
                                        font-size: 0.9rem;
                                        text-decoration: none;
                                        border: 2px solid transparent;
                                        cursor: pointer;
                                        transition: all 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
                                        box-shadow: 0 2px 10px rgba(0,0,0,0.07);
                                        animation: catFadeIn 0.4s ease both;
                                    }
                                    .cat-btn:nth-child(1) { animation-delay: 0.05s; }
                                    .cat-btn:nth-child(2) { animation-delay: 0.12s; }
                                    .cat-btn:nth-child(3) { animation-delay: 0.19s; }
                                    .cat-btn:hover {
                                        color: #fff !important;
                                        transform: translateY(-3px) scale(1.05);
                                        box-shadow: 0 8px 20px rgba(0,0,0,0.15);
                                    }
                                    .cat-btn .cat-icon {
                                        width: 28px;
                                        height: 28px;
                                        border-radius: 8px;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        font-size: 1rem;
                                        transition: background 0.22s ease, color 0.22s ease;
                                        flex-shrink: 0;
                                    }
                                `}</style>

                                <div className="banner-catagory d-flex flex-wrap align-items-center" style={{ gap: "10px", marginTop: "18px" }}>
                                    <p style={{ margin: 0, fontWeight: 700, color: "#6B7280", fontSize: "0.9rem", whiteSpace: "nowrap" }}>Most Popular :</p>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                                        {catagoryList.map((val, i) => (
                                            <a
                                                key={i}
                                                href={val.link}
                                                className="cat-btn"
                                                style={{
                                                    background: hoveredIndex === i ? val.hoverBg : val.bg,
                                                    color: hoveredIndex === i ? "#fff" : val.color,
                                                    borderColor: hoveredIndex === i ? val.hoverBg : `${val.color}33`,
                                                }}
                                                onMouseEnter={() => setHoveredIndex(i)}
                                                onMouseLeave={() => setHoveredIndex(null)}
                                            >
                                                <span
                                                    className="cat-icon"
                                                    style={{
                                                        background: hoveredIndex === i ? "rgba(255,255,255,0.2)" : `${val.color}18`,
                                                        color: hoveredIndex === i ? "#fff" : val.color,
                                                    }}
                                                >
                                                    <i className={val.icon}></i>
                                                </span>
                                                {val.name}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-xxl-7 col-xl-6">
                            <div className="banner-thumb floating-anim">
                                <img
                                    src="assets/images/banner/0001.png"
                                    alt="Math Superpowers"
                                    style={{marginLeft: "50px", height: "600px", objectFit: "contain"}}
                                />
                                {/*<img src="assets/images/banner/01.png" alt="img" />*/}
                                {/* <img src={girl3} alt="img" style={{marginLeft:"100px", height:"700px"}}/>*/}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="all-shapes"></div>
            <div className="cbs-content-list d-none">
                <ul className="lab-ul">
                    {shapeList.map((val, i) => (
                        <li className={val.className} key={i}><a href={val.link}>{val.name}</a></li>
                    ))}
                </ul>
            </div>
        </section>
    );
}

export default Banner;