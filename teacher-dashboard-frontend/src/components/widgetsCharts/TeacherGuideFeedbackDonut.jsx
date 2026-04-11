import React, { useEffect, useState } from 'react';
import Chart from 'react-apexcharts';
import axios from 'axios';
import BASE_URL from '../../config/apiConfig';
import { getToken } from '@/utils/token';
import CardHeader from '@/components/shared/CardHeader';
import useCardTitleActions from '@/hooks/useCardTitleActions';
import CardLoader from '@/components/shared/CardLoader';

const TeacherGuideFeedbackDonut = () => {
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const { refreshKey, isRemoved, isExpanded, handleRefresh, handleExpand, handleDelete } = useCardTitleActions();

    useEffect(() => {
        fetchStats();
    }, [refreshKey]);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const token = getToken();
            const res = await axios.get(`${BASE_URL}/teacher-guide-feedbacks/analytics/distribution`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats(res.data);
        } catch (err) {
            console.error('Failed to fetch feedback stats', err);
        } finally {
            setLoading(false);
        }
    };

    const chartOptions = {
        chart: {
            type: 'donut',
        },
        labels: stats.map(s => s.title || 'Unknown Guide'),
        colors: ['#3454d1', '#ff4d4d', '#2ed573', '#ffa502', '#747d8c', '#a55eea', '#4b7bec'],
        legend: {
            position: 'bottom',
            fontFamily: 'Inter, sans-serif',
            fontSize: '13px'
        },
        dataLabels: {
            enabled: true,
            dropShadow: { enabled: false }
        },
        stroke: {
            show: true,
            width: 2,
            colors: ['#fff']
        },
        plotOptions: {
            pie: {
                donut: {
                    size: '70%',
                    labels: {
                        show: true,
                        total: {
                            show: true,
                            label: 'Total Feedbacks',
                            fontSize: '14px',
                            fontWeight: 600,
                            color: '#373d3f',
                            formatter: function (w) {
                                return w.globals.seriesTotals.reduce((a, b) => a + b, 0)
                            }
                        }
                    }
                }
            }
        },
        tooltip: {
            theme: 'dark'
        }
    };

    const chartSeries = stats.map(s => s.count);

    if (isRemoved) return null;

    return (
        <div className={`col-lg-12 col-xxl-4`}>
            <div className={`card stretch stretch-full ${isExpanded ? 'card-expand' : ''} ${refreshKey ? 'card-loading' : ''}`}>
                <CardHeader 
                    title="Feedback Distribution" 
                    refresh={handleRefresh} 
                    remove={handleDelete} 
                    expanded={handleExpand} 
                />
                <div className="card-body">
                    {loading ? (
                        <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    ) : stats.length === 0 ? (
                        <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
                            <p className="text-muted">No feedback data available</p>
                        </div>
                    ) : (
                        <Chart options={chartOptions} series={chartSeries} type="donut" height={350} />
                    )}
                </div>
                <CardLoader refreshKey={refreshKey} />
            </div>
        </div>
    );
};

export default TeacherGuideFeedbackDonut;
