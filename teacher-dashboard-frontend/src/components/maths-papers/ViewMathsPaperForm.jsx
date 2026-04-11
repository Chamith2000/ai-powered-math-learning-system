import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import CardHeader from '@/components/shared/CardHeader';
import CardLoader from '@/components/shared/CardLoader';
import useCardTitleActions from '@/hooks/useCardTitleActions';
import axios from 'axios';
import BASE_URL from '../../config/apiConfig';
import { getToken } from '@/utils/token';
import Swal from 'sweetalert2';
import { FiEdit3, FiSave, FiX } from 'react-icons/fi'; // Icons import kara

const ViewMathsPaperForm = ({ title }) => {
  const { id } = useParams(); // paper id
  const navigate = useNavigate();
  const paperRef = React.useRef();

  const [paper, setPaper] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loadingPaper, setLoadingPaper] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // Evaluation state
  const [evaluating, setEvaluating] = useState(false);
  const [evaluations, setEvaluations] = useState({});

  // --- Edit Question States ---
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [savingQuestion, setSavingQuestion] = useState(false);

  const {
    refreshKey,
    isRemoved,
    isExpanded,
    handleRefresh,
    handleExpand,
    handleDelete,
  } = useCardTitleActions();

  // ---- helpers
  const pct = (v) => `${Math.round((v ?? 0) * 100)}%`;
  const round = (v, d = 1) => (v || v === 0 ? Number(v).toFixed(d) : '—');
  const fmt = (iso) => (iso ? new Date(iso).toLocaleString() : '—');

  const badgeForDifficulty = (diff) => {
    const d = (diff || '').toLowerCase();
    if (d === 'easy') return <span className="badge bg-soft-success text-success">Easy</span>;
    if (d === 'medium') return <span className="badge bg-soft-warning text-warning">Medium</span>;
    if (d === 'hard') return <span className="badge bg-soft-danger text-danger">Hard</span>;
    return <span className="badge bg-secondary">{diff || '—'}</span>;
  };

  // ---- load paper + questions
  useEffect(() => {
    const loadPaper = async () => {
      try {
        setLoadingPaper(true);
        const token = getToken();
        const res = await axios.get(`${BASE_URL}/maths/papers/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPaper(res?.data || null);
      } catch (err) {
        console.error('Failed to load paper', err);
        Swal.fire('Error', 'Failed to load paper details.', 'error');
      } finally {
        setLoadingPaper(false);
      }
    };

    const loadQuestions = async () => {
      try {
        setLoadingQuestions(true);
        const token = getToken();
        const res = await axios.get(`${BASE_URL}/maths/qanda/paper/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setQuestions(Array.isArray(res.data) ? res.data : []);
        setEvaluations({}); 
      } catch (err) {
        console.error('Failed to load questions', err);
        Swal.fire('Error', 'Failed to load questions for this paper.', 'error');
      } finally {
        setLoadingQuestions(false);
      }
    };

    loadPaper();
    loadQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, refreshKey]);

  // ---- derived
  const totalScore = useMemo(
    () => questions.reduce((sum, q) => sum + (typeof q.score === 'number' ? q.score : 0), 0),
    [questions]
  );

  const tgTitle = useMemo(() => {
    if (!paper) return '—';
    const tg = typeof paper?.teacherGuideId === 'string' ? null : paper?.teacherGuideId;
    return tg?.coureInfo || '—';
  }, [paper]);

  const creator = useMemo(() => {
    if (!paper) return {};
    return paper?.createby || paper?.createBy || {};
  }, [paper]);


  // --- Inline Edit Handlers ---
  const handleEditClick = (q) => {
    setEditingQuestion({ ...q }); // Prashnaye copy ekak state ekata gannawa
  };

  const handleCancelEdit = () => {
    setEditingQuestion(null);
  };

  const handleEditChange = (field, value) => {
    setEditingQuestion((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveQuestion = async () => {
    if (!editingQuestion.questionTytle.trim() || !editingQuestion.questionAnswer.trim()) {
      Swal.fire('Required', 'Question title and answer cannot be empty.', 'warning');
      return;
    }

    try {
      setSavingQuestion(true);
      const token = getToken();
      
      const payload = {
        questionTytle: editingQuestion.questionTytle,
        questionAnswer: editingQuestion.questionAnswer,
        topicTag: editingQuestion.topicTag,
        score: Number(editingQuestion.score) || 0,
      };

      await axios.put(`${BASE_URL}/maths/qanda/${editingQuestion._id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Update UI List
      setQuestions((prev) =>
        prev.map((q) => (q._id === editingQuestion._id ? { ...q, ...payload } : q))
      );
      
      setEditingQuestion(null);
      Swal.fire({ icon: 'success', title: 'Updated!', text: 'Question updated successfully.', timer: 1500, showConfirmButton: false });
    } catch (err) {
      console.error('Failed to update question', err);
      Swal.fire('Error', 'Failed to update the question.', 'error');
    } finally {
      setSavingQuestion(false);
    }
  };


  // ---- evaluation call
  const runEvaluation = async () => {
    if (!questions.length) {
      Swal.fire('No questions', 'There are no questions to evaluate.', 'info');
      return;
    }
    try {
      setEvaluating(true);
      const newEvals = {};

      for (const q of questions) {
        const payload = {
          teacher_data: {
            task: "task_a",
            topic: q.topicTag || "General",
            question: q.questionTytle,
            student_answer: q.questionAnswer,
            answer: q.questionAnswer,
            grade: paper?.grade || 3
          },
          model_type: "analyze"
        };

        try {
          const res = await axios.post('https://Chamith2000-mcq-generator-new.hf.space/generate', payload, {
            headers: { 'Content-Type': 'application/json' },
          });
          newEvals[q._id] = res.data?.output || {};
        } catch (innerErr) {
          console.error(`Evaluation failed for question ${q._id}`, innerErr);
          newEvals[q._id] = { error: true };
        }
      }
      setEvaluations(newEvals);
    } catch (err) {
      console.error('Evaluate failed', err);
      Swal.fire('Error', 'Failed to evaluate paper topics.', 'error');
    } finally {
      setEvaluating(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!paperRef.current) return;

    try {
      Swal.fire({
        title: 'Generating PDF...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const element = paperRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

      const fileName = `${paper?.paperTytle || 'Maths_Paper'}_Grade_${paper?.grade || '3'}.pdf`;
      pdf.save(fileName);

      Swal.close();
    } catch (error) {
      console.error('PDF Generation failed', error);
      Swal.close();
      Swal.fire('Error', 'Failed to generate PDF.', 'error');
    }
  };

  if (isRemoved) return null;

  return (
    <div className="col-xxl-12">
      <div className={`card stretch stretch-full ${isExpanded ? 'card-expand' : ''} ${refreshKey ? 'card-loading' : ''}`}>
        <CardHeader title={title} refresh={handleRefresh} remove={handleDelete} expanded={handleExpand} />

        <div className="card-body">
          {/* Top bar */}
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn btn-outline-primary"
                onClick={runEvaluation}
                disabled={evaluating || loadingPaper || loadingQuestions}
              >
                {evaluating ? 'Evaluating…' : 'Evaluate Matching'}
              </button>
            </div>

            <div className="d-flex justify-content-end gap-2">
              <button type="button" className="btn btn-light" onClick={() => navigate(-1)}>← Back</button>
              <button type="button" className="btn btn-outline-info" onClick={handleDownloadPDF}>Download PDF</button>
              <button type="button" className="btn btn-outline-primary" onClick={() => window.print()}>Print</button>
            </div>
          </div>

          {/* Paper content ref wrapper */}
          <div ref={paperRef} className="p-3 bg-white">
            {/* Paper header */}
            <div className="text-center mb-4">
              <h3 className="mb-1" style={{ wordBreak: 'break-word' }}>
                {paper?.paperTytle || paper?.paperTitle || '—'}
              </h3>
              <div className="d-inline-flex align-items-center gap-2 mt-2">
                {badgeForDifficulty(paper?.paperDifficulty)}
                <span className="badge bg-soft-info text-info">Grade {paper?.grade || '—'}</span>
                <span className="text-muted">Total Marks: {totalScore}</span>
              </div>
            </div>

            {/* Meta */}
            <div className="row g-3 mb-4">
              <div className="col-md-4">
                <div className="p-3 border rounded h-100">
                  <div className="text-muted small">Teacher Guide</div>
                  <div className="fw-semibold" title={tgTitle}>{tgTitle}</div>
                </div>
              </div>
              {/* <div className="col-md-4">
                <div className="p-3 border rounded h-100">
                  <div className="text-muted small">Created By</div>
                  <div className="fw-semibold">{creator?.username || '—'}</div>
                  <div className="small text-muted">{creator?.email || ''}</div>
                </div>
              </div> */}
              <div className="col-md-4">
                <div className="p-3 border rounded h-100">
                  <div className="text-muted small">Dates</div>
                  <div className="small">Created: {fmt(paper?.createdAt)}</div>
                  <div className="small">Updated: {fmt(paper?.updatedAt)}</div>
                </div>
              </div>
            </div>

            <hr className="my-4" />

            {/* Questions List */}
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Questions</h5>
                <span className="text-muted small">
                  {questions.length} question{questions.length !== 1 ? 's' : ''}
                </span>
              </div>

              {loadingPaper || loadingQuestions ? (
                <div className="text-muted">Loading paper…</div>
              ) : questions.length === 0 ? (
                <div className="text-muted">No questions available for this paper.</div>
              ) : (
                <ol className="ps-3">
                  {questions.map((q) => {
                    const ev = evaluations[q._id];
                    const isEditing = editingQuestion?._id === q._id;

                    // EDIT MODE
                    if (isEditing) {
                      return (
                        <li key={q._id} className="mb-4 p-4 border border-primary rounded bg-soft-primary">
                          <h6 className="mb-3 text-primary">Edit Question</h6>
                          <div className="mb-3">
                            <label className="form-label">Question Title</label>
                            <input 
                              type="text" 
                              className="form-control" 
                              value={editingQuestion.questionTytle} 
                              onChange={(e) => handleEditChange('questionTytle', e.target.value)} 
                            />
                          </div>
                          <div className="row mb-3">
                            <div className="col-md-8">
                              <label className="form-label">Topic Tag</label>
                              <input 
                                type="text" 
                                className="form-control" 
                                value={editingQuestion.topicTag} 
                                onChange={(e) => handleEditChange('topicTag', e.target.value)} 
                              />
                            </div>
                            <div className="col-md-4">
                              <label className="form-label">Score</label>
                              <input 
                                type="number" 
                                className="form-control" 
                                min={0}
                                value={editingQuestion.score} 
                                onChange={(e) => handleEditChange('score', e.target.value)} 
                              />
                            </div>
                          </div>
                          <div className="mb-4">
                            <label className="form-label">Answer</label>
                            <textarea 
                              className="form-control" 
                              rows="3" 
                              value={editingQuestion.questionAnswer} 
                              onChange={(e) => handleEditChange('questionAnswer', e.target.value)}
                            ></textarea>
                          </div>
                          <div className="d-flex justify-content-end gap-2">
                            <button className="btn btn-light" onClick={handleCancelEdit} disabled={savingQuestion}>
                              <FiX className="me-1" /> Cancel
                            </button>
                            <button className="btn btn-primary" onClick={handleSaveQuestion} disabled={savingQuestion}>
                              <FiSave className="me-1" /> {savingQuestion ? 'Saving...' : 'Save Changes'}
                            </button>
                          </div>
                        </li>
                      );
                    }

                    // VIEW MODE
                    return (
                      <li key={q._id} className="mb-4">
                        <div className="d-flex justify-content-between align-items-start gap-3">
                          <h6 className="mb-2 d-flex align-items-center gap-2" style={{ wordBreak: 'break-word' }}>
                            <span>{q.questionTytle || '—'}</span>
                            <span className="badge bg-secondary" style={{ fontSize: '0.75rem' }}>
                              {q.topicTag || q.topic || 'General'}
                            </span>
                          </h6>
                          <div className="d-flex flex-wrap align-items-center gap-2">
                            <span className="badge bg-light text-dark border">
                              Score: {q.score ?? 0}
                            </span>
                            {ev && !ev.error && (
                              <span className={`badge ${ev.matching_score >= 0.8 ? 'bg-soft-success text-success' : ev.matching_score >= 0.5 ? 'bg-soft-warning text-warning' : 'bg-soft-danger text-danger'}`}>
                                Match: {round(ev.matching_score * 100)}%
                              </span>
                            )}
                            {ev?.error && <span className="badge bg-soft-danger text-danger">Eval Failed</span>}
                            
                            {/* Edit Button */}
                            <button 
                              className="btn btn-sm btn-icon btn-outline-primary ms-2" 
                              onClick={() => handleEditClick(q)} 
                              title="Edit Question"
                            >
                              <FiEdit3 /> Edit
                            </button>
                          </div>
                        </div>

                        <div className="p-3 border rounded mt-2 bg-light" style={{ whiteSpace: 'pre-wrap' }}>
                          <strong>Answer:</strong><br/>
                          {q.questionAnswer || '—'}
                        </div>
                        {ev && !ev.error && ev.improvements && (
                          <div className="mt-2 p-2 border rounded bg-soft-info text-info small" style={{ whiteSpace: 'pre-wrap' }}>
                            <strong>Improvements:</strong> {typeof ev.improvements === 'string' ? ev.improvements.replace(/\bstudent\b/gi, 'You') : JSON.stringify(ev.improvements)}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          </div>

          <CardLoader refreshKey={refreshKey} />
        </div>
      </div>
    </div>
  );
};

export default ViewMathsPaperForm;