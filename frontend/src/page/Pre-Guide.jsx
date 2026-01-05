import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Footer from "../component/layout/footer";
import Header from "../component/layout/header";
import PageHeader from "../component/layout/pageheader";
import apiClient from "../api";
import "../assets/css/Category.css";

const CATEGORY_STYLE_KEY = {
  VisualLearning: "visual",
  AuditoryLearning: "auditory",
  KinestheticLearning: "kinesthetic",
  ReadAndWriteLearning: "readwrite",
};

const PreGuide = () => {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

  const [bestStyleKey, setBestStyleKey] = useState(null); // "visual" | "auditory" | "kinesthetic" | "readwrite" | null
  const [averages, setAverages] = useState(null); // optional debugging/tooltip use

  const categories = [
    {
      key: "VisualLearning",
      title: "Visual Learning",
      desc: "Diagrams, flowcharts, animations, and screen-walkthroughs that make concepts click at a glance.",
      img: "../images/categories/visual.jpg",
    },
    {
      key: "AuditoryLearning",
      title: "Auditory Learning",
      desc: "Narrated explanations, podcasts, and talk-through sessions to learn by listening.",
      img: "../images/categories/auditory.jpg",
    },
    {
      key: "KinestheticLearning",
      title: "Kinesthetic Learning",
      desc: "Hands-on practice, guided labs, and interactive tasks to learn by doing.",
      img: "../images/categories/kinesthetic.jpg",
    },
    {
      key: "ReadAndWriteLearning",
      title: "Read & Write Learning",
      desc: "Structured notes, reading materials, and exercises for deep understanding.",
      img: "../images/categories/readwrite.jpg",
    },
  ];

  useEffect(() => {
    const fetchUserAndCompute = async () => {
      if (!userId) return;

      try {
        const res = await apiClient.get(`/api/users/${userId}`);
        const u = res?.data || {};

        // Pull your new columns from the user profile (defaults = 0)
        const vCount = Number(u.VisualLearningCount ?? 0);
        const vTotal = Number(u.VisualLearningTotalMarks ?? 0);

        const aCount = Number(u.AuditoryLearningCount ?? 0);
        const aTotal = Number(u.AuditoryLearningTotalMarks ?? 0);

        const kCount = Number(u.KinestheticLearningCount ?? 0);
        const kTotal = Number(u.KinestheticLearningTotal ?? 0);

        const rCount = Number(u.ReadWriteLearningCount ?? 0);
        const rTotal = Number(u.ReadWriteLearningTotal ?? 0);

        const visualAvg = vCount > 0 ? vTotal / vCount : -1;       // use -1 to ignore “no data”
        const auditoryAvg = aCount > 0 ? aTotal / aCount : -1;
        const kinestheticAvg = kCount > 0 ? kTotal / kCount : -1;
        const readwriteAvg = rCount > 0 ? rTotal / rCount : -1;

        const avgs = {
          visual: visualAvg,
          auditory: auditoryAvg,
          kinesthetic: kinestheticAvg,
          readwrite: readwriteAvg,
        };
        setAverages(avgs);

        // Pick highest average among those that have data (>= 0)
        const entries = Object.entries(avgs).filter(([, avg]) => avg >= 0);
        if (entries.length === 0) {
          setBestStyleKey(null);
          return;
        }
        entries.sort((a, b) => b[1] - a[1]);
        setBestStyleKey(entries[0][0]); // "visual" | "auditory" | "kinesthetic" | "readwrite"
      } catch (e) {
        // If fetch fails, just don’t highlight anything
        setBestStyleKey(null);
      }
    };

    fetchUserAndCompute();
  }, [userId]);

  const goToCategory = (key) => {
    navigate(`/${key}`);
  };

  const isMatch = (catKey) => {
    const styleKey = CATEGORY_STYLE_KEY[catKey];
    return bestStyleKey && styleKey === bestStyleKey;
  };

  return (
    <>
      <Header />
      <PageHeader title={"Python Pre-Learning Styles"} curPage={"Categories"} />

      <div className="course-section padding-tb section-bg">
        <div className="container">
          <div className="section-header text-center mb-4">
            <h3 className="mb-2">Choose Your Learning Style</h3>
            <p className="text-muted">
              Pick a category to explore Python content curated for how you learn best.
            </p>
          </div>

          <div className="section-wrapper">
            <div className="row g-4 justify-content-center row-cols-xl-4 row-cols-md-2 row-cols-1">
              {categories.map((cat) => {
                const matched = isMatch(cat.key);
                return (
                  <div className="col" key={cat.key}>
                    <div className="course-item h-100 position-relative">
                      {/* Matched ribbon */}
                      {matched && (
                        <span className="badge bg-success position-absolute top-0 end-0 m-2">
                          Matched for you
                        </span>
                      )}

                      <div className="course-inner d-flex flex-column h-100">
                        <div className="course-thumb" style={{ overflow: "hidden" }}>
                          <img
                            src={cat.img}
                            alt={cat.title}
                            style={{ width: "100%", height: 220, objectFit: "cover" }}
                          />
                        </div>

                        <div className="course-content d-flex flex-column flex-grow-1">
                          <div className="course-category mb-2">
                            <div className="course-cate">
                              <span className={`badge ${matched ? "bg-success" : "bg-primary"}`}>
                                {matched ? "Recommended" : cat.key}
                              </span>
                            </div>
                          </div>

                          <h4 className="mb-2">{cat.title}</h4>
                          <p className="text-muted flex-grow-1" style={{ minHeight: 60 }}>
                            {cat.desc}
                          </p>

                          {matched && (
                            <div className="text-success small mb-2">
                              This matches your recent learning performance.
                            </div>
                          )}

                          <div className="course-footer d-flex align-items-center justify-content-between">
                            <div className="course-author">
                              <span className="ca-name">Python Tracks</span>
                            </div>
                            <div className="course-btn">
                              <button
                                className="lab-btn-text"
                                onClick={() => goToCategory(cat.key)}
                                aria-label={`Explore ${cat.title}`}
                                title={`Explore ${cat.title}`}
                              >
                                Explore <i className="icofont-external-link"></i>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-center mt-4">
              {categories.map((c) => (
                <Link
                  key={c.key}
                  to={`/${c.key}`}
                  className={`btn m-1 ${isMatch(c.key) ? "btn-success" : "btn-outline-primary"}`}
                >
                  {c.title}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default PreGuide;
