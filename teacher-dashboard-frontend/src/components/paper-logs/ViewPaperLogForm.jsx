import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import BASE_URL from "../../config/apiConfig";
import { getToken } from "@/utils/token";

const ViewPaperLogForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [log, setLog] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLog = async () => {
            try {
                const token = getToken();
                const response = await axios.get(`${BASE_URL}/paper-logs/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setLog(response.data);
                setLoading(false);
            } catch (error) {
                console.error("Failed to fetch paper log:", error);
                setLoading(false);
            }
        };
        fetchLog();
    }, [id]);

    if (loading) return <div>Loading log...</div>;
    if (!log) return <div>Log not found.</div>;

    const student = log.studentId || {};

    return (
        <div className="card stretch stretch-full">
            <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">Paper Log Details</h5>
                <button className="btn btn-light" onClick={() => navigate(-1)}>Back</button>
            </div>
            <div className="card-body">
                <div className="row mb-4">
                    <div className="col-md-6 border-end">
                        <h6 className="text-muted mb-3">Student Info</h6>
                        <p className="mb-1"><strong>Name:</strong> {student.firstName} {student.lastName}</p>
                        <p className="mb-1"><strong>Username:</strong> {student.username}</p>
                        <p className="mb-1"><strong>Email:</strong> {student.email}</p>
                    </div>
                    <div className="col-md-6 ps-md-4">
                        <h6 className="text-muted mb-3">Paper Info</h6>
                        <p className="mb-1"><strong>Title:</strong> {log.paperTitle}</p>
                        <p className="mb-1"><strong>Type:</strong> {log.paperType}</p>
                        <p className="mb-1"><strong>Score:</strong> <span className={log.marks === log.totalMarks ? "text-success" : ""}>{log.marks} / {log.totalMarks}</span></p>
                        <p className="mb-1"><strong>Time Spent:</strong> {log.timeSpent} seconds</p>
                        <p className="mb-0"><strong>Submitted At:</strong> {new Date(log.createdAt).toLocaleString()}</p>
                    </div>
                </div>

                <div className="alert alert-soft-secondary">
                    <h6 className="mb-3 d-flex align-items-center gap-2">
                        <i className="feather-alert-triangle"></i> Monitoring Summary
                    </h6>
                    <p className="mb-0">
                        Object Detection Monitoring:{" "}
                        {log.suspiciousActivity ? (
                            <span className="badge bg-danger text-white ms-2">SUSPICIOUS ACTIVITY</span>
                        ) : (
                            <span className="badge bg-success text-white ms-2">CLEAN</span>
                        )}
                    </p>
                    <p className="mb-0 mt-2">
                        Dominant Emotion:{" "}
                        <span className="badge bg-info text-white ms-2 text-uppercase">
                            {log.dominantEmotion || "Neutral"}
                        </span>
                    </p>
                </div>

                <h6 className="mt-4 mb-3">Detection Incidents ({log.cheatIncidents?.length || 0})</h6>
                {log.cheatIncidents && log.cheatIncidents.length > 0 ? (
                    <div className="table-responsive">
                        <table className="table table-bordered">
                            <thead className="table-light">
                                <tr>
                                    <th>#</th>
                                    <th>Timestamp</th>
                                    <th>Detected Object</th>
                                </tr>
                            </thead>
                            <tbody>
                                {log.cheatIncidents.map((inc, i) => (
                                    <tr key={inc._id || i}>
                                        <td>{i + 1}</td>
                                        <td>{new Date(inc.timestamp).toLocaleString()}</td>
                                        <td className="text-danger fw-bold text-uppercase">{inc.detectionType}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-muted">No restricted objects were detected during this session.</p>
                )}
            </div>
        </div>
    );
};

export default ViewPaperLogForm;
