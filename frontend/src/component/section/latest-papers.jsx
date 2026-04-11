import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import paperimg from "../../assets/images/papers/paperimg.jpg";
import apiClient from "../../api";
import "../../assets/css/LatestCourse.css";


const subTitle = "Featured Maths Papers";
const title = "Latest Maths Papers";

const LatestPapers = () => {
    const [papers, setPapers] = useState([]);
    const [loading, setLoading] = useState(true);

    const difficultyLevel = useMemo(() => {
        const dl = localStorage.getItem("difficultyLevel");
        return (dl || "").trim().toLowerCase();
    }, []);

    useEffect(() => {
        const fetchPapers = async () => {
            try {
                const res = await apiClient.get("/api/maths/papers");
                const raw = Array.isArray(res.data) ? res.data : [];
                const sorted = [...raw]
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .slice(0, 6);
                setPapers(sorted);
            } catch (err) {
                console.error("Error fetching papers:", err);
                setPapers([]);
            } finally {
                setLoading(false);
            }
        };
        fetchPapers();
    }, []);

    const isPaperRecommended = (paperDifficulty) => {
        const pd = (paperDifficulty || "").trim().toLowerCase();
        return difficultyLevel && pd === difficultyLevel;
    };

    return (
        <div className="course-section padding-tb section-bg" style={{ backgroundColor: "#F9FAFB" }}>
            <div className="container">
                <div className="section-header text-center lms-section-header">
                    <span className="subtitle" style={{ color: "#4F46E5", fontWeight: "800" }}>{subTitle}</span>
                    <h2 className="title" style={{ fontSize: "2rem", fontFamily: "'Baloo 2', sans-serif" }}>{title}</h2>
                </div>

                <div className="section-wrapper">
                    <div className="row g-4 justify-content-center row-cols-xl-3 row-cols-md-2 row-cols-1">
                        {loading && (
                            <div className="col-12 text-center text-muted py-4">
                                Loading latest papers…
                            </div>
                        )}

                        {!loading && papers.length === 0 && (
                            <div className="col-12 text-center text-muted py-4">
                                No papers found.
                            </div>
                        )}

                        {!loading && papers.map((paper) => {
                            const recommended = isPaperRecommended(paper.paperDifficulty);
                            return (
                                <div className="col" key={paper._id}>
                                    <div className="course-item">
                                        <div className="course-inner">
                                            <div className="course-thumb" style={{ position: "relative" }}>
                                                {recommended && (
                                                    <span
                                                        style={{
                                                            position: "absolute",
                                                            top: 8,
                                                            left: 8,
                                                            background: "linear-gradient(135deg, #22C55E 0%, #16A34A 100%)",
                                                            color: "#fff",
                                                            padding: "2px 8px",
                                                            borderRadius: 12,
                                                            fontSize: 12,
                                                            zIndex: 2,
                                                            boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
                                                        }}
                                                        title="Difficulty matches your profile"
                                                    >
                                                        Recommended
                                                    </span>
                                                )}
                                                <Link to={`/paper-details/${paper._id}`} className="d-block w-100">
                                                    <img src={paperimg} alt="Paper Thumbnail" style={{ width: '100%', height: 200, objectFit: 'cover' }} />
                                                </Link>
                                            </div>

                                            <div className="course-content">
                                                <div className="course-category">
                                                    <div className="course-cate">
                                                        <span>{paper.teacherGuideId?.coureInfo || "Maths Paper"}</span>
                                                    </div>
                                                </div>

                                                <Link to={`/paper-details/${paper._id}`}>
                                                    <h4 title={paper.paperTytle}>{paper.paperTytle}</h4>
                                                </Link>

                                                <div className="course-details">
                                                    <div className="couse-topic">
                                                        <i className="icofont-signal"></i> {paper.paperDifficulty || "—"}
                                                    </div>
                                                </div>

                                                <div className="course-footer">
                                                    <div className="course-btn">
                                                        <Link to={`/paper-details/${paper._id}`} className="lab-btn-text">
                                                            View Paper <i className="icofont-external-link"></i>
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="text-center mt-5">
                    <Link to="/paperlist" className="lab-btn">
                        <span>Browse All Papers</span>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default LatestPapers;
