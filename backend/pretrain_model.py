#!/usr/bin/env python3
"""
Pre-train the ML model on deployment.
This runs once when the container starts, ensuring the model is ready for all users.
"""

import os
import sys
import pickle
import logging
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def check_model_exists():
    """Check if model files already exist"""
    models_dir = project_root / "models"
    required_files = [
        "threat_model_sklearn.pkl",
        "scaler.pkl", 
        "encoders.pkl"
    ]
    
    return all((models_dir / f).exists() for f in required_files)

def train_model():
    """Train the threat detection model"""
    try:
        from src.preprocess import load_data, preprocess
        from sklearn.neural_network import MLPClassifier
        from sklearn.model_selection import train_test_split
        
        logger.info("Starting model training...")
        
        # Ensure directories exist
        models_dir = project_root / "models"
        data_dir = project_root / "data"
        models_dir.mkdir(exist_ok=True)
        
        # Check if data files exist
        train_path = data_dir / "KDDTrain+.txt"
        test_path = data_dir / "KDDTest+.txt"
        
        if not train_path.exists() or not test_path.exists():
            logger.warning("Training data not found. Model will be trained on first use."
            return False
        
        logger.info("Loading and preprocessing data..."
        train_df, test_df = load_data(str(train_path), str(test_path))
        X_train, y_train, _, _ = preprocess(train_df, test_df, str(models_dir))
        
        logger.info("Splitting data for training..."
        X_tr, _, y_tr, _ = train_test_split(
            X_train, y_train, test_size=0.1, random_state=42, stratify=y_train
        )
        
        logger.info("Training MLP classifier..."
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
            verbose=False  # Reduce noise in logs
        )
        
        model.fit(X_tr, y_tr)
        
        logger.info("Saving trained model...")
        with open(models_dir / "threat_model_sklearn.pkl", "wb") as f:
            pickle.dump(model, f)
        
        logger.info("Model training completed successfully!")
        return True
        
    except Exception as e:
        logger.error(f"Model training failed: {e}")
        return False

def main():
    """Main function"""
    logger.info("Checking model availability...")
    
    if check_model_exists():
        logger.info("Pre-trained model found. Skipping training.")
        return True
    
    logger.info("No pre-trained model found. Starting training...")
    success = train_model()
    
    if success:
        logger.info("Model ready for production use.")
    else:
        logger.warning("Model training failed. Will train on first API call.")
    
    return success

if __name__ == "__main__":
    main()