import { Fragment, useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import Footer from "../component/layout/footer";
import Header from "../component/layout/header";
import PageHeader from "../component/layout/pageheader";
import apiClient from "../api";
import Swal from "sweetalert2";
import AutoCapture from "./CameraCapturing";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

const PaperDetails = () => {
  const { paperId } = useParams();
  const [paper, setPaper] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [studentAnswers, setStudentAnswers] = useState({});
  const [evaluationResults, setEvaluationResults] = useState({});
  const [totalCorrectMarks, setTotalCorrectMarks] = useState(0);
  const [totalAvailableMarks, setTotalAvailableMarks] = useState(0);
  const [percentage, setPercentage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const userId = localStorage.getItem("userId");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const hasFetched = useRef(false);

  // timing – measure time from mount to submit
  const startTimeRef = useRef(Date.now());       // when student opened the quiz
  const quizOpenedAtRef = useRef(Date.now());    // same — used for wait_time calc
  const [secondsSpent, setSecondsSpent] = useState(0);

  // feedback state
  const [feedbackText, setFeedbackText] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackList, setFeedbackList] = useState([]);

  // Cheating incidents
  const cheatIncidentsRef = useRef([]);
  const emotionsRef = useRef([]);

  // Setup camera & socket stream
  useEffect(() => {
    console.log("[PaperDetails] Socket instance:", socket.id);
    socket.emit("object_stream_enable", { enabled: true });
    console.log("[PaperDetails] Emitted object_stream_enable: true");

    socket.on("object_result", (data) => {
      console.log("[PaperDetails] Received object_result:", data);
      if (data && data.detections && data.detections.length > 0) {
        const incidents = data.detections.map(d => ({
          timestamp: new Date().toISOString(),
          detectionType: d.class_name || "phone"
        }));

        console.log(`[Object Detection] Found: ${incidents.map(i => i.detectionType).join(", ")} at ${new Date().toLocaleTimeString()}`);

        cheatIncidentsRef.current = [...cheatIncidentsRef.current, ...incidents];
      }
    });

    socket.on("emotion_result", (data) => {
      console.log("[PaperDetails] Received emotion:", data.emotion);
      if (data && data.emotion && data.emotion !== "No Face" && data.emotion !== "Connected" && data.emotion !== "No Face Detected") {
        emotionsRef.current.push(data.emotion);
        console.log("[PaperDetails] Added to history. Count:", emotionsRef.current.length);
      }
    });

    const video = document.createElement("video");
    video.setAttribute("autoplay", true);
    video.setAttribute("playsinline", true);
    video.style.display = "none";
    document.body.appendChild(video);

    let stream;
    let captureInterval;

    navigator.mediaDevices.getUserMedia({ video: true })
      .then((_stream) => {
        stream = _stream;
        video.srcObject = stream;

        video.onloadedmetadata = () => {
          captureInterval = setInterval(() => {
            if (isSubmitted) return; // stop sending if submitted
            const canvas = document.createElement("canvas");
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = canvas.toDataURL("image/jpeg");
            // console.log("[PaperDetails] Emitting send_object_image...");
            socket.emit("send_object_image", imageData);
          }, 5000);
        };
      })
      .catch((err) => console.error("Camera access failed:", err));

    return () => {
      socket.emit("object_stream_enable", { enabled: false });
      socket.off("object_result");
      // socket.off("emotion_result");
      if (captureInterval) clearInterval(captureInterval);
      if (stream) stream.getTracks().forEach((track) => track.stop());
      if (document.body.contains(video)) document.body.removeChild(video);
    };
  }, [isSubmitted]);

  useEffect(() => {
    fetchPaperAndQuestions();
  }, [paperId]);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    checkAndCreateStudentPerformanceIfMissing();
  }, [userId]);

  const checkAndCreateStudentPerformanceIfMissing = async () => {
    if (!userId) return;
    try {
      const res = await apiClient.get(`/api/student-performance/user/${userId}`);
      if (!res.data) {
        await apiClient.post("/api/student-performance", {
          userId,
          totalStudyTime: 0,
          resourceScore: 0,
          totalScore: 0,
          paperCount: 0,
          averageScore: 0,
          lectureCount: 0,
        });
      }
    } catch (_e) {
      // ignore; backend may 404 when not found which is fine
    }
  };

  const fetchPaperAndQuestions = async () => {
    setLoading(true);
    setError("");
    try {
      // Try detail first; if not supported, fall back to list+find
      let paperData = null;
      try {
        const p = await apiClient.get(`/api/maths/papers/${paperId}`);
        paperData = p.data;
      } catch {
        const list = await apiClient.get(`/api/maths/papers`);
        paperData = Array.isArray(list.data)
          ? list.data.find((it) => it._id === paperId)
          : null;
      }
      console.log(paperData);
      if (!paperData) throw new Error("Paper not found");

      setPaper(paperData);

      const qRes = await apiClient.get(`/api/maths/qanda/paper/${paperId}`);
      const qs = Array.isArray(qRes.data) ? qRes.data : [];
      setQuestions(qs);

      // Precompute total available marks
      const totalAvail = qs.reduce((sum, q) => sum + (Number(q.score) || 0), 0);
      setTotalAvailableMarks(totalAvail);

      // reset timing baseline on load
      startTimeRef.current = Date.now();
      setSecondsSpent(0);

      // fetch previous feedbacks (optional UI)
      fetchFeedbacks();

      setLoading(false);
    } catch (e) {
      setError("Failed to fetch paper details.");
      setLoading(false);
    }
  };

  const fetchFeedbacks = async () => {
    try {
      // If your backend also exposes feedback per guide, we can use it.
      // This example uses the same endpoint pattern used elsewhere:
      // If there's a teacherGuide, fetch its feedbacks.
      const tgId = paper?.teacherGuideId?._id;
      if (!tgId) {
        setFeedbackList([]);
        return;
      }
      const res = await apiClient.get(`/api/teacher-guide-feedbacks/guideId/${tgId}`);
      setFeedbackList(Array.isArray(res.data) ? res.data : []);
    } catch {
      setFeedbackList([]);
    }
  };

  const handleAnswerChange = (questionId, value) => {
    setStudentAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const submitAnswers = async () => {
    if (isSubmitted) return;

    let results = {};
    let correct = 0;

    questions.forEach((q) => {
      const student = (studentAnswers[q._id] || "").trim().toLowerCase();
      const correctAns = (q.questionAnswer || "").trim().toLowerCase();
      const isCorrect = student !== "" && student === correctAns;

      results[q._id] = isCorrect;
      if (isCorrect) correct += Number(q.score) || 0;
    });

    const pct = totalAvailableMarks > 0 ? (correct / totalAvailableMarks) * 100 : 0;

    setEvaluationResults(results);
    setTotalCorrectMarks(Number(correct.toFixed(2)));
    setPercentage(Number(pct.toFixed(2)));
    setIsSubmitted(true);
    socket.emit("object_stream_enable", { enabled: false }); // turn off stream

    // compute time spent from mount to submit
    const secs = Math.max(0, Math.round((Date.now() - startTimeRef.current) / 1000));
    setSecondsSpent(secs);

    updateStudentPerformance(correct);

    // Calculate dominant emotion
    const getDominantEmotion = () => {
      const counts = {};
      emotionsRef.current.forEach(e => { counts[e] = (counts[e] || 0) + 1; });
      console.log("[PaperDetails] Emotion counts before sorting:", counts);
      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
      const dominant = sorted.length > 0 ? sorted[0][0] : "Neutral";
      console.log("[PaperDetails] Dominant emotion calculated:", dominant);
      return dominant;
    };

    const dominantEmotion = getDominantEmotion();
    console.log("[PaperDetails] Final dominantEmotion to be sent:", dominantEmotion);

    try {
      await apiClient.post("/api/paper-logs", {
        studentId: userId,
        paperId: paper?._id,
        paperTitle: paper?.paperTytle || "Unknown Maths Paper",
        paperType: "Maths",
        marks: correct,
        totalMarks: totalAvailableMarks,
        timeSpent: Math.ceil(secs / 60),
        cheatIncidents: cheatIncidentsRef.current,
        dominantEmotion: dominantEmotion
      });
    } catch (e) {
      console.error("Failed to save paper object detection log:", e);
    }
  };

  const updateStudentPerformance = async (correctScore) => {
    if (!userId) return;

    // Map difficulty string to number — matches ML training data
    // 1=Easy, 2=Medium, 3=Hard, 4=Very Hard, 5=Expert
    const mapDifficulty = (d) => {
      const s = String(d || "").toLowerCase();
      if (s.includes("very hard") || s.includes("expert")) return 4;
      if (s.includes("hard")) return 3;
      if (s.includes("medium")) return 2;
      return 1;
    };

    const difficultyNum = mapDifficulty(paper?.paperDifficulty);
    const sessionScorePct = totalAvailableMarks > 0 ? (correctScore / totalAvailableMarks) * 100 : 0;

    // ── time_spent: minutes from quiz open → submit (decimal, not rounded) ──
    const timeSpentMinutes = Math.max(0, (Date.now() - startTimeRef.current) / 60000);

    // ── wait_time: minutes from quiz published → student opened it ──
    // paper.createdAt is when the quiz was published by the teacher.
    // quizOpenedAtRef.current is when the student opened the page.
    const WAIT_CAP = 55.9;
    let waitTimeMinutes = 0;
    if (paper?.createdAt) {
      const availableAt = new Date(paper.createdAt).getTime();
      waitTimeMinutes = (quizOpenedAtRef.current - availableAt) / 60000;
      waitTimeMinutes = Math.min(Math.max(0, waitTimeMinutes), WAIT_CAP);
    }

    // ── resource_score: check if student completed the related lecture ──
    // If a teacher guide is attached, check CompletedLecture for that guide.
    // 1.0 = fully engaged, 0.055 = no resource engagement (model minimum).
    let resourceScore = 0.055;
    try {
      const tgId = paper?.teacherGuideId?._id;
      if (tgId && userId) {
        const completedRes = await apiClient.get(
          `/api/completed-lectures?userId=${userId}&lectureType=lecture`
        );
        const completedLectures = Array.isArray(completedRes.data) ? completedRes.data : [];
        // If any completed lecture is linked to this teacher guide, the student engaged
        // with the resource. Use resourceScore = 1.0 as a baseline.
        // (For full accuracy, the actual watch-% is stored in the lecture session.)
        const hasCompletedRelated = completedLectures.some(
          (cl) => String(cl.lectureId) === String(tgId) ||
                  String(cl.lectureType).toLowerCase().includes("lecture")
        );
        if (hasCompletedRelated) resourceScore = 1.0;
      }
    } catch (_) {
      // If the check fails, fall back to minimum. Do not block submission.
      resourceScore = 0.055;
    }

    try {
      await apiClient.post("/api/student-performance-history", {
        userId,
        sessionScore:    Number(sessionScorePct.toFixed(2)),
        timeSpent:       Number(timeSpentMinutes.toFixed(2)),
        waitTime:        Number(waitTimeMinutes.toFixed(2)),
        resourceScore:   resourceScore,
        difficulty:      difficultyNum,
        sessionType:     "paper",
        quizAvailableAt: paper?.createdAt || null,
      });

      Swal.fire({
        title: "Success!",
        text: `Your result (${sessionScorePct.toFixed(2)}%) has been recorded! Performance metrics updated.`,
        icon: "success",
        confirmButtonText: "OK",
      });
    } catch (error) {
      console.error("Error updating student performance:", error);
      Swal.fire({
        title: "Error!",
        text: "There was an issue recording your performance. Please try again.",
        icon: "error",
        confirmButtonText: "OK",
      });
    }
  };

  // === Feedback handling after submission ===
  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!isSubmitted) return; // only after completion
    const tgId = paper?.teacherGuideId?._id;

    if (!tgId) {
      Swal.fire({
        icon: "warning",
        title: "No Teacher Guide",
        text: "This paper has no attached teacher guide to leave feedback on.",
      });
      return;
    }
    if (!feedbackText.trim()) return;

    // Attempt percentage: how many questions were tried (non-empty answers)
    const attempted = questions.reduce((sum, q) => {
      const ans = (studentAnswers[q._id] || "").trim();
      return sum + (ans ? 1 : 0);
    }, 0);
    const attemptedPct = questions.length > 0 ? Math.round((attempted / questions.length) * 100) : 0;

    setSubmittingFeedback(true);
    try {
      await apiClient.post("/api/teacher-guide-feedbacks", {
        teacherGuideId: tgId,
        studentFeedback: feedbackText.trim(),
        contentTitle: paper?.paperTytle,
        marks: attemptedPct,      // percent of attempted questions
        studytime: Math.ceil(secondsSpent / 60),  // time spent (minutes) before submitting
      });

      Swal.fire({
        icon: "success",
        title: "Thanks for your feedback!",
        text: `Attempted ${attempted}/${questions.length} questions (${attemptedPct}%). Time spent: ${Math.ceil(secondsSpent / 60)}m.`,
        timer: 1800,
        showConfirmButton: false,
      });
      setFeedbackText("");
      fetchFeedbacks();
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Failed",
        text: "Could not submit feedback. Please try again.",
      });
    } finally {
      setSubmittingFeedback(false);
    }
  };

  return (
    <Fragment>
      <Header />
      <AutoCapture enableGamePopup={false} showFloatingEmotion={false} />
      <PageHeader title="Fun Challenge! " curPage={"Paper Details"} />
      <div className="paper-section padding-tb section-bg" style={{ backgroundColor: "#F9FAFB", minHeight: "80vh", fontFamily: "'Nunito', sans-serif" }}>
        <div className="container">
          {loading ? (
            <div className="text-center mt-5">
              <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} role="status"></div>
              <h4 className="text-primary mt-3 fw-bold">Loading your challenge... ⏳</h4>
            </div>
          ) : error ? (
            <div className="alert alert-danger rounded-4 text-center p-4">
              <h4>Oops! 🙈</h4>
              <p>{error}</p>
            </div>
          ) : paper ? (
            <div className="paper-content mx-auto" style={{ maxWidth: "800px" }}>
              {/* Paper Header */}
              <div className="paper-header text-center bg-white p-5 shadow-sm mb-5" style={{ borderRadius: "24px", border: "2px solid #E0E7FF", boxShadow: "0 4px 20px rgba(79, 70, 229, 0.1)" }}>
                <h1 className="fw-bold mb-3" style={{ color: "#4F46E5", fontFamily: "'Baloo 2', sans-serif" }}>{paper.paperTytle}</h1>
                <div className="d-flex flex-wrap justify-content-center gap-3">
                  <span className={`badge rounded-pill fs-5 ${paper.paperDifficulty === 'Easy' ? 'bg-success' : paper.paperDifficulty === 'Medium' ? 'bg-warning text-dark' : 'bg-danger'}`}>
                    Level: {paper.paperDifficulty}
                  </span>
                  {paper.teacherGuideId?.coureInfo && (
                    <span className="badge bg-secondary rounded-pill fs-5">
                      Guide: {paper.teacherGuideId.coureInfo}
                    </span>
                  )}
                </div>
              </div>

              {/* Questions */}
              <div className="question-section">
                {questions.length > 0 ? (
                  <ul className="question-list list-unstyled">
                    {questions.map((q, idx) => (
                      <li key={q._id} className="mb-4">
                        <div className="card shadow-sm border-0 p-4" style={{ borderRadius: "24px", transition: "all 0.3s ease", border: "2px solid #E5E7EB" }} onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-5px)"; e.currentTarget.style.boxShadow = "0 10px 30px rgba(79, 70, 229, 0.12)"; }} onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.05)"; }}>
                          <h4 className="mb-4 text-dark fst-italic">
                            <span className="badge bg-primary rounded-circle fs-5 me-2" style={{ padding: "10px 15px" }}>Q{idx + 1}</span>
                            {q.questionTytle}
                            <span className="badge bg-warning text-dark fs-6 ms-3 rounded-pill shadow-sm">⭐ {q.score} marks</span>
                          </h4>
                          <div>
                            <input
                              type="text"
                              className="form-control form-control-lg rounded-pill px-4 shadow-sm"
                              placeholder="Type your answer here! "
                              value={studentAnswers[q._id] || ""}
                              style={{ border: "2px solid #e0e7ff", backgroundColor: "#fcfcff" }}
                              onChange={(e) => handleAnswerChange(q._id, e.target.value)}
                              disabled={isSubmitted}
                            />
                            {evaluationResults[q._id] !== undefined && (
                              <div className={`mt-3 p-3 rounded-4 fw-bold text-center fs-5 shadow-sm ${evaluationResults[q._id] ? "lms-feedback-correct" : "lms-feedback-incorrect"}`}>
                                {evaluationResults[q._id] ? "Awesome! Correct! ✅" : "Oops! Incorrect ❌"}
                              </div>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center p-5 bg-white rounded-4 shadow-sm">
                    <h4 className="text-muted">No questions found yet.️</h4>
                  </div>
                )}
              </div>

              {/* Submit + Scores */}
              <div className="text-center mt-5 mb-5">
                <button
                  className={`btn btn-lg rounded-pill px-5 py-3 fw-bold shadow-lg ${isSubmitted ? 'btn-secondary' : ''}`}
                  style={{ fontSize: "1.5rem", transition: "all 0.3s ease", borderRadius: "50px", background: isSubmitted ? undefined : "linear-gradient(135deg, #22C55E 0%, #16A34A 100%)", border: "none" }}
                  onClick={submitAnswers}
                  disabled={isSubmitted || questions.length === 0}
                >
                  {isSubmitted ? "Submitted!" : "Submit My Answers! "}
                </button>

                {isSubmitted && (
                  <div className="mt-4 p-4 bg-white rounded-4 shadow-sm d-inline-block border border-2 border-info">
                    <h3 className="text-success fw-bold mb-3">
                      Great Job!
                    </h3>
                    <h5 className="text-dark mb-2">
                      <span className="badge bg-primary fs-5 me-2">Marks</span>
                      {totalCorrectMarks} / {totalAvailableMarks}
                    </h5>
                    <h4 className="text-info fw-bold mb-3">
                      <span className="badge bg-warning text-dark fs-5 me-2">Score</span>
                      {percentage}%
                    </h4>
                    <p className="text-muted fst-italic mb-0">🕒 Time spent: {Math.ceil(secondsSpent / 60)}m</p>
                  </div>
                )}
              </div>

              {/* Feedback form — enabled only after submission */}
              {isSubmitted && (
                <div className="card mt-4 p-4 border-0 shadow-lg" style={{ borderRadius: "24px", backgroundColor: "#FFFBEB", border: "2px solid #FDE68A" }}>
                  <h4 className="fw-bold border-bottom pb-2 mb-4" style={{ color: "#D97706", fontFamily: "'Baloo 2', sans-serif" }}>
                    Tell us what you think!
                    {paper.teacherGuideId?.coureInfo && <span className="fs-6 text-muted d-block mt-1">For: {paper.teacherGuideId.coureInfo}</span>}
                  </h4>
                  {!paper.teacherGuideId?._id && (
                    <div className="alert alert-info rounded-pill text-center border-0 shadow-sm mb-4">
                      No teacher guide attached for feedback on this one!
                    </div>
                  )}
                  <form onSubmit={handleFeedbackSubmit}>
                    <textarea
                      className="form-control form-control-lg rounded-4 p-3 shadow-sm mb-4"
                      rows={3}
                      style={{ border: "2px solid #ffe0b2" }}
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="Was it fun? Too hard? Let your teacher know! ✏️"
                      disabled={submittingFeedback || !paper.teacherGuideId?._id}
                      required
                    />
                    <div className="text-end">
                      <button
                        className="btn btn-warning btn-lg rounded-pill fw-bold text-dark px-5 shadow-sm"
                        type="submit"
                        disabled={submittingFeedback || !feedbackText.trim() || !paper.teacherGuideId?._id}
                      >
                        {submittingFeedback ? "Sending... " : "Send Feedback! "}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center p-5 bg-white rounded-4 shadow-sm">
              <h4>Adventure not found. </h4>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </Fragment>
  );
};

export default PaperDetails;
