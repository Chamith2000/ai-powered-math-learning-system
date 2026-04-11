import React, { useState, useRef } from 'react';
import CardHeader from '@/components/shared/CardHeader';
import CardLoader from '@/components/shared/CardLoader';
import useCardTitleActions from '@/hooks/useCardTitleActions';
import axios from 'axios';
import BASE_URL from '../../config/apiConfig';
import { getToken } from '@/utils/token';
import Swal from 'sweetalert2';

const blankQuestion = () => ({
  paperQuestionTitle: '',
  paperQuestioncategory: '',
  answers: ['', '', '', ''], // 4 options by default
  correctIndex: 0,           // which answer is correct
});

const MATH_CATEGORY_OPTIONS = [
  'Addition',
  'Subtraction',
  'Multiplication',
  'Division',
  'Fractions',
  'Decimals',
  'Place Value',
  'Measurement',
  'Geometry',
  'Money',
  'Time',
  'Word Problems',
];

const AddStartingPaperForm = ({ title }) => {
  const [formData, setFormData] = useState({
    paperTytle: '',
    paperNumber: 1,
    grade: 3,
  });

  const [questions, setQuestions] = useState([blankQuestion()]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Ref for the hidden file input
  const fileInputRef = useRef(null);

  const {
    refreshKey,
    isRemoved,
    isExpanded,
    handleRefresh,
    handleExpand,
    handleDelete,
  } = useCardTitleActions();

  const onFieldChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: (name === 'paperNumber' || name === 'grade') ? Number(value) : value
    }));
  };

  // --- Questions handlers ---
  const addQuestion = () => setQuestions((prev) => [...prev, blankQuestion()]);

  const removeQuestion = (idx) => {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const onQuestionChange = (idx, field, value) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === idx ? { ...q, [field]: value } : q))
    );
  };

  const onAnswerChange = (qIdx, aIdx, value) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const answers = [...q.answers];
        answers[aIdx] = value;
        return { ...q, answers };
      })
    );
  };

  const onCorrectPick = (qIdx, aIdx) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === qIdx ? { ...q, correctIndex: aIdx } : q))
    );
  };

  const validate = () => {
    if (!formData.paperTytle.trim()) {
      Swal.fire('Required', 'Paper title is required.', 'info');
      return false;
    }
    if (!Number.isFinite(formData.paperNumber) || formData.paperNumber < 1) {
      Swal.fire('Required', 'Paper # must be a positive number.', 'info');
      return false;
    }
    if (![3, 4, 5].includes(Number(formData.grade))) {
      Swal.fire('Required', 'Grade must be 3, 4, or 5.', 'info');
      return false;
    }
    if (questions.length === 0) {
      Swal.fire('Required', 'Add at least one question.', 'info');
      return false;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.paperQuestionTitle.trim()) {
        Swal.fire('Required', `Question #${i + 1}: title is required.`, 'info');
        return false;
      }
      if (!q.paperQuestioncategory.trim()) {
        Swal.fire('Required', `Question #${i + 1}: category is required.`, 'info');
        return false;
      }
      const trimmedAnswers = q.answers.map((a) => a.trim());
      const nonEmpty = trimmedAnswers.filter(Boolean);
      if (nonEmpty.length < 2) {
        Swal.fire('Required', `Question #${i + 1}: provide at least two non-empty answer options.`, 'info');
        return false;
      }
      const correct = trimmedAnswers[q.correctIndex] || '';
      if (!correct) {
        Swal.fire('Required', `Question #${i + 1}: pick a non-empty correct answer.`, 'info');
        return false;
      }
    }
    return true;
  };

  // --- Manual Form Submission ---
  const submitPaperAndQuestions = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const token = getToken();
      const headers = token
        ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
        : { 'Content-Type': 'application/json' };

      // 1) Create Starting Paper Title
      const titlePayload = {
        paperTytle: formData.paperTytle.trim(),
        paperNumber: Number(formData.paperNumber),
        grade: Number(formData.grade),
      };

      const titleRes = await axios.post(`${BASE_URL}/starting-paper-titles`, titlePayload, { headers });
      const paperId = titleRes?.data?._id;
      if (!paperId) throw new Error('Title created but _id missing in response.');

      // 2) Create all questions (one by one)
      const results = await Promise.allSettled(
        questions.map((q) => {
          const trimmedAnswers = q.answers.map((a) => a.trim());
          const correctanser = trimmedAnswers[q.correctIndex];
          return axios.post(
            `${BASE_URL}/starting-paper-questions`,
            {
              paperQuestionId: paperId,
              paperQuestionTitle: q.paperQuestionTitle.trim(),
              paperQuestioncategory: q.paperQuestioncategory.trim(),
              answers: trimmedAnswers,
              correctanser,
            },
            { headers }
          );
        })
      );

      const successCount = results.filter((r) => r.status === 'fulfilled').length;
      const failCount = results.length - successCount;

      if (failCount === 0) {
        await Swal.fire({ icon: 'success', title: 'Created!', text: `Paper & ${successCount} question(s) created.`, timer: 1700, showConfirmButton: false });
      } else if (successCount > 0) {
        await Swal.fire({ icon: 'warning', title: 'Partial success', text: `Title created. ${successCount} added, ${failCount} failed.` });
      } else {
        await Swal.fire({ icon: 'error', title: 'Questions failed', text: 'Title created but questions failed.' });
      }

      setFormData({ paperTytle: '', paperNumber: 1, grade: 3 });
      setQuestions([blankQuestion()]);
      handleRefresh();
    } catch (err) {
      console.error('Creation failed:', err?.response?.data || err);
      Swal.fire({ icon: 'error', title: 'Oops…', text: err?.response?.data?.message || 'Failed to create paper.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Download Sample CSV Format ---
  const downloadSampleCSV = () => {
    // CSV eke header eka saha sample data peliya
    const headers = "Paper Title,Grade,Paper Number,Question Title,Category,Option 1,Option 2,Option 3,Option 4,Correct Index (0-3)\n";
    const sampleData = [
      '"Grade 3 Maths",3,1,"What is 15 + 24?","Addition","39","40","38","49",0',
      '"Grade 4 Maths",4,1,"A rectangle has length 8 cm and width 5 cm. What is its area?","Geometry","13 cm2","40 cm2","26 cm2","45 cm2",1',
      '"Grade 5 Maths",5,1,"What is 3/4 of 20?","Fractions","12","15","16","18",1',
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

  // --- CSV Bulk Upload Logic ---
  const handleCSVUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsSubmitting(true);
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        // Split by lines and remove empty rows
        const rows = text.split('\n').filter((row) => row.trim() !== '');
        if (rows.length < 2) {
          throw new Error('CSV must contain a header row and at least one data row.');
        }

        rows.shift(); // Remove the header row

        // Group questions by Paper Title
        const papersMap = {}; 
        
        rows.forEach((row, index) => {
          // Regex to split by comma but ignore commas inside double quotes
          const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map((col) => col.replace(/^"|"$/g, '').trim());
          
          if (cols.length < 10) {
            console.warn(`Skipping row ${index + 2}: Insufficient columns`);
            return;
          }

          const [paperTytle, grade, paperNumber, qTitle, qCat, opt1, opt2, opt3, opt4, correctIdx] = cols;

          if (!papersMap[paperTytle]) {
            papersMap[paperTytle] = {
              formData: { paperTytle, grade: Number(grade), paperNumber: Number(paperNumber) },
              questions: [],
            };
          }

          papersMap[paperTytle].questions.push({
            paperQuestionTitle: qTitle,
            paperQuestioncategory: qCat,
            answers: [opt1, opt2, opt3, opt4],
            correctIndex: Number(correctIdx) || 0,
          });
        });

        const token = getToken();
        const headersConfig = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };

        let successPapers = 0;
        let totalQuestions = 0;

        // Sequentially create papers and their questions
        for (const key in papersMap) {
          const paper = papersMap[key];
          
          // 1) Post Title
          const titleRes = await axios.post(`${BASE_URL}/starting-paper-titles`, paper.formData, { headers: headersConfig });
          const paperId = titleRes?.data?._id;

          if (paperId) {
            successPapers++;
            // 2) Post Questions for this Title
            const qPromises = paper.questions.map((q) => {
              return axios.post(`${BASE_URL}/starting-paper-questions`, {
                paperQuestionId: paperId,
                paperQuestionTitle: q.paperQuestionTitle,
                paperQuestioncategory: q.paperQuestioncategory,
                answers: q.answers,
                correctanser: q.answers[q.correctIndex]
              }, { headers: headersConfig });
            });

            const qResults = await Promise.allSettled(qPromises);
            totalQuestions += qResults.filter((r) => r.status === 'fulfilled').length;
          }
        }

        Swal.fire('Success', `Bulk uploaded ${successPapers} paper(s) and ${totalQuestions} question(s).`, 'success');
        handleRefresh();
      } catch (error) {
        Swal.fire('Error', error.message || 'Bulk upload failed while parsing/uploading.', 'error');
        console.error(error);
      } finally {
        setIsSubmitting(false);
        if (fileInputRef.current) fileInputRef.current.value = null; // reset file input
      }
    };

    reader.readAsText(file);
  };

  if (isRemoved) return null;

  return (
    <div className="col-xxl-12">
      <div className={`card stretch stretch-full ${isExpanded ? 'card-expand' : ''} ${refreshKey ? 'card-loading' : ''}`}>
        
        {/* Parana widihatama CardHeader eka danna */}
        <CardHeader
          title={title}
          refresh={handleRefresh}
          remove={handleDelete}
          expanded={handleExpand}
        />

        <form onSubmit={submitPaperAndQuestions}>
          <div className="card-body">

            {/* Bulk Upload Button eka methanata danna (Dakunu konata wenda dila thiyenne) */}
            <div className="d-flex justify-content-end gap-2 mb-4">
              
              {/* Aluth: Download CSV Format Button eka */}
              <button 
                type="button" 
                className="btn btn-outline-info" 
                onClick={downloadSampleCSV}
                title="Download Sample CSV Format"
              >
                <i className="feather-download me-2"></i> Download Format
              </button>

              {/* Parana: Bulk Upload Button eka */}
              <input 
                type="file" 
                accept=".csv" 
                style={{ display: 'none' }} 
                ref={fileInputRef} 
                onChange={handleCSVUpload} 
              />
              <button 
                type="button" 
                className="btn btn-success" 
                disabled={isSubmitting}
                onClick={() => fileInputRef.current?.click()}
              >
                <i className="feather-upload me-2"></i>
                {isSubmitting ? 'Uploading...' : 'Bulk Upload CSV'}
              </button>
            </div>
            {/* Title meta */}
            <div className="row g-3">
              <div className="col-md-8">
                <label className="form-label">Paper Title</label>
                <input
                  type="text"
                  className="form-control"
                  name="paperTytle"
                  value={formData.paperTytle}
                  onChange={onFieldChange}
                  placeholder="Grade 3 Maths Starting Paper"
                  required
                />
              </div>

              <div className="col-md-2">
                <label className="form-label">Grade</label>
                <input
                  type="number"
                  className="form-control"
                  name="grade"
                  min={3}
                  max={5}
                  value={formData.grade}
                  onChange={onFieldChange}
                  placeholder="3, 4, or 5"
                  required
                />
               
              </div>

              <div className="col-md-2">
                <label className="form-label">Paper #</label>
                <input
                  type="number"
                  className="form-control"
                  name="paperNumber"
                  min={1}
                  value={formData.paperNumber}
                  onChange={onFieldChange}
                  placeholder="e.g., 1"
                  required
                />
              </div>
            </div>

            {/* Questions */}
            <hr className="my-4" />
            <div className="d-flex align-items-center justify-content-between mb-2">
              <h6 className="mb-0">Questions ({questions.length})</h6>
              <button type="button" className="btn btn-sm btn-outline-primary" onClick={addQuestion}>
                + Add Question
              </button>
            </div>
            <datalist id="math-category-options">
              {MATH_CATEGORY_OPTIONS.map((category) => (
                <option key={category} value={category} />
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
                      value={q.paperQuestionTitle}
                      onChange={(e) => onQuestionChange(idx, 'paperQuestionTitle', e.target.value)}
                      placeholder="e.g., What is 245 + 138?"
                      required
                    />
                    <small className="text-muted">Use Grade 3, 4, or 5 maths questions.</small>
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">Category</label>
                    <input
                      type="text"
                      className="form-control"
                      value={q.paperQuestioncategory}
                      onChange={(e) => onQuestionChange(idx, 'paperQuestioncategory', e.target.value)}
                      placeholder="e.g., Addition"
                      list="math-category-options"
                      required
                    />
                    <small className="text-muted">Examples: Addition, Fractions, Geometry, Measurement.</small>
                  </div>

                  <div className="col-12">
                    <label className="form-label d-block">Answers (pick the correct one)</label>

                    {q.answers.map((a, aIdx) => (
                      <div key={aIdx} className="input-group mb-2">
                        <div className="input-group-text">
                          <input
                            type="radio"
                            name={`correct-${idx}`}
                            checked={q.correctIndex === aIdx}
                            onChange={() => onCorrectPick(idx, aIdx)}
                            aria-label={`Mark option ${aIdx + 1} as correct`}
                          />
                        </div>
                        <input
                          type="text"
                          className="form-control"
                          value={a}
                          onChange={(e) => onAnswerChange(idx, aIdx, e.target.value)}
                          placeholder={`Option ${aIdx + 1}`}
                          required={aIdx < 2} 
                        />
                      </div>
                    ))}
                    <small className="text-muted">
                      Provide 2–4 options. The selected radio is sent as <code>correctanser</code>.
                    </small>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="card-footer d-flex justify-content-end">
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Create Title & Questions'}
            </button>
          </div>
        </form>

        <CardLoader refreshKey={refreshKey} />
      </div>
    </div>
  );
};

export default AddStartingPaperForm;
