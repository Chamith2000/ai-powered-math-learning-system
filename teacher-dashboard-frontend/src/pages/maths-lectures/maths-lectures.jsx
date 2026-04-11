import React from 'react';
import PageHeader from '@/components/shared/pageHeader/PageHeader';
import PageHeaderWidgets from '@/components/shared/pageHeader/PageHeaderWidgets';
import MathsLectureTable from '@/components/maths-lectures/MathsLectureTable';

const MathsLecture = () => {
    return (
        <>
            <PageHeader>
                <PageHeaderWidgets addNewLink="/admin/maths-lectures/create" name="Add New Lecture" />
            </PageHeader>
            <div className='main-content'>
                <div className='row'>
                    <MathsLectureTable title="Maths Lecture List" />
                </div>
            </div>
        </>
    );
};

export default MathsLecture;

