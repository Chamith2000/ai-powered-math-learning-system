import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import BASE_URL from '../../config/apiConfig';
import { getToken } from '@/utils/token';
import CardHeader from '@/components/shared/CardHeader';

const RecentFeedbackWidget = () => {
  const navigate = useNavigate();
  const [feedbacks, setFeedbacks] = useState([]);

  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        const token = getToken();
        const { data } = await axios.get(`${BASE_URL}/teacher-guide-feedbacks`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const list = Array.isArray(data) ? data : [];
        setFeedbacks(
          list
            .slice()
            .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
            .slice(0, 6)
        );
      } catch (error) {
        console.error('Failed to load recent feedback', error);
      }
    };

    fetchFeedbacks();
  }, []);

  const openFeedback = (fb) => {
    navigate(`/admin/teacher-guides/feedback/view/${fb._id}`, {
      state: { fb, suggestion: fb.aiSuggestion },
    });
  };

  return (
    <div className="col-xxl-12 mt-4">
      <div className="card stretch stretch-full">
        <CardHeader title="Recent Feedback & AI Status" />
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Content</th>
                  <th>Study Time</th>
                  <th>AI Status</th>
                  <th className="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {feedbacks.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-4 text-muted">
                      No recent feedback available.
                    </td>
                  </tr>
                ) : (
                  feedbacks.map((fb) => {
                    const studentName = fb?.studentId?.username || fb?.studentId?.email || 'Unknown';
                    const hasAi = Boolean(String(fb?.aiSuggestion || '').trim());
                    const studyTime = Number.isFinite(Number(fb?.studytime))
                      ? `${Math.round(Number(fb.studytime))} min`
                      : '-';

                    return (
                      <tr key={fb._id}>
                        <td>
                          <div className="fw-semibold text-dark">{studentName}</div>
                          <div className="fs-12 text-muted">{fb?.studentId?.email || ''}</div>
                        </td>
                        <td>{fb?.contentTitle || fb?.teacherGuideId?.coureInfo || '-'}</td>
                        <td>{studyTime}</td>
                        <td>
                          <span className={`badge ${hasAi ? 'bg-soft-success text-success' : 'bg-soft-secondary text-secondary'}`}>
                            {hasAi ? 'Generated' : 'Pending'}
                          </span>
                        </td>
                        <td className="text-end">
                          <button
                            type="button"
                            className="btn btn-sm btn-light"
                            onClick={() => openFeedback(fb)}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecentFeedbackWidget;
