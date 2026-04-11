import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import CardHeader from '@/components/shared/CardHeader';
import CardLoader from '@/components/shared/CardLoader';
import useCardTitleActions from '@/hooks/useCardTitleActions';
import Dropdown from '@/components/shared/Dropdown';
import axios from 'axios';
import BASE_URL from '../../config/apiConfig';
import { getToken } from '@/utils/token';
import { BsArrowLeft, BsArrowRight, BsDot } from 'react-icons/bs';
import { FiExternalLink, FiRefreshCcw, FiCopy, FiEye } from 'react-icons/fi';
import Swal from 'sweetalert2';


const TeacherGuideFeedbackTable = ({ title }) => {
  const { id } = useParams(); // teacherGuideId from route
  const navigate = useNavigate();

  const [feedbacks, setFeedbacks] = useState([]);
  const [suggestions, setSuggestions] = useState({});                // fbId -> suggestion text
  const [loadingSuggestions, setLoadingSuggestions] = useState({});  // fbId -> boolean
  const [guideDetails, setGuideDetails] = useState({});              // guideId -> { studytime, originalTeacherGuide, coureInfo, timeAllocations }
  const [generatingAll, setGeneratingAll] = useState(false);
  const latestGuidesRef = React.useRef({});

  const { refreshKey, isRemoved, isExpanded, handleRefresh, handleExpand, handleDelete } =
    useCardTitleActions();

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  // --- GROUPING LOGIC ---
  const groupFeedbacks = (list) => {
    const groups = {};
    list.forEach((fb) => {
      const key = `${fb.studentFeedback?.trim() || ''}:::${fb.contentTitle || ''}`;
      if (!groups[key]) {
        groups[key] = {
          ...fb,
          studentNames: [fb?.studentId?.username || fb?.studentId?.email || 'Unknown'],
          count: 1,
          ids: [fb._id]
        };
      } else {
        groups[key].count += 1;
        groups[key].studentNames.push(fb?.studentId?.username || fb?.studentId?.email || 'Unknown');
        groups[key].ids.push(fb._id);
        // Keep the one with an aiSuggestion if available
        if (!groups[key].aiSuggestion && fb.aiSuggestion) {
          groups[key].aiSuggestion = fb.aiSuggestion;
          groups[key]._id = fb._id; // Update main ID for suggestion lookup
        }
      }
    });
    return Object.values(groups);
  };

  const groupedList = groupFeedbacks(feedbacks);
  const paginatedFeedbacks = groupedList.slice(startIndex, endIndex);

  useEffect(() => {
    fetchFeedbacks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey, id]);

  const clamp01 = (x) => Math.max(0, Math.min(1, x));
  const safeNum = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const toMinutes = (value) => {
    const n = safeNum(value);
    return Math.max(0, Math.round(n));
  };

  const fetchFeedbacks = async () => {
    try {
      const token = getToken();
      const res = await axios.get(`${BASE_URL}/teacher-guide-feedbacks/guideId/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const list = Array.isArray(res.data) ? res.data : [];
      setFeedbacks(list);

      // Initialize suggestions from DB
      const initialSuggestions = {};
      list.forEach(fb => {
        if (fb.aiSuggestion) {
          initialSuggestions[fb._id] = fb.aiSuggestion;
        }
      });
      setSuggestions(initialSuggestions);

      // Collect guide IDs appearing in this list
      const uniqueGuideIds = [
        ...new Set(
          list
            .map((fb) =>
              typeof fb?.teacherGuideId === 'string' ? fb.teacherGuideId : fb?.teacherGuideId?._id
            )
            .filter(Boolean)
        ),
      ];

      // Fetch missing guide details
      const missingIds = uniqueGuideIds.filter((gid) => !guideDetails[gid]);

      let mergedGuides = { ...guideDetails };
      if (missingIds.length) {
        const token2 = getToken();
        const results = await Promise.all(
          missingIds.map(async (gid) => {
            try {
              const { data } = await axios.get(`${BASE_URL}/teacher-guides/${gid}`, {
                headers: { Authorization: `Bearer ${token2}` },
              });
              return [
                gid,
                {
                  studytime: safeNum(data?.studytime),
                  originalTeacherGuide: data?.originalTeacherGuide || '',
                  coureInfo: data?.coureInfo || '',
                  timeAllocations: data?.timeAllocations || {}
                },
              ];
            } catch {
              return [gid, { studytime: 0, originalTeacherGuide: '', coureInfo: '' }];
            }
          })
        );
        const fetchedMap = Object.fromEntries(results);
        mergedGuides = { ...mergedGuides, ...fetchedMap };
        setGuideDetails(mergedGuides);
      }

      latestGuidesRef.current = mergedGuides;
    } catch (err) {
      console.error('Failed to load feedbacks', err);
      Swal.fire('Error', 'Failed to load feedbacks.', 'error');
    }
  };

  const parseModelText = (data, options = {}) => {
    const { isVideoFeedback, technicalData } = options;

    // --- Part A: Pedagogical Feedback (Standard) ---
    const reason = data?.output?.reason || '(no suggestion available)';
    const weakSections = Array.isArray(data?.output?.weak_sections) ? data.output.weak_sections : [];
    
    let recommendation = reason;
    if (weakSections.length > 0) {
      recommendation += `\n\nWeak sections: ${weakSections.join(', ')}`;
    }

    // --- Part B: Technical Quality (Optional) ---
    if (isVideoFeedback && technicalData) {
      const { confidence, issue, recommendation: techRec, severity } = technicalData?.output || {};
      
      const techSection = `\n\n----------------------------\n[Video Lecture Quality Review]\nIssue: ${issue || 'General'}\nSeverity: ${severity || 'N/A'}\nConfidence: ${Math.round((confidence || 0) * 100)}%\nRecommendation: ${techRec || 'No technical issues detected.'}`;
      
      recommendation += techSection;
    }

    return { 
      recommendation, 
      status: technicalData?.output?.severity || null 
    };
  };

  const callSuggester = async ({ feedback, course_info, original_guide, grade, timespent, lecture }) => {
    const isVideo = !!lecture;

    // 1. Prepare Standard Pedagogical Payload
    const langConstraint = "*** MANDATORY: RESPOND IN ENGLISH ONLY. NO CHINESE CHARACTERS ALLOWED. ***";
    const teacherPayload = {
      teacher_data: {
        instruction: "RESPOND IN ENGLISH ONLY",
        task: "task_b",
        teacher_guide: `${langConstraint}\n\n${course_info}. ${original_guide}\n\n${langConstraint}`.trim(),
        student_feedback: `${langConstraint}\n\n${feedback?.trim() || 'No student feedback provided.'}\n\n${langConstraint}`,
        time_spent: {
          introduction: timespent?.introduction || 0,
          concept_explanation: timespent?.concept_explanation || 0,
          worked_examples: timespent?.worked_examples || 0,
          practice_questions: timespent?.practice_questions || 0,
          word_problems: timespent?.word_problems || 0,
          pacing: timespent?.pacing || 0,
          clarity: timespent?.clarity || 0,
          engagement: timespent?.engagement || 0
        },
        grade: Number(grade) || 4,
        language_instruction: "English"
      },
      model_type: "teacher"
    };

    try {
      // 2. Execute Pedagogical Call
      const teacherRes = await axios.post(
        `https://Chamith2000-mcq-generator-new.hf.space/generate`,
        teacherPayload,
        { headers: { 'Content-Type': 'application/json' } }
      );

      let feedbackRes = null;
      if (isVideo) {
        // 3. Execute Technical Quality Call Concurrently if it's a video
        const feedbackPayload = {
          model_type: "feedback",
          feedback_data: {
            instruction: "RESPOND IN ENGLISH ONLY",
            text: `${langConstraint}\n\n${feedback?.trim() || 'No feedback provided.'}\n\n${langConstraint}`,
            grade: Number(grade) || 4,
            lesson: lecture.lectureTytle || 'Untitled Lesson',
            video_content: lecture.description || 'No description available.',
            language: "English"
          }
        };
        const fbRes = await axios.post(
          `https://Chamith2000-mcq-generator-new.hf.space/generate`,
          feedbackPayload,
          { headers: { 'Content-Type': 'application/json' } }
        );
        feedbackRes = fbRes.data;
      }

      return parseModelText(teacherRes.data, { isVideoFeedback: isVideo, technicalData: feedbackRes });
    } catch (e) {
      console.error("AI Generation failed", e);
      throw e;
    }
  };

  const generateSuggestions = async (list, guidesMap) => {
    const missing = list.filter((fb) => !suggestions[fb._id]);
    if (missing.length === 0) return;

    const newLoading = {};
    missing.forEach((fb) => (newLoading[fb._id] = true));
    setLoadingSuggestions((prev) => ({ ...prev, ...newLoading }));

    try {
      const results = await Promise.all(
        missing.map(async (fb) => {
          try {
            const guideId = typeof fb?.teacherGuideId === 'string' ? fb.teacherGuideId : fb?.teacherGuideId?._id;
            const guide = guidesMap?.[guideId] || guideDetails?.[guideId] || {
                studytime: 0,
                originalTeacherGuide: (typeof fb?.teacherGuideId !== 'string' && fb?.teacherGuideId?.originalTeacherGuide) || '',
                coureInfo: (typeof fb?.teacherGuideId !== 'string' && fb?.teacherGuideId?.coureInfo) || '',
              };

            const model = await callSuggester({
              feedback: fb.studentFeedback || '',
              course_info: guide.coureInfo || '',
              original_guide: guide.originalTeacherGuide || '',
              grade: fb?.studentId?.grade ?? fb?.lectureId?.grade,
              timespent: guide.timeAllocations || {},
              lecture: fb.lectureId
            });

            return [fb._id, { model }];
          } catch (e) {
            console.error('Suggester failed for feedback', fb._id, e?.response?.data || e);
            return [fb._id, { model: { recommendation: '(suggestion unavailable)' } }];
          }
        })
      );

      const sugMap = {};
      results.forEach(([fbId, { model }]) => {
        if (!model) return;
        sugMap[fbId] = model.recommendation || '(suggestion unavailable)';
      });

      setSuggestions((prev) => ({ ...prev, ...sugMap }));

      const token = getToken();
      await Promise.all(
        Object.entries(sugMap).map(async ([fbId, suggestion]) => {
          try {
            await axios.put(`${BASE_URL}/teacher-guide-feedbacks/${fbId}`,
              { aiSuggestion: suggestion },
              { headers: { Authorization: `Bearer ${token}` } }
            );
          } catch (err) {
            console.error(`Failed to save suggestion for ${fbId}`, err);
          }
        })
      );
    } finally {
      const cleared = {};
      missing.forEach((fb) => (cleared[fb._id] = false));
      setLoadingSuggestions((prev) => ({ ...prev, ...cleared }));
    }
  };

  const regenerateFor = async (fb) => {
    setLoadingSuggestions((prev) => ({ ...prev, [fb._id]: true }));
    try {
      const guideId = typeof fb?.teacherGuideId === 'string' ? fb.teacherGuideId : fb?.teacherGuideId?._id;
      const guide = guideDetails?.[guideId] || {
          studytime: 0,
          originalTeacherGuide: (typeof fb?.teacherGuideId !== 'string' && fb?.teacherGuideId?.originalTeacherGuide) || '',
          coureInfo: (typeof fb?.teacherGuideId !== 'string' && fb?.teacherGuideId?.coureInfo) || '',
        };

      const model = await callSuggester({
        feedback: fb.studentFeedback || '',
        course_info: guide.coureInfo || '',
        original_guide: guide.originalTeacherGuide || '',
        grade: fb?.studentId?.grade ?? fb?.lectureId?.grade,
        timespent: guide.timeAllocations || {},
        lecture: fb.lectureId
      });

      const suggestion = model.recommendation || '(suggestion unavailable)';
      setSuggestions((prev) => ({ ...prev, [fb._id]: suggestion }));

      const token = getToken();
      await axios.put(`${BASE_URL}/teacher-guide-feedbacks/${fb._id}`,
        { aiSuggestion: suggestion },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (e) {
      Swal.fire('Error', 'Failed to regenerate suggestion.', 'error');
    } finally {
      setLoadingSuggestions((prev) => ({ ...prev, [fb._id]: false }));
    }
  };

  const copySuggestion = async (fbId) => {
    const text = suggestions[fbId] || '';
    try {
      await navigator.clipboard.writeText(text);
      Swal.fire({
        icon: 'success',
        title: 'Copied',
        text: 'Suggestion copied to clipboard.',
        timer: 1200,
        showConfirmButton: false,
      });
    } catch {
      Swal.fire('Error', 'Could not copy to clipboard.', 'error');
    }
  };

  // --- Show Full Text Popup ---
  const handleViewFullText = (title, text) => {
    if (!text) return;
    Swal.fire({
      title: title,
      html: `<div style="text-align: left; white-space: pre-wrap; word-break: break-word; max-height: 60vh; overflow-y: auto; padding: 10px; font-size: 14px;">${text}</div>`,
      width: '800px',
      showCloseButton: true,
      confirmButtonText: 'Close',
      confirmButtonColor: '#3085d6',
    });
  };

  const openGuide = (fb) => {
    const guideId = typeof fb?.teacherGuideId === 'string' ? fb.teacherGuideId : fb?.teacherGuideId?._id;
    if (guideId) navigate(`/admin/teacher-guides/edit/${guideId}`);
  };

  const getDropdownItems = (fb) => [
    {
      icon: <FiEye />,
      label: 'View Full Details',
      onClick: () => navigate(`/admin/teacher-guides/feedback/view/${fb._id}`, { state: { fb, suggestion: suggestions[fb._id] } })
    },
    { icon: <FiExternalLink />, label: 'View Guide', onClick: () => openGuide(fb) },
    { icon: <FiCopy />, label: 'Copy Suggestion', onClick: () => copySuggestion(fb._id) },
    { icon: <FiRefreshCcw />, label: 'Regenerate', onClick: () => regenerateFor(fb) },
  ];

  if (isRemoved) return null;

  const totalPages = Math.max(1, Math.ceil(groupedList.length / itemsPerPage));

  const firstGuideId = typeof feedbacks?.[0]?.teacherGuideId === 'string'
      ? feedbacks?.[0]?.teacherGuideId
      : feedbacks?.[0]?.teacherGuideId?._id;

  const courseInfo = guideDetails[firstGuideId]?.coureInfo ||
    feedbacks[0]?.teacherGuideId?.coureInfo ||
    feedbacks.find((f) => f?.teacherGuideId?.coureInfo)?.teacherGuideId?.coureInfo || '';

  // Widths updated to fit the page
  const suggestionCellStyle = {
    minWidth: '250px',
    maxWidth: '350px',
  };

  const spinner = (
    <span className="align-middle">
      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
      Generating...
    </span>
  );

  const handleGenerateAll = async () => {
    setGeneratingAll(true);
    try {
      await generateSuggestions(feedbacks, latestGuidesRef.current);
    } finally {
      setGeneratingAll(false);
    }
  };

  return (
    <div className="col-xxl-12">
      <div className={`card stretch stretch-full ${isExpanded ? 'card-expand' : ''} ${refreshKey ? 'card-loading' : ''}`}>
        <CardHeader
          title={courseInfo ? `${title} - ${courseInfo}` : title}
          refresh={handleRefresh}
          remove={handleDelete}
          expanded={handleExpand}
        />

        <div className="card-body custom-card-action p-0">
          <div className="d-flex justify-content-end p-3 pb-0">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleGenerateAll}
              disabled={generatingAll || feedbacks.length === 0}
            >
              {generatingAll ? 'Generating...' : 'Generate All Suggestions'}
            </button>
          </div>
          <div className="table-responsive" style={{ minHeight: "350px" }}>
            <table className="table table-hover mb-0">
              <thead>
                {/* Updated TH Widths */}
                <tr>
                  <th style={{ minWidth: 120 }}>Student</th>
                  <th style={{ minWidth: 150 }}>Feedback</th>
                  <th style={{ minWidth: 150 }}>Content</th>
                  <th style={{ minWidth: 100 }}>Time (min)</th>
                  <th style={{ minWidth: 250 }}>Suggestion</th>
                  <th className="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedFeedbacks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4">No feedback found.</td>
                  </tr>
                ) : (
                  paginatedFeedbacks.map((fb) => {
                    const studentName = fb?.studentId?.username || fb?.studentId?.email || '-';
                    const s = suggestions[fb._id];

                    return (
                        <tr key={fb._id}>
                          <td>
                            {fb.count > 1 ? (
                                <div className="d-flex flex-column">
                                <span className="badge bg-soft-primary text-primary border-0"
                                      style={{maxWidth: 'fit-content'}}>
                                    Multiple Students ({fb.count})
                                </span>
                                  <small className="text-muted mt-1" style={{fontSize: '10px'}}>
                                    {Array.from(new Set(fb.studentNames)).slice(0, 2).join(', ')}
                                    {fb.studentNames.length > 2 && '...'}
                                  </small>
                                </div>
                            ) : (
                                <span title={fb?.studentId?.email || ''}>{studentName}</span>
                            )}
                          </td>

                          {/* Feedback with line-clamp */}
                          <td style={{minWidth: '150px', maxWidth: '250px'}}>
                            <div
                                style={{
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                  cursor: 'pointer'
                                }}
                                onClick={() => navigate(`/admin/teacher-guides/feedback/view/${fb._id}`, {
                                  state: {
                                    fb,
                                    suggestion: suggestions[fb._id]
                                  }
                                })}
                            >
                              {fb?.studentFeedback || '-'}
                            </div>
                          </td>

                          <td>{fb?.contentTitle || <span className="text-muted">-</span>}</td>
                          <td>{Number.isFinite(Number(fb?.studytime)) ? toMinutes(fb.studytime) : '-'}</td>

                          <td style={suggestionCellStyle}>
                            {loadingSuggestions[fb._id] ? spinner : (
                                <div
                                    style={{cursor: 'pointer'}}
                                    onClick={() => navigate(`/admin/teacher-guides/feedback/view/${fb._id}`, {
                                      state: {
                                        fb,
                                        suggestion: suggestions[fb._id]
                                      }
                                    })}
                                >
                                  {fb.lectureId && s && !s.includes('[Video Quality') && (
                                      <span className="badge bg-soft-info text-info mb-1 d-block"
                                            style={{width: 'fit-content'}}>
          Pedagogical Suggestion
        </span>
                                  )}
                                  {fb.lectureId && s && s.includes('[Video Quality') && (
                                      <div className="mb-2">
                                        <span className="badge bg-soft-success text-success me-1">Video + Teaching Review</span>
                                        {s.includes('Severity: high') && <span
                                            className="badge bg-soft-danger text-danger">High Severity issue</span>}
                                        {s.includes('Severity: medium') && <span
                                            className="badge bg-soft-warning text-warning">Medium Severity issue</span>}
                                      </div>
                                  )}
                                  <div style={{
                                    display: '-webkit-box',
                                    WebkitLineClamp: 3,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden'
                                  }}>
                                    {s || <span className="text-muted">-</span>}
                                  </div>
                                </div>
                            )}
                          </td>

                          <td className="text-end">
                            <Dropdown dropdownItems={getDropdownItems(fb)} triggerClass="avatar-md ms-auto"
                                      triggerPosition="0,28"/>
                          </td>
                        </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card-footer">
          <ul className="list-unstyled d-flex align-items-center gap-2 mb-0 pagination-common-style">
            <li>
              <Link
                  to="#"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  className={currentPage === 1 ? 'disabled' : ''}
              >
                <BsArrowLeft size={16}/>
              </Link>
            </li>
            {Array.from({length: totalPages}, (_, index) => {
              const page = index + 1;
              const shouldShow = page === 1 || page === totalPages || Math.abs(currentPage - page) <= 1;

              if (!shouldShow && (page === 2 || page === totalPages - 1)) {
                return (
                    <li key={`dots-${index}`}>
                      <Link to="#" onClick={(e) => e.preventDefault()}>
                        <BsDot size={16}/>
                      </Link>
                    </li>
                );
              }

              return shouldShow ? (
                <li key={index}>
                  <Link to="#" onClick={() => setCurrentPage(page)} className={currentPage === page ? 'active' : ''}>
                    {page}
                  </Link>
                </li>
              ) : null;
            })}
            <li>
              <Link
                to="#"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                className={currentPage === totalPages ? 'disabled' : ''}
              >
                <BsArrowRight size={16} />
              </Link>
            </li>
          </ul>
        </div>

        <CardLoader refreshKey={refreshKey} />
      </div>
    </div>
  );
};

export default TeacherGuideFeedbackTable;
