# Flask LMS AI Backend

A robust Flask-based backend server providing real-time AI capabilities for a Learning Management System (LMS). This server handles emotion detection, object detection (for exam monitoring), and FaceNet-based facial recognition/validation.

## 🚀 Features

- **Real-time Emotion Detection**: Analyzes student expressions via Socket.IO.
- **Exam Monitoring**: Detects prohibited objects (phones, etc.) during papers.
- **FaceNet Integration**:
  - **Face Validation**: Multi-stage detection (InsightFace, MediaPipe, Haar) to ensure a single valid face is present.
  - **Face Comparison**: High-accuracy face matching using 512-d embeddings.
- **Forecasting**: Weekly progress forecasts for students.

## 🛠️ Prerequisites

- **Python**: 3.12 (Strongly Recommended)
- **Environment**: Windows (Instructions provided for PowerShell)

## 📦 Setup & Installation

Follow these steps exactly to ensure all AI dependencies (which have specific version requirements) are installed correctly.

1. **Create a Virtual Environment**:
   ```powershell
   python -m venv .venv
   ```

2. **Activate the Virtual Environment**:
   ```powershell
   .\.venv\Scripts\Activate.ps1
   ```
   *Note: If you get a "Script execution is disabled" error, run `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process` in your terminal first.*

3. **Install Dependencies**:
   ```powershell
   # Use the venv's python directly to ensure no permission/global lock issues
   .\.venv\Scripts\python.exe -m pip install -r requirements.txt
   ```

## 🏃 Running the Application

Start the server using:
```powershell
python app.py
```

- **Server URL**: `http://localhost:5000`
- **Socket.IO**: `http://localhost:5000` (for real-time streams)

## 🔌 Key API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/validate-face` | `POST` | Validates if a single clear face exists in the provided base64 image. |
| `/compare-faces` | `POST` | Compares a captured face against a stored image URL. |
| `/train` | `POST` | Updates and saves underlying ML models. |

## ⚠️ Troubleshooting

- **Numpy Conflicts**: If you see "Numpy version mismatch" errors, ensure you are using `numpy<2.0.0` as specified in requirements.
- **MediaPipe Errors**: This project uses a specific import path for MediaPipe compatibility: `from mediapipe.python.solutions import face_detection`. Ensure you do not change this.
- **Model Files**: Ensure the `models/` directory and `facenet_keras.h5` are present in the root directory.
