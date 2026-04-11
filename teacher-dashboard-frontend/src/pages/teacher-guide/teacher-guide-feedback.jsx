import React from 'react';
import PageHeader from '@/components/shared/pageHeader/PageHeader';
import PageHeaderWidgets from '@/components/shared/pageHeader/PageHeaderWidgets';
import TeacherGuideFeedbackTable from '@/components/teacher-guide/TeacherGuideFeedbackTable';

const TeacherGuideFeedback = () => {
    return (
        <>
            <PageHeader>
                {/* <PageHeaderWidgets addNewLink="/admin/teacher-guide/create" name="Add New Guide" /> */}
            </PageHeader>
            <div className='main-content'>
                <div className='row'>
                    <TeacherGuideFeedbackTable title="Teacher Guide Suggest" />
                </div>
            </div>
        </>
    );
};

export default TeacherGuideFeedback;

