import React from 'react';
import PageHeader from '@/components/shared/pageHeader/PageHeader';
import AddMathsLectureForm from '@/components/maths-lectures/AddMathsLectureForm';

const AddMathsLectures = () => {
    return (
        <>
            <PageHeader >
            </PageHeader>
            <div className='main-content'>
                <div className='row'>
                    <AddMathsLectureForm title={"Add Maths Lectures"} />
                </div>
            </div>
        </>
    );
}

export default AddMathsLectures;
