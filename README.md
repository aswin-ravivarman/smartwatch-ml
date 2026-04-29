# SmartWatch Health Monitor — Full Stack Project

## Project Structure

```
your-project/
├── smartwatch-dashboard/        React + Vite frontend
│   ├── src/
│   │   ├── lib/firebase.js      ← EDIT: your Firebase config
│   │   ├── hooks/useHealth.js
│   │   ├── components/
│   │   │   ├── MetricCard.jsx
│   │   │   ├── SparkLine.jsx
│   │   │   ├── HistoryChart.jsx
│   │   │   ├── MLPanel.jsx
│   │   │   ├── FallBanner.jsx
│   │   │   └── StatusBar.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
│
├── firebase-functions/
│   ├── firebase.json
│   └── functions/
│       ├── index.js             ← EDIT: ML_ENDPOINT url
│       └── package.json
│
└── ml-backend/
    ├── app.py                   Flask ML server
    ├── train_model.py           Run once → creates model.pkl
    ├── requirements.txt
    └── model.pkl                Auto-generated after training
```

---

## STEP 1 — ML Backend

```bash
cd ml-backend
pip install -r requirements.txt
python train_model.py          # creates model.pkl  (run once)
python app.py                  # test on http://localhost:5000
```

### Deploy FREE on Render.com
1. Push this folder to GitHub
2. Go to https://render.com → New Web Service
3. Connect your repo, set root dir = ml-backend
4. Build command:  pip install -r requirements.txt
5. Start command:  gunicorn app:app
6. Copy the public HTTPS URL

---

## STEP 2 — Firebase Functions

```bash
npm install -g firebase-tools
firebase login
cd firebase-functions
firebase use --add        # select your Firebase project

cd functions
npm install
cd ..

# Edit functions/index.js  →  paste your Render URL as ML_ENDPOINT
firebase deploy --only functions
```

---

## STEP 3 — React Dashboard

```bash
cd smartwatch-dashboard
npm install
```

Edit **src/lib/firebase.js** — fill in all 6 values from:
Firebase Console → Project Settings → Your apps → SDK setup

```bash
npm run dev          # http://localhost:5173
npm run build        # production → dist/
```

---

## Data Flow

```
ESP32 (every 15s)
  └→ Firebase RTDB /devices/watch_01/latest
       └→ Cloud Function auto-triggers
            └→ POST → ml-backend /predict   (Render.com)
                 └→ { disease, confidence, risk_level }
                      └→ /devices/watch_01/mlResult
                           └→ React dashboard reads live
```

## Files to Edit (3 total)

| File | What to fill in |
|------|----------------|
| smartwatch-dashboard/src/lib/firebase.js | 6 Firebase config values |
| firebase-functions/functions/index.js   | ML_ENDPOINT url from Render |
| ESP32 firmware (.ino)                   | WiFi + Firebase credentials |
