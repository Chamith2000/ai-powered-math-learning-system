import React from 'react';
import PageHeader from '@/components/shared/pageHeader/PageHeader';
import ViewMathsPaperForm from '@/components/maths-papers/ViewMathsPaperForm';

const ViewMathsPapers = () => {
    return (
        <>
            <PageHeader >
            </PageHeader>
            <div className='main-content'>
                <div className='row'>
                    <ViewMathsPaperForm title={"Maths Paper"} />
                </div>
            </div>
        </>
    );
}

export default ViewMathsPapers;
