"""
ml-backend/app.py
Flask ML prediction server — deploy free on Render.com or Railway.app

Local test:
  pip install -r requirements.txt
  python train_model.py    # run once → generates model.pkl
  python app.py            # starts on http://localhost:5000

Test endpoint:
  curl -X POST http://localhost:5000/predict \
    -H "Content-Type: application/json" \
    -d '{"heartRate":75,"spo2":98,"tempC":36.6,"stressScore":30,"totalAccel":1.0,"fallDetected":0}'
"""

from flask import Flask, request, jsonify
import numpy as np
import joblib, os

app = Flask(__name__)

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'model.pkl')
model = None
if os.path.exists(MODEL_PATH):
    model = joblib.load(MODEL_PATH)
    print(f"[ML] Model loaded from {MODEL_PATH}")
else:
    print("[ML] model.pkl not found — using rule-based fallback. Run train_model.py first.")

LABELS = [
    'Normal',
    'Bradycardia',
    'Tachycardia',
    'Hypoxia',
    'Hyperthermia',
    'High Stress',
    'Fall Risk',
]

RISK_MAP = {
    'Normal':       'normal',
    'Bradycardia':  'moderate',
    'Tachycardia':  'moderate',
    'Hypoxia':      'high',
    'Hyperthermia': 'high',
    'High Stress':  'moderate',
    'Fall Risk':    'high',
}


def rule_based_predict(f):
    """Fallback rules when model.pkl is not available."""
    hr   = f.get('heartRate', 75)
    spo2 = f.get('spo2', 97)
    temp = f.get('tempC', 36.5)
    ss   = f.get('stressScore', 40)
    fall = f.get('fallDetected', 0)

    if fall:               return {'disease': 'Fall Risk',    'confidence': 95.0}
    if spo2 < 90:          return {'disease': 'Hypoxia',      'confidence': 90.0}
    if temp >= 38.0:       return {'disease': 'Hyperthermia', 'confidence': 85.0}
    if hr < 50:            return {'disease': 'Bradycardia',  'confidence': 80.0}
    if hr > 110:           return {'disease': 'Tachycardia',  'confidence': 80.0}
    if ss > 75:            return {'disease': 'High Stress',  'confidence': 75.0}
    return                        {'disease': 'Normal',       'confidence': 92.0}


@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json(force=True)
    if not data:
        return jsonify({'error': 'No JSON body'}), 400

    features = {
        'heartRate':    float(data.get('heartRate',    75)),
        'spo2':         float(data.get('spo2',         97)),
        'tempC':        float(data.get('tempC',        36.5)),
        'stressScore':  float(data.get('stressScore',  40)),
        'totalAccel':   float(data.get('totalAccel',   1.0)),
        'fallDetected': float(data.get('fallDetected', 0)),
    }

    if model is not None:
        X = np.array([[
            features['heartRate'], features['spo2'], features['tempC'],
            features['stressScore'], features['totalAccel'], features['fallDetected']
        ]])
        pred_idx   = int(model.predict(X)[0])
        proba      = model.predict_proba(X)[0]
        disease    = LABELS[pred_idx]
        confidence = round(float(proba[pred_idx]) * 100, 1)
    else:
        result     = rule_based_predict(features)
        disease    = result['disease']
        confidence = result['confidence']

    risk = RISK_MAP.get(disease, 'normal')
    return jsonify({
        'disease':    disease,
        'confidence': confidence,
        'risk_level': risk,
        'features':   features,
    })


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'model_loaded': model is not None})


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
