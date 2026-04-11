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
      setAuthToken(token);

      Swal.fire({
        icon: "success",
        title: "Login Successful!",
        text: `Welcome back, ${user.username}!`,
        showConfirmButton: false,
        timer: 2000,
      });

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
        setAuthToken(token);

        Swal.fire({
          icon: "success",
          title: "Face Login Successful!",
          text: `Welcome back, ${user.username}!`,
          showConfirmButton: false,
          timer: 2000,
        });

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

  // Removed legacy ensurePerformanceRecord


  return (
    <>
      <Header />
      <PageHeader title={"Login "} curPage={"Login"} />
      <div className="login-section padding-tb section-bg" style={{ backgroundColor: "#F9FAFB", minHeight: "80vh", fontFamily: "'Nunito', sans-serif" }}>
        <div className="container d-flex justify-content-center align-items-center">
          <div className="card shadow-lg border-0 p-5 lms-card" style={{ maxWidth: 500, width: "100%", borderRadius: "28px", border: "2px solid #E0E7FF", boxShadow: "0 10px 40px rgba(79, 70, 229, 0.15)" }}>
            <div className="text-center mb-4">
              <h2 className="fw-bold" style={{ fontSize: "2.5rem", color: "#4F46E5", fontFamily: "'Baloo 2', sans-serif" }}>
                Welcome Back!
              </h2>
              <p className="fs-5" style={{ color: "#6B7280" }}>Ready for another learning adventure? Log in below!</p>
            </div>

            <form className="account-form" onSubmit={handleSubmit}>
              <div className="form-group mb-4">
                <input
                  type="email"
                  name="email"
                  className="form-control form-control-lg rounded-pill px-4 shadow-sm lms-input"
                  style={{ border: "2px solid #E0E7FF", height: "56px", fontSize: "1.1rem", borderRadius: "50px" }}
                  placeholder="Your Email 📧"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group mb-4">
                <input
                  type="password"
                  name="password"
                  className="form-control form-control-lg rounded-pill px-4 shadow-sm lms-input"
                  style={{ border: "2px solid #E0E7FF", height: "56px", fontSize: "1.1rem", borderRadius: "50px" }}
                  placeholder="Your Password 🔒"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group text-center mt-5">
                <button
                  className="btn btn-primary btn-lg rounded-pill w-100 fw-bold shadow lms-btn lms-btn-primary"
                  type="submit"
                  disabled={loading}
                  style={{ height: "56px", fontSize: "1.25rem", borderRadius: "50px", background: "linear-gradient(135deg, #4F46E5 0%, #4338CA 100%)", border: "none" }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 25px rgba(79, 70, 229, 0.4)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 15px rgba(79, 70, 229, 0.3)"; }}
                >
                  {loading ? "Logging in... ⏳" : "Let's Go!"}
                </button>
              </div>
            </form>

            <div className="account-bottom text-center mt-4">
              <p className="mb-2 fs-6">
                Forgot Password?{" "}
                <Link
                  to="#"
                  className="fw-bold text-decoration-none"
                  style={{ color: "#4F46E5" }}
                  onClick={(e) => {
                    e.preventDefault();
                    setShowFaceLogin(true);
                  }}
                >
                  Login with Face
                </Link>
              </p>
              <p className="fs-6">
                New here? <Link to="/signup" className="fw-bold text-decoration-none" style={{ color: "#22C55E" }}>Join the Fun! </Link>
              </p>
            </div>

            {showFaceLogin && (
              <div className="mt-4 p-4 rounded-4 text-center" style={{ backgroundColor: "#EFF6FF", border: "2px solid #818CF8", borderRadius: "24px" }}>
                <h4 className="fw-bold mb-3" style={{ color: "#4F46E5", fontFamily: "'Baloo 2', sans-serif" }}>Face Login 📸</h4>
                <div className="d-flex justify-content-center mb-3">
                  <FaceCapture onCapture={setCapturedImage} />
                </div>
                {capturedImage && (
                  <button
                    className="btn btn-lg rounded-pill text-white fw-bold shadow-sm px-4"
                    type="button"
                    onClick={handleFaceLogin}
                    style={{ background: "linear-gradient(135deg, #4F46E5 0%, #4338CA 100%)", border: "none", borderRadius: "50px" }}
                  >
                    Magic Login ✨
                  </button>
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
