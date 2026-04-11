import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Footer from "../component/layout/footer";
import Header from "../component/layout/header";
import PageHeader from "../component/layout/pageheader";
import Pagination from "../component/sidebar/pagination";
import Rating from "../component/sidebar/rating";
import apiClient from "../api";
import "../assets/css/LatestCourse.css";

const MathsLectures = () => {
    const userId = localStorage.getItem("userId"); // User ID එක ගන්නවා
    const [videoLectures, setVideoLectures] = useState([]);
    const [filteredLectures, setFilteredLectures] = useState([]);

    // Pre-select the user's difficulty from localStorage (saved at login or after StartingPaper)
    const [selectedDifficulty, setSelectedDifficulty] = useState(() => {
        const dl =
            localStorage.getItem("difficultyLevel") ||
            localStorage.getItem("currentDifficultyLevel");
        return dl && ["Easy", "Medium", "Hard"].includes(dl) ? dl : "all";
    });
    const [selectedType, setSelectedType] = useState("all");
    const [selectedTime, setSelectedTime] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const lecturesPerPage = 6;

    const { preferredDifficulty } = useMemo(() => {
        const pref =
            localStorage.getItem("currentDifficultyLevel") ||
            localStorage.getItem("difficultyLevel") ||
            null;
        return { preferredDifficulty: pref };
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
        fetchData(); // Component එක load වෙද්දි Data ගන්න function එක call කරනවා
    }, []);

    useEffect(() => {
        filterLectures();
    }, [selectedDifficulty, selectedType, selectedTime, videoLectures]);

    // --- එකවර Lectures සහ Student විස්තර ගැනීම ---
    const fetchData = async () => {
        setLoading(true);
        try {
            // API calls දෙකම එකවර යවනවා වේගය වැඩිවෙන්න
            const [lecturesRes, userRes] = await Promise.all([
                apiClient.get("/api/maths/video-lectures/"),
                userId ? apiClient.get(`/api/users/${userId}`).catch(() => ({ data: null })) : Promise.resolve({ data: null })
            ]);

            const currentUser = userRes.data;
            let raw = Array.isArray(lecturesRes.data) ? lecturesRes.data : [];

            // --- Grade Filtering Logic ---
            // Student කෙනෙක් නම්, එයාගේ grade එකට සමාන lectures විතරක් ඉතුරු කරනවා
            if (currentUser && currentUser.role !== 'admin' && currentUser.grade) {
                raw = raw.filter(it => it.grade && Number(it.grade) === Number(currentUser.grade));
            }

            // Normalize: default lectureDifficulty to "Easy" when unset in DB
            const items = raw.map((it) => ({
                ...it,
                lectureDifficulty: it.lectureDifficulty || "Easy",
            }));

            const withDurations = await enrichDurations(items);
            setVideoLectures(withDurations);
            setFilteredLectures(withDurations);
        } catch (error) {
            console.error("Error fetching data:", error);
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
            <PageHeader title={"Maths Adventures! 🎬"} curPage={"Lectures"} />

            {/* Filters */}
            <div className="group-select-section bg-light py-4" style={{ borderBottom: "4px dashed #90e0ef" }}>
                <div className="container">
                    <div className="section-wrapper bg-white p-4 rounded-4 shadow-sm border border-2 border-info">
                        <div className="row align-items-center g-4">
                            <div className="col-lg-2 col-md-3 text-center text-md-start">
                                <h4 className="text-primary fw-bold mb-0">
                                    <i className="icofont-magic me-2 fs-3 text-warning"></i>
                                    Filter Magic!
                                </h4>
                            </div>
                            <div className="col-lg-10 col-md-9">
                                <div className="row g-3 row-cols-md-4 row-cols-sm-2 row-cols-1">
                                    {/* Type */}
                                    <div className="col">
                                        <select
                                            className="form-select form-select-lg rounded-pill shadow-sm"
                                            style={{ border: "2px solid #e0e7ff", fontWeight: "bold", color: "#495057" }}
                                            value={selectedType}
                                            onChange={(e) => setSelectedType(e.target.value)}
                                        >
                                            {typeOptions.map((type) => (
                                                <option key={type.value} value={type.value}>{type.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Difficulty */}
                                    <div className="col">
                                        <select
                                            className="form-select form-select-lg rounded-pill shadow-sm"
                                            style={{ border: "2px solid #e0e7ff", fontWeight: "bold", color: "#495057" }}
                                            value={selectedDifficulty}
                                            onChange={(e) => setSelectedDifficulty(e.target.value)}
                                        >
                                            {difficultyOptions.map((diff) => (
                                                <option key={diff.value} value={diff.value}>{diff.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Duration */}
                                    <div className="col">
                                        <select
                                            className="form-select form-select-lg rounded-pill shadow-sm"
                                            style={{ border: "2px solid #e0e7ff", fontWeight: "bold", color: "#495057" }}
                                            value={selectedTime}
                                            onChange={(e) => setSelectedTime(e.target.value)}
                                        >
                                            {timeFilters.map((time) => (
                                                <option key={time.value} value={time.value}>{time.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Reset/Placeholder */}
                                    <div className="col d-flex flex-column justify-content-center">
                                        {selectedTime !== "all" && (
                                            <span className="badge bg-warning text-dark rounded-pill">Detecting auto-duration ⏱️</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {loading && (
                            <div className="text-center mt-4 p-3 bg-light rounded-4">
                                <div className="spinner-border text-info" role="status"></div>
                                <h5 className="text-info mt-2 fw-bold">Finding best adventures... 🔍</h5>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Course List */}
            <div className="course-section padding-tb" style={{ minHeight: "60vh" }}>
                <div className="container">
                    <div className="section-wrapper">
                        <div className="d-flex justify-content-between align-items-center mb-5">
                            <h3 className="text-primary fw-bold mb-0">Video Hub 📺</h3>
                            <span className="badge bg-light text-dark fs-5 border border-2 border-secondary rounded-pill px-4 py-2 shadow-sm">
                Showing {filteredLectures.length === 0 ? 0 : indexOfFirstLecture + 1} - {Math.min(indexOfLastLecture, filteredLectures.length)} of {filteredLectures.length}
              </span>
                        </div>

                        <div className="row g-4 justify-content-center row-cols-xl-3 row-cols-md-2 row-cols-1">
                            {!loading && filteredLectures.length === 0 && (
                                <div className="col-12 text-center py-5">
                                    <div className="card border-0 shadow-sm p-5 rounded-4 bg-white border border-2 border-warning text-warning">
                                        <h2 className="fw-bold">No Videos Found! 🙈</h2>
                                        <p className="fs-5 text-dark">Try adjusting your Magic Filters!</p>
                                    </div>
                                </div>
                            )}

                            {currentLectures.map((lecture) => {
                                const showRecommended = isRecommendedMatch(lecture.lectureDifficulty);

                                return (
                                    <div className="col" key={lecture._id}>
                                        <div
                                            className="card h-100 border-0 shadow-sm"
                                            style={{ borderRadius: "20px", overflow: "hidden", transition: "transform 0.3s, box-shadow 0.3s", borderBottom: "6px solid #48cae4" }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = "translateY(-10px)";
                                                e.currentTarget.style.boxShadow = "0 15px 30px rgba(0,0,0,0.15)";
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = "translateY(0)";
                                                e.currentTarget.style.boxShadow = "0 4px 6px rgba(0,0,0,0.05)";
                                            }}
                                        >
                                            <div className="position-relative">
                                                {/* 🟢 Recommended */}
                                                {showRecommended && (
                                                    <span className="position-absolute badge bg-success fs-6 rounded-pill shadow-sm px-3 py-2" style={{ top: 12, left: 12, zIndex: 2 }}>
                            🌟 Recommended
                          </span>
                                                )}

                                                <Link to={`/maths-view/${lecture._id}`} className="d-block w-100">
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
                                                            style={{ width: "100%", height: 220, objectFit: "cover", backgroundColor: "#000" }}
                                                        />
                                                    ) : (
                                                        <div className="d-flex align-items-center justify-content-center bg-light text-muted" style={{ width: "100%", height: 220 }}>
                                                            <h5 className="fw-bold"><i className="icofont-ui-video-play display-4 text-secondary opacity-50"></i><br />No Video</h5>
                                                        </div>
                                                    )}
                                                </Link>

                                                {lecture.createdAt && (
                                                    <span className="position-absolute badge bg-dark text-white rounded-pill px-3 py-2 opacity-75" style={{ bottom: 12, right: 12, zIndex: 2 }}>
                            📅 {new Date(lecture.createdAt).toLocaleDateString()}
                          </span>
                                                )}
                                            </div>

                                            <div className="card-body p-4 d-flex flex-column">
                                                <div className="d-flex justify-content-between align-items-center mb-3">
                          <span className="badge bg-light text-primary border border-primary rounded-pill">
                            {lecture.teacherGuideId?.coureInfo || "Video Lecture"}
                          </span>
                                                </div>

                                                <Link to={`/maths-view/${lecture._id}`} className="text-decoration-none">
                                                    <h4 className="card-title text-dark fw-bold mb-3">{lecture.lectureTytle}</h4>
                                                </Link>

                                                <div className="d-flex justify-content-between align-items-center mt-auto mb-4 bg-light p-3 rounded-4">
                          <span className={`badge rounded-pill fs-6 ${lecture.lectureDifficulty === 'Easy' ? 'bg-success' :
                              lecture.lectureDifficulty === 'Medium' ? 'bg-warning text-dark' : 'bg-danger'
                          }`}>
                            {lecture.lectureDifficulty || "—"} {lecture.lectureDifficulty === 'Easy' ? '😊' : lecture.lectureDifficulty === 'Medium' ? '🤔' : '🔥'}
                          </span>

                                                    <div className="d-flex gap-3 text-muted fw-bold">
                                                        <span title="PDF Resources"><i className="icofont-paperclip text-primary fs-5"></i> {lecture.pdfMaterials?.length ?? 0}</span>
                                                        {typeof lecture.durationMins === "number" && (
                                                            <span title="Duration"><i className="icofont-clock-time text-info fs-5"></i> {lecture.durationMins}m</span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="d-flex justify-content-between align-items-center pt-3 border-top">
                                                    <span className="text-muted fw-bold">By {lecture.createby?.username || "Unknown Teacher"} 👨‍🏫</span>
                                                    <Link
                                                        to={`/maths-view/${lecture._id}`}
                                                        className="btn btn-outline-info rounded-pill fw-bold"
                                                    >
                                                        Watch 🍿
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-5 text-center">
                            <Pagination
                                lecturesPerPage={lecturesPerPage}
                                totalLectures={filteredLectures.length}
                                paginate={paginate}
                                currentPage={currentPage}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </>
    );
};

export default MathsLectures;


// import { useEffect, useMemo, useState, useRef } from "react";
// import { Link } from "react-router-dom";
// import Footer from "../component/layout/footer";
// import Header from "../component/layout/header";
// import PageHeader from "../component/layout/pageheader";
// import Pagination from "../component/sidebar/pagination";
// import Rating from "../component/sidebar/rating";
// import apiClient from "../api";
// import "../assets/css/LatestCourse.css";
//
// /* ── Animated Custom Select ───────────────────────────────────────── */
// const CustomSelect = ({ options, value, onChange }) => {
//   const [isOpen, setIsOpen] = useState(false);
//   const [animating, setAnimating] = useState(false);
//   const ref = useRef(null);
//
//   const selected = options.find((o) => String(o.value) === String(value));
//
//   const open = () => { setAnimating(true); setIsOpen(true); };
//   const close = () => { setAnimating(false); setTimeout(() => setIsOpen(false), 200); };
//   const toggle = () => (isOpen ? close() : open());
//
//   const handleSelect = (val) => {
//     onChange({ target: { value: val } });
//     close();
//   };
//
//   useEffect(() => {
//     const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) close(); };
//     document.addEventListener("mousedown", handler);
//     return () => document.removeEventListener("mousedown", handler);
//   }, [isOpen]);
//
//   return (
//       <div ref={ref} style={{ position: "relative", fontFamily: "'Nunito', sans-serif" }}>
//         {/* Trigger */}
//         <button
//             onClick={toggle}
//             style={{
//               width: "100%",
//               padding: "12px 20px",
//               borderRadius: "50px",
//               border: `2px solid ${isOpen ? "#4F46E5" : "#E0E7FF"}`,
//               background: isOpen ? "#EEF2FF" : "#F9FAFB",
//               color: "#374151",
//               fontWeight: 700,
//               fontSize: "1rem",
//               cursor: "pointer",
//               display: "flex",
//               justifyContent: "space-between",
//               alignItems: "center",
//               gap: 10,
//               boxShadow: isOpen ? "0 0 0 3px rgba(79,70,229,0.15)" : "0 2px 8px rgba(79,70,229,0.07)",
//               transition: "all 0.25s ease",
//             }}
//         >
//         <span style={{ color: selected?.value === "all" ? "#9CA3AF" : "#374151", fontStyle: selected?.value === "all" ? "italic" : "normal" }}>
//           {selected?.label}
//         </span>
//           <span style={{ display: "inline-block", transition: "transform 0.25s ease", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", color: "#4F46E5", fontSize: "0.75rem" }}>
//           ▼
//         </span>
//         </button>
//
//         {/* Dropdown panel */}
//         {isOpen && (
//             <ul
//                 style={{
//                   position: "absolute",
//                   top: "calc(100% + 8px)",
//                   left: 0,
//                   right: 0,
//                   zIndex: 999,
//                   margin: 0,
//                   padding: "8px",
//                   listStyle: "none",
//                   background: "#fff",
//                   borderRadius: "16px",
//                   border: "2px solid #E0E7FF",
//                   boxShadow: "0 12px 32px rgba(79,70,229,0.15)",
//                   transformOrigin: "top center",
//                   animation: animating
//                       ? "dropdownIn 0.2s cubic-bezier(0.34,1.56,0.64,1) forwards"
//                       : "dropdownOut 0.18s ease forwards",
//                 }}
//             >
//               {options.map((opt, i) => {
//                 const isSelected = String(opt.value) === String(value);
//                 return (
//                     <li
//                         key={opt.value}
//                         onClick={() => handleSelect(opt.value)}
//                         style={{
//                           padding: "10px 16px",
//                           borderRadius: "10px",
//                           cursor: "pointer",
//                           fontWeight: isSelected ? 800 : 600,
//                           color: isSelected ? "#4F46E5" : "#374151",
//                           background: isSelected ? "#EEF2FF" : "transparent",
//                           display: "flex",
//                           justifyContent: "space-between",
//                           alignItems: "center",
//                           transition: "all 0.15s ease",
//                           animation: `itemFadeIn 0.2s ease ${i * 0.04}s both`,
//                         }}
//                         onMouseEnter={(e) => {
//                           if (!isSelected) {
//                             e.currentTarget.style.background = "#F5F3FF";
//                             e.currentTarget.style.color = "#4F46E5";
//                             e.currentTarget.style.paddingLeft = "22px";
//                           }
//                         }}
//                         onMouseLeave={(e) => {
//                           if (!isSelected) {
//                             e.currentTarget.style.background = "transparent";
//                             e.currentTarget.style.color = "#374151";
//                             e.currentTarget.style.paddingLeft = "16px";
//                           }
//                         }}
//                     >
//                       {opt.label}
//                       {isSelected && <span style={{ color: "#4F46E5", fontSize: "0.85rem" }}>✓</span>}
//                     </li>
//                 );
//               })}
//             </ul>
//         )}
//
//         <style>{`
//         @keyframes dropdownIn {
//           from { opacity: 0; transform: scaleY(0.85) translateY(-6px); }
//           to   { opacity: 1; transform: scaleY(1)    translateY(0); }
//         }
//         @keyframes dropdownOut {
//           from { opacity: 1; transform: scaleY(1)    translateY(0); }
//           to   { opacity: 0; transform: scaleY(0.85) translateY(-6px); }
//         }
//         @keyframes itemFadeIn {
//           from { opacity: 0; transform: translateX(-6px); }
//           to   { opacity: 1; transform: translateX(0); }
//         }
//       `}</style>
//       </div>
//   );
// };
// /* ────────────────────────────────────────────────────────────────── */
//
// const MathsLectures = () => {
//   const [videoLectures, setVideoLectures] = useState([]);
//   const [filteredLectures, setFilteredLectures] = useState([]);
//   // Pre-select the user's difficulty from localStorage (saved at login or after StartingPaper)
//   const [selectedDifficulty, setSelectedDifficulty] = useState(() => {
//     const dl =
//         localStorage.getItem("difficultyLevel") ||
//         localStorage.getItem("currentDifficultyLevel");
//     console.log("MathsLectures: Initial selectedDifficulty from localStorage:", dl);
//     return dl && ["Easy", "Medium", "Hard"].includes(dl) ? dl : "all";
//   });
//   const [selectedType, setSelectedType] = useState("all");
//   const [selectedTime, setSelectedTime] = useState("all");
//   const [currentPage, setCurrentPage] = useState(1);
//   const [loading, setLoading] = useState(true);
//   const lecturesPerPage = 6;
//
//   const { preferredDifficulty } = useMemo(() => {
//     const pref =
//         localStorage.getItem("currentDifficultyLevel") ||
//         localStorage.getItem("difficultyLevel") ||
//         null;
//
//     console.log("MathsLectures: Debugging Recommendation - preferredDifficulty:", pref);
//     return { preferredDifficulty: pref };
//   }, []);
//
//   const difficultyOptions = [
//     { value: "all", label: "All Difficulties" },
//     { value: "Easy", label: "Easy" },
//     { value: "Medium", label: "Medium" },
//     { value: "Hard", label: "Hard" },
//   ];
//
//   const typeOptions = [
//     { value: "all", label: "All Types" },
//     { value: 1, label: "Video Lectures" },
//     { value: 2, label: "Practical" },
//     { value: 3, label: "Reading" },
//   ];
//
//   const timeFilters = [
//     { value: "all", label: "All Durations" },
//     { value: "less10", label: "Less than 10 min" },
//     { value: "less20", label: "Less than 20 min" },
//     { value: "less40", label: "Less than 40 min" },
//     { value: "more40", label: "More than 40 min" },
//   ];
//
//   useEffect(() => {
//     fetchVideoLectures();
//   }, []);
//
//   useEffect(() => {
//     filterLectures();
//   }, [selectedDifficulty, selectedType, selectedTime, videoLectures]);
//
//   const fetchVideoLectures = async () => {
//     setLoading(true);
//     try {
//       const res = await apiClient.get("/api/maths/video-lectures/");
//       const raw = Array.isArray(res.data) ? res.data : [];
//       // Normalize: default lectureDifficulty to "Easy" when unset in DB
//       const items = raw.map((it) => ({
//         ...it,
//         lectureDifficulty: it.lectureDifficulty || "Easy",
//       }));
//       const withDurations = await enrichDurations(items);
//       setVideoLectures(withDurations);
//       setFilteredLectures(withDurations);
//     } catch (error) {
//       console.error("Error fetching Maths lectures:", error);
//       setVideoLectures([]);
//       setFilteredLectures([]);
//     } finally {
//       setLoading(false);
//     }
//   };
//
//   const enrichDurations = async (list) => {
//     const getDurationMins = (url) =>
//         new Promise((resolve) => {
//           if (!url) return resolve(null);
//           const v = document.createElement("video");
//           v.preload = "metadata";
//           v.crossOrigin = "anonymous";
//           v.src = url;
//
//           const cleanup = () => {
//             v.removeAttribute("src");
//             v.load();
//           };
//           const done = (mins) => {
//             cleanup();
//             resolve(mins);
//           };
//
//           v.onloadedmetadata = () => {
//             const secs = Number(v.duration);
//             done(Number.isFinite(secs) && secs > 0 ? Math.round(secs / 60) : null);
//           };
//           v.onerror = () => done(null);
//           setTimeout(() => done(null), 7000);
//         });
//
//     const out = await Promise.all(
//         list.map(async (it) => ({
//           ...it,
//           durationMins: await getDurationMins(it.videoUrl),
//         }))
//     );
//     return out;
//   };
//
//   const filterLectures = () => {
//     let filtered = [...videoLectures];
//
//     if (selectedDifficulty !== "all") {
//       filtered = filtered.filter(
//           (lecture) => lecture.lectureDifficulty === selectedDifficulty
//       );
//     }
//
//     if (selectedType !== "all") {
//       filtered = filtered.filter(
//           (lecture) => Number(lecture.lectureType) === Number(selectedType)
//       );
//     }
//
//     if (selectedTime !== "all") {
//       filtered = filtered.filter((lecture) => {
//         const mins = lecture.durationMins;
//         if (mins == null) return false;
//         if (selectedTime === "less10") return mins < 10;
//         if (selectedTime === "less20") return mins < 20;
//         if (selectedTime === "less40") return mins < 40;
//         if (selectedTime === "more40") return mins >= 40;
//         return true;
//       });
//     }
//
//     setFilteredLectures(filtered);
//     setCurrentPage(1);
//   };
//
//   const indexOfLastLecture = currentPage * lecturesPerPage;
//   const indexOfFirstLecture = indexOfLastLecture - lecturesPerPage;
//   const currentLectures = useMemo(
//       () => filteredLectures.slice(indexOfFirstLecture, indexOfLastLecture),
//       [filteredLectures, indexOfFirstLecture, indexOfLastLecture]
//   );
//
//   const paginate = (pageNumber) => setCurrentPage(pageNumber);
//
//   // helper to compare difficulty names
//   const isRecommendedMatch = (lectureDiff) => {
//     if (!preferredDifficulty || !lectureDiff) return false;
//     return preferredDifficulty.toLowerCase() === String(lectureDiff).toLowerCase();
//   };
//
//   return (
//       <>
//         <Header />
//         <PageHeader title={"Maths Adventures!"} curPage={"Lectures"} />
//
//         {/* Filters */}
//         <div className="group-select-section py-4" style={{ backgroundColor: "#F9FAFB", borderBottom: "4px dashed #E0E7FF" }}>
//           <div className="container">
//             <div className="section-wrapper bg-white p-4 rounded-4 shadow-sm" style={{ border: "2px solid #E0E7FF", borderRadius: "24px" }}>
//               <div className="row align-items-center g-4">
//                 <div className="col-lg-2 col-md-3 text-center text-md-start">
//                   <h4 className="text-primary fw-bold mb-0">
//                     <i className="icofont-magic me-2 fs-3 text-warning"></i>
//                     Filter Magic!
//                   </h4>
//                 </div>
//                 <div className="col-lg-10 col-md-9">
//                   <div className="row g-3 row-cols-md-4 row-cols-sm-2 row-cols-1">
//                     {/* Type */}
//                     <div className="col">
//                       <CustomSelect
//                           options={typeOptions}
//                           value={selectedType}
//                           onChange={(e) => setSelectedType(e.target.value)}
//                       />
//                     </div>
//
//                     {/* Difficulty */}
//                     <div className="col">
//                       <CustomSelect
//                           options={difficultyOptions}
//                           value={selectedDifficulty}
//                           onChange={(e) => setSelectedDifficulty(e.target.value)}
//                       />
//                     </div>
//
//                     {/* Duration */}
//                     <div className="col">
//                       <CustomSelect
//                           options={timeFilters}
//                           value={selectedTime}
//                           onChange={(e) => setSelectedTime(e.target.value)}
//                       />
//                     </div>
//
//                     {/* Reset/Placeholder */}
//                     <div className="col d-flex flex-column justify-content-center">
//                       {selectedTime !== "all" && (
//                           <span className="badge bg-warning text-dark rounded-pill">Detecting auto-duration</span>
//                       )}
//                     </div>
//                   </div>
//                 </div>
//               </div>
//
//               {loading && (
//                   <div className="text-center mt-4 p-3 bg-light rounded-4">
//                     <div className="spinner-border text-info" role="status"></div>
//                     <h5 className="text-info mt-2 fw-bold">Finding best adventures...</h5>
//                   </div>
//               )}
//             </div>
//           </div>
//         </div>
//
//         {/* Course List */}
//         <div className="course-section padding-tb section-bg" style={{ backgroundColor: "#F9FAFB", minHeight: "60vh", fontFamily: "'Nunito', sans-serif" }}>
//           <div className="container">
//             <div className="section-wrapper">
//               <div className="d-flex justify-content-between align-items-center mb-5">
//                 <h3 className="text-primary fw-bold mb-0">Video Hub </h3>
//                 <span className="badge bg-light text-dark fs-5 border border-2 border-secondary rounded-pill px-4 py-2 shadow-sm">
//                 Showing {filteredLectures.length === 0 ? 0 : indexOfFirstLecture + 1} - {Math.min(indexOfLastLecture, filteredLectures.length)} of {filteredLectures.length}
//               </span>
//               </div>
//
//               <div className="row g-4 justify-content-center row-cols-xl-3 row-cols-md-2 row-cols-1">
//                 {!loading && filteredLectures.length === 0 && (
//                     <div className="col-12 text-center py-5">
//                       <div className="card border-0 shadow-sm p-5 rounded-4 bg-white border border-2 border-warning text-warning">
//                         <h2 className="fw-bold">No Videos Found!</h2>
//                         <p className="fs-5 text-dark">Try adjusting your Magic Filters!</p>
//                       </div>
//                     </div>
//                 )}
//
//                 {currentLectures.map((lecture) => {
//                   const showRecommended = isRecommendedMatch(lecture.lectureDifficulty);
//
//                   return (
//                       <div className="col" key={lecture._id}>
//                         <div
//                             className="card h-100 border-0 shadow-sm"
//                             style={{ borderRadius: "24px", overflow: "hidden", transition: "all 0.3s ease", border: "2px solid #E5E7EB", borderBottom: "6px solid #4F46E5" }}
//                             onMouseEnter={(e) => {
//                               e.currentTarget.style.transform = "translateY(-10px)";
//                               e.currentTarget.style.boxShadow = "0 15px 30px rgba(0,0,0,0.15)";
//                             }}
//                             onMouseLeave={(e) => {
//                               e.currentTarget.style.transform = "translateY(0)";
//                               e.currentTarget.style.boxShadow = "0 4px 6px rgba(0,0,0,0.05)";
//                             }}
//                         >
//                           <div className="position-relative">
//                             {/* Recommended */}
//                             {showRecommended && (
//                                 <span className="position-absolute badge bg-success fs-6 rounded-pill shadow-sm px-3 py-2" style={{ top: 12, left: 12, zIndex: 2 }}>
//                             Recommended
//                           </span>
//                             )}
//
//                             <Link to={`/maths-view/${lecture._id}`} className="d-block w-100">
//                               {lecture.videoUrl ? (
//                                   <video
//                                       src={lecture.videoUrl}
//                                       preload="metadata"
//                                       muted
//                                       playsInline
//                                       onMouseOver={(e) => e.currentTarget.play()}
//                                       onMouseOut={(e) => {
//                                         e.currentTarget.pause();
//                                         e.currentTarget.currentTime = 0;
//                                       }}
//                                       style={{ width: "100%", height: 220, objectFit: "cover", backgroundColor: "#000" }}
//                                   />
//                               ) : (
//                                   <div className="d-flex align-items-center justify-content-center bg-light text-muted" style={{ width: "100%", height: 220 }}>
//                                     <h5 className="fw-bold"><i className="icofont-ui-video-play display-4 text-secondary opacity-50"></i><br />No Video</h5>
//                                   </div>
//                               )}
//                             </Link>
//
//                             {lecture.createdAt && (
//                                 <span className="position-absolute badge bg-dark text-white rounded-pill px-3 py-2 opacity-75" style={{ bottom: 12, right: 12, zIndex: 2 }}>
//                             {new Date(lecture.createdAt).toLocaleDateString()}
//                           </span>
//                             )}
//                           </div>
//
//                           <div className="card-body p-4 d-flex flex-column">
//                             <div className="d-flex justify-content-between align-items-center mb-3">
//                           <span className="badge bg-light text-primary border border-primary rounded-pill">
//                             {lecture.teacherGuideId?.coureInfo || "Video Lecture"}
//                           </span>
//                             </div>
//
//                             <Link to={`/maths-view/${lecture._id}`} className="text-decoration-none">
//                               <h4 className="card-title text-dark fw-bold mb-3">{lecture.lectureTytle}</h4>
//                             </Link>
//
//                             <div className="d-flex justify-content-between align-items-center mt-auto mb-4 bg-light p-3 rounded-4">
//                           <span className={`badge rounded-pill fs-6 ${lecture.lectureDifficulty === 'Easy' ? 'bg-success' :
//                               lecture.lectureDifficulty === 'Medium' ? 'bg-warning text-dark' : 'bg-danger'
//                           }`}>
//                             {lecture.lectureDifficulty || "—"} {lecture.lectureDifficulty === 'Easy' ? '' : lecture.lectureDifficulty === 'Medium' ? '' : ''}
//                           </span>
//
//                               <div className="d-flex gap-3 text-muted fw-bold">
//                                 <span title="PDF Resources"><i className="icofont-paperclip text-primary fs-5"></i> {lecture.pdfMaterials?.length ?? 0}</span>
//                                 {typeof lecture.durationMins === "number" && (
//                                     <span title="Duration"><i className="icofont-clock-time text-info fs-5"></i> {lecture.durationMins}m</span>
//                                 )}
//                               </div>
//                             </div>
//
//                             <div className="d-flex justify-content-between align-items-center pt-3 border-top">
//                               <span className="text-muted fw-bold">By {lecture.createby?.username || "Unknown Teacher"}</span>
//                               <Link
//                                   to={`/maths-view/${lecture._id}`}
//                                   className="btn btn-outline-info rounded-pill fw-bold"
//                               >
//                                 Watch
//                               </Link>
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                   );
//                 })}
//               </div>
//
//               <div className="mt-5 text-center">
//                 <Pagination
//                     lecturesPerPage={lecturesPerPage}
//                     totalLectures={filteredLectures.length}
//                     paginate={paginate}
//                     currentPage={currentPage}
//                 />
//               </div>
//             </div>
//           </div>
//         </div>
//
//         <Footer />
//       </>
//   );
// };
//
// export default MathsLectures;