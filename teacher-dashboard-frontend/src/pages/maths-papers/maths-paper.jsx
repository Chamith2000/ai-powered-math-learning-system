import React from 'react';
import PageHeader from '@/components/shared/pageHeader/PageHeader';
import PageHeaderWidgets from '@/components/shared/pageHeader/PageHeaderWidgets';
import MathsPaperTable from '@/components/maths-papers/MathsPaperTable';

const MathsPapers = () => {
    return (
        <>
            <PageHeader>
                <PageHeaderWidgets addNewLink="/admin/maths-papers/create" name="Add New Paper" />
            </PageHeader>
            <div className='main-content'>
                <div className='row'>
                    <MathsPaperTable title="Maths Paper List" />
                </div>
            </div>
        </>
    );
};

export default MathsPapers;

