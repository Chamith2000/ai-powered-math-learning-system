import React from 'react';
import PageHeader from '@/components/shared/pageHeader/PageHeader';
import ViewMathsPaperForm from '@/components/maths-papers/ViewMathsPaperForm';
import ViewVisualLearningForm from '@/components/visual-learning/ViewVisualLearningForm';

const ViewVisualLearning = () => {
    return (
        <>
            <PageHeader >
            </PageHeader>
            <div className='main-content'>
                <div className='row'>
                    <ViewVisualLearningForm title={"Visual Learning"} />
                </div>
            </div>
        </>
    );
}

export default ViewVisualLearning;
