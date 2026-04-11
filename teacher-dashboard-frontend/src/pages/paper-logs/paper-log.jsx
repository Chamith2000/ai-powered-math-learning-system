import React, { Fragment } from 'react'
import PageHeader from '../../components/shared/pageHeader/PageHeader'
import PaperLogTable from '../../components/paper-logs/PaperLogTable'

const PaperLogs = () => {
    return (
        <Fragment>
            <PageHeader />
            <div className='main-content'>
                <div className='row'>
                    <PaperLogTable />
                </div>
            </div>
        </Fragment>
    )
}

export default PaperLogs

