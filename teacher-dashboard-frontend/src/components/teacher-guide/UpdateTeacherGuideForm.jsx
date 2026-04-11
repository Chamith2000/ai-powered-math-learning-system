import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CardHeader from '@/components/shared/CardHeader';
import CardLoader from '@/components/shared/CardLoader';
import useCardTitleActions from '@/hooks/useCardTitleActions';
import axios from 'axios';
import BASE_URL from '../../config/apiConfig';
import { getToken } from '@/utils/token';
import Swal from 'sweetalert2';

const UpdateTeacherGuideForm = ({ title }) => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    courseInfo: '',
    originalTeacherGuide: '',
    studytime: '', // NEW: minutes (string to allow empty)
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

  useEffect(() => {
    fetchGuide();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchGuide = async () => {
    try {
      const token = getToken();
      const res = await axios.get(`${BASE_URL}/teacher-guides/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // API returns: { coureInfo, originalTeacherGuide, studytime? }
      setFormData({
        courseInfo: res.data?.coureInfo || '',
        originalTeacherGuide: res.data?.originalTeacherGuide || '',
        studytime:
          res.data?.studytime === 0 || res.data?.studytime
            ? String(Math.floor(Number(res.data.studytime)))
            : '', // keep empty if undefined / null
        time_spent: {
          introduction: res.data?.timeAllocations?.introduction || 0,
          concept_explanation: res.data?.timeAllocations?.concept_explanation || 0,
          worked_examples: res.data?.timeAllocations?.worked_examples || 0,
          practice_questions: res.data?.timeAllocations?.practice_questions || 0,
          word_problems: res.data?.timeAllocations?.word_problems || 0,
          pacing: res.data?.timeAllocations?.pacing || 0,
          clarity: res.data?.timeAllocations?.clarity || 0,
          engagement: res.data?.timeAllocations?.engagement || 0
        }
      });
    } catch (err) {
      console.error('Error fetching teacher guide', err);
      Swal.fire('Error', 'Could not fetch teacher guide data', 'error');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'studytime') {
      // Allow empty string; otherwise coerce to non-negative integer
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
        // map UI -> API keys (keep API’s "coureInfo" spelling)
        coureInfo: formData.courseInfo.trim(),
        originalTeacherGuide: formData.originalTeacherGuide.trim(),
        ...(minutes !== undefined ? { studytime: minutes } : {}), // send only if user set it
        timeAllocations: formData.time_spent
      };

      await axios.put(`${BASE_URL}/teacher-guides/${id}`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      await Swal.fire({
        icon: 'success',
        title: 'Updated!',
        text: 'Teacher guide updated successfully!',
        timer: 1500,
        showConfirmButton: false,
      });

      navigate('/admin/teacher-guide');
    } catch (err) {
      console.error('Update failed', err?.response?.data || err);
      Swal.fire(
        'Error',
        err?.response?.data?.message || err?.response?.data?.error || 'Failed to update teacher guide',
        'error'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isRemoved) return null;

  return (
    <div className="col-xxl-12">
      <div className={`card stretch stretch-full ${isExpanded ? 'card-expand' : ''} ${refreshKey ? 'card-loading' : ''}`}>
        <CardHeader title={title} refresh={handleRefresh} remove={handleDelete} expanded={handleExpand} />

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
                placeholder="e.g., Maths 101 - Week 3"
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
                rows={6}
                required
              />
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
              {isSubmitting ? 'Saving...' : 'Update Teacher Guide'}
            </button>
          </div>
        </form>

        <CardLoader refreshKey={refreshKey} />
      </div>
    </div>
  );
};

export default UpdateTeacherGuideForm;
