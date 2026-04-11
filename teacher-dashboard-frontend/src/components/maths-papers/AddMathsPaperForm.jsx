import React, { useState, useEffect } from 'react';
import CardHeader from '@/components/shared/CardHeader';
import CardLoader from '@/components/shared/CardLoader';
import useCardTitleActions from '@/hooks/useCardTitleActions';
import axios from 'axios';
import BASE_URL from '../../config/apiConfig';
import { getToken } from '@/utils/token';
import Swal from 'sweetalert2';
import Papa from 'papaparse';
import { FiUpload , FiDownload} from 'react-icons/fi';

const MATH_TOPIC_TAG_OPTIONS = [
  'addition',
  'subtraction',
  'multiplication',
  'division',
  'fractions',
  'decimals',
  'place value',
  'geometry',
  'measurement',
  'money',
  'time',
  'word problems',
];

const AddMathsPaperForm = ({ title }) => {
  const selectTextStyle = {
    fontFamily: 'inherit',
    fontSize: '14px',
    fontWeight: 500,
    color: '#283c50',
  };

  const [formData, setFormData] = useState({
    paperTytle: '',
    paperDifficulty: 'Easy',   // dropdown: Easy | Medium | Hard
    teacherGuideId: '',
    grade: 3,
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

  // --- Download Sample CSV Format ---
  const downloadSampleCSV = () => {
    // CSV eke header eka (oyage papaparse eken kiyawana nam walatama galapennai dila thiyenne)
    const headers = "paperTitle,paperDifficulty,grade,questionTitle,answer,topicTags,score\n";
    
    // Grade 3, 4, 5 maths walata galapena sample data
    const sampleData = [
      '"Grade 3 Maths Practice","Easy",3,"What is 45 + 32?","77","addition,basic",2',
      '"Grade 4 Maths Practice","Medium",4,"A rectangle is 8 cm long and 5 cm wide. Find the area.","40 cm2","geometry,area",3',
      '"Grade 5 Maths Practice","Hard",5,"What is 3/4 of 20?","15","fractions,multiplication",3',
    ].join('\n') + '\n';
    
    const blob = new Blob([headers + sampleData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Sample_Paper_Format.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCsvUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data;
        if (rows.length === 0) {
          Swal.fire('Error', 'CSV file is empty.', 'error');
          return;
        }

        // Auto-fill form data from the first row if available
        const firstRow = rows[0];
        setFormData((prev) => ({
          ...prev,
          paperTytle: firstRow.paperTitle || prev.paperTytle,
          paperDifficulty: firstRow.paperDifficulty || prev.paperDifficulty,
          grade: firstRow.grade ? Number(firstRow.grade) : prev.grade,
        }));

        // Map rows to questions
        const mappedQuestions = rows.map((row) => ({
          questionTytle: row.questionTitle || '',
          questionAnswer: row.answer || '',
          topicTag: row.topicTags || '',
          score: row.score ? Number(row.score) : 1,
        }));

        setQuestions(mappedQuestions);
        Swal.fire('Success', `Loaded ${mappedQuestions.length} questions from CSV.`, 'success');
        // Reset file input
        e.target.value = '';
      },
      error: (err) => {
        console.error('CSV Parsing Error:', err);
        Swal.fire('Error', 'Failed to parse CSV file.', 'error');
      },
    });
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
    if (![3, 4, 5].includes(Number(formData.grade))) {
      Swal.fire('Required', 'Grade must be 3, 4, or 5.', 'info');
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
        grade: Number(formData.grade) || 3,
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
        grade: 3,
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
            {/* Bulk Upload & Download Buttons (Aluth Styles ekka) */}
            <div className="d-flex justify-content-end gap-2 mb-4">
              
              <button
                type="button"
                className="btn btn-outline-info" 
                onClick={downloadSampleCSV}
                title="Download Sample CSV Format"
              >
                <FiDownload className="me-2" /> Download Format
              </button>
              
              <input
                type="file"
                accept=".csv"
                id="csvUploadMaths"
                style={{ display: 'none' }}
                onChange={handleCsvUpload}
              />
              
              <button
                type="button"
                className="btn btn-success"
                disabled={isSubmitting}
                onClick={() => document.getElementById('csvUploadMaths').click()}
              >
                <FiUpload className="me-2" /> 
                {isSubmitting ? 'Uploading...' : 'Bulk Upload CSV'}
              </button>

            </div>
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
                  placeholder="Grade 3 Maths Practice Paper"
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
                  style={selectTextStyle}
                  required
                >
                  <option style={selectTextStyle} value="Easy">Easy</option>
                  <option style={selectTextStyle} value="Medium">Medium</option>
                  <option style={selectTextStyle} value="Hard">Hard</option>
                </select>
              </div>

              <div className="col-md-3">
                <label className="form-label">Teacher Guide (optional)</label>
                <select
                  className="form-select"
                  name="teacherGuideId"
                  value={formData.teacherGuideId}
                  onChange={onFieldChange}
                  style={selectTextStyle}
                  disabled={tgLoading}
                >
                  <option style={selectTextStyle} value="">None</option>
                  {teacherGuides.map((tg) => (
                    <option style={selectTextStyle} key={tg._id} value={tg._id}>
                      {tg.coureInfo}
                    </option>
                  ))}
                </select>
                <small className="text-muted">
                  {tgLoading ? 'Loading teacher guides…' : 'Link to an existing teacher guide (optional).'}
                </small>
              </div>

              <div className="col-md-3">
                <label className="form-label">Grade</label>
                <input
                  type="number"
                  className="form-control"
                  name="grade"
                  value={formData.grade}
                  onChange={onFieldChange}
                  min={3}
                  max={5}
                  required
                />
                
              </div>
            </div>

            {/* Questions list */}
            <div className="d-flex align-items-center justify-content-between mb-2">
              <h6 className="mb-0">Questions ({questions.length})</h6>
              <div className="d-flex gap-2">
                
                <button type="button" className="btn btn-sm btn-outline-primary" onClick={addQuestion}>
                  + Add Question
                </button>
              </div>
            </div>
            <datalist id="math-topic-tag-options">
              {MATH_TOPIC_TAG_OPTIONS.map((tag) => (
                <option key={tag} value={tag} />
              ))}
            </datalist>

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
                      placeholder="e.g., What is 245 + 138?"
                      required
                    />
                    <small className="text-muted">Use Grade 3, 4, or 5 maths questions.</small>
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
                      placeholder="e.g., 383"
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
                      placeholder="addition, carrying, grade 3"
                      list="math-topic-tag-options"
                    />
                    <small className="text-muted">Examples: addition, fractions, geometry, measurement, word problems.</small>
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
        </form >

        <CardLoader refreshKey={refreshKey} />
      </div >
    </div >
  );
};

export default AddMathsPaperForm;
