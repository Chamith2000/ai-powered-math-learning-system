import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom"; // useNavigate import karanna
import axios from "axios";
import BASE_URL from "../../config/apiConfig";
import { getToken } from "@/utils/token";
import Dropdown from '@/components/shared/Dropdown'; // Dropdown eka import karanna
import { FiEye, FiTrash2 } from 'react-icons/fi';

const PaperLogTable = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate(); // navigate eka define karanna

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const token = getToken();
            const response = await axios.get(`${BASE_URL}/paper-logs`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setLogs(response.data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const deleteLog = async (id) => {
        if (!window.confirm("Are you sure you want to delete this log?")) return;
        try {
            const token = getToken();
            await axios.delete(`${BASE_URL}/paper-logs/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            fetchLogs();
        } catch (error) {
            console.error(error);
        }
    };

    // Dropdown ekata oni items tika list karana function eka
    const getDropdownItems = (logId) => [
        {
            icon: <FiEye />,
            label: 'View Details',
            onClick: () => navigate(`/admin/paper-logs/view/${logId}`)
        },
        { type: 'divider' }, // Podi iri kallak (separator)
        {
            icon: <FiTrash2 />,
            label: 'Delete',
            onClick: () => deleteLog(logId)
        },
    ];

    return (
        <div className="card stretch stretch-full">
            <div className="card-header">
                <h5 className="card-title">Student Paper Activity Logs</h5>
            </div>
            <div className="card-body custom-card-action p-0">
                <div className="table-responsive" style={{ minHeight: "350px" }} >
                    <table className="table table-hover mb-0">
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Paper Title</th>
                                <th>Type</th>
                                <th>Score</th>
                                <th>Suspicious</th>
                                <th>Emotion</th>
                                <th>Date</th>
                                <th className="text-end">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="8" className="text-center">Loading...</td></tr>
                            ) : logs.length === 0 ? (
                                <tr><td colSpan="8" className="text-center">No logs found.</td></tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log._id}>
                                        <td>
                                            <div className="d-flex align-items-center gap-2">
                                                <div>
                                                    <a href="#!" className="d-block">{log.studentId?.username || "Unknown"}</a>
                                                    <span className="fs-12 text-muted">{log.studentId?.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{log.paperTitle}</td>
                                        <td>{log.paperType}</td>
                                        <td>{log.marks} / {log.totalMarks}</td>
                                        <td>
                                            {log.suspiciousActivity ? (
                                                <span className="badge bg-soft-danger text-danger">⚠️ Yes ({log.cheatIncidents?.length})</span>
                                            ) : (
                                                <span className="badge bg-soft-success text-success">Clean</span>
                                            )}
                                        </td>
                                        <td>
                                            <span className="text-capitalize">{log.dominantEmotion || "Neutral"}</span>
                                        </td>
                                        <td>{new Date(log.createdAt).toLocaleDateString()}</td>

                                        {/* Actions Column eka wenas wuna widiha */}
                                        <td className="text-end">
                                            <Dropdown
                                                dropdownItems={getDropdownItems(log._id)}
                                                triggerClass="avatar-md ms-auto"
                                                triggerPosition="0,28"
                                            />
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default PaperLogTable;