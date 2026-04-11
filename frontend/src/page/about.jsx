import { Fragment } from "react";
import Footer from "../component/layout/footer";
import Header from "../component/layout/header";
import PageHeader from "../component/layout/pageheader";
import AchievementTwo from "../component/section/achievement-2";
import Instructor from "../component/section/instructor";
import Skill from "../component/section/skill";

const subTitle = "About Maths Buddy";
const title = "Fun Maths Learning for Curious Kids";
const desc =
    "Maths Buddy makes maths playful and friendly! Through short lessons, stories, and interactive activities, children learn maths while building problem-solving skills and creativity in a safe, supportive space.";

const year = "8+";
const expareance = "Years Teaching Kids Maths";

const aboutList = [
  {
    imgUrl: "assets/images/about/icon/01.jpg",
    imgAlt: "friendly mentor icon",
    title: "Friendly Mentors",
    desc: "Patient, child-safe instructors who guide every step with smiles and simple explanations.",
  },
  {
    imgUrl: "assets/images/about/icon/02.jpg",
    imgAlt: "certificate and badge icon",
    title: "Badges and Certificates",
    desc: "Celebrate progress with colorful badges and printable certificates for every milestone.",
  },
  {
    imgUrl: "assets/images/about/icon/03.jpg",
    imgAlt: "online class icon",
    title: "Interactive Classes",
    desc: "Hands-on maths, puzzles, and games - learn by doing with interactive tools right in the browser.",
  },
];

const AboutPage = () => {
  return (
      <Fragment>
        <Header />
        <PageHeader title={"About Maths Buddy"} curPage={"About"} />

        <div className="py-5" style={{ backgroundColor: "#f0f8ff", position: "relative", overflow: "hidden" }}>
          {/* Soft decorative background elements */}
          <div style={{ position: "absolute", top: "10%", left: "-5%", width: "300px", height: "300px", backgroundColor: "#4F46E5", borderRadius: "50%", opacity: 0.1, filter: "blur(40px)" }}></div>
          <div style={{ position: "absolute", bottom: "10%", right: "-5%", width: "250px", height: "250px", backgroundColor: "#22C55E", borderRadius: "50%", opacity: 0.1, filter: "blur(40px)" }}></div>

          <div className="container position-relative z-1">
            <div className="row align-items-center g-5 mb-5">
              {/* Left side: Images and Badge */}
              <div className="col-lg-6">
                <div className="position-relative text-center">
                  <div className="card border-0 shadow-lg rounded-4 overflow-hidden d-inline-block" style={{ border: "8px solid #fff", transform: "rotate(-3deg)", transition: "transform 0.3s" }} onMouseEnter={(e) => e.currentTarget.style.transform = "rotate(0deg) scale(1.02)"} onMouseLeave={(e) => e.currentTarget.style.transform = "rotate(-3deg) scale(1)"}>
                    <img src="assets/images/about/01.jpg" alt="about" className="img-fluid" style={{ maxWidth: "400px" }} />
                  </div>

                  <div className="card shadow-lg border-0 position-absolute" style={{ bottom: "-20px", right: "10%", borderRadius: "24px", backgroundColor: "#ffca28", transform: "rotate(5deg)" }}>
                    <div className="card-body px-4 py-3 text-center">
                      <h2 className="display-4 fw-bold mb-0 text-white" style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.2)" }}>{year}</h2>
                      <span className="fw-bold" style={{ color: "#4e342e" }}>{expareance}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right side: Text and List */}
              <div className="col-lg-6">
                <div className="mb-4">
                <span className="badge rounded-pill bg-info text-dark px-4 py-2 fs-6 mb-3 fw-bold shadow-sm border border-2 border-white">
                  {subTitle}
                </span>
                  <h2 className="display-5 fw-bold mb-4" style={{ color: "#4F46E5", lineHeight: "1.2", fontFamily: "'Baloo 2', sans-serif" }}>{title}</h2>
                  <p className="fs-5 text-secondary fw-semibold mb-4 lh-lg">{desc}</p>
                </div>

                <div className="d-flex flex-column gap-3">
                  {aboutList.map((val, i) => (
                      <div className="card border-0 shadow-sm rounded-4" key={i} style={{ backgroundColor: "#ffffff" }}>
                        <div className="card-body p-3 d-flex align-items-center gap-3">
                          <div className="rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{ width: "60px", height: "60px", backgroundColor: "#e2e8f0" }}>
                            <img src={`${val.imgUrl}`} alt={`${val.imgAlt}`} style={{ width: "35px", height: "35px", borderRadius: "50%" }} />
                          </div>
                          <div>
                            <h5 className="fw-bold mb-1" style={{ color: "#4F46E5", fontFamily: "'Baloo 2', sans-serif" }}>{val.title}</h5>
                            <p className="mb-0 text-secondary fw-semibold small">{val.desc}</p>
                          </div>
                        </div>
                      </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <Instructor />
        <Skill />
        <AchievementTwo />
        <Footer />
      </Fragment>
  );
};

export default AboutPage;