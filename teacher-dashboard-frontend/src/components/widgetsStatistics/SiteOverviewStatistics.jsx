import React, { useEffect, useState } from 'react';
import axios from 'axios';
import BASE_URL from '../../config/apiConfig';
import { getToken } from '@/utils/token';
import {
  FiUsers,
  FiMessageSquare,
  FiPlayCircle,
  FiFileText,
} from 'react-icons/fi';

const SiteOverviewStatistics = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    feedbackCount: 0,
    mathsLectures: 0,
    mathsPapers: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const token = getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const requests = [
        axios.get(`${BASE_URL}/users/`, { headers }),                          
        axios.get(`${BASE_URL}/teacher-guide-feedbacks/`, { headers }),        
        axios.get(`${BASE_URL}/maths/video-lectures/`, { headers }),          
        axios.get(`${BASE_URL}/maths/papers`, { headers }),                   
      ];

      try {
        const results = await Promise.allSettled(requests);

        const safeLen = (idx) =>
          results[idx].status === 'fulfilled' && Array.isArray(results[idx].value?.data)
            ? results[idx].value.data.length
            : 0;

        setStats({
          totalUsers: safeLen(0),
          feedbackCount: safeLen(1),
          mathsLectures: safeLen(2),
          mathsPapers: safeLen(3),
        });
      } catch {
        setStats({
          totalUsers: 0,
          feedbackCount: 0,
          mathsLectures: 0,
          mathsPapers: 0,
        });
      }
    };

    fetchStats();
  }, []);

  const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

  // Added a 'colorClass' to make the icons pop with different colors
  const data = [
    {
      id: 1,
      icon: <FiUsers />,
      title: 'Users',
      count: stats.totalUsers,
      label: plural(stats.totalUsers, 'User'),
      colorClass: 'bg-soft-primary text-primary',
    },
    {
      id: 2,
      icon: <FiMessageSquare />,
      title: 'Feedbacks',
      count: stats.feedbackCount,
      label: plural(stats.feedbackCount, 'Feedback'),
      colorClass: 'bg-soft-success text-success',
    },
    {
      id: 3,
      icon: <FiPlayCircle />,
      title: 'Maths Lectures',
      count: stats.mathsLectures,
      label: plural(stats.mathsLectures, 'Lecture'),
      colorClass: 'bg-soft-danger text-danger',
    },
    {
      id: 4,
      icon: <FiFileText />,
      title: 'Maths Papers',
      count: stats.mathsPapers,
      label: plural(stats.mathsPapers, 'Paper'),
      colorClass: 'bg-soft-info text-info',
    },
  ];

  return (
    <>
      {data.map(({ id, icon, title, count, label, colorClass }) => (
        <div key={id} className="col-xxl-3 col-md-6 mb-4">
          <div className="card stretch stretch-full short-info-card shadow-sm border-0">
            <div className="card-body">
              <div className="d-flex align-items-center gap-3 mb-2">
                {/* Dynamically applying the color block here */}
                <div className={`avatar-text avatar-lg ${colorClass} icon rounded`}>
                  {React.cloneElement(icon, { size: 24 })}
                </div>
                <div>
                  <div className="fs-2 fw-bold text-dark">{count}</div>
                  <div className="fs-14 fw-semibold text-truncate-1-line">{title}</div>
                </div>
              </div>
              <div className="text-end pt-2">
                <span className="fs-12 text-muted">{label}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

export default SiteOverviewStatistics;