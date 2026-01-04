from flask import Flask, request, jsonify
import numpy as np
import torch
import tensorflow as tf
import joblib
import requests

from model_defs.student_transformer import StudentTransformerModel
from model_defs.weekly_forecast import WeeklyForecastModel

# ===================== ADDED (Emotion Capture) =====================
import os
import cv2
import base64
from io import BytesIO
from PIL import Image
from tensorflow.keras.models import load_model
from werkzeug.utils import secure_filename

# ---------------- APP ----------------
app = Flask(__name__)
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

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
# =================== END ADDED (Emotion Capture) ====================


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

# ---------------- LOAD MODEL 3: Weekly Forecast ----------------
weekly_model = WeeklyForecastModel(input_dim=7)
weekly_model = WeeklyForecastModel.load_from_checkpoint(
    "models/weekly_model.ckpt",
    input_dim=7
)
weekly_model.to(device)
weekly_model.eval()

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


import joblib
import numpy as np
import pandas as pd

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
    x = torch.tensor(request.json["sequence"], dtype=torch.float32).unsqueeze(0).to(device)

    with torch.no_grad():
        preds = weekly_model(x).squeeze(0).cpu().numpy()

    return jsonify({
        "week_plus_1": float(preds[0]),
        "week_plus_2": float(preds[1]),
        "week_plus_3": float(preds[2]),
        "week_plus_4": float(preds[3]),
    })


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

        # Convert to grayscale for Haar + model input
        gray = cv2.cvtColor(img_np, cv2.COLOR_RGB2GRAY)

        faces = face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(40, 40)
        )

        if len(faces) == 0:
            return jsonify({"emotion": "No Face Detected", "confidence": 0.0})

        # Take largest face
        x, y, w, h = max(faces, key=lambda b: b[2] * b[3])
        roi = gray[y:y+h, x:x+w]

        if roi.size == 0:
            return jsonify({"emotion": "No Face Detected", "confidence": 0.0})

        roi_resized = cv2.resize(roi, (48, 48))
        roi_ready = roi_resized.astype("float32")

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

        gray = cv2.cvtColor(img_np, cv2.COLOR_RGB2GRAY)

        faces = face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(40, 40)
        )

        if len(faces) == 0:
            return jsonify({"emotion": "No Face Detected", "confidence": 0.0})

        x, y, w, h = max(faces, key=lambda b: b[2] * b[3])
        roi = gray[y:y+h, x:x+w]

        if roi.size == 0:
            return jsonify({"emotion": "No Face Detected", "confidence": 0.0})

        roi_resized = cv2.resize(roi, (48, 48)).astype("float32")
        roi_ready = np.expand_dims(np.expand_dims(roi_resized, -1), 0)  # (1,48,48,1)

        pred = model_emotion.predict(roi_ready, verbose=0)[0]
        idx = int(np.argmax(pred))
        emotion = emotion_dict.get(idx, "Unknown")
        confidence = float(pred[idx])

        return jsonify({"emotion": emotion, "confidence": round(confidence, 4)})

    except Exception as e:
        return jsonify({"error": str(e)}), 500
# =================== END (Emotion Capture) ====================


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


# TEACHER ANALYSIS (task_b)
@app.route("/teacher/analyze", methods=["POST"])
def teacher_analyze():
    data = request.json

    payload = {
        "teacher_data": {
            "task": "task_b",
            "teacher_guide": data.get("teacher_guide"),
            "student_feedback": data.get("student_feedback"),
            "time_spent": data.get("time_spent")
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
            "answer": data.get("answer")
        },
        "model_type": "teacher"
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


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=False)
