import React from 'react';
import CountUp from 'react-countup';

const subTitle = "Our Magic Numbers";
const title = "We're Growing Faster Than Ever!";

const achievementList = [
  {
    count: '250',
    desc: 'Kids Mastered Maths',
    icon: "icofont-users-social",
    color: "#8B5CF6"
  },
  {
    count: '1500',
    desc: 'Quizzes Completed',
    icon: "icofont-game-console",
    color: "#10B981"
  },
  {
    count: '98',
    desc: 'Success Score',
    icon: "icofont-chart-line",
    color: "#F59E0B",
    suffix: "%"
  },
  {
    count: '5',
    desc: 'Expert Tutors',
    icon: "icofont-teacher",
    color: "#0EA5E9"
  },
];

const AchievementTwo = () => {
  return (
    <section className="achievement-section padding-tb" style={{ 
      background: "linear-gradient(rgba(139,92,246,0.05), rgba(79,70,229,0.03))",
      borderRadius: "60px",
      margin: "40px 15px",
      padding: "80px 0"
    }}>
      <div className="container">
        <div className="section-header text-center mb-5 px-3">
          <span className="subtitle" style={{ 
            color: "var(--lms-primary)", 
            fontWeight: "800",
            background: "#fff",
            padding: "5px 15px",
            borderRadius: "50px",
            boxShadow: "0 4px 10px rgba(0,0,0,0.05)"
          }}>{subTitle}</span>
          <h2 className="title mt-3" style={{ fontSize: "2.5rem", fontFamily: "'Baloo 2', sans-serif" }}>{title}</h2>
        </div>
        
        <div className="section-wrapper">
          <div className="row g-4 justify-content-center">
            {achievementList.map((val, i) => (
              <div className="col-lg-3 col-sm-6 col-12" key={i}>
                <div className="achievement-card" style={{
                  background: "#fff",
                  padding: "40px 20px",
                  borderRadius: "32px",
                  textAlign: "center",
                  transition: "all 0.4s ease",
                  border: "1px solid rgba(0,0,0,0.05)",
                  boxShadow: "0 10px 20px rgba(0,0,0,0.02)",
                  position: "relative",
                  overflow: "hidden",
                  height: "100%"
                }}>
                  {/* THE SHINE EFFECT */}
                  <div className="shine-effect"></div>

                  <div className="achievement-icon mb-3 mx-auto" style={{
                    width: "70px",
                    height: "70px",
                    background: `${val.color}10`,
                    color: val.color,
                    borderRadius: "20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "2rem",
                    transition: "transform 0.3s ease"
                  }}>
                    <i className={val.icon}></i>
                  </div>
                  <h2 className="mb-2" style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: "800", color: "#1F2937", fontSize: "2.2rem" }}>
                    <span className="count"><CountUp end={val.count} duration={3} /></span>
                    <span style={{ color: val.color }}>{val.suffix || "+"}</span>
                  </h2>
                  <p style={{ color: "#6B7280", fontWeight: "600", margin: 0 }}>{val.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <style>{`
        .achievement-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 30px 60px rgba(139,92,246,0.1) !important;
          border-color: var(--lms-primary-light);
        }
        
        .achievement-card:hover .achievement-icon {
          transform: scale(1.1) rotate(5deg);
        }

        .achievement-card .shine-effect {
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
        
        .achievement-card:hover .shine-effect {
          left: 200%;
          transition: 0.8s ease-in-out;
        }

        @media (max-width: 575px) {
          .achievement-section {
            border-radius: 40px;
            margin: 20px 10px;
            padding: 50px 0;
          }
          .achievement-section .title {
            font-size: 1.8rem !important;
          }
          .achievement-card {
            padding: 30px 15px;
          }
        }
      `}</style>
    </section>
  );
}

export default AchievementTwo;