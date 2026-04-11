import React from 'react';
import PageHeader from '@/components/shared/pageHeader/PageHeader';
import CardHeader from '@/components/shared/CardHeader';

const PrivacyPage = () => {
  const privacyItems = [
    {
      title: 'Student Data',
      text: 'Student profiles, grades, activity logs, feedback, and paper results should be used only for learning support and administration.',
    },
    {
      title: 'Admin Access',
      text: 'Only authorized admins should access private student and learning records from this panel.',
    },
    {
      title: 'Uploaded Content',
      text: 'Teacher guides, lectures, papers, PDFs, and images are stored to support MathsBuddy lessons and assessments.',
    },
    {
      title: 'AI Recommendations',
      text: 'AI suggestions may use submitted learning feedback to create helpful teaching recommendations, but admins should review them before use.',
    },
  ];

  return (
    <>
      <PageHeader />
      <div className="main-content">
        <div className="row">
          <div className="col-12">
            <div className="card stretch stretch-full">
              <CardHeader title="Privacy Policy" />
              <div className="card-body">
                <p className="text-muted mb-4">
                  This page explains how MathsBuddy admin data should be handled inside the system.
                </p>
                <div className="row g-3">
                  {privacyItems.map((item) => (
                    <div className="col-md-6" key={item.title}>
                      <div className="border rounded-3 p-3 h-100 bg-white">
                        <h6 className="fw-bold mb-2">{item.title}</h6>
                        <p className="text-muted mb-0">{item.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="alert alert-light border mt-4 mb-0">
                  If private information looks incorrect or exposed to the wrong user, report it to the system administrator immediately.
                </div>
                <p className="small text-muted mt-4 mb-0">
                  Last updated: April 22, 2026
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PrivacyPage;
