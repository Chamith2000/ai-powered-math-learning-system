import React, { useEffect, useState } from 'react';
import axios from 'axios';
import BASE_URL from '../../config/apiConfig';
import { getToken } from '@/utils/token';
import CardHeader from '@/components/shared/CardHeader';
import { FiBookOpen, FiCheckCircle, FiClock, FiTrendingUp } from 'react-icons/fi';

const LearningActivitySummary = () => {
  const [summary, setSummary] = useState({
    guideMinutes: 0,
    paperAttempts: 0,
    averageScore: 0,
    aiSuggestions: 0,
  });

  useEffect(() => {
    const fetchSummary = async () => {
      const token = getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      try {
        const [guidesRes, paperLogsRes, feedbackRes] = await Promise.allSettled([
          axios.get(`${BASE_URL}/teacher-guides`, { headers }),
          axios.get(`${BASE_URL}/paper-logs`, { headers }),
          axios.get(`${BASE_URL}/teacher-guide-feedbacks`, { headers }),
        ]);

        const guides = guidesRes.status === 'fulfilled' && Array.isArray(guidesRes.value.data)
          ? guidesRes.value.data
          : [];
        const paperLogs = paperLogsRes.status === 'fulfilled' && Array.isArray(paperLogsRes.value.data)
          ? paperLogsRes.value.data
          : [];
        const feedbacks = feedbackRes.status === 'fulfilled' && Array.isArray(feedbackRes.value.data)
          ? feedbackRes.value.data
          : [];

        const guideMinutes = guides.reduce((sum, guide) => sum + (Number(guide.studytime) || 0), 0);
        const scoreRows = paperLogs.filter((log) => Number(log.totalMarks) > 0);
        const averageScore = scoreRows.length
          ? scoreRows.reduce((sum, log) => sum + ((Number(log.marks) || 0) / Number(log.totalMarks)) * 100, 0) / scoreRows.length
          : 0;
        const aiSuggestions = feedbacks.filter((fb) => String(fb.aiSuggestion || '').trim()).length;

        setSummary({
          guideMinutes,
          paperAttempts: paperLogs.length,
          averageScore,
          aiSuggestions,
        });
      } catch (error) {
        console.error('Failed to load learning activity summary', error);
      }
    };

    fetchSummary();
  }, []);

  const items = [
    {
      icon: <FiClock />,
      label: 'Planned Guide Time',
      value: `${Math.round(summary.guideMinutes)} min`,
      hint: 'Total study time across teacher guides',
      className: 'bg-soft-primary text-primary',
    },
    {
      icon: <FiCheckCircle />,
      label: 'Paper Attempts',
      value: summary.paperAttempts,
      hint: 'Submitted maths paper sessions',
      className: 'bg-soft-success text-success',
    },
    {
      icon: <FiTrendingUp />,
      label: 'Average Paper Score',
      value: `${Math.round(summary.averageScore)}%`,
      hint: 'Average score from saved paper logs',
      className: 'bg-soft-info text-info',
    },
    {
      icon: <FiBookOpen />,
      label: 'AI Suggestions Ready',
      value: summary.aiSuggestions,
      hint: 'Feedback rows with generated AI guidance',
      className: 'bg-soft-warning text-warning',
    },
  ];

  return (
    <div className="col-xxl-8 col-lg-12">
      <div className="card stretch stretch-full">
        <CardHeader title="Learning Activity Summary" />
        <div className="card-body">
          <div className="row g-3">
            {items.map((item) => (
              <div className="col-md-6" key={item.label}>
                <div className="d-flex align-items-center gap-3 p-3 border rounded-3 h-100">
                  <div className={`avatar-text avatar-lg rounded ${item.className}`}>
                    {React.cloneElement(item.icon, { size: 22 })}
                  </div>
                  <div>
                    <div className="fs-4 fw-bold text-dark">{item.value}</div>
                    <div className="fw-semibold text-dark">{item.label}</div>
                    <div className="fs-12 text-muted">{item.hint}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearningActivitySummary;
