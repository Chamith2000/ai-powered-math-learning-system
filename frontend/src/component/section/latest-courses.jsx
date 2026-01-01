import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Rating from "../sidebar/rating";
import apiClient from "../../api";
import "../../assets/css/LatestCourse.css";

const subTitle = "Featured Video Lectures";
const title = "Latest Video Lectures";

const LatestCourse = () => {
  const [videoLectures, setVideoLectures] = useState([]);
  const [loading, setLoading] = useState(true);

  // Read once from localStorage
  const suitabilityForCoding = useMemo(() => {
    const v = localStorage.getItem("suitabilityForCoding");
    return v === "0" ? 0 : v === "1" ? 1 : null;
  }, []);

  const difficultyLevel = useMemo(() => {
    const dl = localStorage.getItem("difficultyLevel");
    return (dl || "").trim().toLowerCase();
  }, []);

  useEffect(() => {
    const fetchVideoLectures = async () => {
      try {
        const res = await apiClient.get("/api/maths/video-lectures/");
        const items = Array.isArray(res.data) ? res.data : [];
        const latest = [...items]
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 6);
        setVideoLectures(latest);
      } catch (err) {
        console.error("Error fetching video lectures:", err);
        setVideoLectures([]);
      } finally {
        setLoading(false);
      }
    };

    fetchVideoLectures();
  }, []);

  const content = useMemo(() => videoLectures, [videoLectures]);

  // Helper: does this lecture match the user's difficulty and suitability?
  const isLectureRecommended = (lectureDifficulty) => {
    if (suitabilityForCoding !== 1) return false;
    const ld = (lectureDifficulty || "").trim().toLowerCase();
    return difficultyLevel && ld === difficultyLevel;
  };

  return (
    <div className="course-section padding-tb section-bg">
      <div className="container">
        <div className="section-header text-center">
          <span className="subtitle">{subTitle}</span>
          <h2 className="title">{title}</h2>
        </div>

        <div className="section-wrapper">
          <div className="row g-4 justify-content-center row-cols-xl-3 row-cols-md-2 row-cols-1">
            {loading && (
              <div className="col-12 text-center text-muted py-4">
                Loading latest lectures…
              </div>
            )}

            {!loading && content.length === 0 && (
              <div className="col-12 text-center text-muted py-4">
                No video lectures found.
              </div>
            )}

            {!loading &&
              content.map((lecture) => {
                const recommended = isLectureRecommended(lecture.lectureDifficulty);

                return (
                  <div className="col" key={lecture._id}>
                    <div className="course-item">
                      <div className="course-inner">
                        <div className="course-thumb" style={{ position: "relative" }}>
                          {/* Badge logic: prefer "Recommended"; otherwise show "Not recommended" when suitability=0 */}
                          {recommended ? (
                            <span
                              style={{
                                position: "absolute",
                                top: 8,
                                left: 8,
                                background: "rgba(5,150,105,0.95)", // green-ish
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
                          ) : suitabilityForCoding === 0 ? (
                            <span
                              style={{
                                position: "absolute",
                                top: 8,
                                left: 8,
                                background: "rgba(220,38,38,0.95)", // red-ish
                                color: "#fff",
                                padding: "2px 8px",
                                borderRadius: 12,
                                fontSize: 12,
                                zIndex: 2,
                                boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
                              }}
                              title="Based on your suitability score"
                            >
                              Not recommended
                            </span>
                          ) : null}

                          <Link to={`/course-view/${lecture._id}`}>
                            {lecture.videoUrl ? (
                              <video
                                src={lecture.videoUrl}
                                preload="metadata"
                                muted
                                playsInline
                                onMouseOver={(e) => e.currentTarget.play()}
                                onMouseOut={(e) => {
                                  e.currentTarget.pause();
                                  e.currentTarget.currentTime = 0;
                                }}
                                style={{
                                  width: "100%",
                                  height: 200,
                                  objectFit: "cover",
                                  borderRadius: 8,
                                  background: "#000",
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: "100%",
                                  height: 200,
                                  borderRadius: 8,
                                  background:
                                    "repeating-linear-gradient(45deg,#f3f4f6,#f3f4f6 10px,#e5e7eb 10px,#e5e7eb 20px)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  color: "#6b7280",
                                  fontWeight: 600,
                                }}
                              >
                                No video
                              </div>
                            )}
                          </Link>

                          {lecture.createdAt && (
                            <span
                              style={{
                                position: "absolute",
                                bottom: 8,
                                right: 8,
                                background: "rgba(0,0,0,0.6)",
                                color: "#fff",
                                padding: "2px 8px",
                                borderRadius: 12,
                                fontSize: 12,
                              }}
                              title="Created at"
                            >
                              {new Date(lecture.createdAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        <div className="course-content">
                          <div className="course-category">
                            <div className="course-cate">
                              <span>
                                {lecture.teacherGuideId?.coureInfo || "Video Lecture"}
                              </span>
                            </div>
                            <div className="course-reiew">
                              <Rating />
                              <span className="ratting-count"> 0 reviews</span>
                            </div>
                          </div>

                          <Link to={`/maths-view/${lecture._id}`}>
                            <h4 title={lecture.lectureTytle}>
                              {lecture.lectureTytle || lecture.title || "Untitled Lecture"}
                            </h4>
                          </Link>

                          <div className="course-details">
                            <div className="couse-topic">
                              <i className="icofont-signal"></i>{" "}
                              {lecture.lectureDifficulty || "—"}
                            </div>
                            <div className="couse-count">
                              <i className="icofont-paperclip"></i>{" "}
                              {(lecture.pdfMaterials?.length ?? 0)} PDF
                              {(lecture.pdfMaterials?.length ?? 0) === 1 ? "" : "s"}
                            </div>
                          </div>

                          <div className="course-footer">
                            <div className="course-author">
                              <Link to="#" className="ca-name">
                                {lecture.createby?.username || "Unknown"}
                              </Link>
                            </div>
                            <div className="course-btn">
                              <Link
                                to={`/maths-view/${lecture._id}`}
                                className="lab-btn-text"
                              >
                                Read More <i className="icofont-external-link"></i>
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
          <Link to="/maths-lectures" className="lab-btn">
            <span>Browse All Lectures</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LatestCourse;
