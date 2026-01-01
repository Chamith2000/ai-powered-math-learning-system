import { Link } from "react-router-dom";

const title = "Grow Your Python Superpowers — Anytime!";
const btnText = "Start Coding Now";

const skillList = [
  {
    imgUrl: "assets/images/skill/icon/01.jpg",
    imgAlt: "friendly mentor icon",
    title: "Friendly Mentors",
    desc: "Kind instructors who explain with stories & examples.",
  },
  {
    imgUrl: "assets/images/skill/icon/02.jpg",
    imgAlt: "certificate and badges icon",
    title: "Badges & Certificates",
    desc: "Collect fun badges and earn printable certificates.",
  },
  {
    imgUrl: "assets/images/skill/icon/03.jpg",
    imgAlt: "online lessons icon",
    title: "Interactive Lessons",
    desc: "Short, gamified activities and mini-projects.",
  },
  {
    imgUrl: "assets/images/skill/icon/04.jpg",
    imgAlt: "helping hand icon",
    title: "Helpful Hints",
    desc: "Step-by-step hints and quick feedback when stuck.",
  },
];

const Skill = () => {
  return (
    <div className="skill-section padding-tb">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-5 col-12">
            <div className="section-header">
              <h2 className="title">{title}</h2>
              <Link to="/signup" className="lab-btn">
                <span>{btnText}</span>
              </Link>
            </div>
          </div>
          <div className="col-lg-7 col-12">
            <div className="section-wrpper">
              <div className="row g-4 justify-content-center row-cols-sm-2 row-cols-1">
                {skillList.map((val, i) => (
                  <div className="col" key={i}>
                    <div className="skill-item">
                      <div className="skill-inner">
                        <div className="skill-thumb">
                          <img src={val.imgUrl} alt={val.imgAlt} />
                        </div>
                        <div className="skill-content">
                          <h5>{val.title}</h5>
                          <p>{val.desc}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Skill;
