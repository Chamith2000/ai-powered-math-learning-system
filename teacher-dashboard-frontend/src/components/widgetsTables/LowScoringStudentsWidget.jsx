import React, { useEffect, useState } from "react";
import axios from "axios";
import BASE_URL from "../../config/apiConfig";
import { getToken } from "@/utils/token";
import { FiTrendingDown } from "react-icons/fi";

const LowScoringStudentsWidget = () => {
    const [lowScorers, setLowScorers] = useState([]);

    useEffect(() => {
        const fetchLowScorers = async () => {
            try {
                const token = getToken();
                const response = await axios.get(`${BASE_URL}/paper-logs`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                const studentScores = {};
                response.data.forEach(log => {
                    if (!log.studentId) return;
                    const studentId = log.studentId._id;
                    
                    if (!studentScores[studentId]) {
                        studentScores[studentId] = {
                            username: log.studentId.username,
                            email: log.studentId.email,
                            totalObtained: 0,
                            totalPossible: 0,
                            paperCount: 0
                        };
                    }
                    studentScores[studentId].totalObtained += log.marks;
                    studentScores[studentId].totalPossible += log.totalMarks;
                    studentScores[studentId].paperCount += 1;
                });

                const weakStudents = Object.values(studentScores).map(student => {
                    const percentage = (student.totalObtained / student.totalPossible) * 100;
                    return { ...student, percentage };
                }).filter(student => student.percentage < 50) 
                  .sort((a, b) => a.percentage - b.percentage) 
                  .slice(0, 5); 

                setLowScorers(weakStudents);
            } catch (error) {
                console.error(error);
            }
        };
        fetchLowScorers();
    }, []);

    return (
        <div className="col-xxl-6 col-md-12 mb-4">
            <div className="card stretch stretch-full border border-warning shadow-sm">
                <div className="card-header bg-warning text-dark">
                    <h5 className="card-title text-dark d-flex align-items-center gap-2 mb-0">
                        <FiTrendingDown size={20} /> Low Performing Students (Below 50%)
                    </h5>
                </div>
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover mb-0">
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Papers Done</th>
                                    <th>Average Score</th>
                                </tr>
                            </thead>
                            <tbody>
                                {lowScorers.length === 0 ? (
                                    <tr><td colSpan="3" className="text-center py-3">No low performing students right now.</td></tr>
                                ) : (
                                    lowScorers.map((student, index) => (
                                        <tr key={index}>
                                            <td>
                                                <div className="fw-bold">{student.username}</div>
                                                <small className="text-muted">{student.email}</small>
                                            </td>
                                            <td>{student.paperCount}</td>
                                            <td>
                                                <span className="badge bg-warning text-dark">
                                                    {student.percentage.toFixed(1)}%
                                                </span>
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

export default LowScoringStudentsWidget;