import { Fragment, useEffect, useRef, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import Footer from "../component/layout/footer";
import Header from "../component/layout/header";
import PageHeader from "../component/layout/pageheader";
import apiClient from "../api";
import axios from "axios";
import Swal from "sweetalert2";

const StudentProfile = () => {
  const [student, setStudent] = useState(null);
  const [studentPerScore, setStudentPerScore] = useState(null);
  const [studentPerformanceHistory, setStudentPerformanceHistory] = useState([]);
  const [studentForecast, setStudentForecast] = useState(null);
  const userId = localStorage.getItem("userId");



  useEffect(() => {
    fetchStudentProfile();
    fetchStudentPerformanceHistory();
  }, []);

  useEffect(() => {
    // Only call calculations if we have at least 10 sessions
    if (studentPerformanceHistory.length >= 10) {
      fetchStudentCurrentLevel();
      fetchStudentForecast();
    }
  }, [studentPerformanceHistory.length]);

  useEffect(() => {
    checkDifficultyUpdate();
  }, [student, studentPerScore]);



  const fetchStudentProfile = async () => {
    try {
      const response = await apiClient.get(`/api/users/${userId}`);
      if (response.data) {
        setStudent(response.data);
      }
    } catch (error) {
      console.error("Error fetching student profile:", error);
    }
  };

  // legacy studentPerformance fetch removed

  const fetchStudentPerformanceHistory = async () => {
    try {
      const response = await apiClient.get(`/api/student-performance-history/user/${userId}`);
      if (response.data) {
        setStudentPerformanceHistory(response.data);
      }
    } catch (error) {
      console.error("Error fetching student performance history:", error);
    }
  };

  const fetchStudentCurrentLevel = async () => {
    try {
      const response = await apiClient.post(`/api/student-performance/predict/${userId}`);
      if (response.data) {
        setStudentPerScore(response.data);
      }
    } catch (error) {
      console.error("Error fetching student performance prediction:", error);
    }
  };

  const fetchStudentForecast = async () => {
    try {
      const response = await apiClient.post(`/api/student-performance/forecast/${userId}`);
      if (response.data) {
        setStudentForecast(response.data);
      }
    } catch (error) {
      console.error("Error fetching student forecast:", error);
    }
  };

  const checkDifficultyUpdate = () => {
    if (!student || !studentPerScore?.next_difficulty) return;

    const currentLevel = student.difficultyLevel;
    const suggestedLevel = mapNumericDifficulty(studentPerScore.next_difficulty);

    if (suggestedLevel !== "N/A" && currentLevel !== suggestedLevel) {
      Swal.fire({
        title: "Level Up? ",
        text: `Your performance suggests a ${suggestedLevel} difficulty would be better for you. Do you want to update your level from ${currentLevel || 'N/A'} to ${suggestedLevel}?`,
        icon: "info",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, update it!",
        cancelButtonText: "Maybe later"
      }).then((result) => {
        if (result.isConfirmed) {
          updateDifficulty(suggestedLevel);
        }
      });
    }
  };

  const updateDifficulty = async (newLevel) => {
    try {
      const response = await apiClient.put(`/api/users/${userId}`, {
        difficultyLevel: newLevel
      });

      if (response.data) {
        setStudent(response.data);
        localStorage.setItem("difficultyLevel", newLevel);
        Swal.fire({
          title: "Updated!",
          text: `Your difficulty level is now ${newLevel}.`,
          icon: "success",
          timer: 2000,
          showConfirmButton: false
        });
      }
    } catch (error) {
      console.error("Error updating difficulty:", error);
      Swal.fire("Error", "Failed to update difficulty level.", "error");
    }
  };

  const mapNumericDifficulty = (diff) => {
    const d = Number(diff);
    if (d >= 3.5) return "Hard";
    if (d >= 1.8) return "Medium";
    if (d > 0) return "Easy";
    return "N/A";
  };

  const getRiskConfig = (val) => {
    if (val === 2) return { label: "Needs Help", bg: "#FEE2E2", color: "#DC2626", dot: "#DC2626" };
    if (val === 1) return { label: "Getting There", bg: "#FEF9C3", color: "#CA8A04", dot: "#FACC15" };
    return { label: "Doing Great!", bg: "#DCFCE7", color: "#16A34A", dot: "#22C55E" };
  };

  const getLevelConfig = (level) => {
    if (level === "Hard") return { bg: "#FEE2E2", color: "#DC2626", icon: "🔥" };
    if (level === "Medium") return { bg: "#FEF9C3", color: "#CA8A04", icon: "⚡" };
    return { bg: "#DBEAFE", color: "#2563EB", icon: "🌱" };
  };

  return (
      <Fragment>
        <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseRing {
          0%, 100% { box-shadow: 0 0 0 0 rgba(79,70,229,0.18); }
          50%       { box-shadow: 0 0 0 10px rgba(79,70,229,0); }
        }
        .info-card-row { animation: fadeSlideUp 0.45s ease both; transition: transform 0.2s ease; }
        .info-card-row:nth-child(1) { animation-delay: 0.05s; }
        .info-card-row:nth-child(2) { animation-delay: 0.12s; }
        .info-card-row:nth-child(3) { animation-delay: 0.19s; }
        .info-card-row:nth-child(4) { animation-delay: 0.26s; }
        .info-card-row:nth-child(5) { animation-delay: 0.33s; }
        .info-card-row { transition: all 0.2s ease-in-out; cursor: default; }
        .info-card-row:hover { transform: translateX(5px); background-color: #F8FAFC !important; }
        .info-card-row:hover div { color: inherit !important; }
        
        .magic-suggestion-box {
          transition: all 0.3s ease;
        }
        .magic-suggestion-box:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 30px rgba(0,0,0,0.08) !important;
        }

        .profile-avatar-wrap { animation: pulseRing 2.8s ease-in-out infinite; border-radius: 50%; display: inline-block; }
      `}</style>

        <Header />
        <PageHeader title={"Student Profile"} curPage={"Profile"} />
        <section className="student-profile-section padding-tb section-bg" style={{ backgroundColor: "#F9FAFB", minHeight: "80vh", fontFamily: "'Nunito', sans-serif" }}>
          <div className="container">
            <div className="profile-wrapper d-flex justify-content-center">
              {student ? (
                  <div className="profile-content card border-0 shadow-lg p-5" style={{ borderRadius: "28px", width: "100%", maxWidth: "1000px", border: "2px solid #E0E7FF", boxShadow: "0 10px 40px rgba(79, 70, 229, 0.12)" }}>
                    <div className="text-center mb-5">
                      <h1 className="fw-bold" style={{ fontSize: "2.8rem", color: "#4F46E5", fontFamily: "'Baloo 2', sans-serif" }}>
                        Hello, {student.firstName}!
                      </h1>
                      <h5 className="text-muted">Welcome to your learning dashboard!</h5>
                    </div>

                    {/* ── Profile Row ── */}
                    <div className="row align-items-stretch mb-5">

                      {/* Avatar */}
                      <div className="col-md-5 text-center mb-4 mb-md-0 d-flex align-items-center justify-content-center">
                        <div className="profile-avatar-wrap">
                          <img
                              src={
                                student.faceImgUrl
                                    ? student.faceImgUrl
                                    : "https://img.freepik.com/premium-vector/man-avatar-profile-picture-vector-illustration_268834-538.jpg"
                              }
                              alt="Profile"
                              className="rounded-circle shadow"
                              style={{
                                width: "220px",
                                height: "220px",
                                objectFit: "cover",
                                border: "6px solid #e0e7ff",
                                padding: "5px",
                                backgroundColor: "#fff",
                              }}
                          />
                        </div>
                      </div>

                      {/* ── Your Info Card ── */}
                      <div className="col-md-7 d-flex">
                        <div style={{
                          width: "100%",
                          borderRadius: "24px",
                          background: "linear-gradient(145deg, #f0f4ff 0%, #ffffff 60%, #f5f3ff 100%)",
                          border: "2px solid #E0E7FF",
                          boxShadow: "0 6px 24px rgba(79,70,229,0.10)",
                          overflow: "hidden",
                        }}>
                          {/* Header stripe */}
                          <div style={{
                            background: "linear-gradient(90deg, #4F46E5 0%, #818CF8 100%)",
                            padding: "16px 24px",
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                          }}>
                            <i className="icofont-id-card" style={{ fontSize: "1.6rem", color: "#fff" }}></i>
                            <span style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1.2rem", color: "#fff", letterSpacing: "0.02em" }}>
                          Your Info
                        </span>
                          </div>

                          {/* Info rows */}
                          <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 10 }}>

                            {/* Name */}
                            <div className="info-card-row" style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", borderRadius: "14px", background: "#fff", border: "1.5px solid #E0E7FF" }}>
                              <div style={{ width: 38, height: 38, borderRadius: "10px", background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                <i className="icofont-user-alt-3" style={{ color: "#4F46E5", fontSize: "1.2rem" }}></i>
                              </div>
                              <div>
                                <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.08em" }}>Full Name</div>
                                <div style={{ fontWeight: 700, color: "#1F2937", fontSize: "1rem" }}>{student.firstName} {student.lastName}</div>
                              </div>
                            </div>

                            {/* Age */}
                            <div className="info-card-row" style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", borderRadius: "14px", background: "#fff", border: "1.5px solid #E0E7FF" }}>
                              <div style={{ width: 38, height: 38, borderRadius: "10px", background: "#FFF7ED", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                <i className="icofont-birthday-cake" style={{ color: "#F97316", fontSize: "1.2rem" }}></i>
                              </div>
                              <div>
                                <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.08em" }}>Age</div>
                                <div style={{ fontWeight: 700, color: "#1F2937", fontSize: "1rem" }}>{student.age ?? "N/A"}</div>
                              </div>
                            </div>

                            {/* Grade */}
                            <div className="info-card-row" style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", borderRadius: "14px", background: "#fff", border: "1.5px solid #E0E7FF" }}>
                              <div style={{
                                width: 38, height: 38, borderRadius: "10px",
                                background: "#EEF2FF",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                flexShrink: 0
                              }}>
                                <i className="icofont-graduate" style={{ color: "#4F46E5", fontSize: "1.2rem" }}></i>
                              </div>
                              <div>
                                <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.08em" }}>Grade</div>
                                <div style={{ fontWeight: 700, color: "#1F2937", fontSize: "1rem" }}>{student.grade ?? "N/A"}</div>
                              </div>
                            </div>


                            {/* Email */}
                            <div className="info-card-row" style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", borderRadius: "14px", background: "#fff", border: "1.5px solid #E0E7FF" }}>
                              <div style={{ width: 38, height: 38, borderRadius: "10px", background: "#F0FDF4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                <i className="icofont-email" style={{ color: "#16A34A", fontSize: "1.2rem" }}></i>
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.08em" }}>Email</div>
                                <div style={{ fontWeight: 700, color: "#1F2937", fontSize: "1rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{student.email}</div>
                              </div>
                            </div>

                            {/* Learning Status */}
                            <div className="info-card-row" style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", borderRadius: "14px", background: "#fff", border: "1.5px solid #E0E7FF" }}>
                              <div style={{ width: 38, height: 38, borderRadius: "10px", background: getRiskConfig(student.isRiskStudent).bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                <i className="icofont-heart-beat" style={{ color: getRiskConfig(student.isRiskStudent).color, fontSize: "1.2rem" }}></i>
                              </div>
                              <div style={{ flex: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div>
                                  <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.08em" }}>Learning Status</div>
                                  <div style={{ fontWeight: 700, color: "#1F2937", fontSize: "1rem" }}>{getRiskConfig(student.isRiskStudent).label}</div>
                                </div>
                                <span style={{
                                  width: 12, height: 12, borderRadius: "50%",
                                  background: getRiskConfig(student.isRiskStudent).dot,
                                  boxShadow: `0 0 0 3px ${getRiskConfig(student.isRiskStudent).bg}`,
                                  display: "inline-block",
                                  flexShrink: 0,
                                }}></span>
                              </div>
                            </div>

                            {/* Current Level */}
                            <div className="info-card-row" style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", borderRadius: "14px", background: "#fff", border: "1.5px solid #E0E7FF" }}>
                              <div style={{ width: 38, height: 38, borderRadius: "10px", background: getLevelConfig(student.difficultyLevel).bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "1.2rem" }}>
                                {getLevelConfig(student.difficultyLevel).icon}
                              </div>
                              <div style={{ flex: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div>
                                  <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.08em" }}>Current Level</div>
                                  <div style={{ fontWeight: 700, color: "#1F2937", fontSize: "1rem" }}>{student.difficultyLevel ?? "N/A"}</div>
                                </div>
                                <span style={{
                                  padding: "4px 14px",
                                  borderRadius: "50px",
                                  background: getLevelConfig(student.difficultyLevel).bg,
                                  color: getLevelConfig(student.difficultyLevel).color,
                                  fontWeight: 800,
                                  fontSize: "0.8rem",
                                  border: `1.5px solid ${getLevelConfig(student.difficultyLevel).color}44`,
                                }}>
                              {student.difficultyLevel ?? "N/A"}
                            </span>
                              </div>
                            </div>

                          </div>
                        </div>
                      </div>
                    </div>

                    {/* AI Prediction Section (Magic Suggestion) */}
                    <div className="row mb-5 justify-content-center">
                      <div className="col-md-8 text-center">
                        <div className="p-4 shadow-sm magic-suggestion-box" style={{ 
                          borderRadius: "24px", 
                          backgroundColor: studentPerformanceHistory.length >= 10 ? "#FFFBEB" : "#F3F4F6", 
                          border: studentPerformanceHistory.length >= 10 ? "2px solid #FDE68A" : "2px solid #E5E7EB" 
                        }}>
                          <h4 className="mb-3" style={{ 
                            fontWeight: 800, 
                            color: studentPerformanceHistory.length >= 10 ? "#D97706" : "#6B7280", 
                            fontFamily: "'Baloo 2', sans-serif" 
                          }}>
                            <span role="img" aria-label="crystal ball">{studentPerformanceHistory.length >= 10 ? "🔮" : "🔒"}</span> Magic Suggestion
                          </h4>
                          
                          {studentPerformanceHistory.length >= 10 ? (
                            <h5 className="mb-0">
                              Based on your progress, you should try <span className="badge bg-primary fs-5 ms-2 rounded-pill">
                                {studentPerScore?.next_difficulty ? mapNumericDifficulty(studentPerScore.next_difficulty) : "Leveling Up!"}
                              </span> next!
                            </h5>
                          ) : (
                            <h5 className="mb-0" style={{ color: "#6B7280" }}>
                              Complete <span className="badge bg-secondary fs-6 mx-1 rounded-pill">{10 - studentPerformanceHistory.length}</span> more adventure(s) to unlock your secret level recommendation! ✨
                            </h5>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Charts Section */}
                    <h3 className="text-center fw-bold mb-4" style={{ color: "#4F46E5", fontFamily: "'Baloo 2', sans-serif" }}>Your Progress Journey</h3>
                    <div className="row justify-content-center">
                      <div className="col-lg-10 mb-4">
                        <div className="chart-container p-4 border-0 rounded bg-white shadow-sm" style={{ borderRadius: "24px", border: "2px solid #E5E7EB" }}>
                          <h5 className="text-center mb-4 fw-bold" style={{ color: "#22C55E", fontFamily: "'Baloo 2', sans-serif" }}>Past Adventures</h5>
                          <ResponsiveContainer width="100%" height={300}>
                            <LineChart
                                data={studentPerformanceHistory.map((entry, index) => ({
                                  index: index + 1,
                                  sessionScore: entry.sessionScore,
                                }))}
                            >
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                              <XAxis dataKey="index" label={{ value: 'Sessions', position: 'insideBottom', offset: -5 }} tick={{ fill: '#6c757d' }} />
                              <YAxis domain={[0, 100]} tick={{ fill: '#6c757d' }} />
                              <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                              <Line type="monotone" dataKey="sessionScore" stroke="#22C55E" strokeWidth={4} dot={{ r: 6, fill: "#22C55E", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 8 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      <div className="col-lg-10 mb-4">
                        <div className="chart-container p-4 border-0 rounded bg-white shadow-sm" style={{ borderRadius: "24px", border: "2px solid #E5E7EB" }}>
                          <h5 className="text-center mb-4 fw-bold" style={{ color: "#4F46E5", fontFamily: "'Baloo 2', sans-serif" }}>Future Forecast</h5>
                          {studentForecast ? (
                              <ResponsiveContainer width="100%" height={300}>
                                <LineChart
                                    data={[
                                      { name: '+1', score: studentForecast?.predictions?.interaction_plus_1?.predicted_score },
                                      { name: '+2', score: studentForecast?.predictions?.interaction_plus_2?.predicted_score },
                                      { name: '+3', score: studentForecast?.predictions?.interaction_plus_3?.predicted_score },
                                      { name: '+4', score: studentForecast?.predictions?.interaction_plus_4?.predicted_score },
                                    ]}
                                >
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                                  <XAxis dataKey="name" tick={{ fill: '#6c757d' }} />
                                  <YAxis domain={[0, 100]} tick={{ fill: '#6c757d' }} />
                                  <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                                  <Line type="monotone" dataKey="score" stroke="#4F46E5" strokeWidth={4} strokeDasharray="8 6" dot={{ r: 6, fill: "#4F46E5", strokeWidth: 2, stroke: "#fff" }} />
                                </LineChart>
                              </ResponsiveContainer>
                          ) : (
                              <div className="d-flex align-items-center justify-content-center" style={{ height: "300px" }}>
                                <p className="text-muted fst-italic">
                                  {studentPerformanceHistory.length < 10
                                    ? `Complete ${10 - studentPerformanceHistory.length} more session(s) to unlock your future forecast! ✨`
                                    : "Keep playing games to unlock your future forecast! ✨"
                                  }
                                </p>
                              </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
              ) : (
                  <div className="card border-0 shadow-lg p-5 text-center mt-5" style={{ borderRadius: "24px" }}>
                    <div className="spinner-border text-primary ms-auto me-auto mt-4 mb-3" role="status" style={{ width: '3rem', height: '3rem' }}></div>
                    <h4 className="text-primary">Loading your profile...</h4>
                  </div>
              )}
            </div>
          </div>
        </section>
        <Footer />
      </Fragment>
  );
};

export default StudentProfile;