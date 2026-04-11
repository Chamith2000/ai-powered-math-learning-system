import React from 'react';
import PageHeader from '@/components/shared/pageHeader/PageHeader';
import UpdateVisualLearningForm from '@/components/visual-learning/UpdateVisualLearningForm';

const UpdateVisualLearning = () => {
    return (
        <>
            <PageHeader >
            </PageHeader>
            <div className='main-content'>
                <div className='row'>
                    <UpdateVisualLearningForm title={"Update Visual Lecture"} />
                </div>
            </div>
        </>
    );
}

export default UpdateVisualLearning;
