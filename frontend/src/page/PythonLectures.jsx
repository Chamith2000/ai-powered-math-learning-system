import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Footer from "../component/layout/footer";
import Header from "../component/layout/header";
import PageHeader from "../component/layout/pageheader";
import Pagination from "../component/sidebar/pagination";
import Rating from "../component/sidebar/rating";
import apiClient from "../api";
import "../assets/css/LatestCourse.css";

const PythonLectures = () => {
  const [videoLectures, setVideoLectures] = useState([]);
  const [filteredLectures, setFilteredLectures] = useState([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedTime, setSelectedTime] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const lecturesPerPage = 6;

  const { suitabilityForCoding, preferredDifficulty } = useMemo(() => {
    const sfcRaw = localStorage.getItem("suitabilityForCoding");
    const sfc = sfcRaw === "0" ? 0 : sfcRaw === "1" ? 1 : null;

    const pref =
      localStorage.getItem("currentDifficultyLevel") ||
      localStorage.getItem("difficultyLevel") ||
      null;

    return { suitabilityForCoding: sfc, preferredDifficulty: pref };
  }, []);

  const difficultyOptions = [
    { value: "all", label: "All Difficulties" },
    { value: "Easy", label: "Easy" },
    { value: "Medium", label: "Medium" },
    { value: "Hard", label: "Hard" },
  ];

  const typeOptions = [
    { value: "all", label: "All Types" },
    { value: 1, label: "Video Lectures" },
    { value: 2, label: "Practical" },
    { value: 3, label: "Reading" },
  ];

  const timeFilters = [
    { value: "all", label: "All Durations" },
    { value: "less10", label: "Less than 10 min" },
    { value: "less20", label: "Less than 20 min" },
    { value: "less40", label: "Less than 40 min" },
    { value: "more40", label: "More than 40 min" },
  ];

  useEffect(() => {
    fetchVideoLectures();
  }, []);

  useEffect(() => {
    filterLectures();
  }, [selectedDifficulty, selectedType, selectedTime, videoLectures]);

  const fetchVideoLectures = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/api/maths/video-lectures/");
      const items = Array.isArray(res.data) ? res.data : [];
      const withDurations = await enrichDurations(items);
      setVideoLectures(withDurations);
      setFilteredLectures(withDurations);
    } catch (error) {
      console.error("Error fetching Python lectures:", error);
      setVideoLectures([]);
      setFilteredLectures([]);
    } finally {
      setLoading(false);
    }
  };

  const enrichDurations = async (list) => {
    const getDurationMins = (url) =>
      new Promise((resolve) => {
        if (!url) return resolve(null);
        const v = document.createElement("video");
        v.preload = "metadata";
        v.crossOrigin = "anonymous";
        v.src = url;

        const cleanup = () => {
          v.removeAttribute("src");
          v.load();
        };
        const done = (mins) => {
          cleanup();
          resolve(mins);
        };

        v.onloadedmetadata = () => {
          const secs = Number(v.duration);
          done(Number.isFinite(secs) && secs > 0 ? Math.round(secs / 60) : null);
        };
        v.onerror = () => done(null);
        setTimeout(() => done(null), 7000);
      });

    const out = await Promise.all(
      list.map(async (it) => ({
        ...it,
        durationMins: await getDurationMins(it.videoUrl),
      }))
    );
    return out;
  };

  const filterLectures = () => {
    let filtered = [...videoLectures];

    if (selectedDifficulty !== "all") {
      filtered = filtered.filter(
        (lecture) => lecture.lectureDifficulty === selectedDifficulty
      );
    }

    if (selectedType !== "all") {
      filtered = filtered.filter(
        (lecture) => Number(lecture.lectureType) === Number(selectedType)
      );
    }

    if (selectedTime !== "all") {
      filtered = filtered.filter((lecture) => {
        const mins = lecture.durationMins;
        if (mins == null) return false;
        if (selectedTime === "less10") return mins < 10;
        if (selectedTime === "less20") return mins < 20;
        if (selectedTime === "less40") return mins < 40;
        if (selectedTime === "more40") return mins >= 40;
        return true;
      });
    }

    setFilteredLectures(filtered);
    setCurrentPage(1);
  };

  const indexOfLastLecture = currentPage * lecturesPerPage;
  const indexOfFirstLecture = indexOfLastLecture - lecturesPerPage;
  const currentLectures = useMemo(
    () => filteredLectures.slice(indexOfFirstLecture, indexOfLastLecture),
    [filteredLectures, indexOfFirstLecture, indexOfLastLecture]
  );

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // helper to compare difficulty names
  const isRecommendedMatch = (lectureDiff) => {
    if (!preferredDifficulty || !lectureDiff) return false;
    return preferredDifficulty.toLowerCase() === String(lectureDiff).toLowerCase();
  };

  return (
    <>
      <Header />
      <PageHeader title={"Maths Lectures"} curPage={"Course Page"} />

      {/* Filters */}
      <div className="group-select-section">
        <div className="container">
          <div className="section-wrapper">
            <div className="row align-items-center g-4">
              <div className="col-md-1">
                <div className="group-select-left">
                  <i className="icofont-abacus-alt"></i>
                  <span>Filters</span>
                </div>
              </div>
              <div className="col-md-11">
                <div className="group-select-right">
                  <div className="row g-2 row-cols-lg-4 row-cols-sm-2 row-cols-1">
                    {/* Type */}
                    <div className="col">
                      <div className="select-item">
                        <select
                          className="form-select"
                          value={selectedType}
                          onChange={(e) => setSelectedType(e.target.value)}
                        >
                          {typeOptions.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Difficulty */}
                    <div className="col">
                      <div className="select-item">
                        <select
                          className="form-select"
                          value={selectedDifficulty}
                          onChange={(e) => setSelectedDifficulty(e.target.value)}
                        >
                          {difficultyOptions.map((diff) => (
                            <option key={diff.value} value={diff.value}>
                              {diff.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Duration */}
                    <div className="col">
                      <div className="select-item">
                        <select
                          className="form-select"
                          value={selectedTime}
                          onChange={(e) => setSelectedTime(e.target.value)}
                        >
                          {timeFilters.map((time) => (
                            <option key={time.value} value={time.value}>
                              {time.label}
                            </option>
                          ))}
                        </select>
                        {selectedTime !== "all" && (
                          <small className="text-muted d-block mt-1">
                            Duration auto-detected from video metadata.
                          </small>
                        )}
                      </div>
                    </div>

                    <div className="col"></div>
                  </div>
                </div>
              </div>
            </div>

            {loading && (
              <div className="alert alert-light border mt-3 mb-0">
                Loading video lectures…
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Course List */}
      <div className="course-section padding-tb section-bg">
        <div className="container">
          <div className="section-wrapper">
            <div className="course-showing-part">
              <p>
                Showing{" "}
                {filteredLectures.length === 0 ? 0 : indexOfFirstLecture + 1} -{" "}
                {Math.min(indexOfLastLecture, filteredLectures.length)} of{" "}
                {filteredLectures.length} results
              </p>
            </div>

            <div className="row g-4 justify-content-center row-cols-xl-3 row-cols-md-2 row-cols-1">
              {!loading && filteredLectures.length === 0 && (
                <div className="col-12 text-center text-muted py-5">
                  No lectures match your filters.
                </div>
              )}

              {currentLectures.map((lecture) => {
                const showNotRecommended = suitabilityForCoding === 0;
                const showRecommended =
                  suitabilityForCoding === 1 &&
                  isRecommendedMatch(lecture.lectureDifficulty);

                return (
                  <div className="col" key={lecture._id}>
                    <div className="course-item">
                      <div className="course-inner">
                        <div className="course-thumb" style={{ position: "relative" }}>
                          {/* 🔴 Not recommended (top-left) */}
                          {showNotRecommended && (
                            <span
                              style={{
                                position: "absolute",
                                top: 8,
                                left: 8,
                                background: "rgba(220,38,38,0.95)",
                                color: "#fff",
                                padding: "2px 8px",
                                borderRadius: 12,
                                fontSize: 12,
                                zIndex: 2,
                                boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
                              }}
                            >
                              Not recommended
                            </span>
                          )}

                          {/* 🟢 Recommended (top-left; moves right if you prefer) */}
                          {showRecommended && (
                            <span
                              style={{
                                position: "absolute",
                                top: 8,
                                left: 8,
                                background: "rgba(22,163,74,0.95)", // green-600-ish
                                color: "#fff",
                                padding: "2px 8px",
                                borderRadius: 12,
                                fontSize: 12,
                                zIndex: 2,
                                boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
                              }}
                            >
                              Recommended
                            </span>
                          )}

                          <Link to={`/maths-view/${lecture._id}`}>
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
                            <h4 title={lecture.lectureTytle}>{lecture.lectureTytle}</h4>
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
                            {typeof lecture.durationMins === "number" && (
                              <div className="couse-count">
                                <i className="icofont-clock-time"></i>{" "}
                                {lecture.durationMins} min
                              </div>
                            )}
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

            <Pagination
              lecturesPerPage={lecturesPerPage}
              totalLectures={filteredLectures.length}
              paginate={paginate}
              currentPage={currentPage}
            />
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default PythonLectures;
