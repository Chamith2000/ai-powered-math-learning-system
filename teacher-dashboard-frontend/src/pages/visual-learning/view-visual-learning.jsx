import React from 'react';
import PageHeader from '@/components/shared/pageHeader/PageHeader';
import Footer from '@/components/shared/Footer';
import ViewPythonPaperForm from '@/components/maths-papers/ViewPythonPaperForm';
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
            <Footer />
        </>
    );
}

export default ViewVisualLearning;