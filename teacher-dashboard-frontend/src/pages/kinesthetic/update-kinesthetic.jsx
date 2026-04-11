import React from 'react';
import PageHeader from '@/components/shared/pageHeader/PageHeader';
import UpdatekinestheticForm from '@/components/kinesthetic/UpdatekinestheticForm';

const UpdateKinesthetic = () => {
    return (
        <>
            <PageHeader >
            </PageHeader>
            <div className='main-content'>
                <div className='row'>
                    <UpdatekinestheticForm title={"Update kinesthetic Lecture"} />
                </div>
            </div>
        </>
    );
}

export default UpdateKinesthetic;
