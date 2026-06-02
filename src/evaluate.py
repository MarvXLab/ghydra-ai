import json, os
import numpy as np
from sklearn.metrics import (
    precision_score, recall_score, f1_score,
    confusion_matrix, classification_report
)


def evaluate(model, X_test, y_test, models_dir: str = 'models', threshold: float = 0.5):
    y_prob = model.predict(X_test, verbose=0).flatten()
    y_pred = (y_prob >= threshold).astype(int)

    loss_fn = __import__('tensorflow').keras.losses.BinaryCrossentropy()
    bce_loss = float(loss_fn(y_test, y_prob).numpy())

    accuracy  = float((y_pred == y_test).mean())
    precision = float(precision_score(y_test, y_pred, zero_division=0))
    recall    = float(recall_score(y_test, y_pred, zero_division=0))
    f1        = float(f1_score(y_test, y_pred, zero_division=0))
    cm        = confusion_matrix(y_test, y_pred).tolist()

    results = {
        'loss':      round(bce_loss, 4),
        'accuracy':  round(accuracy,  4),
        'precision': round(precision, 4),
        'recall':    round(recall,    4),
        'f1_score':  round(f1,        4),
        'confusion_matrix': cm,
    }

    os.makedirs(models_dir, exist_ok=True)
    with open(os.path.join(models_dir, 'eval_results.json'), 'w') as f:
        json.dump(results, f, indent=2)

    print("\n╔══════════════════════════════════╗")
    print("║     THREAT DETECTION METRICS     ║")
    print("╠══════════════════════════════════╣")
    print(f"║  BCE Loss    : {bce_loss:.4f}              ║")
    print(f"║  Accuracy    : {accuracy*100:.2f}%             ║")
    print(f"║  Precision   : {precision*100:.2f}%             ║")
    print(f"║  Recall      : {recall*100:.2f}%             ║")
    print(f"║  F1-Score    : {f1*100:.2f}%             ║")
    print("╚══════════════════════════════════╝")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=['Normal', 'Threat']))

    tn, fp, fn, tp = confusion_matrix(y_test, y_pred).ravel()
    print(f"Confusion Matrix: TP={tp}  FP={fp}  TN={tn}  FN={fn}")

    return results
