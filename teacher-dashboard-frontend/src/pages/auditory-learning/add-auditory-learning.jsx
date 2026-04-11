import React from 'react';
import PageHeader from '@/components/shared/pageHeader/PageHeader';
import AddAuditoryLearningForm from '@/components/auditory-learning/AddAuditoryLearningForm';

const AddAuditoryLearning = () => {
    return (
        <>
            <PageHeader >
            </PageHeader>
            <div className='main-content'>
                <div className='row'>
                    <AddAuditoryLearningForm title={"Add Auditory Lecture"} />
                </div>
            </div>
        </>
    );
}

export default AddAuditoryLearning;
