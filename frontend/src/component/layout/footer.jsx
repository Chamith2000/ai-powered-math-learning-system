import { useState } from "react";
import emailjs from "emailjs-com";
import Swal from "sweetalert2";
import { Link } from "react-router-dom";

const newsTitle = "Want Us To Contact through Email?";
const siteTitle = "Site Map";
const useTitle = "Useful Links";
const socialTitle = "Social Contact";
const supportTitle = "Our Support";

const siteList = [
  { text: "Documentation", link: "#" },
  { text: "Feedback", link: "#" },
];

const useList = [
  { text: "About Us", link: "about" },
  { text: "Help Link", link: "#" },
  { text: "Terms & Conditions", link: "#" },
  { text: "Contact Us", link: "contact" },
  { text: "Privacy Policy", link: "#" },
];

const socialList = [
  { text: "Facebook", link: "#" },
  { text: "Twitter", link: "#" },
  { text: "Instagram", link: "#" },
  { text: "YouTube", link: "#" },
  { text: "Github", link: "#" },
];

const supportList = [
  { text: "Help Center", link: "#" },
  { text: "Status", link: "#" },
  { text: "Changelog", link: "#" },
  { text: "Contact Support", link: "#" },
];

const Footer = () => {
  const [email, setEmail] = useState("");

  const handleChange = (e) => {
    setEmail(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const emailParams = {
      message: "User requested to be contacted via email.",
      fullName: email,
      email: email,
      subject: "User requested to be contacted via email.",
      // message: "User requested to be contacted via email.",
    };

    emailjs
      .send(
        process.env.REACT_APP_EMAILJS_SERVICE_ID,
        process.env.REACT_APP_EMAILJS_TEMPLATE_ID,
        emailParams,
        process.env.REACT_APP_EMAILJS_PUBLIC_KEY
      )
      .then(
        (result) => {
          Swal.fire({
            icon: "success",
            title: "Request Sent!",
            text: "We will contact you via email shortly.",
            confirmButtonText: "OK",
          });

          console.log(result.text);
        },
        (error) => {
          Swal.fire({
            icon: "error",
            title: "Oops...",
            text: "Failed to send your request. Please try again later.",
            confirmButtonText: "Retry",
          });

          console.log(error.text);
        }
      );

    setEmail("");
  };

  return (
    <div className="news-footer-wrap">
      {/* --- High Visibility Floating Math Decorations --- */}

      {/* Addition - Bright Blue */}
      <div className="floating-anim" style={{
        position: 'absolute', top: '10%', left: '5%', fontSize: '3.5rem',
        opacity: 0.5, color: '#3B82F6',
        textShadow: '0 0 15px rgba(59, 130, 246, 0.8)'
      }}>➕</div>

      {/* Multiplication - Sunny Yellow */}
      <div className="floating-anim" style={{
        position: 'absolute', top: '45%', left: '3%', fontSize: '3rem',
        opacity: 0.5, color: '#FBBF24', animationDelay: '1.5s',
        textShadow: '0 0 15px rgba(251, 191, 36, 0.8)'
      }}>✖️</div>

      {/* Division - Fresh Green */}
      <div className="floating-anim" style={{
        position: 'absolute', top: '15%', right: '5%', fontSize: '3.2rem',
        opacity: 0.5, color: '#34D399', animationDelay: '2s',
        textShadow: '0 0 15px rgba(52, 211, 153, 0.8)'
      }}>➗</div>

      {/* Geometry Shape - Circle (Bright Pink) */}
      <div className="floating-anim" style={{
        position: 'absolute', bottom: '15%', right: '3%', fontSize: '4rem',
        opacity: 0.4, color: '#F472B6', animationDelay: '0.8s',
        filter: 'drop-shadow(0 0 10px rgba(244, 114, 182, 0.6))'
      }}>●</div>

      {/* Percentage - Purple */}
      <div className="floating-anim" style={{
        position: 'absolute', top: '65%', right: '12%', fontSize: '3rem',
        opacity: 0.4, color: '#A855F7', animationDelay: '1.2s',
        textShadow: '0 0 15px rgba(168, 85, 247, 0.7)'
      }}>%</div>

      {/* Geometry Shape - Triangle (Sky Blue) */}
      <div className="floating-anim" style={{
        position: 'absolute', bottom: '25%', left: '12%', fontSize: '3.5rem',
        opacity: 0.4, color: '#60A5FA', animationDelay: '2.5s',
        filter: 'drop-shadow(0 0 10px rgba(96, 165, 250, 0.6))'
      }}>▲</div>

      <div className="news-letter">
        <div className="container">
          <div className="section-wrapper">
            <div className="news-title text-center">
              <h3>{newsTitle}</h3>
            </div>

            <div className="news-form">
              <form onSubmit={handleSubmit}>
                <div className="nf-list">
                  <input
                    type="email"
                    name="email"
                    placeholder="Enter Your Email Address"
                    value={email}
                    onChange={handleChange}
                    required
                  />
                  <input type="submit" name="submit" value="Contact Us" />
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <footer>
        <div className="footer-top padding-tb pt-0">
          <div className="container">
            <div className="row g-4 row-cols-xl-4 row-cols-md-2 row-cols-1 justify-content-center">
              <div className="col">
                <div className="footer-item">
                  <div className="footer-inner">
                    <div className="footer-content">
                      <div className="title">
                        <h4>{siteTitle}</h4>
                      </div>
                      <div className="content">
                        <ul className="lab-ul">
                          {siteList.map((val, i) => (
                            <li key={i}>
                              <a href={val.link}>{val.text}</a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col">
                <div className="footer-item">
                  <div className="footer-inner">
                    <div className="footer-content">
                      <div className="title">
                        <h4>{useTitle}</h4>
                      </div>
                      <div className="content">
                        <ul className="lab-ul">
                          {useList.map((val, i) => (
                            <li key={i}>
                              <a href={val.link}>{val.text}</a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col">
                <div className="footer-item">
                  <div className="footer-inner">
                    <div className="footer-content">
                      <div className="title">
                        <h4>{socialTitle}</h4>
                      </div>
                      <div className="content">
                        <ul className="lab-ul">
                          {socialList.map((val, i) => (
                            <li key={i}>
                              <a href={val.link}>{val.text}</a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col">
                <div className="footer-item">
                  <div className="footer-inner">
                    <div className="footer-content">
                      <div className="title">
                        <h4>{supportTitle}</h4>
                      </div>
                      <div className="content">
                        <ul className="lab-ul">
                          {supportList.map((val, i) => (
                            <li key={i}>
                              <a href={val.link}>{val.text}</a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Footer;
