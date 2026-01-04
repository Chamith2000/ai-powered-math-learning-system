import React from 'react';
import PageHeader from '@/components/shared/pageHeader/PageHeader';
import PageHeaderWidgets from '@/components/shared/pageHeader/PageHeaderWidgets';
import Footer from '@/components/shared/Footer';
import PythonLectureTable from '@/components/maths-lectures/PythonLectureTable';

const PythonLecture = () => {
    return (
        <>
            <PageHeader>
                <PageHeaderWidgets addNewLink="/admin/maths-lectures/create" name="Add New Lecture" />
            </PageHeader>
            <div className='main-content'>
                <div className='row'>
                    <PythonLectureTable title="Maths Lecture List" />
                </div>
            </div>
            <Footer />
        </>
    );
};

export default PythonLecture;
