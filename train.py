import os, json
import numpy as np
import tensorflow as tf
from src.preprocess import load_data, preprocess
from src.model import build_model

DATA_DIR   = 'data'
MODELS_DIR = 'models'
EPOCHS     = 20
BATCH_SIZE = 512


def train():
    train_path = os.path.join(DATA_DIR, 'KDDTrain+.txt')
    test_path  = os.path.join(DATA_DIR, 'KDDTest+.txt')

    if not os.path.exists(train_path) or not os.path.exists(test_path):
        print("ERROR: Dataset files not found.")
        print(f"  Expected: {train_path}")
        print(f"  Expected: {test_path}")
        print("  Download NSL-KDD from: https://www.unb.ca/cic/datasets/nsl.html")
        return

    print("── Loading data...")
    train_df, test_df = load_data(train_path, test_path)

    print("── Preprocessing...")
    X_train, y_train, X_test, y_test = preprocess(train_df, test_df, MODELS_DIR)

    print("── Building model...")
    model = build_model(input_dim=X_train.shape[1])
    model.summary()

    callbacks = [
        tf.keras.callbacks.EarlyStopping(
            monitor='val_loss', patience=5, restore_best_weights=True
        ),
        tf.keras.callbacks.ModelCheckpoint(
            filepath=os.path.join(MODELS_DIR, 'best_model.keras'),
            monitor='val_loss', save_best_only=True
        ),
    ]

    print("── Training...")
    history = model.fit(
        X_train, y_train,
        validation_split=0.1,
        epochs=EPOCHS,
        batch_size=BATCH_SIZE,
        callbacks=callbacks,
        verbose=1,
    )

    # Save final model
    model.save(os.path.join(MODELS_DIR, 'threat_model.keras'))

    # Save training history for dashboard
    hist_dict = {k: [float(v) for v in vals] for k, vals in history.history.items()}
    with open(os.path.join(MODELS_DIR, 'history.json'), 'w') as f:
        json.dump(hist_dict, f, indent=2)

    # Evaluate on test set
    print("\n── Evaluating on test set...")
    from src.evaluate import evaluate
    evaluate(model, X_test, y_test)


if __name__ == '__main__':
    train()
