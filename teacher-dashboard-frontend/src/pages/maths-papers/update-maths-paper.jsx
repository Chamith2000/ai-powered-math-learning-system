import React from 'react';
import PageHeader from '@/components/shared/pageHeader/PageHeader';
import Footer from '@/components/shared/Footer';
import UpdatePythonPaperForm from '@/components/maths-papers/UpdatePythonPaperForm';

const UpdatePythonPapers = () => {
    return (
        <>
            <PageHeader >
            </PageHeader>
            <div className='main-content'>
                <div className='row'>
                    <UpdatePythonPaperForm title={"Update Python Paper"} />
                </div>
            </div>
            <Footer />
        </>
    );
}

export default UpdatePythonPapers;