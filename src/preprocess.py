import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.model_selection import train_test_split
import pickle, os

# NSL-KDD column names (41 features + label + difficulty)
COLUMNS = [
    'duration', 'protocol_type', 'service', 'flag', 'src_bytes', 'dst_bytes',
    'land', 'wrong_fragment', 'urgent', 'hot', 'num_failed_logins', 'logged_in',
    'num_compromised', 'root_shell', 'su_attempted', 'num_root', 'num_file_creations',
    'num_shells', 'num_access_files', 'num_outbound_cmds', 'is_host_login',
    'is_guest_login', 'count', 'srv_count', 'serror_rate', 'srv_serror_rate',
    'rerror_rate', 'srv_rerror_rate', 'same_srv_rate', 'diff_srv_rate',
    'srv_diff_host_rate', 'dst_host_count', 'dst_host_srv_count',
    'dst_host_same_srv_rate', 'dst_host_diff_srv_rate', 'dst_host_same_src_port_rate',
    'dst_host_srv_diff_host_rate', 'dst_host_serror_rate', 'dst_host_srv_serror_rate',
    'dst_host_rerror_rate', 'dst_host_srv_rerror_rate', 'label', 'difficulty'
]

CATEGORICAL = ['protocol_type', 'service', 'flag']


def load_data(train_path: str, test_path: str):
    train = pd.read_csv(train_path, header=None, names=COLUMNS)
    test  = pd.read_csv(test_path,  header=None, names=COLUMNS)
    return train, test


def preprocess(train_df: pd.DataFrame, test_df: pd.DataFrame, models_dir: str = 'models'):
    os.makedirs(models_dir, exist_ok=True)

    # Drop difficulty column
    train_df = train_df.drop(columns=['difficulty'])
    test_df  = test_df.drop(columns=['difficulty'])

    # Binary label: normal=0, attack=1
    train_df['label'] = (train_df['label'] != 'normal').astype(int)
    test_df['label']  = (test_df['label']  != 'normal').astype(int)

    # Label-encode categorical features
    encoders = {}
    for col in CATEGORICAL:
        le = LabelEncoder()
        # Fit on combined to handle unseen categories in test
        combined = pd.concat([train_df[col], test_df[col]], ignore_index=True)
        le.fit(combined)
        train_df[col] = le.transform(train_df[col])
        test_df[col]  = le.transform(test_df[col])
        encoders[col] = le

    X_train = train_df.drop(columns=['label']).values.astype(np.float32)
    y_train = train_df['label'].values.astype(np.float32)
    X_test  = test_df.drop(columns=['label']).values.astype(np.float32)
    y_test  = test_df['label'].values.astype(np.float32)

    # StandardScaler
    scaler = StandardScaler()
    X_train = scaler.fit_transform(X_train)
    X_test  = scaler.transform(X_test)

    # Persist scaler and encoders for inference
    with open(os.path.join(models_dir, 'scaler.pkl'), 'wb') as f:
        pickle.dump(scaler, f)
    with open(os.path.join(models_dir, 'encoders.pkl'), 'wb') as f:
        pickle.dump(encoders, f)

    print(f"Train: {X_train.shape} | Test: {X_test.shape}")
    print(f"Train threat rate: {y_train.mean()*100:.1f}%  |  Test threat rate: {y_test.mean()*100:.1f}%")

    return X_train, y_train, X_test, y_test
