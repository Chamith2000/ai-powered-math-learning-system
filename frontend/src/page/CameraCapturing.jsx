import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useLocation } from 'react-router-dom';

const socket = io("http://localhost:5000");

function AutoCapture({ enableGamePopup = false, showFloatingEmotion = false }) {
  const emotionWindowRef = useRef([]);
  const [showModal, setShowModal] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState("Detecting...");
  const [popupInterval, setPopupInterval] = useState(localStorage.getItem("popupInterval") || "10");

  const getSuppressDuration = (value) => {
    switch (value) {
      case "5": return 5 * 60 * 1000;
      case "10": return 10 * 60 * 1000;
      case "30": return 30 * 60 * 1000;
      case "60": return 60 * 60 * 1000;
      default: return 10 * 60 * 1000;
    }
  };

  const shouldShowModal = () => {
    const nextPopupTime = localStorage.getItem("nextPopupTime");
    const now = Date.now();
    if (!nextPopupTime) return true;
    if (nextPopupTime === "never") return false;
    return now >= parseInt(nextPopupTime);
  };

  useEffect(() => {
    socket.on("emotion_result", (data) => {
      emotionWindowRef.current.push(data.emotion);
      setCurrentEmotion(data.emotion); // update floating stick
    });

    return () => socket.off("emotion_result");
  }, []);


  useEffect(() => {
    const interval = setInterval(() => {
      const emotions = emotionWindowRef.current;
      if (emotions.length === 0) return;

      // Count frequencies
      const counts = {};
      emotions.forEach((em) => {
        counts[em] = (counts[em] || 0) + 1;
      });

      // Get most frequent
      const mostFrequent = Object.entries(counts).reduce((a, b) => (b[1] > a[1] ? b : a))[0];
      console.log("Most frequent (last 5s):", mostFrequent);

      // Trigger popup if needed (only if enabled via props)
      if (
        enableGamePopup && 
        mostFrequent !== "Neutral" && 
        mostFrequent !== "Happy" && 
        mostFrequent !== "No Face" && 
        shouldShowModal()
      ) {
        setShowModal(true);
      }

      // Clear the 5-second window
      emotionWindowRef.current = [];
    }, 5000); // every 5 seconds

    return () => clearInterval(interval);
  }, [popupInterval, enableGamePopup]);


  const handleDismiss = () => {
    const delay = popupInterval === "never" ? "never" : Date.now() + getSuppressDuration(popupInterval);
    localStorage.setItem("popupInterval", popupInterval);
    localStorage.setItem("nextPopupTime", delay);
    setShowModal(false);
  };


  useEffect(() => {
    const video = document.createElement("video");
    video.setAttribute("autoplay", true);
    video.setAttribute("playsinline", true);
    video.style.display = "none";
    document.body.appendChild(video);

    let stream;
    let captureInterval;

    navigator.mediaDevices.getUserMedia({ video: true })
      .then((_stream) => {
        stream = _stream;
        video.srcObject = stream;

        video.onloadedmetadata = () => {
          captureInterval = setInterval(() => {
            const canvas = document.createElement("canvas");
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = canvas.toDataURL("image/jpeg");
            socket.emit("send_image", imageData);
          }, 10000); // Capture every 10s
        };
      })
      // .catch((err) => console.error("Camera access failed:", err));

    return () => {
      if (captureInterval) clearInterval(captureInterval);
      if (stream) stream.getTracks().forEach((track) => track.stop());
      document.body.removeChild(video);
    };
  }, []);

  return (
    <>
      {showFloatingEmotion && currentEmotion && (
        <div
          className="shadow-sm rounded-pill px-3 py-2 fw-bold"
          style={{
            position: "fixed",
            top: "100px",
            right: "20px",
            backgroundColor: "#fffdf0",
            border: "2px solid #ffca28",
            color: "#f57c00",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "14px",
            animation: "slideIn 0.5s ease-out"
          }}
        >
          <span>👀</span> 
          <span>Emotion: {currentEmotion}</span>
        </div>
      )}

      {showModal && (
        <div
          className="card border-0 shadow-lg"
          style={{
            position: "fixed",
            bottom: "30px",
            right: "30px",
            width: "350px",
            backgroundColor: "#fffdf0",
            borderRadius: "24px",
            border: "4px solid #ffca28",
            zIndex: 9999,
            animation: "slideIn 0.5s ease-out"
          }}
        >
          <div className="card-body p-4 text-center">
            <h3 className="fw-bold mb-3" style={{ color: "#f57c00" }}>😟 Oh no!</h3>
            <p className="fs-6 text-muted fw-bold mb-4">
              You look a little frustrated. Feeling stressed? How about a quick game to relax and recharge your brain?
            </p>

            <div className="d-flex align-items-center justify-content-center gap-2 mb-4 bg-white p-2 rounded-pill border border-warning border-opacity-50 shadow-sm">
              <label htmlFor="remind" className="text-secondary fw-bold small mb-0">Ask again in:</label>
              <select
                id="remind"
                className="form-select form-select-sm rounded-pill fw-bold border-0 shadow-none bg-transparent"
                style={{ width: "auto", color: "#f57c00", cursor: "pointer" }}
                value={popupInterval}
                onChange={(e) => {
                  const value = e.target.value;
                  setPopupInterval(value);
                  localStorage.setItem("popupInterval", value);
                }}
              >
                <option value="5">5 mins</option>
                <option value="10">10 mins</option>
                <option value="30">30 mins</option>
                <option value="60">1 hour</option>
                <option value="never">Never</option>
              </select>
            </div>

            <div className="d-flex gap-2 justify-content-center">
              <button
                className="btn btn-light rounded-pill fw-bold px-4 border border-secondary border-opacity-25 shadow-sm"
                onClick={handleDismiss}
              >
                No Thanks
              </button>
              <button
                className="btn btn-warning rounded-pill fw-bold px-4 shadow-sm"
                style={{ backgroundColor: "#ffca28", borderColor: "#ffca28", color: "#4e342e" }}
                onClick={() => {
                  setShowModal(false);
                  window.location.href = "/game-launch";
                }}
              >
                Let's Play! 🚀
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`
        @keyframes slideIn {
          from { transform: translateY(100px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </>
  );
}

export default AutoCapture;
