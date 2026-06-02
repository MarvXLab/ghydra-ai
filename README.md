# Cybersecurity Threat Detection System

Binary classification of network traffic (Normal vs. Cyber Threat) using a
3-layer Deep Neural Network trained on the NSL-KDD benchmark dataset.

## Setup

```bash
pip install -r requirements.txt
```

## Dataset

1. Download NSL-KDD from: https://www.unb.ca/cic/datasets/nsl.html
2. Place these two files in the `data/` folder:
   - `KDDTrain+.txt`
   - `KDDTest+.txt`

## Train

```bash
python train.py
```

Outputs saved to `models/`:
- `threat_model.keras` — trained model
- `scaler.pkl` — fitted StandardScaler
- `encoders.pkl` — fitted LabelEncoders
- `eval_results.json` — test set metrics
- `history.json` — training curves

## Dashboard

```bash
streamlit run dashboard.py
```

## Architecture

```
[ Data Ingestion ]   NSL-KDD tabular network logs
        │
[ Feature Pipeline ] LabelEncoding (categorical) + StandardScaler
        │
[ Inference Core ]   Dense(256) → Dense(128) → Dense(64) → Sigmoid
        │
[ Analytics Layer ]  Loss · Accuracy · Precision · Recall · F1
```

## Metrics Tracked

| Metric | Purpose |
|---|---|
| Binary Cross-Entropy Loss | Training objective |
| Accuracy | Overall correctness |
| Precision | Low false positive rate |
| Recall | Low false negative rate (missed threats) |
| F1-Score | Harmonic mean of precision & recall |
