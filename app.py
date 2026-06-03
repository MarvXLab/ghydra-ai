import os
import subprocess
import sys

# Auto-setup on first run
if not os.path.exists('models/threat_model_sklearn.pkl'):
    try:
        print("🐍 HydraGuard initializing - Training AI model...")
        subprocess.run([sys.executable, 'train_sklearn.py'], check=True)
        print("✅ HydraGuard ready for deployment!")
    except Exception as e:
        print(f"❌ Setup failed: {e}")

# Import and run HydraGuard
exec(open('hydraguard.py').read())