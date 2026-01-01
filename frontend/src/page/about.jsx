import { Fragment } from "react";
import Footer from "../component/layout/footer";
import Header from "../component/layout/header";
import PageHeader from "../component/layout/pageheader";
import AchievementTwo from "../component/section/achievement-2";
import Instructor from "../component/section/instructor";
import Skill from "../component/section/skill";

const subTitle = "About Codingඉස්කොලේ";
const title = "Fun Python Learning for Curious Kids";
const desc =
  "Codingඉස්කොලේ makes coding playful and friendly! Through short lessons, stories, and mini-projects, children learn Python while building problem-solving skills and creativity in a safe, supportive space.";

const year = "8+";
const expareance = "Years Teaching Kids to Code";

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
    title: "Badges & Certificates",
    desc: "Celebrate progress with colorful badges and printable certificates for every milestone.",
  },
  {
    imgUrl: "assets/images/about/icon/03.jpg",
    imgAlt: "online class icon",
    title: "Interactive Classes",
    desc: "Hands-on coding, puzzles, and games—learn by doing with real Python right in the browser.",
  },
];

const AboutPage = () => {
  return (
    <Fragment>
      <Header />
      <PageHeader title={"About Codingඉස්කොලේ"} curPage={"About"} />
      <div className="about-section style-3 padding-tb section-bg">
        <div className="container">
          <div className="row justify-content-center row-cols-xl-2 row-cols-1 align-items-center">
            <div className="col">
              <div className="about-left">
                <div className="about-thumb">
                  <img src="assets/images/about/01.jpg" alt="about" />
                </div>
                <div className="abs-thumb">
                  <img src="assets/images/about/02.jpg" alt="about" />
                </div>
                <div className="about-left-content">
                  <h3>{year}</h3>
                  <p>{expareance}</p>
                </div>
              </div>
            </div>
            <div className="col">
              <div className="about-right">
                <div className="section-header">
                  <span className="subtitle">{subTitle}</span>
                  <h2 className="title">{title}</h2>
                  <p>{desc}</p>
                </div>
                <div className="section-wrapper">
                  <ul className="lab-ul">
                    {aboutList.map((val, i) => (
                      <li key={i}>
                        <div className="sr-left">
                          <img src={`${val.imgUrl}`} alt={`${val.imgAlt}`} />
                        </div>
                        <div className="sr-right">
                          <h5>{val.title}</h5>
                          <p>{val.desc}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
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
