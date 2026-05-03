import React from 'react';
import PageHeader from '@/components/shared/pageHeader/PageHeader';
import ViewStartingPaperForm from '@/components/starting-papers/ViewStartingPaperForm';

const ViewStartingPapers = () => {
    return (
        <>
            <PageHeader >
            </PageHeader>
            <div className='main-content'>
                <div className='row'>
                    <ViewStartingPaperForm title={"Starting Paper"} />
                </div>
            </div>
        </>
    );
}

export default ViewStartingPapers;
