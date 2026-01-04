import React from 'react';
import PageHeader from '@/components/shared/pageHeader/PageHeader';
import Footer from '@/components/shared/Footer';
import UpdatePythonLectureForm from '@/components/maths-lectures/UpdatePythonLectureForm';

const UpdatePythonLectures = () => {
    return (
        <>
            <PageHeader >
            </PageHeader>
            <div className='main-content'>
                <div className='row'>
                    <UpdatePythonLectureForm title={"Update Python Lecture"} />
                </div>
            </div>
            <Footer />
        </>
    );
}

export default UpdatePythonLectures;