import React, { useEffect, useState } from "react";
import axios from "axios";
import BASE_URL from "../../config/apiConfig";
import { getToken } from "@/utils/token";
import { Link } from "react-router-dom";
import { FiAlertTriangle } from "react-icons/fi";

const SuspiciousActivityWidget = () => {
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        const fetchSuspiciousLogs = async () => {
            try {
                const token = getToken();
                const response = await axios.get(`${BASE_URL}/paper-logs`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const suspicious = response.data
                    .filter(log => log.suspiciousActivity === true)
                    .slice(0, 5);
                setLogs(suspicious);
            } catch (error) {
                console.error(error);
            }
        };
        fetchSuspiciousLogs();
    }, []);

    return (
        <div className="col-xxl-6 col-md-12 mb-4">
            <div className="card stretch stretch-full border border-danger shadow-sm">
                <div className="card-header bg-danger text-white">
                    <h5 className="card-title text-white d-flex align-items-center gap-2 mb-0">
                        <FiAlertTriangle size={20} /> Suspicious Activity Detected
                    </h5>
                </div>
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover mb-0">
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Paper</th>
                                    <th>Incidents</th>
                                    <th className="text-end">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.length === 0 ? (
                                    <tr><td colSpan="4" className="text-center py-3">No suspicious activity found.</td></tr>
                                ) : (
                                    logs.map((log) => (
                                        <tr key={log._id}>
                                            <td>
                                                <div className="fw-bold">{log.studentId?.username || "Unknown"}</div>
                                            </td>
                                            <td>{log.paperTitle}</td>
                                            <td>
                                                <span className="badge bg-danger">
                                                    {log.cheatIncidents?.length || 1} Warnings
                                                </span>
                                            </td>
                                            <td className="text-end">
                                                <Link to={`/admin/paper-logs/view/${log._id}`} className="btn btn-sm btn-outline-danger">
                                                    View
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SuspiciousActivityWidget;