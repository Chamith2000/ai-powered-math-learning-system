import React from 'react';
import PageHeader from '@/components/shared/pageHeader/PageHeader';
import AddReadAndWriteForm from '@/components/read-and-write/AddReadAndWriteForm';

const AddReadAndWrite = () => {
    return (
        <>
            <PageHeader >
            </PageHeader>
            <div className='main-content'>
                <div className='row'>
                    <AddReadAndWriteForm title={"Add Lecture"} />
                </div>
            </div>
        </>
    );
}

export default AddReadAndWrite;
