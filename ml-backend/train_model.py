"""
ml-backend/train_model.py
Trains a Random Forest on synthetic health data.
Run ONCE before starting app.py:
  python train_model.py
Produces model.pkl in the same directory.
"""

import numpy as np
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report

LABELS = ['Normal','Bradycardia','Tachycardia','Hypoxia','Hyperthermia','High Stress','Fall Risk']
np.random.seed(42)
N = 2000

def gen(label, n):
    if label == 0:   # Normal
        return np.column_stack([np.random.randint(60,100,n), np.random.uniform(95,100,n),
            np.random.uniform(36.1,37.2,n), np.random.randint(0,55,n),
            np.random.uniform(0.9,1.1,n), np.zeros(n)]), np.full(n, label)
    if label == 1:   # Bradycardia
        return np.column_stack([np.random.randint(30,55,n), np.random.uniform(93,100,n),
            np.random.uniform(35.5,37.5,n), np.random.randint(20,60,n),
            np.random.uniform(0.9,1.1,n), np.zeros(n)]), np.full(n, label)
    if label == 2:   # Tachycardia
        return np.column_stack([np.random.randint(110,180,n), np.random.uniform(92,100,n),
            np.random.uniform(36.0,38.5,n), np.random.randint(50,100,n),
            np.random.uniform(0.9,1.5,n), np.zeros(n)]), np.full(n, label)
    if label == 3:   # Hypoxia
        return np.column_stack([np.random.randint(55,130,n), np.random.uniform(85,91,n),
            np.random.uniform(35.0,38.0,n), np.random.randint(30,90,n),
            np.random.uniform(0.8,1.2,n), np.zeros(n)]), np.full(n, label)
    if label == 4:   # Hyperthermia
        return np.column_stack([np.random.randint(70,140,n), np.random.uniform(91,99,n),
            np.random.uniform(38.0,41.0,n), np.random.randint(40,90,n),
            np.random.uniform(0.9,1.2,n), np.zeros(n)]), np.full(n, label)
    if label == 5:   # High Stress
        return np.column_stack([np.random.randint(85,130,n), np.random.uniform(93,100,n),
            np.random.uniform(36.2,37.8,n), np.random.randint(75,100,n),
            np.random.uniform(0.9,1.3,n), np.zeros(n)]), np.full(n, label)
    if label == 6:   # Fall Risk
        return np.column_stack([np.random.randint(55,160,n), np.random.uniform(90,100,n),
            np.random.uniform(35.0,38.5,n), np.random.randint(20,100,n),
            np.random.uniform(2.5,6.0,n), np.ones(n)]), np.full(n, label)

Xs, ys = [], []
for lbl in range(7):
    X, y = gen(lbl, N)
    Xs.append(X); ys.append(y)

X_all = np.vstack(Xs)
y_all = np.concatenate(ys)

X_train, X_test, y_train, y_test = train_test_split(X_all, y_all, test_size=0.2, random_state=42)

print("Training Random Forest...")
clf = RandomForestClassifier(n_estimators=150, max_depth=12, random_state=42, n_jobs=-1)
clf.fit(X_train, y_train)

print("\nClassification Report:")
print(classification_report(y_test, clf.predict(X_test), target_names=LABELS))

joblib.dump(clf, 'model.pkl')
print("\n✅ model.pkl saved — ready for app.py")
