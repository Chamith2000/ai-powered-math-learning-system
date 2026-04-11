import React from 'react';
import PageHeader from '@/components/shared/pageHeader/PageHeader';
import UpdateMathsLectureForm from '@/components/maths-lectures/UpdateMathsLectureForm';

const UpdateMathsLectures = () => {
    return (
        <>
            <PageHeader >
            </PageHeader>
            <div className='main-content'>
                <div className='row'>
                    <UpdateMathsLectureForm title={"Update Maths Lecture"} />
                </div>
            </div>
        </>
    );
}

export default UpdateMathsLectures;
