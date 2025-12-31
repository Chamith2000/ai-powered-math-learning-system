
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Footer from "../component/layout/footer";
import Header from "../component/layout/header";
import PageHeader from "../component/layout/pageheader";
import apiClient, { setAuthToken } from "../api";
import Swal from "sweetalert2";
import FaceCapture from "../component/WebCamCapture";

const LoginPage = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showFaceLogin, setShowFaceLogin] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await apiClient.post("/api/auth/login", formData);
      const { token, user } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("userId", user.id);
      localStorage.setItem("difficultyLevel", user.difficultyLevel ?? "Easy");
      localStorage.setItem("suitabilityForCoding", String(user.suitabilityForCoding ?? 0));
      setAuthToken(token);

      Swal.fire({
        icon: "success",
        title: "Login Successful!",
        text: `Welcome back, ${user.username}!`,
        showConfirmButton: false,
        timer: 2000,
      });

      await fetchStudentPerformance(user.id);

      const dest = Number(user.entranceTest) === 0 ? "/starting-paper" : "/";
      setTimeout(() => navigate(dest), 2000);
    } catch (error) {
      console.error("Login Error:", error);
      Swal.fire({
        icon: "error",
        title: "Login Failed!",
        text: "Invalid email or password. Or try Face Login below.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFaceLogin = async () => {
    if (!formData.email || !capturedImage) {
      Swal.fire({
        icon: "warning",
        title: "Missing Info",
        text: "Please enter your email and capture your face.",
      });
      return;
    }

    try {
      Swal.fire({ title: "Verifying Face...", allowOutsideClick: false });
      Swal.showLoading();

      const response = await apiClient.post("/api/auth/face-login", {
        email: formData.email,
        capturedImage,
      });

      Swal.close();

      if (response?.data) {
        const { token, user } = response.data;

        localStorage.setItem("token", token);
        localStorage.setItem("userId", user.id);
        localStorage.setItem("difficultyLevel", user.difficultyLevel ?? "Easy");
        localStorage.setItem("suitabilityForCoding", String(user.suitabilityForCoding ?? 0));
        setAuthToken(token);

        Swal.fire({
          icon: "success",
          title: "Face Login Successful!",
          text: `Welcome back, ${user.username}!`,
          showConfirmButton: false,
          timer: 2000,
        });

        await fetchStudentPerformance(user.id);

        const dest = Number(user.entranceTest) === 0 ? "/starting-paper" : "/";
        setTimeout(() => navigate(dest), 2000);
      } else {
        Swal.fire({
          icon: "error",
          title: "Login Failed",
          text: response.data.message || "Face not recognized.",
        });
      }
    } catch (error) {
      console.error("Face login error:", error);
      Swal.fire({
        icon: "error",
        title: "Face Login Error",
        text: "Something went wrong during face authentication.",
      });
    }
  };

  const fetchStudentPerformance = async (userId) => {
    try {
      let spRes = null;
      try {
        spRes = await apiClient.get(`/api/student-performance/user/${userId}`);
      } catch (err) {
        if (err?.response?.status !== 404) throw err;
      }

      if (!spRes?.data || !spRes.data.userId) {
        try {
          await apiClient.post(`/api/student-performance`, {
            userId,
            totalStudyTime: 0,
            totalScore: 0,
            resourceScore: 0,
            paperCount: 0,
            averageScore: 0,
            lectureCount: 0,
          });
          console.log("Baseline student performance created.");
        } catch (postErr) {
          console.error("Error creating baseline performance:", postErr);
        }

        try {
          spRes = await apiClient.get(`/api/student-performance/user/${userId}`);
        } catch (err2) {
          spRes = {
            data: {
              totalStudyTime: 0,
              resourceScore: 0,
              totalScore: 0,
              paperCount: 0,
              lectureCount: 0,
              averageScore: 0, 
            },
          };
        }
      }

      const data = spRes?.data || {};
      const {
        totalStudyTime = 0,
        resourceScore = 0,
        totalScore = 0,
        paperCount = 0,
        lectureCount = 0,
        averageScore = 0, 
        updatedAt,
        createdAt,
      } = data;

      const todayStr = new Date().toISOString().split("T")[0];
      const lastUpdateISO = (updatedAt || createdAt || "").toString();
      const isLastUpdateToday = lastUpdateISO && lastUpdateISO.split("T")[0] === todayStr;

      const historyList = await getHistoryRecords(userId); 
      const alreadyHasTodayHistory = historyList.some(
        (r) => (r?.createdAt || "").split("T")[0] === todayStr
      ); 
      const attendanceRate = (historyList?.length || 0) + 1; 

      if (!isLastUpdateToday && !alreadyHasTodayHistory) {
        await predictAndUpdateDifficulty({
          userId,
          paperCount,
          lectureCount,
          totalStudyTime,
          resourceScore,
          attendanceRate,
          averageScore,
        });

        await sendStudentPerformanceHistory(
          userId,
          totalStudyTime,
          resourceScore,
          totalScore,
          paperCount,
          lectureCount
        );
      } else {
        console.log("Student performance was updated today or history exists. No snapshot needed.");
      }
    } catch (error) {
      console.error("Error fetching/creating student performance:", error);
    }
  };

  // NEW: get all history records once
  const getHistoryRecords = async (userId) => {
    try {
      const response = await apiClient.get(`/api/student-performance-history/user/${userId}`);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error("Error getting performance history:", error);
      return [];
    }
  };

  // NEW: map ML skill → difficulty level used in your user table
  const mapSkillToDifficulty = (skill) => {
    switch (String(skill).toLowerCase()) {
      case "basic":
        return "Easy";
      case "intermediate":
        return "Medium";
      case "advanced":
        return "Hard";
      default:
        return "Easy";
    }
  };

  const predictAndUpdateDifficulty = async ({
    userId,
    paperCount,
    lectureCount,
    totalStudyTime,
    resourceScore,
    attendanceRate,
    averageScore,
  }) => {
    try {
      const payload = {
        papers_completed: Number(paperCount) || 0,
        video_lectures_watched: Number(lectureCount) || 0,
        total_time_on_LMS_hours: Number(totalStudyTime) || 0, 
        resources_downloaded: Number(resourceScore) || 0,
        attendance_rate: Number(attendanceRate) || 0,
        past_coding_score: Number(averageScore) || 0,
      };

      const mlRes = await apiClient.post("http://127.0.0.1:5000/predict-skill", payload); 
      const predictedSkill = mlRes?.data?.predicted_skill; // "Basic" | "Intermediate" | "Advanced"
      if (!predictedSkill) {
        console.warn("ML API did not return predicted_skill. Skipping difficulty update.");
        return;
      }

      const difficultyLevel = mapSkillToDifficulty(predictedSkill);

      const token = localStorage.getItem("token") || "";
      await apiClient.put(
        `/api/users/${userId}`,
        { difficultyLevel },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      localStorage.setItem("difficultyLevel", difficultyLevel);
      console.log(`Updated difficultyLevel → ${difficultyLevel} based on predicted_skill "${predictedSkill}"`);
    } catch (error) {
      console.error("Error predicting/updating difficulty level:", error);
    }
  };

  const sendStudentPerformanceHistory = async (
    userId,
    totalStudyTime,
    resourceScore,
    totalScore,
    paperCount,
    lectureCount
  ) => {
    try {
      const requestBody = {
        userId,
        totalStudyTime,
        resourceScore,
        totalScore,
        paperCount,
        lectureCount,
      };
      await apiClient.post("/api/student-performance-history", requestBody);
      console.log("Student performance history created for today.");
    } catch (error) {
      console.error("Error sending student performance history:", error);
    }
  };

  return (
    <>
      <Header />
      <PageHeader title={"Login Page"} curPage={"Login"} />
      <div className="login-section padding-tb section-bg">
        <div className="container">
          <div className="account-wrapper">
            <h3 className="title">Login</h3>
            <form className="account-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <input
                  type="email"
                  name="email"
                  placeholder="Email *"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <input
                  type="password"
                  name="password"
                  placeholder="Password *"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group text-center">
                <button className="lab-btn" type="submit" disabled={loading}>
                  <span>{loading ? "Logging in..." : "Login Now"}</span>
                </button>
              </div>
            </form>

            <div className="account-bottom text-center">
              <span className="d-block cate pt-10">
                Forgot Password?{" "}
                <Link
                  to="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowFaceLogin(true);
                  }}
                >
                  Login with Face
                </Link>
              </span>
              <span className="d-block cate pt-10">
                Don’t Have an Account? <Link to="/signup">Sign Up</Link>
              </span>
            </div>

            {showFaceLogin && (
              <div className="mt-4">
                <h5>Face Login</h5>
                <FaceCapture onCapture={setCapturedImage} />
                {capturedImage && (
                  <div className="mt-3 text-center">
                    <button className="lab-btn" type="button" onClick={handleFaceLogin}>
                      Login Using Face
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default LoginPage;
