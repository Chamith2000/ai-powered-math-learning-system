import React from 'react';
import PageHeader from '@/components/shared/pageHeader/PageHeader';
import AddStartingPaperForm from '@/components/starting-papers/AddStartingPaperForm';

const AddStartingPapers = () => {
    return (
        <>
            <PageHeader >
            </PageHeader>
            <div className='main-content'>
                <div className='row'>
                    <AddStartingPaperForm title={"Add Starting Papers"} />
                </div>
            </div>
        </>
    );
}

export default AddStartingPapers;
