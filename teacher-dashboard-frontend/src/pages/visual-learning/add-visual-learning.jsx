import React from 'react';
import PageHeader from '@/components/shared/pageHeader/PageHeader';
import AddVisualLearningForm from '@/components/visual-learning/AddVisualLearningForm';

const AddVisualLearning = () => {
    return (
        <>
            <PageHeader >
            </PageHeader>
            <div className='main-content'>
                <div className='row'>
                    <AddVisualLearningForm title={"Add Lecture"} />
                </div>
            </div>
        </>
    );
}

export default AddVisualLearning;
