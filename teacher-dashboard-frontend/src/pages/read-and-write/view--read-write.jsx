import React from 'react';
import PageHeader from '@/components/shared/pageHeader/PageHeader';
import ViewReadAndWriteForm from '@/components/read-and-write/ViewReadAndWriteForm';

const ViewReadAndWrite = () => {
    return (
        <>
            <PageHeader >
            </PageHeader>
            <div className='main-content'>
                <div className='row'>
                    <ViewReadAndWriteForm title={"Visual Learning"} />
                </div>
            </div>
        </>
    );
}

export default ViewReadAndWrite;
