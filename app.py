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