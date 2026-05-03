import React from 'react';
import PageHeader from '@/components/shared/pageHeader/PageHeader';
import CardHeader from '@/components/shared/CardHeader';

const HelpPage = () => {
  const helpItems = [
    {
      title: 'Managing Maths Content',
      text: 'Use Teacher Guides, Maths Video Lectures, Maths Papers, and Starting Papers from the sidebar to create or update learning content.',
    },
    {
      title: 'AI Suggestions',
      text: 'Open feedback pages to generate or review AI recommendations for teacher guides and video lectures.',
    },
    {
      title: 'Student Records',
      text: 'Use User Details and Activity Logs to review students, paper submissions, and saved learning activity.',
    },
    {
      title: 'Profile',
      text: 'Use Profile Details from the top-right menu to update your admin profile information and image.',
    },
  ];

  return (
    <>
      <PageHeader />
      <div className="main-content">
        <div className="row">
          <div className="col-12">
            <div className="card stretch stretch-full">
              <CardHeader title="Help Center" />
              <div className="card-body">
                <p className="text-muted mb-4">
                  Quick guidance for using the MathsBuddy admin panel.
                </p>
                <div className="row g-3">
                  {helpItems.map((item) => (
                    <div className="col-md-6" key={item.title}>
                      <div className="border rounded-3 p-3 h-100">
                        <h6 className="fw-bold mb-2">{item.title}</h6>
                        <p className="text-muted mb-0">{item.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="alert alert-light border mt-4 mb-0">
                  For technical issues, contact the system administrator with the page name and a short description of the issue.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default HelpPage;
