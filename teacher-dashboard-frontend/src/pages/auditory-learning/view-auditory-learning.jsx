import React from 'react';
import PageHeader from '@/components/shared/pageHeader/PageHeader';
import ViewAuditoryLearningForm from '@/components/auditory-learning/ViewAuditoryLearningForm';

const ViewAuditoryLearning = () => {
    return (
        <>
            <PageHeader >
            </PageHeader>
            <div className='main-content'>
                <div className='row'>
                    <ViewAuditoryLearningForm title={"Auditory Learning"} />
                </div>
            </div>
        </>
    );
}

export default ViewAuditoryLearning;
