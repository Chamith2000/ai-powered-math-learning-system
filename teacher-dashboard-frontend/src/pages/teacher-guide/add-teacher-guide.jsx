import React from 'react';
import PageHeader from '@/components/shared/pageHeader/PageHeader';
import AddTeacherGuideForm from '@/components/teacher-guide/AddTeacherGuideForm';

const AddTeacherGuide = () => {
    return (
        <>
            <PageHeader >
            </PageHeader>
            <div className='main-content'>
                <div className='row'>
                    <AddTeacherGuideForm title={"Add Teacher Guide"} />
                </div>
            </div>
        </>
    );
}

export default AddTeacherGuide;
