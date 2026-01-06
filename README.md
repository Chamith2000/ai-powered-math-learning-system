# AI-powered-math-learning-system
AI-powered, emotion-aware personalized learning
system designed to improve Mathematics learning for age 8-10 students in Sri Lankan
international schools.

The system integrates real-time emotion recognition, adaptive
question generation, continuous progress monitoring, and teacher-side analytics to
enhance engagement, learning outcomes, and instructional quality.

## The solution works in four main components:

1. Adaptive Question Paper Generation – The system generates question papers
based on predefined categories and difficulty levels. It analyzes student
performance, including response time and accuracy, to adjust the number and
difficulty of future questions dynamically.

3. Emotion-Aware Engagement Monitoring – Facial recognition captures students’
emotional states (e.g., happy, frustrated, bored) in real-time. When
disengagement is detected, the system suggests short gamified breaks,
maintaining motivation and focus.

5. Continuous Progress Monitoring and Personalized Recommendation – The
system tracks each student’s learning progress, identifies competency levels,
and recommends appropriate lectures, exercises, and practice papers. Future
performance is forecasted through progress visualization, enabling goal-
oriented learning.

7. Teacher-Side Analytics and Feedback Integration – Teachers receive insights
about student engagement, section  specific weekness detection and feedback on lecture
effectiveness. The system provides actionable recommendations to improve
teaching content and strategies.

This integrated solution ensures personalized learning paths, real-time intervention,
and adaptive assessment, fostering better understanding and retention of Mathematics
concepts.

## Contents

- `frontend/` — React web app (student-facing learning UI)
- `backend/` — Node.js/Express API and services
- `teacher-dashboard-frontend/` — Teacher dashboard (separate React app)
- `models/`, `model_defs/`, `notebooks/` — ML models, checkpoints and analysis notebooks
- `app.py` and `requirements.txt` — Python ML/Flask utilities and dependencies

## Key Features

- Adaptive question generation (MCQ generator)
- Emotion recognition (camera / image -> emotion label)
- Student performance prediction and weekly forecasting
- Teacher analytics and feedback

## Prerequisites

- Node.js (v16+ recommended) and npm
- Python 3.10.0 (recommended)
- Git

Optional (for model features): GPU drivers/CUDA if you plan to run PyTorch/TensorFlow models with GPU acceleration.

## Quickstart

1. Clone the repo:

	git clone <repo-url>
	cd ai-powered-math-learning-system

2. Frontend (student app)

	- Install and start the React app located in `frontend/`:

	```powershell
	cd frontend
	npm install
	npm start
	```

	- Open http://localhost:3000 in your browser.
3. Frontend (Teacher app)

	- Install and start the React app located in `frontend/`:

	```powershell
	cd teacher-dashboard-frontend
	npm install
	npm run dev
	```

	- Open http://localhost:5173 in your browser.

4. Backend (Node API)

	- Install and start the backend server located in `backend/`:

	```powershell
	cd backend
	npm install
	npm start
	```

	- By default the backend uses `server.js` as the entry point. Check `backend/package.json` for scripts.

5. Python ML server / utilities

	- Create a virtual environment and install Python dependencies listed in `requirements.txt`:

	```bash
	python -m venv .venv
	# Windows
	.venv\Scripts\activate
	# macOS / Linux
	source .venv/bin/activate

	pip install -r requirements.txt
	```

	- The project includes `app.py` which provides Flask endpoints for emotion prediction and some ML helpers. Run it with:

	```bash
	python app.py
	```

	- Note: Some model checkpoint paths referenced in `app.py` are located in `models/`. Ensure required model files exist before running the endpoints. If a model file is missing, `app.py` will print a warning and some endpoints may return errors.

## Environment variables

- Backend: create a `.env` inside `backend/` if required (see `backend/src/config/env.js` for expected keys such as DB connection strings, JWT secrets, Cloudinary keys, etc.).
- Frontend: configure any API base URLs in `frontend/src` or environment files as needed.

## Models & Data

- Pre-trained models and checkpoints are stored in `models/` and `model_defs/`.
- If you need to retrain models, see the notebooks in `notebooks/` for training pipelines and data preparation notes.

## Development notes

- Frontend uses `react-scripts` (Create React App). See `frontend/package.json` for available scripts.
- Backend is an Express server with routes in `backend/src/routes` and controllers in `backend/src/controllers`.
- Many endpoints call Python-based ML helpers; the backend may use `python-shell` or HTTP calls to `app.py` endpoints.

## Troubleshooting

- Port conflicts: the React dev server defaults to port `3000`. The backend typically runs on port `3000` or `5000` depending on config — check `server.js` and the environment configuration.
- Missing model files: copy required files into `models/` (see `models/` for expected filenames) or adjust paths in `app.py`.
- If backend cannot connect to DB, verify connection string in `backend/.env` or `backend/src/config/db.js`.

## Tests

- Frontend: `cd frontend && npm test` (uses react-scripts test)
- Backend: add tests and test scripts to `backend/package.json` as needed.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Open a pull request with a clear description

## Overall architecture diagram
![WhatsApp Image 2026-01-06 at 10 01 55 AM](https://github.com/user-attachments/assets/95f61920-28fa-4599-ad2e-f7cf1a8257e9)

