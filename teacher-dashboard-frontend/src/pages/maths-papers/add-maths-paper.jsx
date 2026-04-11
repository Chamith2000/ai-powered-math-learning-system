import React from 'react';
import PageHeader from '@/components/shared/pageHeader/PageHeader';
import AddMathsPaperForm from '@/components/maths-papers/AddMathsPaperForm';

const AddMathsPapers = () => {
    return (
        <>
            <PageHeader >
            </PageHeader>
            <div className='main-content'>
                <div className='row'>
                    <AddMathsPaperForm title={"Add Maths Papers"} />
                </div>
            </div>
        </>
    );
}

export default AddMathsPapers;
