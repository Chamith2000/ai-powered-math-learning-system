import React from 'react';
import PageHeader from '@/components/shared/pageHeader/PageHeader';
import UpdateVisualLearningForm from '@/components/visual-learning/UpdateVisualLearningForm';
import UpdateAuditoryLearningForm from '@/components/auditory-learning/UpdateAuditoryLearningForm';

const UpdateAuditoryLearning = () => {
    return (
        <>
            <PageHeader >
            </PageHeader>
            <div className='main-content'>
                <div className='row'>
                    <UpdateAuditoryLearningForm title={"Update Auditory Lecture"} />
                </div>
            </div>
        </>
    );
}

export default UpdateAuditoryLearning;
