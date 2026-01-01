from flask import Flask, request, jsonify, app
import numpy as np
import torch
import tensorflow as tf
import joblib
import requests

# ===================== ADDED (Emotion Capture) =====================
import os
import cv2
import base64
from io import BytesIO
from PIL import Image
from tensorflow.keras.models import load_model
from werkzeug.utils import secure_filename


from flask import Blueprint, request, jsonify
import os
import cv2
import base64
import numpy as np
from io import BytesIO
from PIL import Image
from tensorflow.keras.models import load_model

# ---------------- BLUEPRINT ----------------
emotion_bp = Blueprint("emotion", __name__)

# ---------------- EMOTION LABELS ----------------
emotion_dict = {
    0: "Angry",
    1: "Disgusted",
    2: "Fearful",
    3: "Happy",
    4: "Neutral",
    5: "Sad",
    6: "Surprised"
}

# ---------------- LOAD MODEL ----------------
MODEL_PATH = "models/emotion/emotion_model.h5"
WEIGHTS_PATH = "models/emotion/emotion.weights.h5"

model_emotion = None
try:
    if os.path.exists(MODEL_PATH) and os.path.exists(WEIGHTS_PATH):
        model_emotion = load_model(MODEL_PATH)
        model_emotion.load_weights(WEIGHTS_PATH)
    else:
        print("⚠️ Emotion model files not found")
except Exception as e:
    print("⚠️ Emotion model load failed:", e)
    model_emotion = None

# ---------------- FACE DETECTOR ----------------
face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)

# =====================================================
# 🔹 BASE64 IMAGE API
# =====================================================
@emotion_bp.route("/emotion/predict", methods=["POST"])
def predict_emotion_base64():

    if model_emotion is None:
        return jsonify({"error": "Emotion model not loaded"}), 500

    data = request.get_json()
    img_data = data.get("image", "")

    if not img_data:
        return jsonify({"error": "Missing base64 image"}), 400

    try:
        if "," in img_data:
            img_data = img_data.split(",")[1]

        image_bytes = base64.b64decode(img_data)
        img = Image.open(BytesIO(image_bytes)).convert("RGB")
        img_np = np.array(img)

        gray = cv2.cvtColor(img_np, cv2.COLOR_RGB2GRAY)

        faces = face_cascade.detectMultiScale(gray, 1.1, 5)

        if len(faces) == 0:
            return jsonify({"emotion": "No Face Detected", "confidence": 0.0})

        x, y, w, h = max(faces, key=lambda b: b[2] * b[3])
        face = gray[y:y+h, x:x+w]

        face = cv2.resize(face, (48, 48))
        face = face.astype("float32")
        face = np.expand_dims(np.expand_dims(face, -1), 0)

        pred = model_emotion.predict(face, verbose=0)[0]
        idx = int(np.argmax(pred))

        return jsonify({
            "emotion": emotion_dict[idx],
            "confidence": round(float(pred[idx]), 4)
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# =====================================================
# 🔹 FILE UPLOAD API
# =====================================================
@emotion_bp.route("/emotion/predict-file", methods=["POST"])
def predict_emotion_file():

    if model_emotion is None:
        return jsonify({"error": "Emotion model not loaded"}), 500

    if "image" not in request.files:
        return jsonify({"error": "No image file"}), 400

    try:
        file = request.files["image"]
        img = Image.open(file).convert("RGB")
        img_np = np.array(img)

        gray = cv2.cvtColor(img_np, cv2.COLOR_RGB2GRAY)
        faces = face_cascade.detectMultiScale(gray, 1.1, 5)

        if len(faces) == 0:
            return jsonify({"emotion": "No Face Detected", "confidence": 0.0})

        x, y, w, h = max(faces, key=lambda b: b[2] * b[3])
        face = gray[y:y+h, x:x+w]

        face = cv2.resize(face, (48, 48))
        face = np.expand_dims(np.expand_dims(face, -1), 0)

        pred = model_emotion.predict(face, verbose=0)[0]
        idx = int(np.argmax(pred))

        return jsonify({
            "emotion": emotion_dict[idx],
            "confidence": round(float(pred[idx]), 4)
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


HF_ENDPOINT = "https://Chamith2000-mcq-generator-new.hf.space/generate"

# MCQ GENERATION-
@app.route("/mcq/generate", methods=["POST"])
def mcq_generate():
    data = request.json

    payload = {
        "topic": data.get("topic"),
        "difficulty": data.get("difficulty"),
        "model_type": "question"
    }

    hf_resp = call_hf(payload)

    if "error" in hf_resp:
        return jsonify(hf_resp), 500

    return jsonify(hf_resp)

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

# ---------------- LOAD MODEL 3: Weekly Forecast ----------------
weekly_model = WeeklyForecastModel(input_dim=7)
weekly_model = WeeklyForecastModel.load_from_checkpoint(
    "models/weekly_model.ckpt",
    input_dim=7
)
weekly_model.to(device)
weekly_model.eval()