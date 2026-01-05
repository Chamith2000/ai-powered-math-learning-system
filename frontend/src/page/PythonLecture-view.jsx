import React, { Fragment, useEffect, useState, useRef } from 'react';
import { useParams } from "react-router-dom";
import Footer from "../component/layout/footer";
import Header from "../component/layout/header";
import PageHeader from "../component/layout/pageheader";
import apiClient from "../api";
import Swal from "sweetalert2";
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

const PythonLectureView = () => {
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

  const initialSnapshotDoneRef = useRef(false);

  // ===== NEW: watch-time tracking (in seconds) =====
  const watchedSecondsRef = useRef(0);   // accumulated watch time
  const lastTimeRef = useRef(null);      // last known currentTime while playing
  const isPlayingRef = useRef(false);    // whether we are in playing state

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
    if (!videoRef.current) return;
    if (!isPlayingRef.current) return;
    const now = videoRef.current.currentTime || 0;
    if (lastTimeRef.current == null) {
      lastTimeRef.current = now;
      return;
    }
    // accumulate only positive deltas (avoid double count on backward seek)
    const delta = now - lastTimeRef.current;
    if (delta > 0) watchedSecondsRef.current += delta;
    lastTimeRef.current = now;
  };

  const onVideoSeeked = () => {
    if (!videoRef.current) return;
    // reset the baseline to the new position; no accumulation on seek jump
    lastTimeRef.current = videoRef.current.currentTime || 0;
  };

  const onVideoEnded = () => {
    if (!videoRef.current) return;
    // finalize last segment if it was playing
    if (isPlayingRef.current && lastTimeRef.current != null) {
      const now = videoRef.current.currentTime || 0;
      const delta = now - lastTimeRef.current;
      if (delta > 0) watchedSecondsRef.current += delta;
    }
    isPlayingRef.current = false;
    lastTimeRef.current = videoRef.current.currentTime || 0;
  };
  // ===== end watch-time tracking =====

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    fetchLecture();
    ensureStudentPerformanceExists();
    fetchFeedbacks();
  }, []);

  useEffect(() => {
    const addResourceAndLectureOnce = async () => {
      if (!userId || !lecture || initialSnapshotDoneRef.current) return;

      try {
        const resourceCount = Array.isArray(lecture.pdfMaterials) ? lecture.pdfMaterials.length : 0;

        const spRes = await apiClient.get(`/api/student-performance/user/${userId}`);
        const sp = spRes?.data || {};

        await apiClient.put(`/api/student-performance/user/${userId}`, {
          totalStudyTime: sp.totalStudyTime ?? 0,             
          totalScore: sp.totalScore ?? 0,                     
          resourceScore: (sp.resourceScore ?? 0) + resourceCount,
          paperCount: sp.paperCount ?? 0,              
          averageScore: sp.averageScore ?? 0, 
          lectureCount: (sp.lectureCount ?? 0) + 1,
        });

        initialSnapshotDoneRef.current = true;
      } catch (e) {
        console.error("Error applying initial resource/lecture snapshot:", e);
      }
    };

    addResourceAndLectureOnce();
  }, [lecture, userId]);

  useEffect(() => {
    if (!userId || !lecture || !Number.isFinite(durationMinutes)) return;

    const difficultyKey = (lecture.lectureDifficulty || '').toString().trim().toLowerCase();
    const timeMultiplier = timeMultiplierByDifficulty[difficultyKey] ?? 1;
    const maxMinutes = Math.max(1, Math.ceil(durationMinutes));

    let elapsedMinutes = 0;
    clearInterval(intervalRef.current);

    intervalRef.current = setInterval(async () => {
      elapsedMinutes += 1;
      try {
        if (elapsedMinutes <= maxMinutes) {
          const response = await apiClient.get(`/api/student-performance/user/${userId}`);
          const sp = response?.data || {};

          await apiClient.put(`/api/student-performance/user/${userId}`, {
            totalStudyTime: (sp.totalStudyTime ?? 0) + timeMultiplier,
            totalScore: sp.totalScore ?? 0,
            resourceScore: sp.resourceScore ?? 0,
            paperCount: sp.paperCount ?? 0,
            averageScore: sp.averageScore ?? 0,
            lectureCount: sp.lectureCount ?? 0,
          });
        } else {
          clearInterval(intervalRef.current);
        }
      } catch (error) {
        console.error("Error updating weighted study time:", error);
      }
    }, 60000); 

    return () => clearInterval(intervalRef.current);
  }, [lecture, userId, durationMinutes]);

  const fetchLecture = async () => {
    try {
      const response = await apiClient.get(`/api/maths/video-lectures/${id}`);
      setLecture(response.data);
      if (Array.isArray(response.data?.pdfMaterials) && response.data.pdfMaterials.length > 0) {
        setActivePdf(response.data.pdfMaterials[0]);
      } else {
        setActivePdf(null);
      }
    } catch (error) {
      console.error("Error fetching python lecture:", error);
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

    // finalize any in-progress segment before submitting
    if (videoRef.current && isPlayingRef.current && lastTimeRef.current != null) {
      const now = videoRef.current.currentTime || 0;
      const delta = now - lastTimeRef.current;
      if (delta > 0) watchedSecondsRef.current += delta;
      isPlayingRef.current = false;
      lastTimeRef.current = now;
    }

    const secondsWatched = Math.round(watchedSecondsRef.current || 0);

    setSubmittingFeedback(true);
    try {
      await apiClient.post('/api/teacher-guide-feedbacks', {
        teacherGuideId: tgId,
        studentFeedback: feedbackText.trim(),
        marks: 0,                 // ← no questions here
        studytime: secondsWatched // ← total watched seconds
      });

      Swal.fire({
        icon: 'success',
        title: 'Thanks for your feedback!',
        text: `We recorded ${secondsWatched}s of watch time.`,
        showConfirmButton: false,
        timer: 1800,
      });
      setFeedbackText('');
      fetchFeedbacks();
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: 'error',
        title: 'Failed',
        text: 'Could not submit feedback. Please try again.',
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
      <PageHeader title={lecture.lectureTytle} curPage={'Course View'} />

      <div className="course-view-section padding-tb section-bg">
        <div className="container">
          <div className="row">
            <div className="col-12">
              <div className="course-view">
                <div className="row justify-content-center">
                  <div className="col-lg-9 col-12">
                    <div className="video-part mb-4 mb-lg-0">
                      <div className="vp-title mb-4">
                        <h3>{lecture.lectureTytle}</h3>
                      </div>

                      <div className="vp-video mb-4">
                        <video
                          ref={videoRef}
                          controls
                          onLoadedMetadata={() => {
                            if (videoRef.current && Number.isFinite(videoRef.current.duration)) {
                              setDurationMinutes(videoRef.current.duration / 60);
                              // reset tracking baselines
                              watchedSecondsRef.current = 0;
                              lastTimeRef.current = videoRef.current.currentTime || 0;
                              isPlayingRef.current = false;
                            }
                          }}
                          onPlay={onVideoPlay}
                          onPause={onVideoPause}
                          onTimeUpdate={onVideoTimeUpdate}
                          onSeeked={onVideoSeeked}
                          onEnded={onVideoEnded}
                        >
                          <source src={lecture.videoUrl} type="video/mp4" />
                        </video>
                      </div>

                      <div className={`content-wrapper ${icon ? "open" : ""}`}>
                        <div className="content-icon d-lg-none" onClick={() => setIcon(!icon)}>
                          <i className="icofont-caret-down"></i>
                        </div>
                        <div className="vp-content mb-5">
                          <h4>Introduction</h4>
                          <p>{lecture.description}</p>
                        </div>
                      </div>

                      {/* Materials (PDF) */}
                      {Array.isArray(lecture.pdfMaterials) && lecture.pdfMaterials.length > 0 && (
                        <div className="card mt-4 p-3">
                          <div className="d-flex align-items-center justify-content-between mb-2">
                            <h5 className="mb-0">Materials (PDF)</h5>
                          </div>

                          {/* list of PDFs */}
                          <ul className="list-unstyled mb-3">
                            {lecture.pdfMaterials.map((url) => (
                              <li key={url} className="d-flex align-items-center justify-content-between py-2 border-bottom">
                                <div className="me-2">
                                  <i className="icofont-file-pdf me-2"></i>
                                  <span className="text-break">{fileNameFromUrl(url)}</span>
                                </div>
                                <div className="d-flex gap-2">
                                  <button
                                    type="button"
                                    className={`btn btn-sm ${activePdf === url ? 'btn-primary' : 'btn-outline-primary'}`}
                                    onClick={() => setActivePdf(url)}
                                    title="Preview"
                                  >
                                    Preview
                                  </button>
                                  <a
                                    className="btn btn-sm btn-outline-secondary"
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="Open in new tab"
                                  >
                                    Open
                                  </a>
                                  <a
                                    className="btn btn-sm btn-outline-success"
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    download
                                    title="Download"
                                  >
                                    Download
                                  </a>
                                </div>
                              </li>
                            ))}
                          </ul>

                          {/* inline PDF preview */}
                          {activePdf && (
                            <div className="ratio ratio-16x9">
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
                      <div className="card mt-4 p-3">
                        <h5>Leave Feedback {hasTeacherGuide && lecture.teacherGuideId?.coureInfo ? `for: ${lecture.teacherGuideId.coureInfo}` : ''}</h5>
                        {!hasTeacherGuide && (
                          <div className="alert alert-warning mb-3">
                            This lecture has no attached teacher guide, so feedback can’t be submitted.
                          </div>
                        )}
                        <form onSubmit={handleFeedbackSubmit}>
                          <textarea
                            className="form-control mb-2"
                            rows={3}
                            value={feedbackText}
                            onChange={e => setFeedbackText(e.target.value)}
                            placeholder="Write your feedback to the teacher/guide..."
                            disabled={submittingFeedback || !hasTeacherGuide}
                            required
                          />
                          <button
                            className="btn btn-success"
                            type="submit"
                            disabled={submittingFeedback || !feedbackText.trim() || !hasTeacherGuide}
                          >
                            {submittingFeedback ? 'Submitting...' : 'Submit Feedback'}
                          </button>
                        </form>
                      </div>

                      {/* Previous feedbacks */}
                      {feedbackList.length > 0 && (
                        <div className="card mt-3 p-3">
                          <h6 className="mb-3">Feedback from Students</h6>
                          <ul className="list-unstyled">
                            {feedbackList.map((fb, idx) => (
                              <li key={idx} className="mb-2 border-bottom pb-2">
                                <strong>{fb.userId?.username || 'Student'}</strong>:
                                <br />
                                <span>
                                  {[1, 2, 3, 4, 5].map(star => (
                                    <span
                                      key={star}
                                      style={{
                                        color: fb.rating >= star ? '#FFD700' : '#ddd',
                                        fontSize: '1.2em',
                                        marginRight: '1px'
                                      }}
                                    >
                                      ★
                                    </span>
                                  ))}
                                </span>
                                <br />
                                <span>{fb.feedback}</span>
                                <div style={{ fontSize: '0.8em', color: '#888' }}>
                                  {new Date(fb.createdAt).toLocaleString()}
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="overview-announce-section padding-tb">
        <div className="container">
          <div className="row">
            <div className="col-12">
              <div className="course-view-bottom">
                <div className="tab-content" id="myTabContent">
                  <div className="tab-pane fade show active" id="overview" role="tabpanel" aria-labelledby="overview-tab">
                    <div className="overview-area">
                      <div className="overview-head mb-4">
                        <h6 className="mb-0">About this Lecture</h6>
                      </div>
                      <div className="overview-body">
                        <ul className="lab-ul">
                          <li className="d-flex flex-wrap">
                            <div className="overview-left">
                              <p className="mb-0">More Details</p>
                            </div>
                            <div className="overview-right">
                              <div className="or-items d-flex flex-wrap">
                                <div className="or-left mr-3">Skill level</div>
                                <div className="or-right">{lecture.lectureDifficulty} Level</div>
                              </div>
                              <div className="or-items d-flex flex-wrap">
                                <div className="or-left mr-3">Lecture Type</div>
                                <div className="or-right">{typeLabels[lecture.lectureType] || 'Unknown'}</div>
                              </div>
                              <div className="or-items d-flex flex-wrap">
                                <div className="or-left mr-3">Languages</div>
                                <div className="or-right">English</div>
                              </div>
                              <div className="or-items d-flex flex-wrap">
                                <div className="or-left mr-3">Max Time</div>
                                <div className="or-right">
                                  {Number.isFinite(durationMinutes)
                                    ? `${Math.ceil(durationMinutes)} minute${Math.ceil(durationMinutes) === 1 ? '' : 's'}`
                                    : '—'}
                                </div>
                              </div>
                              <div className="or-items d-flex flex-wrap">
                                <div className="or-left mr-3">Created By</div>
                                <div className="or-right">{lecture.createby?.username || 'Unknown'}</div>
                              </div>
                              {lecture.teacherGuideId?.coureInfo && (
                                <div className="or-items d-flex flex-wrap">
                                  <div className="or-left mr-3">Teacher Guide</div>
                                  <div className="or-right">{lecture.teacherGuideId.coureInfo}</div>
                                </div>
                              )}
                            </div>
                          </li>

                          <li className={`d-flex flex-wrap rajib ${viewFull ? "fullview" : ""}`}>
                            <div className="overview-left">
                              <p className="mb-0">Description</p>
                            </div>
                            <div className="overview-right overview-description">
                              <p className="description mb-3">{lecture.description}</p>
                            </div>
                            <div className="view-details">
                              <span className="more" onClick={() => setViewFull(!viewFull)}>+ See More</span>
                              <span className="less" onClick={() => setViewFull(!viewFull)}>- See Less</span>
                            </div>
                          </li>
                        </ul>
                      </div>

                    </div>
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

export default PythonLectureView;
