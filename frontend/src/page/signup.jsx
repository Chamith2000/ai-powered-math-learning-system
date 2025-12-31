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
    suitableMethod: "none",
    status: 1,
    entranceTest: 0,
    suitabilityForCoding: 0,
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

    // try {
    //   const res = await axios.post("http://localhost:5000/validate-face", { image: faceImage });
    //   if (!res?.data?.valid) {
    //     Swal.fire({
    //       icon: "error",
    //       title: "Invalid face image",
    //       text: res?.data?.message || "No proper face detected. Please try again.",
    //     });
    //     setLoading(false);
    //     return;
    //   }
    // } catch (err) {
    //   console.error("Face validation error:", err);
    //   Swal.fire({ icon: "error", title: "Validation failed", text: "Unable to validate the face image." });
    //   setLoading(false);
    //   return;
    // }

    try {
      const fd = new FormData();

      const payload = {
        ...formData,
        difficultyLevel: "Easy",
        suitableMethod: "none",
        entranceTest: 0,
        suitabilityForCoding: 0,
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
      <PageHeader title={"Register Now"} curPage={"Sign Up"} />
      <div className="login-section padding-tb section-bg">
        <div className="container">
          <div className="account-wrapper">
            <h3 className="title">Register Now</h3>
            <form className="account-form" onSubmit={handleSubmit}>
              <FaceCapture onCapture={setFaceImage} />

              <div className="form-group">
                <input name="username" placeholder="Username" value={formData.username} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <input type="password" name="confirmPassword" placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <input name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <input name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <input type="number" name="age" placeholder="Age" value={formData.age} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <input name="phoneNumber" placeholder="Phone Number" value={formData.phoneNumber} onChange={handleChange} required />
              </div>

              <div className="form-group">
                <button className="lab-btn" type="submit" disabled={loading}>
                  <span>{loading ? "Registering..." : "Get Started Now"}</span>
                </button>
              </div>
            </form>

            <div className="account-bottom">
              <span className="d-block cate pt-10">
                Already have an account? <Link to="/login">Login</Link>
              </span>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default SignupPage;
