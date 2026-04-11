import React from 'react';
import PageHeader from '@/components/shared/pageHeader/PageHeader';
import CardHeader from '@/components/shared/CardHeader';

const TermsPage = () => {
  const terms = [
    'Use the admin panel only for authorized MathsBuddy learning management tasks.',
    'Keep student information, feedback, performance records, and learning data confidential.',
    'Upload only accurate and appropriate maths learning materials for the intended grades.',
    'Review AI-generated suggestions before using them as teaching guidance.',
    'Do not share your admin account or login credentials with another person.',
  ];

  return (
    <>
      <PageHeader />
      <div className="main-content">
        <div className="row">
          <div className="col-12">
            <div className="card stretch stretch-full">
              <CardHeader title="Terms of Use" />
              <div className="card-body">
                <p className="text-muted">
                  These terms describe expected use of the MathsBuddy admin panel.
                </p>
                <div className="border rounded-3 p-4 bg-white">
                  {terms.map((term, index) => (
                    <div className="d-flex gap-3 mb-3" key={term}>
                      <span className="badge bg-light text-dark border rounded-pill">{index + 1}</span>
                      <p className="mb-0 text-dark">{term}</p>
                    </div>
                  ))}
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

export default TermsPage;
