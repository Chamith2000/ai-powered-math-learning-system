import React, { Fragment } from 'react'
import PageHeader from '../../components/shared/pageHeader/PageHeader'
import ViewPaperLogForm from '../../components/paper-logs/ViewPaperLogForm'

const ViewPaperLog = () => {
    return (
        <Fragment>
            <PageHeader />
            <div className='main-content'>
                <div className='row'>
                    <ViewPaperLogForm />
                </div>
            </div>
        </Fragment>
    )
}

export default ViewPaperLog

