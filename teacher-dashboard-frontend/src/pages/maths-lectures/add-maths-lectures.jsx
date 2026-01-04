import React from 'react';
import PageHeader from '@/components/shared/pageHeader/PageHeader';
import Footer from '@/components/shared/Footer';
import AddPythonLectureForm from '@/components/maths-lectures/AddPythonLectureForm';

const AddPythonLectures = () => {
    return (
        <>
            <PageHeader >
            </PageHeader>
            <div className='main-content'>
                <div className='row'>
                    <AddPythonLectureForm title={"Add Maths Lectures"} />
                </div>
            </div>
            <Footer />
        </>
    );
}

export default AddPythonLectures;