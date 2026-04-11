import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import CardHeader from '@/components/shared/CardHeader';
import PageHeader from '@/components/shared/pageHeader/PageHeader';
import { BsArrowLeft, BsStars } from 'react-icons/bs';
import axios from 'axios';
import BASE_URL from '../../config/apiConfig';
import { getToken } from '@/utils/token';

const ViewTeacherGuideFeedback = () => {
    const { state } = useLocation();
    const navigate = useNavigate();

    // Table eken pass karapu data
    const fb = state?.fb;
    const aiSuggestion = state?.suggestion || fb?.aiSuggestion;
    const [fetchedStudentGrade, setFetchedStudentGrade] = useState(null);
    const studentGradeFromFeedback = Number.isFinite(Number(fb?.studentId?.grade)) ? fb.studentId.grade : null;
    const studentGrade = studentGradeFromFeedback ?? fetchedStudentGrade;
    const feedbackStudyTime = Number(fb?.studytime);
    const guideStudyTime = Number(fb?.teacherGuideId?.studytime);
    const studyTimeLabel = Number.isFinite(feedbackStudyTime)
        ? `${Math.max(0, Math.round(feedbackStudyTime))} minutes`
        : Number.isFinite(guideStudyTime)
            ? `${Math.max(0, Math.round(guideStudyTime))} minutes`
            : '-';

    useEffect(() => {
        const studentId = typeof fb?.studentId === 'string' ? fb.studentId : fb?.studentId?._id;
        if (studentGradeFromFeedback !== null || !studentId) return;

        const fetchStudentGrade = async () => {
            try {
                const token = getToken();
                const { data } = await axios.get(`${BASE_URL}/users/${studentId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const grade = Number(data?.grade);
                setFetchedStudentGrade(Number.isFinite(grade) ? data.grade : null);
            } catch (error) {
                console.error('Failed to fetch student grade', error);
            }
        };

        fetchStudentGrade();
    }, [fb?.studentId, studentGradeFromFeedback]);

    if (!fb) {
        return (
            <>
                <PageHeader />
                <div className="main-content">
                    <div className="row">
                        <div className="col-12">
                            <div className="card stretch stretch-full">
                                <div className="card-body text-center py-5">
                                    <div className="d-flex justify-content-end mb-4">
                                        <button className="btn btn-light btn-sm" onClick={() => navigate(-1)}>
                                            <BsArrowLeft className="me-2" /> Go Back
                                        </button>
                                    </div>
                                    <h4>No feedback data found.</h4>
                                    <p className="text-muted mb-0">Please navigate from the feedback table.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    // AI Text එක neutral admin-card style එකට render කරන function එක
    const formatAIText = (text) => {
        if (!text) return null;

        const renderBold = (str) => {
            const parts = str.split(/(\*\*.*?\*\*)/g);
            return parts.map((part, i) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={i} className="text-dark fw-bolder">{part.slice(2, -2)}</strong>;
                }
                return part;
            });
        };

        return text.split('\n').map((line, index) => {
            const trimmedLine = line.trim();

            if (!trimmedLine) return <div key={index} className="my-2"></div>;

            if (trimmedLine.startsWith('Weak sections:')) {
                const sections = trimmedLine.replace('Weak sections:', '').split(',').map(s => s.trim()).filter(Boolean);
                return (
                    <div key={index} className="mb-3 mt-3 p-3 border rounded-3 bg-white">
                        <strong className="text-dark d-block mb-2 small text-uppercase">Weak Sections Identified</strong>
                        <div className="d-flex flex-wrap gap-2">
                            {sections.map((sec, i) => (
                                <span key={i} className="badge bg-light text-dark border px-3 py-2 rounded-pill">{sec}</span>
                            ))}
                        </div>
                    </div>
                );
            }

            if (trimmedLine.includes('----------------------------')) {
                return <hr key={index} className="my-4" />;
            }

            if (trimmedLine.includes('[Video Lecture Quality Review]')) {
                return (
                    <div key={index} className="d-flex align-items-center gap-2 mt-2 mb-3">
                        <span className="avatar-text avatar-sm bg-light text-dark border rounded-circle">
                            <BsStars size={16} />
                        </span>
                        <h5 className="fw-bold text-dark mb-0">Video Lecture Quality Review</h5>
                    </div>
                );
            }

            if (trimmedLine.startsWith('Issue:')) {
                return (
                    <div key={index} className="mb-2 p-2 rounded-3 border bg-white">
                        <strong className="text-muted me-2">Issue:</strong>
                        <span className="text-dark">{trimmedLine.replace('Issue:', '').trim()}</span>
                    </div>
                );
            }

            if (trimmedLine.startsWith('Severity:')) {
                const severity = trimmedLine.replace('Severity:', '').trim();
                const badgeClass = "badge bg-light text-dark border px-3 py-2";

                return <div key={index} className="mb-2"><strong className="text-muted me-2">Severity:</strong> <span className={badgeClass}>{severity}</span></div>;
            }

            if (trimmedLine.startsWith('Confidence:')) {
                return (
                    <div key={index} className="mb-2">
                        <span className="badge bg-light text-dark border px-3 py-2">
                            Confidence: {trimmedLine.replace('Confidence:', '').trim()}
                        </span>
                    </div>
                );
            }

            if (trimmedLine.startsWith('Recommendation:')) {
                return (
                    <div key={index} className="mt-4 p-3 bg-white border rounded-3">
                        <strong className="text-dark d-block mb-1 fs-6">Technical Recommendation</strong>
                        <span className="text-dark">{renderBold(trimmedLine.replace('Recommendation:', ''))}</span>
                    </div>
                );
            }

            if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
                return (
                    <div key={index} className="d-flex align-items-start mb-2 p-2 rounded-3 border bg-white">
                        <span className="me-2 mt-1 rounded-circle bg-secondary" style={{ width: 6, height: 6, flex: '0 0 6px' }}></span>
                        <div className="text-dark lh-base">{renderBold(trimmedLine.substring(2))}</div>
                    </div>
                );
            }

            return <p key={index} className="mb-2 text-dark" style={{ lineHeight: '1.8', fontSize: '15px' }}>{renderBold(trimmedLine)}</p>;
        });
    };

    return (
        <>
            <PageHeader />
            <div className="main-content">
                <div className="row">
                    <div className="col-12">
                        <div className="card stretch stretch-full">
                            <CardHeader title="Comprehensive Feedback & AI Recommendation" />

                            <div className="card-body">
                                <div className="d-flex justify-content-end mb-4">
                                    <button className="btn btn-light btn-sm" onClick={() => navigate(-1)}>
                                        <BsArrowLeft className="me-2" /> Back to Table
                                    </button>
                                </div>

                        <div className="row mb-4">
                            <div className="col-md-6">
                                <h6 className="fw-bold text-dark mb-3">Student Details</h6>
                                <div className="p-3 bg-white rounded-3 border">
                                    {fb.count > 1 ? (
                                        <>
                                            <p className="mb-1"><strong>Grouped Feedback:</strong> Multiple Students ({fb.count})</p>
                                            <p className="mb-0"><strong>Students:</strong> {Array.from(new Set(fb.studentNames)).join(', ')}</p>
                                        </>
                                    ) : (
                                        <>
                                            <p className="mb-1"><strong>Name:</strong> {fb?.studentId?.username || fb?.studentId?.email || 'Unknown'}</p>
                                            <p className="mb-0"><strong>Grade:</strong> {studentGrade ?? 'Not available'}</p>

                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="col-md-6 mt-3 mt-md-0">
                                <h6 className="fw-bold text-dark mb-3">Content Details</h6>
                                <div className="p-3 bg-white rounded-3 border">
                                    <p className="mb-1"><strong>Content Title:</strong> {fb?.contentTitle || 'N/A'}</p>
                                    <p className="mb-0"><strong>Study Time:</strong> {studyTimeLabel}</p>
                                </div>
                            </div>
                        </div>

                        <div className="row mb-4">
                            <div className="col-12">
                                <h6 className="fw-bold text-dark mb-3">Student Feedback</h6>
                                <div className="p-4 rounded-3 border bg-white">
                                    <p className="mb-0 fst-italic text-secondary"
                                       style={{whiteSpace: 'pre-wrap', fontSize: '15px'}}>
                                        &quot;{fb?.studentFeedback || 'No student feedback provided.'}&quot;
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* AI Recommendation Section */}
                        <div className="row mt-4">
                            <div className="col-12">
                                <div className="d-flex align-items-center mb-3">
                                    <div className="bg-light text-dark border p-2 rounded-circle me-3 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                        <BsStars size={22} />
                                    </div>
                                    <h5 className="fw-bold text-dark mb-0">AI Insight & Recommendation</h5>
                                </div>

                                <div className="p-4 rounded-3 bg-white border">
                                    {aiSuggestion ? (
                                        <div style={{ letterSpacing: '0.2px' }}>
                                            {formatAIText(aiSuggestion)}
                                        </div>
                                    ) : (
                                        <div className="text-center text-muted py-5 bg-light rounded-3">
                                            <BsStars size={30} className="mb-3 opacity-50 text-dark" />
                                            <h6 className="text-muted">No AI suggestion generated yet.</h6>
                                            <p className="small mb-0">Please generate suggestions from the previous table to view insights.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ViewTeacherGuideFeedback;
