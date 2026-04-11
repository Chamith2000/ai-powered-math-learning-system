import React from 'react'
import SiteOverviewStatistics from '@/components/widgetsStatistics/SiteOverviewStatistics'
import PageHeader from '@/components/shared/pageHeader/PageHeader'
import TeacherGuideFeedbackDonut from '@/components/widgetsCharts/TeacherGuideFeedbackDonut'
import LearningActivitySummary from '@/components/widgetsStatistics/LearningActivitySummary'
import RecentFeedbackWidget from '@/components/widgetsTables/RecentFeedbackWidget'


const Home = () => {
    return (
        <>
            <PageHeader/>
            <div className='main-content'>
                <div className='row'>
                    <SiteOverviewStatistics />
                    <TeacherGuideFeedbackDonut />
                    <LearningActivitySummary />
                    <RecentFeedbackWidget />
                </div>
            </div>
        </>
    )
}

export default Home
