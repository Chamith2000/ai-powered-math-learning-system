import React, { useRef, useState } from "react";
import Webcam from "react-webcam";

const videoConstraints = {
  width: 320,
  height: 240,
  facingMode: "user",
};

const FaceCapture = ({ onCapture }) => {
  const webcamRef = useRef(null);
  const [image, setImage] = useState(null);

  const capture = () => {
    const imgSrc = webcamRef.current.getScreenshot();
    setImage(imgSrc);
    onCapture(imgSrc); // Pass image to parent component
  };

  return (
    <div style={{ textAlign: "center", marginTop: "1rem", marginBottom: "30px" }}>
      <Webcam
        audio={false}
        style={{ borderRadius: "24px", border: "3px solid #E0E7FF", boxShadow: "0 4px 20px rgba(79, 70, 229, 0.15)" }}
        height={240}
        width={320}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        videoConstraints={videoConstraints}
      />
      <br />
      <button
        type="button"
        onClick={capture}
        style={{
          marginTop: "12px",
          padding: "12px 24px",
          borderRadius: "50px",
          background: "linear-gradient(135deg, #4F46E5 0%, #4338CA 100%)",
          color: "white",
          border: "none",
          fontWeight: "700",
          fontSize: "1rem",
          fontFamily: "'Baloo 2', 'Nunito', sans-serif",
          cursor: "pointer"
        }}
      >
        Capture Face 📸
      </button>
      {image && (
        <div style={{ marginTop: "1rem" }}>
          <img src={image} alt="Captured face" width="150" style={{ borderRadius: "20px", border: "2px solid #22C55E", boxShadow: "0 4px 15px rgba(34, 197, 94, 0.2)" }} />
        </div>
      )}
    </div>
  );
};

export default FaceCapture;
