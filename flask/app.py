import eventlet
eventlet.monkey_patch()

from flask import Flask, request, jsonify
import torch
import torch.nn as nn
import pytorch_lightning as pl
import tensorflow as tf
import joblib
import requests
from ultralytics import YOLO
import numpy as np
import pandas as pd

import cv2
from flask_cors import CORS
from model_defs.student_transformer import StudentTransformerModel

import os
import cv2
import base64
from io import BytesIO
from PIL import Image
from tensorflow.keras.models import load_model
from werkzeug.utils import secure_filename
from flask_socketio import SocketIO, emit
from insightface.app import FaceAnalysis
import mediapipe as mp
from mediapipe.python.solutions import face_detection as mp_face_detection
import whisper
import shutil


# ---------------- APP ----------------
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": ["http://localhost:3000","http://localhost:5173"]}})

socketio = SocketIO(
    app,
    cors_allowed_origins=["http://localhost:3000"],
    async_mode="eventlet",
    logger=False,
    engineio_logger=False
)

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# ===================== ADDED (Paper Mode Toggle for Object Detection) =====================
# OFF by default (so it won't run unless you enable it during papers/demo)
OBJECT_STREAM_ENABLED = False

@socketio.on("object_stream_enable")
def on_object_stream_enable(data):
    """
    Frontend:
      socket.emit("object_stream_enable", { enabled: true })  -> starts object detection streaming
      socket.emit("object_stream_enable", { enabled: false }) -> stops it
    """
    global OBJECT_STREAM_ENABLED
    OBJECT_STREAM_ENABLED = bool((data or {}).get("enabled", True))
    emit("object_stream_status", {"enabled": OBJECT_STREAM_ENABLED})
# =================== END ADDED (Paper Mode Toggle for Object Detection) ===================


# ===================== ADDED (Emotion Capture) =====================
# ---- Emotion Detection Setup (same style as your previous project) ----
emotion_dict = {
    0: "Angry", 1: "Disgusted", 2: "Fearful",
    3: "Happy", 4: "Neutral", 5: "Sad", 6: "Surprised"
}

# Try common paths (keep flexible because your models are inside /models now)
EMOTION_MODEL_CANDIDATES = [
    ("models/emotion_model.h5", "models/emotion.weights.h5"),
    ("models/emotion/emotion_model.h5", "models/emotion/emotion.weights.h5"),
    ("emotion_model.h5", "emotion.weights.h5"),
]

model_emotion = None
emotion_model_path = None
emotion_weights_path = None

for m_path, w_path in EMOTION_MODEL_CANDIDATES:
    if os.path.exists(m_path) and os.path.exists(w_path):
        emotion_model_path = m_path
        emotion_weights_path = w_path
        break

try:
    if emotion_model_path and emotion_weights_path:
        model_emotion = load_model(emotion_model_path)
        model_emotion.load_weights(emotion_weights_path)
    else:
        print("⚠️ Emotion model files not found. Checked:", EMOTION_MODEL_CANDIDATES)
except Exception as e:
    print("⚠️ Failed to load emotion model:", e)
    model_emotion = None

face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)
if face_cascade.empty():
    print("⚠️ Could not load Haar cascade from OpenCV data path.")

# ---- FaceNet / InsightFace / MediaPipe Detection Setup ----
face_detection = mp_face_detection.FaceDetection(model_selection=0, min_detection_confidence=0.6)

# Load the model once globally
face_app = FaceAnalysis(name="buffalo_l", providers=['CPUExecutionProvider'])
face_app.prepare(ctx_id=0)

def get_embedding(image_np):
    faces = face_app.get(image_np)
    if not faces:
        raise ValueError("No face detected.")
    # Use the first detected face
    return faces[0].embedding

def extract_mp_face_roi(img_rgb):
    """
    Given an RGB image, attempt to extract a 48x48 face ROI for emotion model.
    Uses MediaPipe face detection, fall back to Haar cascade.
    Returns: a 48x48 float32 numpy array or None.
    """
    h, w = img_rgb.shape[:2]
    # Try MediaPipe first
    mp_result = face_detection.process(img_rgb)
    if mp_result and mp_result.detections:
        det = max(mp_result.detections, key=lambda d: d.score[0] if d.score else 0)
        bbox = det.location_data.relative_bounding_box
        x = max(0, int(bbox.xmin * w))
        y = max(0, int(bbox.ymin * h))
        bw = min(w - x, int(bbox.width * w))
        bh = min(h - y, int(bbox.height * h))
        
        if bw > 10 and bh > 10:
            gray = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2GRAY)
            roi = gray[y:y+bh, x:x+bw]
            return cv2.resize(roi, (48, 48)).astype("float32")

    # Fallback to Haar Cascade
    gray = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2GRAY)
    faces = face_cascade.detectMultiScale(
        gray, scaleFactor=1.1, minNeighbors=5, minSize=(40, 40)
    )
    if len(faces) > 0:
        x, y, bw, bh = max(faces, key=lambda b: b[2] * b[3])
        roi = gray[y:y+bh, x:x+bw]
        if roi.size > 0:
            return cv2.resize(roi, (48, 48)).astype("float32")
    
    return None

# =================== END ADDED (Emotion Capture) ====================

# ---------------- WHISPER MODEL (Transcription) ----------------
# Load the Whisper model globally. "base" is a good balance of speed/accuracy.
# Note: This will download the model (~140MB) on first run.
try:
    print("Loading Whisper model (base)...")
    transcribe_model = whisper.load_model("base", device=device)
    print("Whisper model loaded successfully.")
except Exception as e:
    print(f"⚠️ Failed to load Whisper model: {e}")
    transcribe_model = None

# Ensure an uploads directory exists
UPLOAD_FOLDER = "uploads"
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)


def predict_emotion_from_dataurl(image_dataurl: str):
    """
    Input: "data:image/jpeg;base64,...." OR "....base64...."
    Output: (emotion_label, confidence_float)
    """
    if model_emotion is None:
        return ("Model Not Loaded", 0.0)

    img_data = (image_dataurl or "").strip()
    if not img_data:
        return ("No Image", 0.0)

    if "," in img_data:
        img_data = img_data.split(",", 1)[1]

    image_bytes = base64.b64decode(img_data)
    pil_img = Image.open(BytesIO(image_bytes)).convert("RGB")
    img_np = np.array(pil_img)

    roi_ready = extract_mp_face_roi(img_np)
    if roi_ready is None:
        return ("No Face", 0.0)

    roi_ready = np.expand_dims(np.expand_dims(roi_ready, -1), 0)  # (1,48,48,1)

    pred = model_emotion.predict(roi_ready, verbose=0)[0]
    idx = int(np.argmax(pred))
    emotion = emotion_dict.get(idx, "Unknown")
    confidence = float(pred[idx])
    return (emotion, confidence)


@socketio.on("connect")
def on_connect():
    # optional: log connect
    # print("Socket client connected")
    emit("emotion_result", {"emotion": "Connected", "confidence": 1.0})


@socketio.on("send_image")
def on_send_image(image_data):
    """
    Frontend emits: socket.emit("send_image", imageData);
    (see your AutoCapture.jsx) :contentReference[oaicite:5]{index=5}
    """
    emotion, confidence = predict_emotion_from_dataurl(image_data)
    emit("emotion_result", {"emotion": emotion, "confidence": round(confidence, 4)})

@socketio.on("send_object_image")
def on_send_object_image(image_data):
    if not OBJECT_STREAM_ENABLED:
        return

    if not image_data:
        emit("object_result", {"error": "No Image", "detections": [], "num_detections": 0})
        return

    try:
        img_data = image_data.strip()
        if "," in img_data:
            img_data = img_data.split(",", 1)[1]

        image_bytes = base64.b64decode(img_data)
        pil_img = Image.open(BytesIO(image_bytes)).convert("RGB")
        img_np = np.array(pil_img)

        # YOLO expects BGR if using cv2, but Ultralytics can handle numpy RGB too.
        # To match your current /predict-object behavior, convert to BGR:
        image_bgr = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)

        detections = detect_objects_with_yolov8(image_bgr)

        # Also predict emotion from the same image data
        emotion, confidence = predict_emotion_from_dataurl(image_data)
        emit("emotion_result", {"emotion": emotion, "confidence": round(confidence, 4)})

        emit("object_result", {
            "detections": detections,
            "num_detections": len(detections)
        })

    except Exception as e:
        emit("object_result", {
            "error": str(e),
            "detections": [],
            "num_detections": 0
        })

# ---------------- LOAD MODEL 1: Difficulty + Count ----------------
recommender = tf.keras.models.load_model(
    "models/student_recommender_model.h5",
    custom_objects={"mse": tf.keras.losses.mse}
)
recommend_scaler = joblib.load("models/student_recommender_scaler.pkl")
label_encoder = joblib.load("models/student_recommender_label_encoder.pkl")

# ---------------- LOAD MODEL 2: Current Performance ----------------
feature_cols = [
    "time_since_prev",
    "cum_interactions",
    "cum_score_mean",
    "score_per_difficulty",
    "roll_mean_score_3",
    "roll_mean_score_5",
    "roll_mean_score_10",
    "roll_sum_time_spent_3",
    "roll_sum_time_spent_5",
    "roll_mean_wait_3",
    "roll_mean_wait_5",
    "difficulty",
    "wait_time",
    "resource_score",
    "time_spent",
]

transformer = StudentTransformerModel(d_in=len(feature_cols))
transformer.load_state_dict(torch.load("models/student_transformer_model.pth", map_location=device))
transformer.to(device)
transformer.eval()

# ---------------- LOAD MODEL 3: Student Future Forecast (LSTM) ----------------

# Feature columns the model was trained on (21 features)
FORECAST_FEATURE_COLS = [
    "week_avg_score",
    "week_std_score",
    "week_avg_difficulty",
    "week_total_time_spent",
    "week_avg_wait",
    "week_resource_score",
    "interactions",
    "cum_score_mean",
    "score_per_difficulty",
    "roll_mean_score_3",
    "roll_sum_time_spent_3",
    "roll_mean_wait_3",
    "roll_sum_time_spent_5",
    "roll_mean_wait_5",
    "roll_sum_time_spent_10",
    "roll_mean_wait_10",
    "score_trend_3w",
    "score_trend_5w",
    "gap_from_peak",
    "gap_from_trough",
    "score_momentum",
]
FORECAST_SEQ_LEN = 10


class StudentForecastModel(pl.LightningModule):
    """LSTM model that predicts next 4 absolute interaction scores."""
    def __init__(self, input_dim, hidden_dim=128, lr=1e-3):
        super().__init__()
        self.save_hyperparameters()
        self.lstm = nn.LSTM(
            input_dim, hidden_dim,
            batch_first=True, num_layers=3, dropout=0.3,
        )
        self.head = nn.Sequential(
            nn.Linear(hidden_dim, hidden_dim),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(hidden_dim, hidden_dim // 2),
            nn.ReLU(),
            nn.Linear(hidden_dim // 2, 4),
        )

    def forward(self, x):
        _, (h_n, _) = self.lstm(x)
        return self.head(h_n[-1])


def _make_forecast_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    df = df.sort_values(["student_id", "timestamp"]).reset_index(drop=True)

    # rename raw columns to pipeline names (no cum_interactions rename)
    df = df.rename(columns={
        "score":          "week_avg_score",
        "time_spent":     "week_total_time_spent",
        "wait_time":      "week_avg_wait",
        "resource_score": "week_resource_score",
        "difficulty":     "week_avg_difficulty",
    })

    # compute interactions exactly like notebook Cell 4
    df["interactions"] = df.groupby("student_id").cumcount() + 1

    g_score = df.groupby("student_id")["week_avg_score"]

    df["week_std_score"] = (
        g_score.transform(lambda x: x.rolling(3, min_periods=1).std()).fillna(0)
    )

    df["score_trend_3w"] = (
        g_score.transform(lambda x: x.rolling(3).apply(
            lambda s: np.polyfit(range(len(s)), s, 1)[0], raw=True
        ))
    ).fillna(0)

    df["score_trend_5w"] = (
        g_score.transform(lambda x: x.rolling(5).apply(
            lambda s: np.polyfit(range(len(s)), s, 1)[0], raw=True
        ))
    ).fillna(0)

    df["gap_from_peak"]   = g_score.transform(lambda x: x.cummax()) - df["week_avg_score"]
    df["gap_from_trough"] = df["week_avg_score"] - g_score.transform(lambda x: x.cummin())
    df["score_momentum"]  = g_score.transform(lambda x: x.diff(2)).fillna(0)

    return df


# Load feature & target scalers (saved alongside checkpoint during training)
forecast_scaler        = joblib.load("models/forecast_feature_scaler.pkl")
forecast_target_scaler = joblib.load("models/forecast_target_scaler.pkl")

forecast_model = StudentForecastModel.load_from_checkpoint(
    "models/student_forecast_model.ckpt",
    input_dim=len(FORECAST_FEATURE_COLS),
)
forecast_model.to(device)
forecast_model.eval()

# ---------------- ROUTES ----------------

@app.route("/recommend", methods=["POST"])
def recommend():
    data = request.json

    X = np.array([[
        data["total_time"], data["waited_time"], data["total_q"],
        data["answered"], data["correct"], data["wrong"], data["marks"],
        data["correct"]/data["answered"] if data["answered"] else 0,
        data["wrong"]/data["answered"] if data["answered"] else 0,
        data["answered"]/data["total_time"] if data["total_time"] else 0,
        1 - data["waited_time"]/data["total_time"] if data["total_time"] else 0,
        data["answered"]/data["total_q"] if data["total_q"] else 0,
        data["correct"]/data["total_q"] if data["total_q"] else 0,
        data["wrong"]/data["total_q"] if data["total_q"] else 0,
        data["total_time"]/data["answered"] if data["answered"] else data["total_time"],
        data["waited_time"]/data["total_time"] if data["total_time"] else 0,
        data["marks"]/100
    ]])

    Xs = recommend_scaler.transform(X)
    diff_pred, count_pred = recommender.predict(Xs)

    difficulty = label_encoder.inverse_transform([np.argmax(diff_pred)])[0]
    count = int(count_pred[0][0])

    return jsonify({
        "recommended_difficulty": difficulty,
        "recommended_question_count": count
    })



scaler = joblib.load("models/robust_scaler_current_perf.joblib")

SCALED_COLS = [
    "time_since_prev",
    "cum_interactions",
    "cum_score_mean",
    "score_per_difficulty",
    "roll_mean_score_3",
    "roll_mean_score_5",
    "roll_mean_score_10",
    "roll_sum_time_spent_3",
    "roll_sum_time_spent_5",
    "roll_mean_wait_3",
    "roll_mean_wait_5",
    "wait_time",
    "resource_score",
    "time_spent"
]

def preprocess_for_inference(df, scaler, max_len=32):
    X_scaled = scaler.transform(df[SCALED_COLS].values.astype("float32"))

    #  get difficulty UNCHANGED
    difficulty = df["difficulty"].values.reshape(-1, 1).astype("float32")

    # reassemble features in correct order
    X_final = np.concatenate(
        [
            X_scaled[:, :11],    # first 11 scaled features
            difficulty,          # raw difficulty
            X_scaled[:, 11:],    # remaining scaled features
        ],
        axis=1
    )

    return X_final

@app.route("/current-performance", methods=["POST"])
def current_performance():
    data = request.json

    # Convert JSON rows → DataFrame
    df = pd.DataFrame(data["rows"])

    # Preprocess exactly like training
    sequence = preprocess_for_inference(df, scaler)

    # Tensor conversion
    x = torch.tensor(sequence, dtype=torch.float32).unsqueeze(0).to(device)

    with torch.no_grad():
        score, diff, improve_logit = transformer(x)

    return jsonify({
        "next_score": float(score.item()),
        "next_difficulty": float(diff.item()),
        "improved_probability": float(torch.sigmoid(improve_logit).item())
    })

@app.route("/future-forecast", methods=["POST"])
def future_forecast():
    """
    Predict the next 4 interaction scores for a student.

    IMPORTANT — units must match training data:
      - time_spent  : MINUTES (e.g. 86.11), NOT seconds
      - wait_time   : MINUTES (e.g. 10.88), NOT seconds

    The rolling/cumulative columns (cum_score_mean, roll_mean_score_3, etc.)
    must be pre-computed from the student's FULL interaction history,
    exactly as stored in the dataset CSV. Passing only 10 raw rows and
    recomputing these would produce wrong values.

    Expected JSON body:
    {
        "rows": [
            {
                "student_id": 564,
                "timestamp": "2024-01-19",
                "score": 44.46,
                "difficulty": 2,
                "wait_time": 10.88,
                "time_spent": 86.11,
                "resource_score": 0.787,
                "cum_interactions": 6,
                "cum_score_mean": 39.685,
                "score_per_difficulty": 22.23,
                "roll_mean_score_3": 42.601,
                "roll_sum_time_spent_3": 275.06,
                "roll_mean_wait_3": 11.446,
                "roll_sum_time_spent_5": 515.12,
                "roll_mean_wait_5": 11.94,
                "roll_sum_time_spent_10": 632.8,
                "roll_mean_wait_10": 12.635
            },
            ...  (at least 10 rows for the same student)
        ]
    }
    """
    data = request.json

    if not data or "rows" not in data:
        return jsonify({"error": "Missing 'rows' in request body"}), 400

    try:
        df = pd.DataFrame(data["rows"])

        required_cols = {
            "student_id", "timestamp", "score", "difficulty",
            "time_spent", "wait_time", "resource_score",
            "cum_interactions", "cum_score_mean", "score_per_difficulty",
            "roll_mean_score_3", "roll_sum_time_spent_3", "roll_mean_wait_3",
            "roll_sum_time_spent_5", "roll_mean_wait_5",
            "roll_sum_time_spent_10", "roll_mean_wait_10",
        }
        missing = required_cols - set(df.columns)
        if missing:
            return jsonify({"error": f"Missing columns: {sorted(missing)}"}), 400

        # Build all 21 feature columns from raw rows
        feat_df = _make_forecast_features(df)

        if len(feat_df) < FORECAST_SEQ_LEN:
            return jsonify({
                "error": f"Need at least {FORECAST_SEQ_LEN} interactions, got {len(feat_df)}"
            }), 400

        feat_df = feat_df.sort_values("interactions")
        x_raw = feat_df.iloc[-FORECAST_SEQ_LEN:][FORECAST_FEATURE_COLS].values
        x_scaled = forecast_scaler.transform(x_raw)
        x_tensor = torch.tensor(x_scaled, dtype=torch.float32).unsqueeze(0).to(device)

        last_score    = float(feat_df["week_avg_score"].iloc[-1])
        avg_gap_days  = float(feat_df["time_since_prev"].median() / 86400)
        last_date     = pd.to_datetime(feat_df["timestamp"].iloc[-1])

        with torch.no_grad():
            y_scaled = forecast_model(x_tensor).cpu().numpy()           # [1, 4]

        # Inverse-transform back to real score range then clip
        y_real = forecast_target_scaler.inverse_transform(y_scaled)[0]  # [4]
        y_real = np.clip(y_real, 25, 100)

        predictions = {}
        for i, score in enumerate(y_real, start=1):
            predictions[f"interaction_plus_{i}"] = {
                "predicted_score": round(float(score), 2),
                "direction":       "improving" if score > last_score else "declining",
                "estimated_date":  (
                    last_date + pd.Timedelta(days=avg_gap_days * i)
                ).strftime("%Y-%m-%d"),
            }

        return jsonify({
            "last_score":  round(last_score, 2),
            "predictions": predictions,
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


HF_ENDPOINT = "https://Chamith2000-mcq-generator-new.hf.space/generate"

SECTION_INDEX = {
    "introduction": 0,
    "concept_explanation": 1,
    "worked_examples": 2,
    "practice_questions": 3,
    "word_problems": 4,
    "pacing": 5,
    "clarity": 6,
    "engagement": 7
}

# Helper: call HF Space
def call_hf(payload):
    try:
        resp = requests.post(
            HF_ENDPOINT,
            json=payload,
            timeout=60
        )
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        return {"error": str(e)}



# Helper: map section probs
def parse_sections(section_probs, threshold=0.85):
    probs = section_probs[0]
    scores = {k: probs[v] for k, v in SECTION_INDEX.items()}
    weak = [k for k, v in scores.items() if v >= threshold]
    return scores, weak



# Health
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


# MCQ GENERATION-
@app.route("/mcq/generate", methods=["POST"])
def mcq_generate():
    data = request.json

    payload = {
        "topic": data.get("topic"),
        "difficulty": data.get("difficulty"),
        "grade":data.get("grade"),
        "model_type": "question"
    }

    hf_resp = call_hf(payload)

    if "error" in hf_resp:
        return jsonify(hf_resp), 500

    return jsonify(hf_resp)


# TEACHER ANALYSIS (task_b)
@app.route("/teacher/analyze", methods=["POST"])
def teacher_analyze():
    data = request.json

    teacher_data = data.get("teacher_data")

    payload = {
        "teacher_data": {
            "task": "task_b",
            "teacher_guide": teacher_data.get("teacher_guide"),
            "student_feedback": teacher_data.get("student_feedback"),
            "time_spent": teacher_data.get("time_spent"),
            "grade":teacher_data.get("grade")
        },
        "model_type": "teacher"
    }

    hf_resp = call_hf(payload)

    if "error" in hf_resp:
        return jsonify(hf_resp), 500

    output = hf_resp["output"]

    section_scores, weak_sections = parse_sections(
        output["section_probs"],
        threshold=0.85
    )

    return jsonify({
        "overall_score": round(output["matching_score"], 3),
        "section_scores": section_scores,
        "weak_sections": weak_sections
    })



# ANSWER EVALUATION (task_a)
@app.route("/answer/evaluate", methods=["POST"])
def answer_evaluate():
    data = request.json

    payload = {
        "teacher_data": {
            "task": "task_a",
            "topic": data.get("topic"),
            "question": data.get("question"),
            "student_answer": data.get("student_answer"),
            "answer" : data.get("answer"),
            "grade": data.get("grade"),
        },
        "model_type": "analyze"
    }

    hf_resp = call_hf(payload)

    print(hf_resp)

    if "error" in hf_resp:
        return jsonify(hf_resp), 500

    output = hf_resp["output"]

    score = output["matching_score"]

    confidence = (
        "high" if score > 0.75
        else "medium" if score > 0.5
        else "low"
    )

    return jsonify({
        "matching_score": round(score, 3),
        "confidence": confidence
    })



# ===================== (Emotion Capture) =====================
@app.route("/emotion/predict", methods=["POST"])
def emotion_predict():
    """
    Body (JSON):
    {
      "image": "data:image/jpeg;base64,...."  OR  "....base64...."
    }

    Response:
    {
      "emotion": "Happy",
      "confidence": 0.93
    }
    """
    if model_emotion is None:
        return jsonify({
            "error": "Emotion model not loaded. Check emotion_model.h5 and emotion.weights.h5 paths."
        }), 500

    data = request.get_json(silent=True) or {}
    img_data = (data.get("image") or "").strip()
    if not img_data:
        return jsonify({"error": "Missing 'image' (base64)"}), 400

    try:
        if "," in img_data:
            img_data = img_data.split(",", 1)[1]

        image_bytes = base64.b64decode(img_data)
        pil_img = Image.open(BytesIO(image_bytes)).convert("RGB")
        img_np = np.array(pil_img)

        roi_ready = extract_mp_face_roi(img_np)
        if roi_ready is None:
            return jsonify({"emotion": "No Face Detected", "confidence": 0.0})

        # Keep it close to your previous style (no extra preprocessing changes)
        roi_ready = np.expand_dims(np.expand_dims(roi_ready, -1), 0)  # (1,48,48,1)

        pred = model_emotion.predict(roi_ready, verbose=0)[0]
        idx = int(np.argmax(pred))
        emotion = emotion_dict.get(idx, "Unknown")
        confidence = float(pred[idx])

        return jsonify({"emotion": emotion, "confidence": round(confidence, 4)})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/emotion/predict-file", methods=["POST"])
def emotion_predict_file():
    """
    Postman:
      - Body -> form-data
      - Key: image (type: File)
    """
    if model_emotion is None:
        return jsonify({
            "error": "Emotion model not loaded. Check emotion_model.h5 and emotion.weights.h5 paths."
        }), 500

    if "image" not in request.files:
        return jsonify({"error": "Missing file field 'image'"}), 400

    f = request.files["image"]
    if not f or f.filename.strip() == "":
        return jsonify({"error": "No file selected"}), 400

    try:
        # Read image bytes -> numpy
        img_bytes = f.read()
        pil_img = Image.open(BytesIO(img_bytes)).convert("RGB")
        img_np = np.array(pil_img)

        roi_ready = extract_mp_face_roi(img_np)
        if roi_ready is None:
            return jsonify({"emotion": "No Face Detected", "confidence": 0.0})

        roi_ready = np.expand_dims(np.expand_dims(roi_ready, -1), 0)  # (1,48,48,1)

        pred = model_emotion.predict(roi_ready, verbose=0)[0]
        idx = int(np.argmax(pred))
        emotion = emotion_dict.get(idx, "Unknown")
        confidence = float(pred[idx])

        return jsonify({"emotion": emotion, "confidence": round(confidence, 4)})

    except Exception as e:
        return jsonify({"error": str(e)}), 500
# =================== END (Emotion Capture) ====================

@app.route('/validate-face', methods=['POST'])
def validate_face():
    try:
        # ---- 1) Load image from either form-data file or JSON/base64 ----
        pil = None

        # A) multipart form-data file
        if 'image' in request.files:
            file = request.files['image']
            pil = Image.open(file.stream).convert('RGB')

        # B) JSON (or form-url-encoded) with base64 string
        if pil is None:
            data = request.get_json(silent=True) or request.form or {}
            img_data = (data.get("image") or "").strip()
            if not img_data:
                return jsonify({'valid': False, 'message': 'Missing image data'}), 400
            if "," in img_data:
                img_data = img_data.split(",", 1)[1]
            try:
                image_bytes = base64.b64decode(img_data)
            except Exception as e:
                return jsonify({'valid': False, 'message': f'Invalid base64: {e}'}), 400
            pil = Image.open(BytesIO(image_bytes)).convert('RGB')

        img_rgb = np.asarray(pil, dtype=np.uint8)
        h, w = img_rgb.shape[:2]

        # Optional: downscale huge images for stability/speed
        max_side = max(h, w)
        if max_side > 1600:
            scale = 1600 / max_side
            img_rgb = cv2.resize(img_rgb, (int(w*scale), int(h*scale)), interpolation=cv2.INTER_AREA)
            h, w = img_rgb.shape[:2]

        # ---- 2) InsightFace first (robust) ----
        try:
            faces = face_app.get(img_rgb)  # uses your global FaceAnalysis
            if faces:
                # Find largest face
                f = max(faces, key=lambda F: (F.bbox[2]-F.bbox[0])*(F.bbox[3]-F.bbox[1]))
                x1, y1, x2, y2 = map(int, f.bbox)
                bw, bh = max(0, x2-x1), max(0, y2-y1)
                if bw >= 40 and bh >= 40:
                    return jsonify({'valid': True, 'detector': 'insightface', 'bbox': [bw, bh]})
        except Exception:
            pass  # fall through

        # ---- 3) MediaPipe (RGB) ----
        mp_result = face_detection.process(img_rgb)
        if mp_result and mp_result.detections:
            for det in mp_result.detections:
                score = float(det.score[0]) if det.score else 0.0
                bbox = det.location_data.relative_bounding_box
                bw = int(bbox.width * w)
                bh = int(bbox.height * h)
                if score >= 0.5 and bw >= 40 and bh >= 40:
                    return jsonify({'valid': True, 'detector': 'mediapipe', 'conf': round(score, 3), 'bbox': [bw, bh]})

        # ---- 4) Haar fallback ----
        gray = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2GRAY)
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.05, minNeighbors=5, minSize=(40, 40))
        if len(faces) > 0:
            return jsonify({'valid': True, 'detector': 'haar', 'count': int(len(faces))})

        return jsonify({'valid': False, 'message': 'No proper face detected', 'debug': {'shape': [int(h), int(w)]}})
    except Exception as e:
        return jsonify({'valid': False, 'message': f'Error processing image: {str(e)}'}), 500


@app.route('/compare-faces', methods=['POST'])
def compare_faces():
    try:
        data = request.get_json()
        captured_image_b64 = data.get("captured_image")
        stored_image_url = data.get("stored_image_url")

        if not captured_image_b64 or not stored_image_url:
            return jsonify({"success": False, "message": "Missing image data"})

        # Load captured image (base64)
        img_data = captured_image_b64
        if "," in img_data:
            img_data = img_data.split(",", 1)[1]
        captured_bytes = base64.b64decode(img_data)
        captured_img = Image.open(BytesIO(captured_bytes)).convert('RGB')

        # Load stored image from URL
        response = requests.get(stored_image_url)
        stored_img = Image.open(BytesIO(response.content)).convert('RGB')

        # Convert to numpy
        captured_np = np.asarray(captured_img)
        stored_np = np.asarray(stored_img)

        # Preprocess and get embeddings
        captured_emb = get_embedding(captured_np)
        stored_emb = get_embedding(stored_np)

        # Compare embeddings (euclidean distance)
        distance = np.linalg.norm(captured_emb - stored_emb)
        threshold = 18  # adjust based on your model and validation set

        print(f"the distance {distance}")

        if distance < threshold:
            return jsonify({"success": True})
        else:
            return jsonify({"success": False, "message": "Faces do not match"})

    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

# ---------------- OBJECT DETECTION  ----------------
YOLO_OBJECT_MODEL_PATH = "/mnt/data/yolov8n.pt"
object_model = YOLO(YOLO_OBJECT_MODEL_PATH)

object_class_names = object_model.names

OBJECT_CLASSES_TO_DETECT = None

OBJECT_CLASSES_TO_DETECT = ["cell phone", "laptop"]

if OBJECT_CLASSES_TO_DETECT is not None:
    OBJECT_CLASSES_TO_DETECT_IDS = [
        cls_id for cls_id, name in object_class_names.items()
        if name in OBJECT_CLASSES_TO_DETECT
    ]
else:
    OBJECT_CLASSES_TO_DETECT_IDS = None


def detect_objects_with_yolov8(image_bgr):
    results = object_model(image_bgr)

    detections = []

    boxes = results[0].boxes
    if boxes is not None:
        xyxy = boxes.xyxy.cpu().numpy()
        conf = boxes.conf.cpu().numpy()
        cls = boxes.cls.cpu().numpy()

        for i in range(len(xyxy)):
            cls_id = int(cls[i])

            if (
                OBJECT_CLASSES_TO_DETECT_IDS is not None
                and cls_id not in OBJECT_CLASSES_TO_DETECT_IDS
            ):
                continue

            detections.append({
                "class_id": cls_id,
                "class_name": object_class_names[cls_id],
                "confidence": float(conf[i]),
                "bbox": {
                    "x1": float(xyxy[i][0]),
                    "y1": float(xyxy[i][1]),
                    "x2": float(xyxy[i][2]),
                    "y2": float(xyxy[i][3]),
                }
            })

    return detections

@app.route("/predict-object", methods=["POST"])
def predict():
    if "image" not in request.files:
        return jsonify({"error": "No image file provided"}), 400

    file = request.files["image"]
    file_bytes = np.frombuffer(file.read(), np.uint8)
    image = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

    if image is None:
        return jsonify({"error": "Invalid image"}), 400

    try:
        detections = detect_objects_with_yolov8(image)

        return jsonify({
            "detections": detections,
            "num_detections": len(detections)
        })
    except Exception as e:
        return jsonify({
            "error": str(e),
            "detections": [],
            "num_detections": 0
        }), 500



@app.route("/transcribe", methods=["POST"])
def transcribe():
    """
    Accepts a video or audio file and returns the transcribed text.
    Form-data key: 'video' (file)
    """
    if transcribe_model is None:
        return jsonify({"error": "Transcription model not loaded"}), 500

    if "video" not in request.files:
        return jsonify({"error": "No file field 'video' found"}), 400

    file = request.files["video"]
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    try:
        # Save file temporarily
        filename = secure_filename(file.filename)
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)

        # Transcribe
        print(f"Transcribing: {filepath}...")
        result = transcribe_model.transcribe(filepath)
        text = result.get("text", "").strip()

        # Cleanup
        if os.path.exists(filepath):
            os.remove(filepath)

        return jsonify({
            "text": text,
            "filename": filename
        })

    except Exception as e:
        # Final cleanup attempt
        if 'filepath' in locals() and os.path.exists(filepath):
            os.remove(filepath)
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=5000, debug=True)