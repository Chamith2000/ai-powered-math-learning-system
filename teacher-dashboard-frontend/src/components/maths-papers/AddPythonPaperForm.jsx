import React, { useState, useEffect } from 'react';
import CardHeader from '@/components/shared/CardHeader';
import CardLoader from '@/components/shared/CardLoader';
import useCardTitleActions from '@/hooks/useCardTitleActions';
import axios from 'axios';
import BASE_URL from '../../config/apiConfig';
import { getToken } from '@/utils/token';
import Swal from 'sweetalert2';

const AddPythonPaperForm = ({ title }) => {
  const [formData, setFormData] = useState({
    paperTytle: '',
    paperDifficulty: 'Easy',   // dropdown: Easy | Medium | Hard
    teacherGuideId: '',
  });

  const [questions, setQuestions] = useState([
    { questionTytle: '', questionAnswer: '', topicTag: '', score: 1 },
  ]);

  const [teacherGuides, setTeacherGuides] = useState([]);
  const [tgLoading, setTgLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    refreshKey,
    isRemoved,
    isExpanded,
    handleRefresh,
    handleExpand,
    handleDelete,
  } = useCardTitleActions();

  // Fetch teacher guides (same pattern as previous)
  useEffect(() => {
    const loadTeacherGuides = async () => {
      try {
        setTgLoading(true);
        const token = getToken();
        const res = await axios.get(`${BASE_URL}/teacher-guides`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTeacherGuides(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Failed to load teacher guides', err);
        Swal.fire('Error', 'Failed to load teacher guides.', 'error');
      } finally {
        setTgLoading(false);
      }
    };
    loadTeacherGuides();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onFieldChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Questions handlers
  const addQuestion = () => {
    setQuestions((prev) => [...prev, { questionTytle: '', questionAnswer: '', topicTag: '', score: 1 }]);
  };

  const removeQuestion = (idx) => {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const onQuestionChange = (idx, field, value) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === idx ? { ...q, [field]: value } : q))
    );
  };

  const submitPaperAndQuestions = async (e) => {
    e.preventDefault();
    if (!formData.paperTytle.trim()) {
      Swal.fire('Required', 'Paper title is required.', 'info');
      return;
    }
    if (questions.length === 0) {
      Swal.fire('Required', 'Add at least one question.', 'info');
      return;
    }
    // basic validation on questions
    const invalid = questions.find(
      (q) => !q.questionTytle.trim() || !q.questionAnswer.trim() || !String(q.score).trim()
    );
    if (invalid) {
      Swal.fire('Required', 'Each question must have a title, an answer, and a score.', 'info');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = getToken();

      // 1) Create the paper
      const paperPayload = {
        paperTytle: formData.paperTytle.trim(),
        paperDifficulty: formData.paperDifficulty,
        ...(formData.teacherGuideId ? { teacherGuideId: formData.teacherGuideId } : {}),
      };

      const paperRes = await axios.post(`${BASE_URL}/maths/papers`, paperPayload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const paperId = paperRes?.data?._id;
      if (!paperId) {
        throw new Error('Paper created but id missing in response.');
      }

      // 2) Create all Q&A for that paper (one by one)
      const results = await Promise.allSettled(
        questions.map((q) =>
          axios.post(
            `${BASE_URL}/maths/qanda`,
            {
              paperId,
              questionTytle: q.questionTytle.trim(),
              questionAnswer: q.questionAnswer.trim(),
              topicTag: (q.topicTag || '').trim(),
              score: Number(q.score) || 0,
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            }
          )
        )
      );

      const successCount = results.filter((r) => r.status === 'fulfilled').length;
      const failCount = results.length - successCount;

      if (failCount === 0) {
        await Swal.fire({
          icon: 'success',
          title: 'Paper created!',
          text: `Created paper and ${successCount} question(s) successfully.`,
          timer: 1700,
          showConfirmButton: false,
        });
      } else if (successCount > 0) {
        await Swal.fire({
          icon: 'warning',
          title: 'Partial success',
          text: `Paper created. ${successCount} question(s) added, ${failCount} failed.`,
        });
      } else {
        // Paper created but questions all failed
        await Swal.fire({
          icon: 'error',
          title: 'Questions failed',
          text: 'The paper was created but adding questions failed.',
        });
      }

      // reset UI
      setFormData({
        paperTytle: '',
        paperDifficulty: 'Easy',
        teacherGuideId: '',
      });
      setQuestions([{ questionTytle: '', questionAnswer: '', topicTag: '', score: 1 }]);
      handleRefresh();
    } catch (err) {
      console.error('Paper creation failed:', err?.response?.data || err);
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text:
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          'Failed to create paper or questions.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isRemoved) return null;

  return (
    <div className="col-xxl-12">
      <div className={`card stretch stretch-full ${isExpanded ? 'card-expand' : ''} ${refreshKey ? 'card-loading' : ''}`}>
        <CardHeader title={title} refresh={handleRefresh} remove={handleDelete} expanded={handleExpand} />

        <form onSubmit={submitPaperAndQuestions}>
          <div className="card-body">
            {/* Paper meta */}
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Paper Title</label>
                <input
                  type="text"
                  className="form-control"
                  name="paperTytle"
                  value={formData.paperTytle}
                  onChange={onFieldChange}
                  placeholder="Functions & Loops – Practice Paper"
                  required
                />
              </div>

              <div className="col-md-3">
                <label className="form-label">Difficulty</label>
                <select
                  className="form-select"
                  name="paperDifficulty"
                  value={formData.paperDifficulty}
                  onChange={onFieldChange}
                  required
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              <div className="col-md-3">
                <label className="form-label">Teacher Guide (optional)</label>
                <select
                  className="form-select"
                  name="teacherGuideId"
                  value={formData.teacherGuideId}
                  onChange={onFieldChange}
                  disabled={tgLoading}
                >
                  <option value="">— None —</option>
                  {teacherGuides.map((tg) => (
                    <option key={tg._id} value={tg._id}>
                      {tg.coureInfo}
                    </option>
                  ))}
                </select>
                <small className="text-muted">
                  {tgLoading ? 'Loading teacher guides…' : 'Link to an existing teacher guide (optional).'}
                </small>
              </div>
            </div>

            {/* Questions list */}
            <hr className="my-4" />
            <div className="d-flex align-items-center justify-content-between mb-2">
              <h6 className="mb-0">Questions ({questions.length})</h6>
              <button type="button" className="btn btn-sm btn-outline-primary" onClick={addQuestion}>
                + Add Question
              </button>
            </div>

            {questions.map((q, idx) => (
              <div key={idx} className="border rounded p-3 mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <strong>Question #{idx + 1}</strong>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => removeQuestion(idx)}
                    disabled={questions.length === 1}
                    title={questions.length === 1 ? 'At least one question is required' : 'Remove'}
                  >
                    Remove
                  </button>
                </div>

                <div className="row g-3">
                  <div className="col-md-8">
                    <label className="form-label">Question Title</label>
                    <input
                      type="text"
                      className="form-control"
                      value={q.questionTytle}
                      onChange={(e) => onQuestionChange(idx, 'questionTytle', e.target.value)}
                      placeholder="What is Python's list 'append' vs 'extend'?"
                      required
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">Score</label>
                    <input
                      type="number"
                      className="form-control"
                      min={0}
                      max={100}
                      value={q.score}
                      onChange={(e) => onQuestionChange(idx, 'score', e.target.value)}
                      placeholder="e.g., 3"
                      required
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label">Answer</label>
                    <textarea
                      className="form-control"
                      rows={4}
                      value={q.questionAnswer}
                      onChange={(e) => onQuestionChange(idx, 'questionAnswer', e.target.value)}
                      placeholder="append() adds a single element; extend() adds elements from an iterable…"
                      required
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label">Topic Tags (comma-separated)</label>
                    <input
                      type="text"
                      className="form-control"
                      value={q.topicTag}
                      onChange={(e) => onQuestionChange(idx, 'topicTag', e.target.value)}
                      placeholder="list,append,extend,methods"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="card-footer d-flex justify-content-end">
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Create Paper & Questions'}
            </button>
          </div>
        </form>

        <CardLoader refreshKey={refreshKey} />
      </div>
    </div>
  );
};

export default AddPythonPaperForm;
