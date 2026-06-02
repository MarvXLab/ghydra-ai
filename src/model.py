import tensorflow as tf
from tensorflow import keras


def build_model(input_dim: int) -> keras.Model:
    """
    3-Layer Dense Deep Neural Network for binary threat classification.
    Architecture: Input -> Dense(256) -> Dense(128) -> Dense(64) -> Output(1)
    """
    model = keras.Sequential([
        keras.layers.Input(shape=(input_dim,)),

        # Layer 1
        keras.layers.Dense(256, activation='relu'),
        keras.layers.BatchNormalization(),
        keras.layers.Dropout(0.3),

        # Layer 2
        keras.layers.Dense(128, activation='relu'),
        keras.layers.BatchNormalization(),
        keras.layers.Dropout(0.3),

        # Layer 3
        keras.layers.Dense(64, activation='relu'),
        keras.layers.Dropout(0.2),

        # Output — sigmoid for binary classification
        keras.layers.Dense(1, activation='sigmoid'),
    ], name='threat_detector')

    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=1e-3),
        loss='binary_crossentropy',
        metrics=[
            'accuracy',
            keras.metrics.Precision(name='precision'),
            keras.metrics.Recall(name='recall'),
        ]
    )

    return model
