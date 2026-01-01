import { Fragment, useEffect, useRef, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import Footer from "../component/layout/footer";
import Header from "../component/layout/header";
import PageHeader from "../component/layout/pageheader";
import apiClient from "../api";
import axios from "axios";

const StudentProfile = () => {
  const [student, setStudent] = useState(null);
  const [studentPerformance, setStudentPerformance] = useState(null);
  const [studentPerScore, setStudentPerScore] = useState(null); 
  const [studentPerformanceHistory, setStudentPerformanceHistory] = useState([]);
  const userId = localStorage.getItem("userId");

  const [learningBreakdown, setLearningBreakdown] = useState([]);
  const [bestLearningStyle, setBestLearningStyle] = useState(null);
  const updatingSuitableRef = useRef(false); 

  useEffect(() => {
    fetchStudentProfile();
    fetchStudentPerformance();
    fetchStudentPerformanceHistory();
  }, []);

  useEffect(() => {
    if (studentPerformance) {
      fetchStudentCurrentLevel();
    }
  }, [studentPerformance, studentPerformanceHistory.length]);

  useEffect(() => {
    if (!student) {
      setLearningBreakdown([]);
      setBestLearningStyle(null);
      return;
    }

    const raw = [
      {
        key: "Visual",
        count: Number(student?.VisualLearningCount ?? 0),
        total: Number(student?.VisualLearningTotalMarks ?? 0),
      },
      {
        key: "Auditory",
        count: Number(student?.AuditoryLearningCount ?? 0),
        total: Number(student?.AuditoryLearningTotalMarks ?? 0),
      },
      {
        key: "Kinesthetic",
        count: Number(student?.KinestheticLearningCount ?? 0),
        total: Number(student?.KinestheticLearningTotal ?? 0),
      },
      {
        key: "Read & Write",
        count: Number(student?.ReadWriteLearningCount ?? 0),
        total: Number(student?.ReadWriteLearningTotal ?? 0),
      },
    ];

    const table = raw.map(r => ({
      ...r,
      avg: r.count > 0 ? (r.total / r.count) : 0,
    }))
    .sort((a, b) => b.avg - a.avg);

    setLearningBreakdown(table);

    const hasSignal = table.some(r => r.count > 0 && r.avg > 0);
    const best = hasSignal ? table[0].key : null;
    setBestLearningStyle(best);


    if (
      best &&
      String(student?.suitableMethod || "").toLowerCase() !== best.toLowerCase() &&
      !updatingSuitableRef.current
    ) {
      updatingSuitableRef.current = true;
      apiClient
        .put(`/api/users/${userId}`, { suitableMethod: best })
        .then(() => {
          fetchStudentProfile();
        })
        .catch((err) => {
          console.error("Failed to update suitableMethod:", err);
        })
        .finally(() => {
          setTimeout(() => (updatingSuitableRef.current = false), 300);
        });
    }
  }, [student, userId]);

  const fetchStudentProfile = async () => {
    try {
      const response = await apiClient.get(`/api/users/${userId}`);
      if (response.data) {
        setStudent(response.data);
      }
    } catch (error) {
      console.error("Error fetching student profile:", error);
    }
  };

  const fetchStudentPerformance = async () => {
    try {
      const response = await apiClient.get(`/api/student-performance/user/${userId}`);
      if (response.data) {
        setStudentPerformance(response.data);
      }
    } catch (error) {
      console.error("Error fetching student performance:", error);
    }
  };

  const fetchStudentPerformanceHistory = async () => {
    try {
      const response = await apiClient.get(`/api/student-performance-history/user/${userId}`);
      if (response.data) {
        setStudentPerformanceHistory(response.data);
      }
    } catch (error) {
      console.error("Error fetching student performance history:", error);
    }
  };

  const fetchStudentCurrentLevel = async () => {
    try {
      const sp = studentPerformance || {};
      const attendanceRate = Number(studentPerformanceHistory?.length || 0);

      const payload = {
        papers_completed: Number(sp.paperCount ?? 0),
        video_lectures_watched: Number(sp.lectureCount ?? 0),
        total_time_on_LMS_hours: Number(sp.totalStudyTime ?? 0),
        resources_downloaded: Number(sp.resourceScore ?? 0),
        attendance_rate: attendanceRate,
        past_coding_score: Number(sp.averageScore ?? 0),
      };

      const response = await axios.post(`http://127.0.0.1:5000/predict-skill`, payload);
      if (response.data) {
        setStudentPerScore(response.data); 
      }
    } catch (error) {
      console.error("Error fetching student skill prediction:", error);
    }
  };

  const mapSkillToDifficulty = (skill) => {
    switch (String(skill || "").toLowerCase()) {
      case "basic":
        return "Easy";
      case "intermediate":
        return "Medium";
      case "advanced":
        return "Hard";
      default:
        return "N/A";
    }
  };

  return (
    <Fragment>
      <Header />
      <PageHeader title={"Student Profile"} curPage={"Profile"} />
      <section className="student-profile-section padding-tb section-bg">
        <div className="container">
          <div className="profile-wrapper">
            {student ? (
              <div className="profile-content text-center">
                <h2 className="text-center">
                  Welcome, {student.firstName} {student.lastName}
                </h2>

                <div className="d-flex align-items-center flex-wrap mb-4" style={{ gap: "40px" }}>
                  <div className="profile-image text-center">
                    <img
                      src={
                        student.faceImgUrl
                          ? student.faceImgUrl
                          : "https://img.freepik.com/premium-vector/man-avatar-profile-picture-vector-illustration_268834-538.jpg"
                      }
                      alt="Profile"
                      className="rounded"
                      style={{
                        width: "300px",
                        height: "300px",
                        objectFit: "cover",
                        border: "3px solid #007bff",
                        maxWidth: "100%",
                      }}
                    />
                  </div>

                  <div className="profile-info" style={{ flex: "1", minWidth: "250px" }}>
                    <p><strong>Email:</strong> {student.email}</p>
                    <p><strong>First Name:</strong> {student.firstName}</p>
                    <p><strong>Last Name:</strong> {student.lastName}</p>
                    <p><strong>Age:</strong> {student.age ?? "N/A"}</p>
                    <p><strong>Phone Number:</strong> {student.phoneNumber ?? "N/A"}</p>
                    <p><strong>Current Difficulty Level:</strong> {student.difficultyLevel ?? "N/A"}</p>
                    <p><strong>Current Learning Style (Profile):</strong> {student.suitableMethod ?? "N/A"}</p>
                    <p>
                      <strong>Suggested Difficulty (ML):</strong>{" "}
                      {studentPerScore?.predicted_skill
                        ? mapSkillToDifficulty(studentPerScore.predicted_skill)
                        : "N/A"}
                    </p>
                  </div>
                </div>

                

                {/* Historical Average Score Chart */}
                <div className="chart-container">
                  <h3 className="text-center">Student's Average Score Trend</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart
                      data={studentPerformanceHistory.map((entry, index) => ({
                        index,
                        averageScore: entry.averageScore,
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="index" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="averageScore" stroke="#28a745" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <p className="text-center">Loading student profile...</p>
            )}
          </div>
        </div>
      </section>
      <Footer />
    </Fragment>
  );
};

export default StudentProfile;
