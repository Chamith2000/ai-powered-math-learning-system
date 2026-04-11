import React, { useEffect, useState } from 'react';
import { Modal, Button, Table, Spinner, Badge } from 'react-bootstrap';
import axios from 'axios';
import BASE_URL from '../../config/apiConfig';
import { getToken } from '@/utils/token';
import Swal from 'sweetalert2';

const LectureFeedbackModal = ({ show, onHide, lecture }) => {
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState({}); // fbKey -> boolean
    const [aiResults, setAiResults] = useState({});   // fbKey -> result object

    useEffect(() => {
        if (show && lecture?._id) {
            fetchFeedback();
        }
    }, [show, lecture]);

    const fetchFeedback = async () => {
        setLoading(true);
        try {
            const token = getToken();
            const res = await axios.get(`${BASE_URL}/teacher-guide-feedbacks/lectureId/${lecture._id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFeedbacks(res.data);
        } catch (err) {
            console.error('Failed to fetch lecture feedback', err);
        } finally {
            setLoading(false);
        }
    };

    const groupFeedbacks = (list) => {
        const groups = {};
        list.forEach((fb) => {
            const key = fb.studentFeedback?.trim() || 'No feedback';
            if (!groups[key]) {
                groups[key] = {
                    text: key,
                    count: 1,
                    students: [fb?.studentId?.username || fb?.studentId?.email || 'Unknown'],
                    grade: fb?.studentId?.grade ?? lecture?.grade ?? 4,
                    raw: fb
                };
            } else {
                groups[key].count += 1;
                groups[key].students.push(fb?.studentId?.username || fb?.studentId?.email || 'Unknown');
            }
        });
        return Object.values(groups);
    };

    const handleGenerateReview = async (group) => {
        const key = group.text;
        setGenerating(prev => ({ ...prev, [key]: true }));

        const langConstraint = "*** MANDATORY: RESPOND IN ENGLISH ONLY. NO OTHER LANGUAGES ALLOWED. ***";
        
        const payload = {
            model_type: "feedback",
            feedback_data: {
                text: `${langConstraint}\n\n${group.text}\n\n${langConstraint}`,
                grade: Number(group.grade) || 4,
                lesson: lecture.lectureTytle || "Untitled Lesson",
                video_content: lecture.description || "No description available."
            }
        };

        try {
            const res = await axios.post(`https://Chamith2000-mcq-generator-new.hf.space/generate`, payload, {
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (res.data?.output) {
                setAiResults(prev => ({ ...prev, [key]: res.data.output }));
            } else {
                throw new Error("Invalid AI response");
            }
        } catch (err) {
            console.error('AI generation failed', err);
            Swal.fire('Error', 'Failed to generate technical review.', 'error');
        } finally {
            setGenerating(prev => ({ ...prev, [key]: false }));
        }
    };

    const grouped = groupFeedbacks(feedbacks);

    return (
        <Modal show={show} onHide={onHide} size="xl" centered>
            <Modal.Header closeButton className="bg-light">
                <Modal.Title className="fw-bold">
                    Student Feedback Overview - <span className="text-primary">{lecture?.lectureTytle}</span>
                </Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ minHeight: '400px' }}>
                {loading ? (
                    <div className="d-flex justify-content-center py-5">
                        <Spinner animation="border" variant="primary" />
                    </div>
                ) : grouped.length === 0 ? (
                    <div className="text-center py-5 text-muted">
                        No student feedback found for this lecture.
                    </div>
                ) : (
                    <Table hover responsive className="border">
                        <thead className="table-light">
                            <tr>
                                <th style={{ width: '25%' }}>Student Feedback</th>
                                <th style={{ width: '15%' }}>Count / Students</th>
                                <th style={{ width: '60%' }}>Technical Quality Review (AI)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {grouped.map((group, idx) => (
                                <tr key={idx}>
                                    <td className="fw-bold fs-5" style={{ color: '#2b2d42' }}>{group.text}</td>
                                    <td>
                                        <Badge bg="primary" className="mb-2 p-2 d-block fs-7" style={{ width: 'fit-content' }}>
                                            {group.count} Students
                                        </Badge>
                                        <small className="text-muted fw-bold" style={{ fontSize: '13px' }}>
                                            {Array.from(new Set(group.students)).join(', ')}
                                        </small>
                                    </td>
                                    <td>
                                        {aiResults[group.text] ? (
                                            <div className="p-4 bg-white rounded border border-success shadow-sm">
                                                <div className="d-flex flex-wrap gap-2 mb-3">
                                                    <Badge bg={aiResults[group.text].severity === 'high' ? 'danger' : 'warning'} className="p-2 fs-7">
                                                        Severity: {aiResults[group.text].severity.toUpperCase()}
                                                    </Badge>
                                                    <Badge bg="info" className="p-2 fs-7 text-white">
                                                        Confidence: {Math.round(aiResults[group.text].confidence * 100)}%
                                                    </Badge>
                                                    <Badge bg="dark" className="p-2 fs-7">
                                                        Issue: {aiResults[group.text].issue.toUpperCase()}
                                                    </Badge>
                                                </div>
                                                <div className="alert alert-success border-0 mb-0" style={{ backgroundColor: '#f0fdf4' }}>
                                                    <h6 className="fw-900 text-uppercase mb-2" style={{ letterSpacing: '1px', fontSize: '14px' }}>Recommendation:</h6>
                                                    <p className="mb-0 fs-5 fw-bold lh-base" style={{ color: '#166534', whiteSpace: 'pre-line' }}>
                                                        {aiResults[group.text].recommendation}
                                                    </p>
                                                </div>

                                            </div>
                                        ) : (
                                            <Button 
                                                variant="primary" 
                                                className="px-4 py-2 fw-bold"
                                                onClick={() => handleGenerateReview(group)}
                                                disabled={generating[group.text]}
                                            >
                                                {generating[group.text] ? (
                                                    <>
                                                        <Spinner size="sm" className="me-2" />
                                                        Analyzing Quality...
                                                    </>
                                                ) : '🌟 Generate Video Quality Review'}
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>

                    </Table>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>Close</Button>
            </Modal.Footer>
        </Modal>
    );
};

export default LectureFeedbackModal;
