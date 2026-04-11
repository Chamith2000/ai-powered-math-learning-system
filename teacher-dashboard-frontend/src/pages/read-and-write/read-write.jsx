import React from 'react';
import PageHeader from '@/components/shared/pageHeader/PageHeader';
import PageHeaderWidgets from '@/components/shared/pageHeader/PageHeaderWidgets';
import ReadAndWriteTable from '@/components/read-and-write/ReadAndWriteTable';

const ReadAndWrite = () => {
    return (
        <>
            <PageHeader>
                <PageHeaderWidgets addNewLink="/admin/read-and-write/create" name="Add New Lecture" />
            </PageHeader>
            <div className='main-content'>
                <div className='row'>
                    <ReadAndWriteTable title="Read And Write List" />
                </div>
            </div>
        </>
    );
};

export default ReadAndWrite;

