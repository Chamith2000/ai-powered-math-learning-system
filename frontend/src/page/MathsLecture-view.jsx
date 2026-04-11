import React, { Fragment, useEffect, useState, useRef } from 'react';
import { useParams } from "react-router-dom";
import Footer from "../component/layout/footer";
import Header from "../component/layout/header";
import PageHeader from "../component/layout/pageheader";
import apiClient from "../api";
import Swal from "sweetalert2";
import AutoCapture from "./CameraCapturing";
import { Document, Page, pdfjs } from 'react-pdf';
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

const typeLabels = {
  1: "Video Lectures",
  2: "Practical",
  3: "Reading",
};

// Multiplier for time -> totalStudyTime
const timeMultiplierByDifficulty = {
  easy: 1,
  medium: 1.2,
  hard: 1.5,
};

const fileNameFromUrl = (url) => {
  try {
    const u = new URL(url);
    const last = u.pathname.split('/').filter(Boolean).pop() || 'material.pdf';
    return decodeURIComponent(last);
  } catch {
    return 'material.pdf';
  }
};

const MathsLectureView = () => {
  const { id } = useParams();
  const [lecture, setLecture] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewFull, setViewFull] = useState(false);
  const userId = localStorage.getItem("userId");
  const intervalRef = useRef(null);
  const [icon, setIcon] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackList, setFeedbackList] = useState([]);
  const [ratingValue, setRatingValue] = useState(5);

  const videoRef = useRef(null);
  const [durationMinutes, setDurationMinutes] = useState(null);

  const [activePdf, setActivePdf] = useState(null);

  const hasFetched = useRef(false);

  // ===== video engagement tracking =====
  const watchedSecondsRef  = useRef(0);     // accumulated real watch time (seconds)
  const lastTimeRef        = useRef(null);  // last known currentTime while playing
  const isPlayingRef       = useRef(false); // currently playing?
  const hasRewoundRef      = useRef(false); // did student seek backward?
  const hasSkippedRef      = useRef(false); // did student skip forward > 20%?
  const lectureRef         = useRef(null);  // LATEST LECTURE DATA (avoid stale closures)
  const prevPositionRef    = useRef(null);  // position BEFORE a seek

  const onVideoPlay = () => {
    if (!videoRef.current) return;
    isPlayingRef.current = true;
    lastTimeRef.current = videoRef.current.currentTime || 0;
  };

  const onVideoPause = () => {
    if (!videoRef.current) return;
    if (isPlayingRef.current && lastTimeRef.current != null) {
      const now = videoRef.current.currentTime || 0;
      const delta = now - lastTimeRef.current;
      if (delta > 0) watchedSecondsRef.current += delta;
    }
    isPlayingRef.current = false;
    lastTimeRef.current = videoRef.current?.currentTime || 0;
  };

  const onVideoTimeUpdate = () => {
    if (!videoRef.current || !isPlayingRef.current) return;
    const now = videoRef.current.currentTime || 0;
    if (lastTimeRef.current == null) { lastTimeRef.current = now; return; }
    const delta = now - lastTimeRef.current;
    if (delta > 0) watchedSecondsRef.current += delta;
    lastTimeRef.current = now;
  };

  const onVideoSeeked = () => {
    if (!videoRef.current) return;
    const newPos  = videoRef.current.currentTime || 0;
    const oldPos  = prevPositionRef.current;
    const dur     = videoRef.current.duration || 1;

    if (oldPos != null) {
      if (newPos < oldPos) {
        // Backward seek = rewind
        hasRewoundRef.current = true;
      } else if ((newPos - oldPos) > dur * 0.20) {
        // Forward skip > 20% of duration
        hasSkippedRef.current = true;
      }
    }
    // reset accumulation baseline to new position
    lastTimeRef.current   = newPos;
    prevPositionRef.current = newPos;
  };

  const onVideoTimeUpdateForSeek = () => {
    // Keep prevPosition in sync while playing (before any seek)
    if (!videoRef.current) return;
    prevPositionRef.current = videoRef.current.currentTime || 0;
  };

  const onVideoEnded = () => {
    if (!videoRef.current) return;
    if (isPlayingRef.current && lastTimeRef.current != null) {
      const now = videoRef.current.currentTime || 0;
      const delta = now - lastTimeRef.current;
      if (delta > 0) watchedSecondsRef.current += delta;
    }
    isPlayingRef.current = false;
    lastTimeRef.current = videoRef.current.currentTime || 0;
  };

  /**
   * Compute resource_score from video watch behaviour.
   * Formula from specification:
   *   watch_ratio   = watchedSeconds / totalDurationSeconds
   *   rewind_bonus  = +0.1 if student rewound any section
   *   skip_penalty  = -0.1 if student skipped forward > 20%
   *   resource_score = clamp(watch_ratio + rewind_bonus - skip_penalty, 0.055, 1.0)
   */
  const computeResourceScore = (watchedSeconds, totalDurationSeconds) => {
    if (!totalDurationSeconds || totalDurationSeconds <= 0) return 0.055;
    const watchRatio    = Math.min(watchedSeconds / totalDurationSeconds, 1.0);
    const rewindBonus   = hasRewoundRef.current  ? 0.1 : 0;
    const skipPenalty   = hasSkippedRef.current  ? 0.1 : 0;
    const raw = watchRatio + rewindBonus - skipPenalty;
    return Math.min(1.0, Math.max(0.055, raw));
  };

  const finalizeWatchedSeconds = () => {
    let finalWatched = watchedSecondsRef.current;
    if (videoRef.current && isPlayingRef.current && lastTimeRef.current != null) {
      const now = videoRef.current.currentTime || 0;
      const delta = now - lastTimeRef.current;
      if (delta > 0) {
        finalWatched += delta;
        watchedSecondsRef.current = finalWatched;
      }
      lastTimeRef.current = now;
    }
    return finalWatched;
  };
  // ===== end video engagement tracking =====

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    fetchLecture();
    ensureStudentPerformanceExists();
    fetchFeedbacks();
  }, []);

  // On unmount (normal SPA navigation): record the lecture session
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      recordLectureSessionOnExit();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // On tab close / page refresh: use sendBeacon for reliability
  useEffect(() => {
    const recordWithBeacon = () => {
      // sendBeacon is the only reliable way to send data when the tab closes.
      // It uses the Beacon API which the browser guarantees to deliver
      // even during page unload.
      const currentLecture = lectureRef.current;
      if (!userId || !currentLecture || sessionRecordedRef.current) return;
      sessionRecordedRef.current = true;

      const finalWatched = finalizeWatchedSeconds();

      const totalDurationSec = videoRef.current?.duration || 0;
      const resourceScore    = computeResourceScore(finalWatched, totalDurationSec);
      const timeSpentMinutes = Math.max(0, finalWatched / 60);
      const difficultyNum    = mapDifficulty(currentLecture.lectureDifficulty);
      const lecScore         = currentLecture.score !== undefined ? Number(currentLecture.score) : 100;

      const payload = JSON.stringify({
        userId,
        sessionScore:  lecScore,
        timeSpent:     Number(timeSpentMinutes.toFixed(2)),
        waitTime:      0,
        resourceScore: resourceScore,
        difficulty:    difficultyNum,
        sessionType:   "lecture",
      });

      // Beacon API — works on tab close/refresh
      // Try to use absolute path relative to current domain or configured base
      const apiEndpoint = "/api/student-performance-history";
      const fullUrl = apiClient.defaults.baseURL 
        ? `${apiClient.defaults.baseURL}${apiEndpoint}`
        : `http://localhost:5001${apiEndpoint}`;
        
      navigator.sendBeacon(
        fullUrl,
        new Blob([payload], { type: "application/json" })
      );
    };

    const handleVisibilityChange = () => {
      // Keep the latest watch segment counted when the tab is hidden.
      // Do not save here: visibilitychange also fires on ordinary tab switches.
      if (document.visibilityState === "hidden") {
        finalizeWatchedSeconds();
      }
    };

    window.addEventListener("beforeunload", recordWithBeacon);
    window.addEventListener("pagehide", recordWithBeacon);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", recordWithBeacon);
      window.removeEventListener("pagehide", recordWithBeacon);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, lecture]);


  /**
   * Map difficulty string to number matching ML training data.
   * 1=Easy, 2=Medium, 3=Hard, 4=Very Hard, 5=Expert
   */
  const mapDifficulty = (d) => {
    const s = String(d || "").toLowerCase();
    if (s.includes("very hard") || s.includes("expert")) return 4;
    if (s.includes("hard")) return 3;
    if (s.includes("medium")) return 2;
    return 1;
  };

  /**
   * Record the complete lecture session when the student leaves.
   * Called on component unmount and after feedback submission.
   * Uses a ref flag to avoid double-recording.
   */
  const sessionRecordedRef = useRef(false);

  const recordLectureSessionOnExit = async () => {
    if (sessionRecordedRef.current) return; // already recorded
    const currentLecture = lectureRef.current;
    if (!userId || !currentLecture) return;
    sessionRecordedRef.current = true;

    // Finalize any in-progress video segment
    const finalWatched = finalizeWatchedSeconds();

    const totalDurationSec = videoRef.current?.duration || 0;
    const resourceScore = computeResourceScore(finalWatched, totalDurationSec);
    const timeSpentMinutes = Math.max(0, finalWatched / 60);
    const difficultyNum = mapDifficulty(currentLecture.lectureDifficulty);
    const lecScore = currentLecture.score !== undefined ? Number(currentLecture.score) : 100;

    try {
      await apiClient.post("/api/student-performance-history", {
        userId,
        sessionScore:  lecScore,
        timeSpent:     Number(timeSpentMinutes.toFixed(2)),
        waitTime:      0,   // lectures do not have a wait_time
        resourceScore: resourceScore,
        difficulty:    difficultyNum,
        sessionType:   "lecture",
      });
    } catch (e) {
      console.error("Error recording lecture session:", e);
    }
  };

  const fetchLecture = async () => {
    try {
      const response = await apiClient.get(`/api/maths/video-lectures/${id}`);
      if (response.data) {
        setLecture(response.data);
        lectureRef.current = response.data; // Keep ref in sync
      }
      if (Array.isArray(response.data?.pdfMaterials) && response.data.pdfMaterials.length > 0) {
        setActivePdf(response.data.pdfMaterials[0]);
      } else {
        setActivePdf(null);
      }
    } catch (error) {
      console.error("Error fetching maths lecture:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFeedbacks = async () => {
    try {
      const res = await apiClient.get(`/api/feedbacks/video/${id}`);
      setFeedbackList(res.data);
    } catch {
      setFeedbackList([]);
    }
  };

  const ensureStudentPerformanceExists = async () => {
    if (!userId) {
      console.error("User ID is missing");
      return;
    }
    try {
      const response = await apiClient.get(`/api/student-performance/user/${userId}`);
      if (!response.data) {
        await apiClient.post("/api/student-performance", {
          userId,
          totalStudyTime: 0,
          totalScore: 0,
          resourceScore: 0,
          paperCount: 0,
          averageScore: 0,
          lectureCount: 0,
        });
      }
    } catch (error) {
      if (error?.response?.status === 404) {
        try {
          await apiClient.post("/api/student-performance", {
            userId,
            totalStudyTime: 0,
            totalScore: 0,
            resourceScore: 0,
            paperCount: 0,
            averageScore: 0,
            lectureCount: 0,
          });
        } catch (e2) {
          console.error("Error creating baseline student performance:", e2);
        }
      } else {
        console.error("Error checking/updating student performance:", error);
      }
    }
  };


  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    const tgId = lecture?.teacherGuideId?._id;

    if (!tgId) {
      Swal.fire({
        icon: 'warning',
        title: 'No Teacher Guide',
        text: 'This lecture has no attached teacher guide to leave feedback on.',
      });
      return;
    }
    if (!feedbackText.trim()) return;

    setSubmittingFeedback(true);
    try {
      // 1. Record the lecture session (if not already recorded)
      await recordLectureSessionOnExit();

      // 2. Submit feedback to teacher
      const finalWatched = finalizeWatchedSeconds();
      const watchedMinutes = Math.max(0, finalWatched / 60);
      await apiClient.post('/api/teacher-guide-feedbacks', {
        teacherGuideId:  tgId,
        studentFeedback: feedbackText.trim(),
        contentTitle:    lecture?.lectureTytle,
        marks:           0,
        studytime:       Number(watchedMinutes.toFixed(2)),
        lectureId:       id,
      });

      Swal.fire({
        icon:  'success',
        title: 'Thanks for your feedback!',
        text:  `Progress recorded with ${Math.ceil(watchedMinutes)}m of watch time.`,
        showConfirmButton: false,
        timer: 1800,
      });
      setFeedbackText('');
      fetchFeedbacks();
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon:  'error',
        title: 'Failed',
        text:  'Could not submit feedback. Please try again.',
      });
    } finally {
      setSubmittingFeedback(false);
    }
  };

  if (loading) {
    return <div className="text-center p-5">Loading...</div>;
  }
  if (!lecture) {
    return <div className="text-center p-5">Lecture Not Found</div>;
  }
  const hasTeacherGuide = Boolean(lecture.teacherGuideId?._id);

  return (
    <Fragment>
      <Header />
      <AutoCapture enableGamePopup={true} showFloatingEmotion={true} />
      <PageHeader title={lecture.lectureTytle} curPage={'Adventure View'} />

      <div className="course-view-section padding-tb section-bg" style={{ backgroundColor: "#F9FAFB", minHeight: "80vh", fontFamily: "'Nunito', sans-serif" }}>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-10 col-12">

              {/* Main Video Card */}
              <div className="card border-0 shadow-lg mb-5" style={{ borderRadius: "24px", overflow: "hidden", border: "2px solid #E0E7FF" }}>
                <div className="card-header bg-white p-4 border-bottom d-flex justify-content-between align-items-center" style={{ borderColor: "#E0E7FF" }}>
                  <h2 className="fw-bold mb-0" style={{ color: "#4F46E5", fontFamily: "'Baloo 2', sans-serif" }}>📺 {lecture.lectureTytle}</h2>
                  <span className={`badge rounded-pill fs-6 ${lecture.lectureDifficulty === 'Easy' ? 'bg-success' : lecture.lectureDifficulty === 'Medium' ? 'bg-warning text-dark' : 'bg-danger'}`}>
                    Level: {lecture.lectureDifficulty}
                  </span>
                </div>

                <div className="card-body p-0 bg-dark">
                  <video
                    ref={videoRef}
                    controls
                    className="w-100"
                    style={{ maxHeight: "60vh", objectFit: "contain" }}
                    onLoadedMetadata={() => {
                      if (videoRef.current && Number.isFinite(videoRef.current.duration)) {
                        setDurationMinutes(videoRef.current.duration / 60);
                        watchedSecondsRef.current  = 0;
                        lastTimeRef.current        = videoRef.current.currentTime || 0;
                        prevPositionRef.current    = videoRef.current.currentTime || 0;
                        isPlayingRef.current       = false;
                        hasRewoundRef.current      = false;
                        hasSkippedRef.current      = false;
                      }
                    }}
                    onPlay={onVideoPlay}
                    onPause={onVideoPause}
                    onTimeUpdate={(e) => { onVideoTimeUpdate(e); onVideoTimeUpdateForSeek(e); }}
                    onSeeked={onVideoSeeked}
                    onEnded={onVideoEnded}
                  >
                    <source src={lecture.videoUrl} type="video/mp4" />
                  </video>
                </div>

                <div className="card-footer bg-white p-4">
                  <h4 className="fw-bold mb-3" style={{ color: "#4F46E5", fontFamily: "'Baloo 2', sans-serif" }}>What is this about?</h4>
                  <p className="fs-5 text-muted">{lecture.description}</p>
                </div>
              </div>

              <div className="row g-4">
                {/* Left Column: PDFs & Feedback */}
                <div className="col-lg-8 col-12">

                  {/* Materials (PDF) */}
                  {Array.isArray(lecture.pdfMaterials) && lecture.pdfMaterials.length > 0 && (
                    <div className="card border-0 shadow-sm p-4 mb-4" style={{ borderRadius: "24px", borderTop: "6px solid #F59E0B", border: "2px solid #E5E7EB" }}>
                      <h4 className="text-warning text-darken-2 fw-bold mb-4">Special Materials</h4>

                      <ul className="list-unstyled mb-4">
                        {lecture.pdfMaterials.map((url) => (
                          <li key={url} className="d-flex flex-wrap align-items-center justify-content-between p-3 mb-2 bg-light rounded-4 shadow-sm border border-2 border-light">
                            <div className="d-flex align-items-center mb-2 mb-md-0">
                              <i className="icofont-file-pdf text-danger fs-3 me-3"></i>
                              <span className="fw-bold text-dark text-break">{fileNameFromUrl(url)}</span>
                            </div>
                            <div className="d-flex gap-2">
                              <button
                                type="button"
                                className={`btn btn-sm rounded-pill fw-bold ${activePdf === url ? 'btn-primary' : 'btn-outline-primary'}`}
                                onClick={() => setActivePdf(url)}
                                title="Preview"
                              >
                                Peek
                              </button>
                              <a
                                className="btn btn-sm btn-outline-success rounded-pill fw-bold"
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                download
                                title="Download"
                              >
                                Get It!
                              </a>
                            </div>
                          </li>
                        ))}
                      </ul>

                      {/* inline PDF preview */}
                      {activePdf && (
                        <div className="ratio ratio-16x9 rounded-4 overflow-hidden border border-2 border-primary shadow-sm mt-3">
                          <iframe
                            src={`${activePdf}#view=FitH`}
                            title="PDF Preview"
                            style={{ border: 0 }}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Feedback form */}
                  <div className="card border-0 shadow-sm p-4 mb-4" style={{ borderRadius: "24px", backgroundColor: "#FFFBEB", border: "2px solid #FDE68A" }}>
                    <h4 className="text-warning fw-bold mb-3" style={{ color: "#f57c00" }}>
                      Tell us what you think!
                    </h4>
                    {hasTeacherGuide && lecture.teacherGuideId?.coureInfo && (
                      <p className="text-muted fw-bold">For: {lecture.teacherGuideId.coureInfo}</p>
                    )}

                    {!hasTeacherGuide && (
                      <div className="alert alert-info rounded-pill text-center border-0 shadow-sm mb-3">
                        No teacher guide attached for feedback on this one!
                      </div>
                    )}

                    <form onSubmit={handleFeedbackSubmit}>
                      <textarea
                        className="form-control form-control-lg rounded-4 p-3 shadow-sm mb-3"
                        rows={3}
                        style={{ border: "2px solid #ffe0b2" }}
                        value={feedbackText}
                        onChange={e => setFeedbackText(e.target.value)}
                        placeholder="Was the video cool? Did you learn something new? Let us know! "
                        disabled={submittingFeedback || !hasTeacherGuide}
                        required
                      />
                      <div className="text-end">
                        <button
                          className="btn btn-warning btn-lg rounded-pill fw-bold text-dark px-5 shadow-sm"
                          type="submit"
                          disabled={submittingFeedback || !feedbackText.trim() || !hasTeacherGuide}
                        >
                          {submittingFeedback ? 'Sending... ' : 'Send Feedback! '}
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Previous feedbacks */}
                  {feedbackList.length > 0 && (
                    <div className="card border-0 shadow-sm p-4" style={{ borderRadius: "20px" }}>
                      <h4 className="text-success fw-bold mb-4">What others said:</h4>
                      <div className="row g-3">
                        {feedbackList.map((fb, idx) => (
                          <div className="col-12" key={idx}>
                            <div className="bg-light p-3 rounded-4 border border-info border-opacity-25 shadow-sm">
                              <div className="d-flex justify-content-between align-items-center mb-2">
                                <strong className="text-primary fs-5">{fb.userId?.username || 'Super Student'}</strong>
                                <small className="text-muted">{new Date(fb.createdAt).toLocaleDateString()}</small>
                              </div>
                              <p className="mb-0 fs-6 text-dark fst-italic">"{fb.feedback}"</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>

                {/* Right Column: Overview / Stats */}
                <div className="col-lg-4 col-12">
                  <div className="card border-0 shadow-sm z-10 p-4 sticky-lg-top" style={{ borderRadius: "24px", top: "20px", borderTop: "6px solid #4F46E5", border: "2px solid #E5E7EB" }}>
                    <h4 className="fw-bold mb-4" style={{ color: "#4F46E5", fontFamily: "'Baloo 2', sans-serif" }}>Quick Facts</h4>

                    <ul className="list-group list-group-flush fs-6">
                      <li className="list-group-item d-flex justify-content-between align-items-center px-0 py-3 bg-transparent">
                        <span className="text-muted fw-bold">Level</span>
                        <span className="badge bg-primary rounded-pill px-3 py-2">{lecture.lectureDifficulty}</span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between align-items-center px-0 py-3 bg-transparent">
                        <span className="text-muted fw-bold">Type</span>
                        <span className="fw-bold text-dark">{typeLabels[lecture.lectureType] || 'Unknown'}</span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between align-items-center px-0 py-3 bg-transparent">
                        <span className="text-muted fw-bold">Time</span>
                        <span className="fw-bold text-info">
                          {Number.isFinite(durationMinutes) ? `${Math.ceil(durationMinutes)} mins` : '—'}
                        </span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between align-items-center px-0 py-3 bg-transparent">
                        <span className="text-muted fw-bold">Teacher</span>
                        <span className="fw-bold text-success border-bottom border-success border-2 pb-1">{lecture.createby?.username || 'Unknown'}</span>
                      </li>
                      {lecture.teacherGuideId?.coureInfo && (
                        <li className="list-group-item d-flex justify-content-between align-items-center px-0 py-3 bg-transparent">
                          <span className="text-muted fw-bold">Guide</span>
                          <span className="fw-bold text-dark">{lecture.teacherGuideId.coureInfo}</span>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      <Footer />
    </Fragment>
  );
};

export default MathsLectureView;
