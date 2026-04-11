import React from 'react';
import PageHeader from '@/components/shared/pageHeader/PageHeader';
import AddkinestheticForm from '@/components/kinesthetic/AddkinestheticForm';

const AddKinesthetic = () => {
    return (
        <>
            <PageHeader >
            </PageHeader>
            <div className='main-content'>
                <div className='row'>
                    <AddkinestheticForm title={"Add Lecture"} />
                </div>
            </div>
        </>
    );
}

export default AddKinesthetic;
