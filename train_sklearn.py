import os, json, pickle
import numpy as np
from sklearn.neural_network import MLPClassifier
from sklearn.model_selection import train_test_split
from src.preprocess import load_data, preprocess

DATA_DIR   = 'data'
MODELS_DIR = 'models'


def train_sklearn():
    train_path = os.path.join(DATA_DIR, 'KDDTrain+.txt')
    test_path  = os.path.join(DATA_DIR, 'KDDTest+.txt')

    if not os.path.exists(train_path) or not os.path.exists(test_path):
        print("ERROR: Dataset files not found.")
        return

    print("-- Loading data...")
    train_df, test_df = load_data(train_path, test_path)

    print("-- Preprocessing...")
    X_train, y_train, X_test, y_test = preprocess(train_df, test_df, MODELS_DIR)

    # Split training for validation
    X_train_split, X_val, y_train_split, y_val = train_test_split(
        X_train, y_train, test_size=0.1, random_state=42, stratify=y_train
    )

    print("-- Building sklearn MLP model...")
    # 3-layer dense network: 256 -> 128 -> 64 -> output
    model = MLPClassifier(
        hidden_layer_sizes=(256, 128, 64),
        activation='relu',
        solver='adam',
        learning_rate_init=0.001,
        max_iter=100,
        early_stopping=True,
        validation_fraction=0.1,
        n_iter_no_change=5,
        random_state=42,
        verbose=True,
    )

    print("-- Training...")
    model.fit(X_train_split, y_train_split)

    # Save model
    os.makedirs(MODELS_DIR, exist_ok=True)
    with open(os.path.join(MODELS_DIR, 'threat_model_sklearn.pkl'), 'wb') as f:
        pickle.dump(model, f)

    # Create training history (sklearn doesn't have epoch-by-epoch like TF)
    history = {
        'loss': model.loss_curve_,
        'val_loss': model.loss_curve_,  # sklearn doesn't separate val loss
        'accuracy': [0.5] * len(model.loss_curve_),  # placeholder
        'val_accuracy': [0.5] * len(model.loss_curve_),  # placeholder
    }
    with open(os.path.join(MODELS_DIR, 'history.json'), 'w') as f:
        json.dump(history, f, indent=2)

    print("\n-- Evaluating on test set...")
    from src.evaluate_sklearn import evaluate_sklearn
    evaluate_sklearn(model, X_test, y_test)


if __name__ == '__main__':
    train_sklearn()