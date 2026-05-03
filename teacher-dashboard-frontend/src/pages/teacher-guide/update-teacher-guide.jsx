import React from 'react';
import PageHeader from '@/components/shared/pageHeader/PageHeader';
import UpdateTeacherGuideForm from '@/components/teacher-guide/UpdateTeacherGuideForm';

const UpdateTeacherGuide = () => {
    return (
        <>
            <PageHeader >
            </PageHeader>
            <div className='main-content'>
                <div className='row'>
                    <UpdateTeacherGuideForm title={"Update Teacher Guide"} />
                </div>
            </div>
        </>
    );
}

export default UpdateTeacherGuide;
