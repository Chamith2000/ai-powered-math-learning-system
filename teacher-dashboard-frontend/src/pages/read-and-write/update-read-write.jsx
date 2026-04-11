import React from 'react';
import PageHeader from '@/components/shared/pageHeader/PageHeader';
import UpdateReadAndWriteForm from '@/components/read-and-write/UpdateReadAndWriteForm';

const UpdateReadAndWrite = () => {
    return (
        <>
            <PageHeader >
            </PageHeader>
            <div className='main-content'>
                <div className='row'>
                    <UpdateReadAndWriteForm title={"Update Read And Write"} />
                </div>
            </div>
        </>
    );
}

export default UpdateReadAndWrite;
