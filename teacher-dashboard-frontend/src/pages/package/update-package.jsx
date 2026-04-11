import React from 'react';
import PageHeader from '@/components/shared/pageHeader/PageHeader';
import UpdatePackageForm from '@/components/package/UpdatePackageForm';

const UpdatePackage = () => {
    return (
        <>
            <PageHeader >
            </PageHeader>
            <div className='main-content'>
                <div className='row'>
                    <UpdatePackageForm title={"Update Location"} />
                </div>
            </div>
        </>
    );
}

export default UpdatePackage;
