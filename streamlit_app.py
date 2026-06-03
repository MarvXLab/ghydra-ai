"""
🐍 Ghydra - AI Threat Detection System
Main entry point for Streamlit Cloud deployment
"""

import os
import subprocess
import sys

# Auto-setup on first run
if not os.path.exists('models/threat_model_sklearn.pkl'):
    try:
        print("🐍 Ghydra initializing - Training AI model...")
        subprocess.run([sys.executable, 'train_sklearn.py'], check=True)
        print("✅ Ghydra ready!")
    except Exception as e:
        print(f"❌ Setup failed: {e}")

# Import and run Ghydra dashboard
exec(open('hydraguard.py').read())