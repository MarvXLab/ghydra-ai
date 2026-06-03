import os
import subprocess
import sys

# Auto-setup on first run
if not os.path.exists('models/threat_model_sklearn.pkl'):
    try:
        print("First run - downloading dataset and training model...")
        subprocess.run([sys.executable, 'train_sklearn.py'], check=True)
    except Exception as e:
        print(f"Setup failed: {e}")

# Import and run dashboard
exec(open('dashboard_sklearn.py').read())