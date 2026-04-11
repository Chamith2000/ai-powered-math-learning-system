import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Footer from "../component/layout/footer";
import Header from "../component/layout/header";
import PageHeader from "../component/layout/pageheader";
import apiClient from "../api";
import Swal from "sweetalert2";
import FaceCapture from "../component/WebCamCapture";
import axios from "axios";

const SignupPage = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    age: "",
    phoneNumber: "",
    difficultyLevel: "Easy",
    grade: 3,
    status: 1,
    entranceTest: 0,
  });

  const [faceImage, setFaceImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) =>
    setFormData((s) => ({ ...s, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // basic checks
    if (formData.password !== formData.confirmPassword) {
      Swal.fire({ icon: "error", title: "Password mismatch", text: "Please retype the passwords." });
      setLoading(false);
      return;
    }
    if (!faceImage || !faceImage.startsWith("data:image/")) {
      Swal.fire({ icon: "warning", title: "Face image required", text: "Please capture a clear face image." });
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post("http://localhost:5000/validate-face", { image: faceImage });
      if (!res?.data?.valid) {
        Swal.fire({
          icon: "error",
          title: "Invalid face image",
          text: res?.data?.message || "No proper face detected. Please try again.",
        });
        setLoading(false);
        return;
      }
    } catch (err) {
      console.error("Face validation error:", err);
      Swal.fire({ icon: "error", title: "Validation failed", text: "Unable to validate the face image." });
      setLoading(false);
      return;
    }

    try {
      const fd = new FormData();

      const payload = {
        ...formData,
        difficultyLevel: "Easy",
        entranceTest: 0,
        status: 1,
      };

      Object.entries(payload).forEach(([k, v]) => fd.append(k, v));

      const blob = await (await fetch(faceImage)).blob();
      fd.append("faceImage", blob, "face.jpg");

      await apiClient.post("/api/auth/register", fd, {
        headers: { "Content-Type": undefined },
      });

      Swal.fire({
        icon: "success",
        title: "Registration successful",
        text: "You can now log in with your credentials.",
        showConfirmButton: false,
        timer: 1800,
      });

      setTimeout(() => navigate("/login"), 1800);
    } catch (error) {
      console.error("Registration Error:", error);
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "Something went wrong. Please try again.";
      Swal.fire({ icon: "error", title: "Registration failed", text: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <PageHeader title={"Join the Adventure! "} curPage={"Sign Up"} />
      <div className="login-section padding-tb section-bg" style={{ backgroundColor: "#F9FAFB", minHeight: "80vh", fontFamily: "'Nunito', sans-serif" }}>
        <div className="container d-flex justify-content-center align-items-center">
          <div className="card shadow-lg border-0 p-5 lms-card" style={{ maxWidth: 650, width: "100%", borderRadius: "28px", border: "2px solid #E0E7FF", boxShadow: "0 10px 40px rgba(79, 70, 229, 0.15)" }}>
            <div className="text-center mb-4">
              <h2 className="fw-bold" style={{ fontSize: "2.5rem", color: "#22C55E", fontFamily: "'Baloo 2', sans-serif" }}>
                Create Your Profile!
              </h2>
              <p className="fs-5" style={{ color: "#6B7280" }}>Fill in your details to start learning and playing!</p>
            </div>

            <form className="account-form" onSubmit={handleSubmit}>
              <div className="mb-4 text-center p-4 rounded-4" style={{ backgroundColor: "#F0FDF4", border: "2px solid #86EFAC", borderRadius: "24px" }}>
                <h5 className="fw-bold mb-3" style={{ color: "#22C55E", fontFamily: "'Baloo 2', sans-serif" }}>Snap a cool photo! 📸</h5>
                <FaceCapture onCapture={setFaceImage} />
              </div>

              <div className="row">
                <div className="col-md-6 form-group mb-3">
                  <input className="form-control form-control-lg rounded-pill px-4 shadow-sm lms-input" style={{ border: "2px solid #E0E7FF", borderRadius: "50px" }} name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleChange} required />
                </div>
                <div className="col-md-6 form-group mb-3">
                  <input className="form-control form-control-lg rounded-pill px-4 shadow-sm lms-input" style={{ border: "2px solid #E0E7FF", borderRadius: "50px" }} name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleChange} required />
                </div>
                <div className="col-md-6 form-group mb-3">
                  <input className="form-control form-control-lg rounded-pill px-4 shadow-sm lms-input" style={{ border: "2px solid #E0E7FF", borderRadius: "50px" }} name="username" placeholder="Nickname / Username" value={formData.username} onChange={handleChange} required />
                </div>
                <div className="col-md-6 form-group mb-3">
                  <input type="number" className="form-control form-control-lg rounded-pill px-4 shadow-sm lms-input" style={{ border: "2px solid #E0E7FF", borderRadius: "50px" }} name="age" placeholder="Your Age" value={formData.age} onChange={handleChange} required />
                </div>
                <div className="col-md-12 form-group mb-3">
                  <input type="email" className="form-control form-control-lg rounded-pill px-4 shadow-sm lms-input" style={{ border: "2px solid #E0E7FF", borderRadius: "50px" }} name="email" placeholder="Your Email Address" value={formData.email} onChange={handleChange} required />
                </div>
                <div className="col-md-6 form-group mb-3">
                  <input type="password" className="form-control form-control-lg rounded-pill px-4 shadow-sm lms-input" style={{ border: "2px solid #E0E7FF", borderRadius: "50px" }} name="password" placeholder="Create a Password" value={formData.password} onChange={handleChange} required />
                </div>
                <div className="col-md-6 form-group mb-3">
                  <input type="password" className="form-control form-control-lg rounded-pill px-4 shadow-sm lms-input" style={{ border: "2px solid #E0E7FF", borderRadius: "50px" }} name="confirmPassword" placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleChange} required />
                </div>
                <div className="col-md-6 form-group mb-3">
                  <input className="form-control form-control-lg rounded-pill px-4 shadow-sm lms-input" style={{ border: "2px solid #E0E7FF", borderRadius: "50px" }} name="phoneNumber" placeholder="Phone Number" value={formData.phoneNumber} onChange={handleChange} required />
                </div>
                <div className="col-md-6 form-group mb-3">
                  <input type="number" min="1" max="13" className="form-control form-control-lg rounded-pill px-4 shadow-sm" style={{ backgroundColor: "#FFFBEB", border: "2px solid #F59E0B", borderRadius: "50px" }} name="grade" placeholder="Your Grade (e.g. 3) ⭐" value={formData.grade} onChange={handleChange} required />
                </div>
              </div>

              <div className="form-group text-center mt-5">
                <button
                  className="btn btn-success btn-lg rounded-pill w-100 fw-bold shadow-lg"
                  type="submit"
                  disabled={loading}
                  style={{ height: "56px", fontSize: "1.25rem", borderRadius: "50px", background: "linear-gradient(135deg, #22C55E 0%, #16A34A 100%)", border: "none" }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 25px rgba(34, 197, 94, 0.4)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 15px rgba(34, 197, 94, 0.3)"; }}
                >
                  {loading ? "Registering... ⏳" : "Get Started Now! 🎉"}
                </button>
              </div>
            </form>

            <div className="account-bottom text-center mt-4">
              <p className="fs-6">
                Already have a profile? <Link to="/login" className="fw-bold text-decoration-none" style={{ color: "#4F46E5" }}>Log in here! </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default SignupPage;
