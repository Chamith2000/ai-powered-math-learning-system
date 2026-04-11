import React from 'react';
import PageHeader from '@/components/shared/pageHeader/PageHeader';
import PageHeaderWidgets from '@/components/shared/pageHeader/PageHeaderWidgets';
import VisualLearningTable from '@/components/visual-learning/VisualLearningTable';

const VisualLearning = () => {
    return (
        <>
            <PageHeader>
                <PageHeaderWidgets addNewLink="/admin/visual-learning/create" name="Add New Lecture" />
            </PageHeader>
            <div className='main-content'>
                <div className='row'>
                    <VisualLearningTable title="Visual Learning List" />
                </div>
            </div>
        </>
    );
};

export default VisualLearning;

