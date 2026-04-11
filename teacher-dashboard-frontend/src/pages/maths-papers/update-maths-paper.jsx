import React from 'react';
import PageHeader from '@/components/shared/pageHeader/PageHeader';
import UpdateMathsPaperForm from '@/components/maths-papers/UpdateMathsPaperForm';

const UpdateMathsPapers = () => {
    return (
        <>
            <PageHeader >
            </PageHeader>
            <div className='main-content'>
                <div className='row'>
                    <UpdateMathsPaperForm title={"Update Maths Paper"} />
                </div>
            </div>
        </>
    );
}

export default UpdateMathsPapers;
