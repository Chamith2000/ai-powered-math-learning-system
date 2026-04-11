import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CardHeader from '@/components/shared/CardHeader';
import PageHeader from '@/components/shared/pageHeader/PageHeader';
import axios from 'axios';
import BASE_URL from '../../config/apiConfig';
import { getToken } from '@/utils/token';
import { BsArrowLeft } from 'react-icons/bs';
import Swal from 'sweetalert2';
import ReactApexChart from 'react-apexcharts';

const renderBoldText = (text) => {
    if (!text) return null;

    return String(text).split(/(\*\*.*?\*\*)/g).map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={index}>{part.slice(2, -2)}</strong>;
        }
        return part;
    });
};

const extractLabelValue = (lines, label) => {
    const line = lines.find((item) => item.toLowerCase().startsWith(`${label.toLowerCase()}:`));
    return line ? line.slice(line.indexOf(':') + 1).trim() : '';
};

const parseAiSuggestion = (text) => {
    const lines = String(text || '')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);

    const dividerIndex = lines.findIndex((line) => line.includes('----------------------------'));
    const beforeVideo = dividerIndex >= 0 ? lines.slice(0, dividerIndex) : lines;
    const afterVideo = dividerIndex >= 0 ? lines.slice(dividerIndex + 1) : [];

    const weakLine = beforeVideo.find((line) => line.toLowerCase().startsWith('weak sections:'));
    const weakSections = weakLine
        ? weakLine.slice(weakLine.indexOf(':') + 1).split(',').map((item) => item.trim()).filter(Boolean)
        : [];

    const mainPoints = beforeVideo
        .filter((line) => !line.toLowerCase().startsWith('weak sections:'))
        .map((line) => line.replace(/^[-*]\s*/, '').trim())
        .filter(Boolean);

    const technicalLines = afterVideo.filter((line) => !line.includes('[Video Lecture Quality Review]'));
    const technical = {
        issue: extractLabelValue(technicalLines, 'Issue'),
        severity: extractLabelValue(technicalLines, 'Severity'),
        confidence: extractLabelValue(technicalLines, 'Confidence'),
        recommendation: extractLabelValue(technicalLines, 'Recommendation')
    };

    return { mainPoints, weakSections, technical };
};

const isSuggestionUnavailable = (suggestion) => {
    const value = String(suggestion || '').trim().toLowerCase();
    return !value || value.includes('suggestion unavailable') || value.includes('no suggestion available');
};

const buildAiSuggestionText = (teacherData, technicalData) => {
    const reason = teacherData?.output?.reason || '(no suggestion available)';
    const weakSections = Array.isArray(teacherData?.output?.weak_sections) ? teacherData.output.weak_sections : [];

    let recommendation = reason;
    if (weakSections.length > 0) {
        recommendation += `\n\nWeak sections: ${weakSections.join(', ')}`;
    }

    const { confidence, issue, recommendation: techRec, severity } = technicalData?.output || {};
    recommendation += `\n\n----------------------------\n[Video Lecture Quality Review]\nIssue: ${issue || 'General'}\nSeverity: ${severity || 'N/A'}\nConfidence: ${Math.round((confidence || 0) * 100)}%\nRecommendation: ${techRec || 'No technical issues detected.'}`;

    return recommendation;
};

const severityBadgeClass = (severity = '') => {
    const value = severity.toLowerCase();
    if (value.includes('high')) return 'bg-soft-danger text-danger border border-danger border-opacity-25';
    if (value.includes('medium')) return 'bg-soft-warning text-warning border border-warning border-opacity-25';
    if (value.includes('low')) return 'bg-soft-success text-success border border-success border-opacity-25';
    return 'bg-soft-dark text-dark border border-secondary border-opacity-25';
};

const AiSuggestionPreview = ({ suggestion, onClick, onGenerate, generating }) => {
    if (isSuggestionUnavailable(suggestion)) {
        return (
            <div className="rounded-3 border border-warning border-opacity-25 bg-soft-warning p-3">
                <div className="fw-bold text-warning mb-1">AI suggestion unavailable</div>
                <div className="small text-muted mb-3">
                    Generate a fresh review for this feedback.
                </div>
                <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={onGenerate}
                    disabled={generating}
                >
                    {generating ? (
                        <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Generating...
                        </>
                    ) : 'Generate AI Suggestion'}
                </button>
            </div>
        );
    }

    const { mainPoints, weakSections, technical } = parseAiSuggestion(suggestion);
    const recommendation = technical.recommendation || mainPoints[0] || suggestion;
    const secondaryPoints = mainPoints.slice(technical.recommendation ? 0 : 1, 3);

    return (
        <button
            type="button"
            className="w-100 text-start border-0 bg-transparent p-0"
            onClick={onClick}
            title="View full AI review"
        >
            <div className="rounded-3 border border-primary border-opacity-25 bg-soft-primary p-3">
                <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                    <span className="badge bg-soft-primary text-primary border border-primary border-opacity-25">
                        AI Insight
                    </span>
                    {technical.severity && (
                        <span className={`badge ${severityBadgeClass(technical.severity)}`}>
                            Severity: {technical.severity}
                        </span>
                    )}
                    {technical.confidence && (
                        <span className="badge bg-soft-info text-info border border-info border-opacity-25">
                            Confidence: {technical.confidence}
                        </span>
                    )}
                </div>

                {technical.issue && (
                    <div className="small mb-2">
                        <span className="fw-bold text-primary">Issue: </span>
                        <span className="text-dark">{technical.issue}</span>
                    </div>
                )}

                <div className="bg-white rounded-3 border border-primary border-opacity-10 p-2 mb-2">
                    <div className="text-primary fw-bold small text-uppercase mb-1">Recommended action</div>
                    <div className="text-dark small lh-base">
                        {renderBoldText(recommendation)}
                    </div>
                </div>

                {weakSections.length > 0 && (
                    <div className="d-flex flex-wrap gap-1 mb-2">
                        {weakSections.slice(0, 4).map((section) => (
                            <span key={section} className="badge bg-soft-warning text-warning border border-warning border-opacity-25">
                                {section}
                            </span>
                        ))}
                    </div>
                )}

                {secondaryPoints.length > 0 && (
                    <ul className="mb-0 ps-3 small text-muted">
                        {secondaryPoints.map((point, index) => (
                            <li key={`${point}-${index}`}>{renderBoldText(point)}</li>
                        ))}
                    </ul>
                )}
            </div>
        </button>
    );
};

const ViewLectureFeedback = () => {
    const { lectureId } = useParams();
    const navigate = useNavigate();
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generatingSuggestions, setGeneratingSuggestions] = useState({});

    useEffect(() => {
        const fetchFeedbacks = async () => {
            try {
                const token = getToken();
                const res = await axios.get(`${BASE_URL}/teacher-guide-feedbacks/lectureId/${lectureId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                const data = Array.isArray(res.data) ? res.data : [];
                setFeedbacks(data);
            } catch (err) {
                console.error("Failed to load feedbacks", err);
                Swal.fire('Error', 'Failed to load feedbacks for this lecture.', 'error');
            } finally {
                setLoading(false);
            }
        };

        if (lectureId) fetchFeedbacks();
    }, [lectureId]);

    // --- Chart ekata Data Hadana Logic eka ---
    const chartData = useMemo(() => {
        if (feedbacks.length === 0) return { series: [], labels: [] };

        const counts = {};
        feedbacks.forEach(fb => {
            let category = fb?.studentFeedback?.trim() || 'No specific feedback';
            if (category.length > 35) {
                category = category.substring(0, 35) + '...';
            }
            counts[category] = (counts[category] || 0) + 1;
        });

        return {
            labels: Object.keys(counts),
            series: Object.values(counts)
        };
    }, [feedbacks]);

    const chartOptions = {
        chart: { type: 'donut', fontFamily: 'inherit' },
        labels: chartData.labels,
        colors: ['#3498db', '#2ecc71', '#e74c3c', '#f1c40f', '#9b59b6', '#34495e'],
        dataLabels: {
            enabled: true,
            formatter: function (val) {
                return val.toFixed(1) + "%";
            }
        },
        plotOptions: {
            pie: {
                donut: {
                    size: '65%',
                    labels: {
                        show: true,
                        name: { show: true },
                        value: {
                            show: true,
                            formatter: (val) => `${val} Students`
                        },
                        total: {
                            show: true,
                            showAlways: true,
                            label: 'Total Feedbacks',
                            formatter: function (w) {
                                return w.globals.seriesTotals.reduce((a, b) => a + b, 0);
                            }
                        }
                    }
                }
            }
        },
        legend: { position: 'bottom' },
        tooltip: {
            y: { formatter: (val) => `${val} Students` }
        }
    };

    // Pop-up eka wenuwata, view-teacher-guide-feedback.jsx page ekata navigate wena function eka
    const handleNavigateToDetailedView = (fb) => {
        navigate(`/admin/teacher-guides/feedback/view/${fb._id}`, {
            state: { fb: fb, suggestion: fb?.aiSuggestion }
        });
    };

    const generateSuggestionFor = async (fb) => {
        setGeneratingSuggestions((prev) => ({ ...prev, [fb._id]: true }));

        const guide = typeof fb?.teacherGuideId === 'object' ? fb.teacherGuideId : {};
        const lecture = typeof fb?.lectureId === 'object' ? fb.lectureId : {};
        const studentGrade = fb?.studentId?.grade ?? lecture?.grade ?? 4;
        const langConstraint = "*** MANDATORY: RESPOND IN ENGLISH ONLY. NO CHINESE CHARACTERS ALLOWED. ***";

        const teacherPayload = {
            teacher_data: {
                instruction: "RESPOND IN ENGLISH ONLY",
                task: "task_b",
                teacher_guide: `${langConstraint}\n\n${guide?.coureInfo || ''}. ${guide?.originalTeacherGuide || ''}\n\n${langConstraint}`.trim(),
                student_feedback: `${langConstraint}\n\n${fb?.studentFeedback?.trim() || 'No student feedback provided.'}\n\n${langConstraint}`,
                time_spent: {
                    introduction: guide?.timeAllocations?.introduction || 0,
                    concept_explanation: guide?.timeAllocations?.concept_explanation || 0,
                    worked_examples: guide?.timeAllocations?.worked_examples || 0,
                    practice_questions: guide?.timeAllocations?.practice_questions || 0,
                    word_problems: guide?.timeAllocations?.word_problems || 0,
                    pacing: guide?.timeAllocations?.pacing || 0,
                    clarity: guide?.timeAllocations?.clarity || 0,
                    engagement: guide?.timeAllocations?.engagement || 0
                },
                grade: Number(studentGrade) || 4,
                language_instruction: "English"
            },
            model_type: "teacher"
        };

        const feedbackPayload = {
            model_type: "feedback",
            feedback_data: {
                instruction: "RESPOND IN ENGLISH ONLY",
                text: `${langConstraint}\n\n${fb?.studentFeedback?.trim() || 'No feedback provided.'}\n\n${langConstraint}`,
                grade: Number(studentGrade) || 4,
                lesson: lecture?.lectureTytle || fb?.contentTitle || 'Untitled Lesson',
                video_content: lecture?.description || 'No description available.',
                language: "English"
            }
        };

        try {
            const [teacherRes, feedbackRes] = await Promise.all([
                axios.post(`https://Chamith2000-mcq-generator-new.hf.space/generate`, teacherPayload, {
                    headers: { 'Content-Type': 'application/json' }
                }),
                axios.post(`https://Chamith2000-mcq-generator-new.hf.space/generate`, feedbackPayload, {
                    headers: { 'Content-Type': 'application/json' }
                })
            ]);

            const suggestion = buildAiSuggestionText(teacherRes.data, feedbackRes.data);
            const token = getToken();

            await axios.put(
                `${BASE_URL}/teacher-guide-feedbacks/${fb._id}`,
                { aiSuggestion: suggestion },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setFeedbacks((prev) => prev.map((item) => (
                item._id === fb._id ? { ...item, aiSuggestion: suggestion } : item
            )));

            Swal.fire({
                icon: 'success',
                title: 'Generated',
                text: 'AI suggestion generated successfully.',
                timer: 1200,
                showConfirmButton: false
            });
        } catch (err) {
            console.error('Failed to generate AI suggestion', err?.response?.data || err);
            Swal.fire('Error', 'Failed to generate AI suggestion.', 'error');
        } finally {
            setGeneratingSuggestions((prev) => ({ ...prev, [fb._id]: false }));
        }
    };

    return (
        <>
            <PageHeader />
            <div className="main-content">
                <div className="row">
                    <div className="col-12">
                        <div className="card stretch stretch-full">
                            <CardHeader title="Lecture Feedback & Suggestions" />

                            <div className="card-body">
                                <div className="d-flex justify-content-end mb-4">
                                    <button className="btn btn-light btn-sm" onClick={() => navigate(-1)}>
                                        <BsArrowLeft className="me-2" /> Back to Lectures
                                    </button>
                                </div>

                        {loading ? (
                            <div className="text-center py-5">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                            </div>
                        ) : feedbacks.length === 0 ? (
                            <div className="text-center py-5 text-muted">
                                <h5>No feedbacks available yet for this lecture.</h5>
                            </div>
                        ) : (
                            <>
                                {/* Chart Section eka */}
                                <div className="row mb-5 justify-content-center">
                                    <div className="col-md-8 col-lg-6">
                                        <div className="p-4 border rounded shadow-sm bg-white">
                                            <h6 className="text-center fw-bold mb-4 text-primary">Feedback Distribution Overview</h6>
                                            <ReactApexChart
                                                options={chartOptions}
                                                series={chartData.series}
                                                type="donut"
                                                height={320}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Data Table Section eka */}
                                <div className="table-responsive">
                                    <table className="table table-hover table-bordered mb-0">
                                        <thead className="table-light">
                                        <tr>
                                            <th style={{ width: '15%' }}>Student</th>
                                            <th style={{ width: '35%' }}>Feedback</th>
                                            <th style={{ width: '50%' }}>AI Suggestion & Review</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {feedbacks.map((fb) => (
                                            <tr key={fb._id}>
                                                <td>
                                                    <span className="fw-medium">{fb?.studentId?.username || fb?.studentId?.email || 'Unknown'}</span>
                                                    <div className="text-muted small">Age: {fb?.studentId?.age || '-'}</div>
                                                </td>
                                                <td>
                                                    <div
                                                        style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', cursor: 'pointer' }}
                                                        // Navigate function eka use kirima
                                                        onClick={() => handleNavigateToDetailedView(fb)}
                                                    >
                                                        {fb?.studentFeedback || <span className="text-muted">No feedback provided</span>}
                                                    </div>
                                                </td>
                                                <td>
                                                    <AiSuggestionPreview
                                                        suggestion={fb?.aiSuggestion}
                                                        onClick={() => handleNavigateToDetailedView(fb)}
                                                        onGenerate={() => generateSuggestionFor(fb)}
                                                        generating={!!generatingSuggestions[fb._id]}
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ViewLectureFeedback;
