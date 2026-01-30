<<<<<<< HEAD
# Shruthi Guru

AI-based shruthi analysis app that acts like a live Carnatic music teacher.

## What is shruthi?
Shruthi (Sruti) is the reference pitch or drone that anchors a performance. A
steady shruthi is the foundation for accurate swara placement, gamakas, and
raga expression.

## Flow after login
1. Sign in with Clerk.
2. Upload an MP3 (or any audio).
3. Receive shruthi alignment + AI teacher feedback.

## Project structure
- `backend/` FastAPI API + CrewAI agents + audio analysis
- `frontend/` static UI (Clerk login, Stripe button, upload + results)

## Audio analysis libraries (options)
These are the most practical math/audio libraries to start shruthi detection:
- Librosa (pitch tracking, tuning estimation)
- Aubio (fast pitch detection with multiple algorithms)
- Essentia (advanced MIR tools for pitch/timbre)

## Local setup
1. Create a virtual environment and install backend deps:
   - `pip install -r backend/requirements.txt`
2. Copy `.env.example` to `.env` and fill in keys.
3. Run the API:
   - `uvicorn app.main:app --reload --port 8000` (from `backend/`)
4. Open the UI:
   - Update `frontend/index.html` with your Clerk publishable key.
   - Open `frontend/index.html` in your browser.

## AWS deployment outline
- Backend: Dockerize FastAPI and deploy on ECS Fargate or AWS App Runner.
- Frontend: host `frontend/` on S3 + CloudFront.
- Secrets: store keys in AWS Secrets Manager or SSM Parameter Store.

## Next steps
- Improve tonic detection (Sa) using histogram-based pitch clustering.
- Add Clerk JWT validation in the API.
- Store analysis history in a database (Postgres on RDS).
=======
# Music
shruthi detection
>>>>>>> ae9cf2e9c5aeb8711a6498adac29b07e46657517
