import React from 'react';
import PageHeader from '@/components/shared/pageHeader/PageHeader';
import PageHeaderWidgets from '@/components/shared/pageHeader/PageHeaderWidgets';
import Footer from '@/components/shared/Footer';
import PythonPaperTable from '@/components/maths-papers/PythonPaperTable';

const PythonPapers = () => {
    return (
        <>
            <PageHeader>
                <PageHeaderWidgets addNewLink="/admin/python-papers/create" name="Add New Paper" />
            </PageHeader>
            <div className='main-content'>
                <div className='row'>
                    <PythonPaperTable title="Maths Paper List" />
                </div>
            </div>
            <Footer />
        </>
    );
};

export default PythonPapers;
