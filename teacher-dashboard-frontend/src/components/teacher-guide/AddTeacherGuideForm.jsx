import React, { useState } from 'react';
import CardHeader from '@/components/shared/CardHeader';
import CardLoader from '@/components/shared/CardLoader';
import useCardTitleActions from '@/hooks/useCardTitleActions';
import axios from 'axios';
import BASE_URL from '../../config/apiConfig';
import { getToken } from '@/utils/token';
import Swal from 'sweetalert2';

const AddTeacherGuideForm = ({ title }) => {
  const countWords = (text) => text.trim().split(/\s+/).filter(Boolean).length;

  const [formData, setFormData] = useState({
    courseInfo: '',
    originalTeacherGuide: '',
    studytime: '', // NEW: minutes (string to allow empty input)
    time_spent: {
      introduction: 0,
      concept_explanation: 0,
      worked_examples: 0,
      practice_questions: 0,
      word_problems: 0,
      pacing: 0,
      clarity: 0,
      engagement: 0
    }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { refreshKey, isRemoved, isExpanded, handleRefresh, handleExpand, handleDelete } =
    useCardTitleActions();

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'studytime') {
      // Allow empty, else coerce to non-negative integer
      if (value === '') {
        setFormData((prev) => ({ ...prev, studytime: '' }));
      } else {
        const n = Number(value);
        if (Number.isFinite(n) && n >= 0) {
          setFormData((prev) => ({ ...prev, studytime: String(Math.floor(n)) }));
        }
      }
      return;
    }

    if (name.startsWith('ts_')) {
      const field = name.replace('ts_', '');
      setFormData((prev) => ({
        ...prev,
        time_spent: {
          ...prev.time_spent,
          [field]: Number(value) || 0
        }
      }));
      return;
    }

    if (name === 'originalTeacherGuide') {
      const words = value.trim().split(/\s+/).filter(Boolean);
      if (words.length > 50) return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const guideWordCount = countWords(formData.originalTeacherGuide);

    if (guideWordCount > 50) {
      Swal.fire({
        icon: 'warning',
        title: 'Summary is too long',
        text: 'Teacher guide summary must be 50 words or less.',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const token = getToken();

      const minutes =
        formData.studytime === '' ? undefined : Number(formData.studytime);

      const payload = {
        coureInfo: formData.courseInfo.trim(),                 // keep backend field name
        originalTeacherGuide: formData.originalTeacherGuide.trim(),
        ...(minutes !== undefined ? { studytime: minutes } : {}), // send only if provided
        timeAllocations: formData.time_spent
      };

      await axios.post(`${BASE_URL}/teacher-guides`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      await Swal.fire({
        icon: 'success',
        title: 'Teacher Guide added!',
        text: 'The teacher guide was created successfully.',
        timer: 1700,
        showConfirmButton: false,
      });

      setFormData({
        courseInfo: '',
        originalTeacherGuide: '',
        studytime: '',
        time_spent: {
          introduction: 0,
          concept_explanation: 0,
          worked_examples: 0,
          practice_questions: 0,
          word_problems: 0,
          pacing: 0,
          clarity: 0,
          engagement: 0
        }
      });
      handleRefresh();
    } catch (err) {
      console.error('Teacher guide submission failed:', err?.response?.data || err);
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text:
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          'Failed to add teacher guide.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isRemoved) return null;

  return (
    <div className="col-xxl-12">
      <div
        className={`card stretch stretch-full ${isExpanded ? 'card-expand' : ''} ${
          refreshKey ? 'card-loading' : ''
        }`}
      >
        <CardHeader
          title={title}
          refresh={handleRefresh}
          remove={handleDelete}
          expanded={handleExpand}
        />

        <form onSubmit={handleSubmit}>
          <div className="card-body">
            <div className="mb-3">
              <label className="form-label">Teacher Guide Title</label>
              <input
                type="text"
                className="form-control"
                name="courseInfo"
                value={formData.courseInfo}
                onChange={handleChange}
                placeholder="e.g., Addition"
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Teacher Guide</label>
              <textarea
                className="form-control"
                name="originalTeacherGuide"
                value={formData.originalTeacherGuide}
                onChange={handleChange}
                placeholder="Add a short summary of the teacher guide here. Maximum 50 words."
                rows={5}
                required
              />
              <div className="d-flex justify-content-end mt-1">
                <small className={countWords(formData.originalTeacherGuide) >= 45 ? 'text-warning' : 'text-muted'}>
                  {countWords(formData.originalTeacherGuide)}/50 words
                </small>
              </div>
            </div>

            {/* Detailed Time Allocations */}
            <hr className="my-4" />
            <h5 className="mb-3 text-primary">AI Suggester Metrics (Time Spent)</h5>
            <div className="row g-3">
              {[
                'introduction', 'concept_explanation', 'worked_examples',
                'practice_questions', 'word_problems', 'pacing',
                'clarity', 'engagement'
              ].map((field) => (
                <div className="col-md-3" key={field}>
                  <label className="form-label small text-capitalize">{field.replace('_', ' ')}</label>
                  <input
                    type="number"
                    className="form-control"
                    name={`ts_${field}`}
                    value={formData.time_spent[field]}
                    onChange={handleChange}
                    min="0"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="card-footer d-flex justify-content-end">
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Teacher Guide'}
            </button>
          </div>
        </form>

        <CardLoader refreshKey={refreshKey} />
      </div>
    </div>
  );
};

export default AddTeacherGuideForm;
