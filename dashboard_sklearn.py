import streamlit as st
import json, os, pickle
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.ticker as mticker

MODELS_DIR = 'models'

st.set_page_config(
    page_title='Threat Detection System',
    page_icon='🛡️',
    layout='wide',
)

# ── Styles ────────────────────────────────────────────────────────────────────
st.markdown("""
<style>
  [data-testid="stAppViewContainer"] { background: #0d1117; }
  [data-testid="stSidebar"] { background: #161b22; }
  .metric-card {
    background: #161b22; border: 1px solid #30363d;
    border-radius: 12px; padding: 20px 24px; text-align: center;
  }
  .metric-val  { font-size: 32px; font-weight: 700; color: #58a6ff; }
  .metric-label{ font-size: 13px; color: #8b949e; margin-top: 4px; }
  .threat-badge{ background:#da3633; color:white; padding:4px 12px;
                 border-radius:20px; font-weight:700; font-size:14px; }
  .normal-badge{ background:#238636; color:white; padding:4px 12px;
                 border-radius:20px; font-weight:700; font-size:14px; }
  h1, h2, h3 { color: #e6edf3 !important; }
</style>
""", unsafe_allow_html=True)

# ── Sidebar ───────────────────────────────────────────────────────────────────
with st.sidebar:
    st.image("https://cdn-icons-png.flaticon.com/128/2716/2716652.png", width=60)
    st.markdown("## 🛡️ Threat Detection")
    st.markdown("**NSL-KDD · MLP Classifier**")
    st.markdown("---")
    page = st.radio("Navigate", ["📊 Dashboard", "🔍 Live Prediction", "📈 Training History"])
    st.markdown("---")
    model_ready = os.path.exists(os.path.join(MODELS_DIR, 'threat_model_sklearn.pkl'))
    if model_ready:
        st.success("Model loaded ✓")
    else:
        st.warning("Model not trained yet.\nRun `python train_sklearn.py` first.")


# ── Helpers ───────────────────────────────────────────────────────────────────
@st.cache_resource
def load_model():
    with open(os.path.join(MODELS_DIR, 'threat_model_sklearn.pkl'), 'rb') as f:
        return pickle.load(f)

@st.cache_resource
def load_artifacts():
    with open(os.path.join(MODELS_DIR, 'scaler.pkl'), 'rb') as f:
        scaler = pickle.load(f)
    with open(os.path.join(MODELS_DIR, 'encoders.pkl'), 'rb') as f:
        encoders = pickle.load(f)
    return scaler, encoders

def load_eval():
    path = os.path.join(MODELS_DIR, 'eval_results.json')
    if os.path.exists(path):
        with open(path) as f:
            return json.load(f)
    return None

def load_history():
    path = os.path.join(MODELS_DIR, 'history.json')
    if os.path.exists(path):
        with open(path) as f:
            return json.load(f)
    return None

def dark_fig():
    fig, ax = plt.subplots(facecolor='#161b22')
    ax.set_facecolor('#0d1117')
    for spine in ax.spines.values():
        spine.set_color('#30363d')
    ax.tick_params(colors='#8b949e')
    ax.xaxis.label.set_color('#8b949e')
    ax.yaxis.label.set_color('#8b949e')
    ax.title.set_color('#e6edf3')
    return fig, ax


# ── Page: Dashboard ───────────────────────────────────────────────────────────
if page == "📊 Dashboard":
    st.title("🛡️ Cybersecurity Threat Detection System")
    st.markdown("**Binary classification of network traffic using a 3-layer Deep Neural Network trained on NSL-KDD.**")
    st.markdown("---")

    results = load_eval()
    if not results:
        st.info("No evaluation results found. Train the model first with `python train_sklearn.py`.")
    else:
        # Metric cards
        cols = st.columns(5)
        metrics = [
            ("BCE Loss",   results['loss'],               ""),
            ("Accuracy",   f"{results['accuracy']*100:.2f}%",  ""),
            ("Precision",  f"{results['precision']*100:.2f}%", "↓ False Positives"),
            ("Recall",     f"{results['recall']*100:.2f}%",    "↓ False Negatives"),
            ("F1-Score",   f"{results['f1_score']*100:.2f}%",  "Harmonic mean"),
        ]
        for col, (label, val, sub) in zip(cols, metrics):
            with col:
                st.markdown(f"""
                <div class="metric-card">
                  <div class="metric-val">{val}</div>
                  <div class="metric-label">{label}</div>
                  <div style="font-size:11px;color:#484f58;margin-top:3px">{sub}</div>
                </div>""", unsafe_allow_html=True)

        st.markdown("### Confusion Matrix")
        cm = np.array(results['confusion_matrix'])
        fig, ax = dark_fig()
        im = ax.imshow(cm, cmap='Blues')
        ax.set_xticks([0, 1]); ax.set_yticks([0, 1])
        ax.set_xticklabels(['Normal', 'Threat']); ax.set_yticklabels(['Normal', 'Threat'])
        ax.set_xlabel('Predicted'); ax.set_ylabel('Actual')
        ax.set_title('Confusion Matrix')
        for i in range(2):
            for j in range(2):
                ax.text(j, i, f'{cm[i,j]:,}', ha='center', va='center',
                        color='white' if cm[i,j] > cm.max()/2 else '#8b949e', fontsize=14, fontweight='bold')
        plt.colorbar(im, ax=ax)
        st.pyplot(fig)

        tn, fp, fn, tp = cm.ravel()
        c1, c2, c3, c4 = st.columns(4)
        c1.metric("True Positives",  f"{tp:,}", "Correctly flagged threats")
        c2.metric("True Negatives",  f"{tn:,}", "Correctly passed normal")
        c3.metric("False Positives", f"{fp:,}", "Normal flagged as threat")
        c4.metric("False Negatives", f"{fn:,}", "Missed threats")


# ── Page: Live Prediction ─────────────────────────────────────────────────────
elif page == "🔍 Live Prediction":
    st.title("🔍 Live Threat Prediction")
    st.markdown("Input network traffic parameters to classify in real-time.")
    st.markdown("---")

    if not model_ready:
        st.warning("Train the model first: `python train_sklearn.py`")
        st.stop()

    model = load_model()
    scaler, encoders = load_artifacts()

    from src.preprocess import COLUMNS, CATEGORICAL
    feature_cols = [c for c in COLUMNS if c not in ('label', 'difficulty')]

    with st.form("predict_form"):
        st.markdown("#### Network Traffic Parameters")

        # Categorical selectors
        cat_vals = {}
        c1, c2, c3 = st.columns(3)
        cat_vals['protocol_type'] = c1.selectbox("Protocol Type", encoders['protocol_type'].classes_)
        cat_vals['service']       = c2.selectbox("Service",       encoders['service'].classes_)
        cat_vals['flag']          = c3.selectbox("Flag",          encoders['flag'].classes_)

        st.markdown("#### Numeric Features *(most impactful)*")
        n1, n2, n3, n4 = st.columns(4)
        duration       = n1.number_input("Duration (s)",    0, 60000, 0)
        src_bytes      = n2.number_input("Src Bytes",        0, 10**9, 0)
        dst_bytes      = n3.number_input("Dst Bytes",        0, 10**9, 0)
        count          = n4.number_input("Count",            0, 512,   1)

        n5, n6, n7, n8 = st.columns(4)
        logged_in      = n5.selectbox("Logged In",    [0, 1])
        num_compromised= n6.number_input("Num Compromised", 0, 9999, 0)
        serror_rate    = n7.slider("SError Rate",  0.0, 1.0, 0.0)
        same_srv_rate  = n8.slider("Same Srv Rate",0.0, 1.0, 1.0)

        submitted = st.form_submit_button("🔍 Classify Traffic", use_container_width=True)

    if submitted:
        # Build feature vector (41 features, zeros for unspecified)
        row = {col: 0 for col in feature_cols}
        row['protocol_type']   = encoders['protocol_type'].transform([cat_vals['protocol_type']])[0]
        row['service']         = encoders['service'].transform([cat_vals['service']])[0]
        row['flag']            = encoders['flag'].transform([cat_vals['flag']])[0]
        row['duration']        = duration
        row['src_bytes']       = src_bytes
        row['dst_bytes']       = dst_bytes
        row['count']           = count
        row['logged_in']       = logged_in
        row['num_compromised'] = num_compromised
        row['serror_rate']     = serror_rate
        row['same_srv_rate']   = same_srv_rate

        X = np.array([[row[c] for c in feature_cols]], dtype=np.float32)
        X = scaler.transform(X)
        prob = float(model.predict_proba(X)[0][1])  # probability of threat class
        label = 1 if prob >= 0.5 else 0

        st.markdown("---")
        st.markdown("### Prediction Result")
        r1, r2 = st.columns(2)
        with r1:
            if label == 1:
                st.markdown('<span class="threat-badge">⚠️ CYBER THREAT DETECTED</span>', unsafe_allow_html=True)
            else:
                st.markdown('<span class="normal-badge">✅ NORMAL TRAFFIC</span>', unsafe_allow_html=True)
        with r2:
            st.metric("Threat Probability", f"{prob*100:.2f}%")

        # Confidence gauge
        fig, ax = dark_fig()
        bar_color = '#da3633' if label == 1 else '#238636'
        ax.barh(['Confidence'], [prob], color=bar_color, height=0.4)
        ax.barh(['Confidence'], [1 - prob], left=[prob], color='#30363d', height=0.4)
        ax.set_xlim(0, 1)
        ax.set_title(f"Threat Confidence: {prob*100:.1f}%")
        ax.xaxis.set_major_formatter(mticker.PercentFormatter(xmax=1))
        st.pyplot(fig)


# ── Page: Training History ────────────────────────────────────────────────────
elif page == "📈 Training History":
    st.title("📈 Training History")
    st.markdown("Loss curves during training iterations.")
    st.markdown("---")

    history = load_history()
    if not history:
        st.info("No training history found. Run `python train_sklearn.py` first.")
        st.stop()

    iterations = range(1, len(history['loss']) + 1)

    fig, ax = dark_fig()
    ax.plot(iterations, history['loss'], '#58a6ff', label='Training Loss', linewidth=2)
    ax.set_title('Loss Curve (sklearn MLPClassifier)')
    ax.set_xlabel('Iteration')
    ax.set_ylabel('Loss')
    ax.legend(facecolor='#161b22', labelcolor='#e6edf3')
    ax.grid(color='#21262d', linestyle='--', alpha=0.5)

    st.pyplot(fig)

    # Loss table
    st.markdown("### Training Progress")
    df = pd.DataFrame({
        'Iteration': list(iterations),
        'Loss':      [round(v, 4) for v in history['loss']],
    })
    st.dataframe(df, use_container_width=True, hide_index=True)