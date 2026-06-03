#!/bin/bash
echo "Setting up threat detection system..."

# Download NSL-KDD dataset if not exists
if [ ! -f "data/KDDTrain+.txt" ]; then
    echo "Downloading NSL-KDD dataset..."
    mkdir -p data
    pip install -q kaggle
    kaggle datasets download -d hassan06/nslkdd -p data --unzip
fi

# Train model if not exists
if [ ! -f "models/threat_model_sklearn.pkl" ]; then
    echo "Training model..."
    python train_sklearn.py
fi

echo "Setup complete!"