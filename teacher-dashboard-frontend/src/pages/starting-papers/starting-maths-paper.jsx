import React from 'react';
import PageHeader from '@/components/shared/pageHeader/PageHeader';
import UpdateStartingPaperForm from '@/components/starting-papers/UpdateStartingPaperForm';

const UpdateStartingPapers = () => {
    return (
        <>
            <PageHeader >
            </PageHeader>
            <div className='main-content'>
                <div className='row'>
                    <UpdateStartingPaperForm title={"Update Starting Paper"} />
                </div>
            </div>
        </>
    );
}

export default UpdateStartingPapers;
