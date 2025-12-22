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
import { FiExternalLink, FiRefreshCcw, FiCopy } from 'react-icons/fi';
import Swal from 'sweetalert2';

const TeacherGuideFeedbackTable = ({ title }) => {
  const { id } = useParams(); // teacherGuideId from route
  const navigate = useNavigate();

  const [feedbacks, setFeedbacks] = useState([]);
  const [suggestions, setSuggestions] = useState({});                // fbId -> suggestion text
  const [trustInfo, setTrustInfo] = useState({});                    // fbId -> { status }
  const [loadingSuggestions, setLoadingSuggestions] = useState({});  // fbId -> boolean
  const [guideDetails, setGuideDetails] = useState({});              // guideId -> { studytime, originalTeacherGuide, coureInfo }

  const { refreshKey, isRemoved, isExpanded, handleRefresh, handleExpand, handleDelete } =
    useCardTitleActions();

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedFeedbacks = feedbacks.slice(startIndex, endIndex);

  useEffect(() => {
    fetchFeedbacks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey, id]);

  const clamp01 = (x) => Math.max(0, Math.min(1, x));
  const safeNum = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  // --- STUDYTIME UNIT SWITCH ---
  // If feedback.studytime is in SECONDS from backend, keep this true.
  // If it's already in MINUTES, set to false.
  const FEEDBACK_STUDYTIME_IS_SECONDS = true;
  const toMinutes = (value) => {
    const n = safeNum(value);
    if (!FEEDBACK_STUDYTIME_IS_SECONDS) return Math.max(0, Math.round(n)); // already minutes
    return Math.max(0, Math.round(n / 60)); // seconds -> minutes
  };

  const fetchFeedbacks = async () => {
    try {
      const token = getToken();
      const res = await axios.get(`${BASE_URL}/teacher-guide-feedbacks/guideId/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const list = Array.isArray(res.data) ? res.data : [];
      setFeedbacks(list);

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

      // Fetch missing guide details (studytime + originalTeacherGuide + coureInfo)
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
                  studytime: safeNum(data?.studytime),                // assigned minutes for the guide
                  originalTeacherGuide: data?.originalTeacherGuide || '',
                  coureInfo: data?.coureInfo || '',
                },
              ];
            } catch {
              return [gid, { studytime: 0, originalTeacherGuide: '', coureInfo: '' }];
            }
          })
        );
        const fetchedMap = Object.fromEntries(results);
        mergedGuides = { ...mergedGuides, ...fetchedMap };
        setGuideDetails(mergedGuides); // update state (async), but use mergedGuides now
      }

      // Generate suggestions using the merged map to avoid empty payloads
      await generateSuggestions(list, mergedGuides);
    } catch (err) {
      console.error('Failed to load feedbacks', err);
      Swal.fire('Error', 'Failed to load feedbacks.', 'error');
    }
  };

  // Parse the model's text block to extract recommendation + trust status (we'll override trust)
  const parseModelText = (raw) => {
    const text = typeof raw === 'string' ? raw : JSON.stringify(raw);

    // Recommendation line
    const recMatch = text.match(/RECOMMENDATIONS:\s*(.*)/i);
    const recommendation = recMatch ? recMatch[1].trim() : text.trim();

    // Trust from model is ignored for display; we compute from completion rate
    return { recommendation, status: null };
  };

  // NEW endpoint + body
  const callSuggester = async ({ feedback, course_info, original_guide, completion_rate }) => {
    const payload = {
      feedback: feedback?.trim() || 'No student feedback provided.',
      course_info: course_info?.trim() || 'General Course',
      original_guide: original_guide?.trim() || 'No guide text available.',
      // Send the TABLE’S computed completion rate AS-IS (no extra clamping here)
      completion_rate: Number(completion_rate),
    };

    const { data } = await axios.post(`http://127.0.0.1:5000/predict-clean`, payload, {
      headers: { 'Content-Type': 'application/json' },
    });

    return parseModelText(data);
  };

  /**
   * Completion formula SHOWN IN TABLE:
   * marksPercent = clamp(marks, 0..100)
   * timePercent  = clamp((spentMinutes/assignedMinutes)*100, 0..100)
   * completion   = round( max(marksPercent, timePercent) )
   * => Guarantees completion ≥ 50 if marks ≥ 50 OR timePercent ≥ 50
   */
  const computeCompletionRate = (fb, guide) => {
    const assignedMinutes = safeNum(guide?.studytime); // assigned minutes on the guide (already minutes)
    const spentMinutes = toMinutes(fb?.studytime);     // convert feedback's studytime -> minutes
    const timePercent = assignedMinutes > 0 ? clamp01(spentMinutes / assignedMinutes) * 100 : 0;
    const marksPercent = clamp01(safeNum(fb?.marks) / 100) * 100;
    const completion = Math.round(Math.max(marksPercent, timePercent));
    return completion; // 0..100
  };

  // Map a completion rate to display trust AFTER model returns
  const trustFromCompletion = (completionRate) =>
    completionRate < 50 ? 'UNTRUSTWORTHY' : 'TRUSTWORTHY';

  const generateSuggestions = async (list, guidesMap) => {
    // Only generate for rows missing a suggestion
    const missing = list.filter((fb) => !suggestions[fb._id]);
    if (missing.length === 0) return;

    // Mark all missing as loading
    const newLoading = {};
    missing.forEach((fb) => (newLoading[fb._id] = true));
    setLoadingSuggestions((prev) => ({ ...prev, ...newLoading }));

    try {
      const results = await Promise.all(
        missing.map(async (fb) => {
          try {
            const guideId =
              typeof fb?.teacherGuideId === 'string'
                ? fb.teacherGuideId
                : fb?.teacherGuideId?._id;

            const guide =
              guidesMap?.[guideId] ||
              guideDetails?.[guideId] || {
                studytime: 0,
                originalTeacherGuide:
                  (typeof fb?.teacherGuideId !== 'string' && fb?.teacherGuideId?.originalTeacherGuide) || '',
                coureInfo:
                  (typeof fb?.teacherGuideId !== 'string' && fb?.teacherGuideId?.coureInfo) || '',
              };

            const completion_rate = computeCompletionRate(fb, guide);

            const model = await callSuggester({
              feedback: fb.studentFeedback || '',
              course_info: guide.coureInfo || '',
              original_guide: guide.originalTeacherGuide || '',
              completion_rate,
            });

            // Decide trust ONLY after model output is available
            const trustStatus = trustFromCompletion(completion_rate);

            return [fb._id, { model, trustStatus }];
          } catch (e) {
            console.error('Suggester failed for feedback', fb._id, e?.response?.data || e);
            return [fb._id, { model: { recommendation: '(suggestion unavailable)' }, trustStatus: null }];
          }
        })
      );

      // Split into suggestion + trust maps
      const sugMap = {};
      const trustMap = {};
      results.forEach(([fbId, { model, trustStatus }]) => {
        if (!model) return;
        sugMap[fbId] = model.recommendation || '(suggestion unavailable)';
        // Only set trust once the model has returned
        if (trustStatus) trustMap[fbId] = { status: trustStatus };
      });

      setSuggestions((prev) => ({ ...prev, ...sugMap }));
      setTrustInfo((prev) => ({ ...prev, ...trustMap }));
    } finally {
      // Clear loading flags
      const cleared = {};
      missing.forEach((fb) => (cleared[fb._id] = false));
      setLoadingSuggestions((prev) => ({ ...prev, ...cleared }));
    }
  };

  const regenerateFor = async (fb) => {
    setLoadingSuggestions((prev) => ({ ...prev, [fb._id]: true }));
    try {
      const guideId =
        typeof fb?.teacherGuideId === 'string' ? fb.teacherGuideId : fb?.teacherGuideId?._id;

      const guide =
        guideDetails?.[guideId] || {
          studytime: 0,
          originalTeacherGuide:
            (typeof fb?.teacherGuideId !== 'string' && fb?.teacherGuideId?.originalTeacherGuide) || '',
          coureInfo:
            (typeof fb?.teacherGuideId !== 'string' && fb?.teacherGuideId?.coureInfo) || '',
        };

      const completion_rate = computeCompletionRate(fb, guide);

      const model = await callSuggester({
        feedback: fb.studentFeedback || '',
        course_info: guide.coureInfo || '',
        original_guide: guide.originalTeacherGuide || '',
        completion_rate,
      });

      setSuggestions((prev) => ({ ...prev, [fb._id]: model.recommendation || '(suggestion unavailable)' }));
      // Set trust AFTER model returns
      setTrustInfo((prev) => ({
        ...prev,
        [fb._id]: { status: trustFromCompletion(completion_rate) },
      }));
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

  const openGuide = (fb) => {
    const guideId =
      typeof fb?.teacherGuideId === 'string' ? fb.teacherGuideId : fb?.teacherGuideId?._id;
    if (guideId) navigate(`/admin/teacher-guides/edit/${guideId}`);
  };

  const getDropdownItems = (fb) => [
    { icon: <FiExternalLink />, label: 'View Guide', onClick: () => openGuide(fb) },
    { icon: <FiCopy />, label: 'Copy Suggestion', onClick: () => copySuggestion(fb._id) },
    { icon: <FiRefreshCcw />, label: 'Regenerate', onClick: () => regenerateFor(fb) },
  ];

  if (isRemoved) return null;

  const totalPages = Math.max(1, Math.ceil(feedbacks.length / itemsPerPage));

  const firstGuideId =
    typeof feedbacks?.[0]?.teacherGuideId === 'string'
      ? feedbacks?.[0]?.teacherGuideId
      : feedbacks?.[0]?.teacherGuideId?._id;

  const courseInfo =
    guideDetails[firstGuideId]?.coureInfo ||
    feedbacks[0]?.teacherGuideId?.coureInfo ||
    feedbacks.find((f) => f?.teacherGuideId?.coureInfo)?.teacherGuideId?.coureInfo ||
    '';

  // Wider suggestion column
  const suggestionCellStyle = {
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    minWidth: '520px',
    width: '50%',
  };

  const spinner = (
    <span className="align-middle">
      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
      Generating...
    </span>
  );

  // badge helper for trust status
  const TrustBadge = ({ fb }) => {
    const info = trustInfo[fb._id];
    // Show "—" while loading or before model finished
    if (!info || loadingSuggestions[fb._id]) {
      return <span className="badge bg-secondary">—</span>;
    }
    const raw = (info.status || '').toUpperCase().trim();
    const isTrust = raw === 'TRUSTWORTHY';
    const cls = isTrust ? 'bg-success' : 'bg-danger';
    const label = isTrust ? 'TRUSTWORTHY' : 'UNTRUSTWORTHY';
    return <span className={`badge ${cls}`}>{label}</span>;
  };

  // ⬅️ Always show OUR computed completion %, independent of model
  const CompletionCell = ({ fb }) => {
    const guideId =
      typeof fb?.teacherGuideId === 'string' ? fb.teacherGuideId : fb?.teacherGuideId?._id;
    const guide = guideDetails?.[guideId] || { studytime: 0 };
    const val = computeCompletionRate(fb, guide);
    return <span>{Number.isFinite(val) ? `${val}%` : '—'}</span>;
  };

  return (
    <div className="col-xxl-12">
      <div className={`card stretch stretch-full ${isExpanded ? 'card-expand' : ''} ${refreshKey ? 'card-loading' : ''}`}>
        <CardHeader
          title={courseInfo ? `${title} — ${courseInfo}` : title}
          refresh={handleRefresh}
          remove={handleDelete}
          expanded={handleExpand}
        />

        <div className="card-body custom-card-action p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead>
                <tr>
                  <th style={{ minWidth: 160 }}>Student</th>
                  <th style={{ minWidth: 260 }}>Feedback</th>
                  <th style={{ minWidth: 120 }}>Marks</th>
                  <th style={{ minWidth: 120 }}>Time (min)</th>
                  <th style={{ minWidth: 140 }}>Completion %</th>
                  <th style={{ minWidth: 140 }}>Trust</th>
                  <th style={{ minWidth: 520, width: '50%' }}>Suggestion</th>
                  <th className="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedFeedbacks.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-4">No feedback found.</td>
                  </tr>
                ) : (
                  paginatedFeedbacks.map((fb) => {
                    const studentName = fb?.studentId?.username || fb?.studentId?.email || '—';
                    const s = suggestions[fb._id];

                    return (
                      <tr key={fb._id}>
                        <td title={fb?.studentId?.email || ''}>{studentName}</td>

                        <td
                          title={fb?.studentFeedback || ''}
                          style={{ maxWidth: 420, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        >
                          {fb?.studentFeedback || ''}
                        </td>

                        <td>{Number.isFinite(Number(fb?.marks)) ? Number(fb.marks) : '—'}</td>

                        {/* Display converted minutes */}
                        <td>{Number.isFinite(Number(fb?.studytime)) ? toMinutes(fb.studytime) : '—'}</td>

                        <td><CompletionCell fb={fb} /></td>

                        <td><TrustBadge fb={fb} /></td>

                        <td style={suggestionCellStyle}>
                          {loadingSuggestions[fb._id] ? spinner : (s || <span className="text-muted">—</span>)}
                        </td>

                        <td className="text-end">
                          <Dropdown dropdownItems={getDropdownItems(fb)} triggerClass="avatar-md ms-auto" triggerPosition="0,28" />
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
                <BsArrowLeft size={16} />
              </Link>
            </li>
            {Array.from({ length: totalPages }, (_, index) => {
              const page = index + 1;
              const shouldShow = page === 1 || page === totalPages || Math.abs(currentPage - page) <= 1;

              if (!shouldShow && (page === 2 || page === totalPages - 1)) {
                return (
                  <li key={`dots-${index}`}>
                    <Link to="#" onClick={(e) => e.preventDefault()}>
                      <BsDot size={16} />
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
