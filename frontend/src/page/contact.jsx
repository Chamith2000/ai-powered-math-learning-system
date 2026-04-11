import { useState, Fragment } from "react";
import apiClient from "../api";

import Swal from "sweetalert2";
import Footer from "../component/layout/footer";
import Header from "../component/layout/header";
import PageHeader from "../component/layout/pageheader";
import GoogleMap from "../component/sidebar/googlemap";

const subTitle = "Get in touch with us";
const title = "We're Always Eager To Hear From You!";
const conSubTitle = "Get in touch with Contact us";
const conTitle =
  "Fill The Form Below So We Can Get To Know You And Your Needs Better.";
const btnText = "Send Our Message";

const contactList = [
  {
    imgUrl: "assets/images/icon/01.png",
    imgAlt: "contact icon",
    title: "Office Address",
    desc: "Colombo, Sri Lanka",
  },
  {
    imgUrl: "assets/images/icon/02.png",
    imgAlt: "contact icon",
    title: "Phone Number",
    desc: "+94765523093",
  },
  {
    imgUrl: "assets/images/icon/03.png",
    imgAlt: "contact icon",
    title: "Send Email",
    desc: "mathsbuddy.info@gmail.com",
  },
  {
    imgUrl: "assets/images/icon/04.png",
    imgAlt: "contact icon",
    title: "Our Website",
    desc: "www.mathsbuddy.com",
  },
];

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    number: "",
    subject: "",
    message: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await apiClient.post("/api/contact", formData);
      
      Swal.fire({
        icon: "success",
        title: "Message Sent!",
        text: response.data.message || "Your message has been sent successfully.",
        confirmButtonText: "OK",
      });

      setFormData({
        name: "", // name matches formData keys now
        email: "",
        number: "",
        subject: "",
        message: "",
      });
    } catch (error) {
      console.error("Submission Error:", error);
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: error.response?.data?.message || "Failed to send your message. Please try again later.",
        confirmButtonText: "Retry",
      });
    }
  };


  return (
    <Fragment>
      <Header />
      <PageHeader title={"Get In Touch! "} curPage={"Contact Us"} />

      <div className="py-5" style={{ 
        backgroundColor: "#F5F3FF", 
        fontFamily: "'Nunito', sans-serif",
        position: "relative",
        overflow: "hidden"
      }}>
        {/* Playful Floating Background Elements (Neon Bright) */}
        <div className="floating-anim" style={{ position: 'absolute', top: '5%', left: '5%', fontSize: '3rem', opacity: 0.4, color: '#A78BFA' }}>🪐</div>
        <div className="floating-anim" style={{ position: 'absolute', top: '65%', left: '2%', fontSize: '4rem', opacity: 0.3, color: '#FCD34D', animationDelay: '1s' }}>⭐</div>
        <div className="floating-anim" style={{ position: 'absolute', top: '15%', left: '40%', fontSize: '2.5rem', opacity: 0.5, color: '#34D399', animationDelay: '2s' }}>➕</div>
        <div className="floating-anim" style={{ position: 'absolute', bottom: '15%', left: '35%', fontSize: '3.5rem', opacity: 0.4, color: '#F43F5E', animationDelay: '0.5s' }}>➖</div>
        <div className="floating-anim" style={{ position: 'absolute', top: '10%', right: '10%', fontSize: '3rem', opacity: 0.5, color: '#8B5CF6', animationDelay: '1.5s' }}>🚀</div>
        <div className="floating-anim" style={{ position: 'absolute', bottom: '15%', right: '5%', fontSize: '4rem', opacity: 0.6, animationDelay: '2.5s' }}>💡</div>
        <div className="floating-anim" style={{ position: 'absolute', top: '45%', right: '3%', fontSize: '2.5rem', opacity: 0.4, color: '#F59E0B', animationDelay: '0.8s' }}>✖️</div>

        <div className="container" style={{ position: "relative", zIndex: 2 }}>
          {/* Top section with Cards and Map */}
          <div className="row g-5 mb-5 align-items-center">
            <div className="col-lg-5">
              <div className="text-center text-lg-start mb-5">
                <span className="subtitle" style={{ 
                    color: "var(--lms-primary)", 
                    fontWeight: "900", 
                    textTransform: "uppercase", 
                    letterSpacing: "3px", 
                    fontSize: "0.85rem",
                    background: "rgba(139,92,246,0.12)",
                    padding: "8px 20px",
                    borderRadius: "50px",
                    display: "inline-block",
                    marginBottom: "20px"
                }}>
                  {subTitle}
                </span>
                <h2 className="display-4 fw-bold mb-4" style={{ 
                    color: "var(--lms-text)", 
                    fontFamily: "'Baloo 2', sans-serif",
                    lineHeight: "1.1" 
                }}>
                  Join Our <span style={{ color: "var(--lms-primary)" }}>Galaxy</span> of Learning
                </h2>
                <p className="lead text-muted" style={{ fontSize: "1.1rem", fontWeight: "600" }}>
                  Have a question or just want to say hello? Our team is always here to help you on your adventure!
                </p>
              </div>

              <div className="d-flex flex-column gap-4">
                {[
                  { title: "Our Space Station", desc: "Colombo, Sri Lanka", icon: "icofont-location-pin", color: "#8B5CF6" },
                  { title: "Call Base Camp", desc: "+94 76 552 3093", icon: "icofont-ui-call", color: "#10B981" },
                  { title: "Send a Signal", desc: "mathsbuddy.info@gmail.com", icon: "icofont-envelope", color: "#F59E0B" },
                  { title: "Visit us Online", desc: "www.mathsbuddy.com", icon: "icofont-globe", color: "#0EA5E9" }
                ].map((val, i) => (
                  <div className="contact-info-card" key={i} style={{
                    background: "#fff",
                    padding: "20px",
                    borderRadius: "24px",
                    boxShadow: "0 8px 0 rgba(0,0,0,0.03)",
                    border: "3px solid #F3F4F6",
                    display: "flex",
                    alignItems: "center",
                    gap: "20px",
                    transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                    cursor: "pointer"
                  }}>
                    <div style={{
                      width: "65px",
                      height: "65px",
                      borderRadius: "18px",
                      background: val.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.8rem",
                      color: "#fff",
                      boxShadow: `0 8px 15px ${val.color}40`,
                      flexShrink: 0
                    }}>
                      <i className={val.icon}></i>
                    </div>
                    <div>
                      <h5 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: "800", marginBottom: "4px", color: "var(--lms-text)" }}>{val.title}</h5>
                      <p style={{ margin: 0, color: "#6B7280", fontWeight: "700", fontSize: "0.95rem" }}>{val.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="col-lg-7">
              <div style={{
                  padding: "15px",
                  background: "#fff",
                  borderRadius: "40px",
                  boxShadow: "0 25px 50px -12px rgba(0,0,0,0.15)",
                  border: "4px solid #fff",
                  position: "relative"
              }}>
                <div style={{
                    borderRadius: "32px",
                    overflow: "hidden",
                    height: "550px",
                    border: "8px solid #F3F4F6"
                }}>
                  <GoogleMap />
                </div>
                {/* Playful Floating Badge on Map */}
                <div style={{
                    position: "absolute",
                    bottom: "-20px",
                    right: "40px",
                    background: "var(--lms-accent)",
                    color: "#fff",
                    padding: "15px 30px",
                    borderRadius: "50px",
                    fontWeight: "900",
                    fontSize: "1.1rem",
                    boxShadow: "0 10px 0 #D97706",
                    transform: "rotate(3deg)"
                }}>
                  Find Our Magic Lab! 📍
                </div>
              </div>
            </div>
          </div>

          {/* Bottom section with form */}
          <div className="row justify-content-center mt-5 pt-lg-5">
            <div className="col-lg-10">
              <div className="contact-form-container" style={{
                  background: "#fff",
                  borderRadius: "50px",
                  padding: "60px 40px",
                  boxShadow: "0 30px 60px -15px rgba(139, 92, 246, 0.2)",
                  border: "10px solid #ede9fe",
                  position: "relative"
              }}>
                <div className="text-center mb-5">
                  <h2 style={{ 
                      fontFamily: "'Baloo 2', sans-serif", 
                      fontWeight: "900", 
                      color: "var(--lms-text)",
                      fontSize: "2.8rem"
                  }}>
                    Send Us a <span style={{ color: "var(--lms-primary)" }}>Magic Message</span>
                  </h2>
                  <p className="text-muted fw-bold" style={{ fontSize: "1.1rem" }}>
                    Have a secret math riddle or need help? Fill out the form below!
                  </p>
                </div>

                <form className="contact-form" onSubmit={handleSubmit}>
                  <div className="row g-4">
                    <div className="col-md-6">
                       <label style={{ fontWeight: "800", marginBottom: "10px", color: "var(--lms-primary)", marginLeft: "15px" }}>Full Name</label>
                      <input
                        className="lms-input"
                        type="text"
                        name="name"
                        placeholder="What should we call you? *"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        style={{
                            width: "100%",
                            padding: "18px 25px",
                            borderRadius: "50px",
                            border: "3px solid #EDE9FE",
                            fontSize: "1.1rem",
                            fontWeight: "700",
                            outline: "none",
                            background: "#F9FAFB"
                        }}
                      />
                    </div>
                    <div className="col-md-6">
                      <label style={{ fontWeight: "800", marginBottom: "10px", color: "var(--lms-primary)", marginLeft: "15px" }}>Email Address</label>
                      <input
                        className="lms-input"
                        type="email"
                        name="email"
                        placeholder="Where can we reply? *"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        style={{
                            width: "100%",
                            padding: "18px 25px",
                            borderRadius: "50px",
                            border: "3px solid #EDE9FE",
                            fontSize: "1.1rem",
                            fontWeight: "700",
                            outline: "none",
                            background: "#F9FAFB"
                        }}
                      />
                    </div>
                    <div className="col-12">
                      <label style={{ fontWeight: "800", marginBottom: "10px", color: "var(--lms-primary)", marginLeft: "15px" }}>Message Subject</label>
                      <input
                        className="lms-input"
                        type="text"
                        name="subject"
                        placeholder="What's this about? *"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        style={{
                            width: "100%",
                            padding: "18px 25px",
                            borderRadius: "50px",
                            border: "3px solid #EDE9FE",
                            fontSize: "1.1rem",
                            fontWeight: "700",
                            outline: "none",
                            background: "#F9FAFB"
                        }}
                      />
                    </div>
                    <div className="col-12">
                      <label style={{ fontWeight: "800", marginBottom: "10px", color: "var(--lms-primary)", marginLeft: "15px" }}>Your Message</label>
                      <textarea
                        className="lms-input"
                        rows="6"
                        name="message"
                        placeholder="Type your magical message here..."
                        value={formData.message}
                        onChange={handleChange}
                        required
                        style={{
                            width: "100%",
                            padding: "25px",
                            borderRadius: "32px",
                            border: "3px solid #EDE9FE",
                            fontSize: "1.1rem",
                            fontWeight: "700",
                            outline: "none",
                            background: "#F9FAFB"
                        }}
                      ></textarea>
                    </div>
                    <div className="col-12 text-center mt-5">
                      <button
                        type="submit"
                        className="lab-btn"
                        style={{ 
                            fontSize: "1.3rem", 
                            padding: "20px 60px", 
                            background: "var(--lms-primary)",
                            border: "none",
                            borderRadius: "50px",
                            boxShadow: "0 10px 0 var(--lms-primary-dark)",
                            transition: "all 0.2s"
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "translateY(-5px)";
                            e.currentTarget.style.boxShadow = "0 15px 0 var(--lms-primary-dark)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "0 10px 0 var(--lms-primary-dark)";
                        }}
                      >
                         ✨ {btnText} ✨
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>

        <style>{`
            .contact-info-card:hover {
                transform: translateX(10px);
                border-color: var(--lms-primary-light) !important;
                box-shadow: 0 15px 30px rgba(139, 92, 246, 0.1) !important;
            }
            .lms-input:focus {
                border-color: var(--lms-primary) !important;
                background: #fff !important;
                box-shadow: 0 0 0 6px rgba(139, 92, 246, 0.1) !important;
            }
            @media (max-width: 991px) {
                .display-4 { font-size: 2.5rem !important; }
                .contact-form-container { padding: 40px 20px !important; }
            }
        `}</style>
      </div>

      <Footer />
    </Fragment>
  );


    
};

export default ContactPage;
