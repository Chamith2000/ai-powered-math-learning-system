import React, { useState } from 'react';
import CardHeader from '@/components/shared/CardHeader';
import CardLoader from '@/components/shared/CardLoader';
import useCardTitleActions from '@/hooks/useCardTitleActions';
import axios from 'axios';
import BASE_URL from '../../config/apiConfig';
import { getToken } from '@/utils/token';
import Swal from 'sweetalert2';

const AddTeacherGuideForm = ({ title }) => {
  const [formData, setFormData] = useState({
    courseInfo: '',
    originalTeacherGuide: '',
    studytime: '' // NEW: minutes (string to allow empty input)
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

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const token = getToken();

      const minutes =
        formData.studytime === '' ? undefined : Number(formData.studytime);

      const payload = {
        coureInfo: formData.courseInfo.trim(),                 // keep backend field name
        originalTeacherGuide: formData.originalTeacherGuide.trim(),
        ...(minutes !== undefined ? { studytime: minutes } : {}) // send only if provided
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

      setFormData({ courseInfo: '', originalTeacherGuide: '', studytime: '' });
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
                placeholder="e.g., Python 101 - Week 3"
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
                placeholder="Objectives, activities, notes..."
                rows={5}
                required
              />
            </div>

            {/* NEW: Time (minutes) */}
            <div className="mb-3">
              <label className="form-label">Time (minutes)</label>
              <input
                type="number"
                className="form-control"
                name="studytime"
                value={formData.studytime}
                onChange={handleChange}
                placeholder="e.g., 60"
                min={0}
                step={1}
                inputMode="numeric"
              />
              <small className="text-muted">Optional. Enter total minutes (non-negative).</small>
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
