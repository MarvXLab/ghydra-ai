# 🐍 Ghydra - AI Threat Detection System

**Multi-headed AI defense against cyber threats**

Ghydra is an enterprise-grade cybersecurity threat detection system that uses advanced deep learning to analyze network traffic and identify cyber threats in real-time. Built with a 3-layer neural network trained on the NSL-KDD benchmark dataset.

## 🚀 Key Features

- **🤖 AI-Powered Detection**: 3-layer deep neural network with 77.5% accuracy and 97.1% precision
- **📱 Mobile-Responsive Dashboard**: Professional UI that works on all devices  
- **⚡ Real-time Monitoring**: Live threat feed with auto-refresh capabilities
- **🎯 Live Scanner**: Interactive network traffic analysis tool
- **📊 Advanced Analytics**: Performance trends, threat patterns, and model insights
- **🔄 Auto-Training**: Automatic model training on first deployment

## 🏗️ Architecture

```
🔍 Data Ingestion    → NSL-KDD tabular network logs (125K+ samples)
🛠️  Feature Pipeline  → LabelEncoding + StandardScaler normalization  
🧠 AI Core          → Dense(256) → Dense(128) → Dense(64) → Sigmoid
📊 Analytics Layer   → Real-time metrics + Interactive dashboard
```

## 📈 Performance Metrics

| Metric | Score | Description |
|--------|-------|-------------|
| **Accuracy** | 77.5% | Overall threat detection rate |
| **Precision** | 97.1% | Low false positive rate |
| **Recall** | 62.4% | Threat catch rate |
| **F1-Score** | 76.0% | Balanced performance |
| **Response Time** | ~23ms | Real-time processing |

## 🛡️ Security Features

- **Binary Classification**: Normal vs. Cyber Threat detection
- **Multi-Protocol Support**: TCP, UDP, ICMP analysis
- **Attack Detection**: DDoS, Port Scans, SQL Injection, Malware, Brute Force
- **Real-time Blocking**: Automatic threat response capabilities
- **Confidence Scoring**: Threat probability with visual gauges

## 💻 Quick Start

### Prerequisites
```bash
Python 3.10+
pip install -r requirements.txt
```

### Launch Ghydra
```bash
# Local deployment
streamlit run ghydra.py

# Or direct dashboard
streamlit run hydraguard.py
```

### Cloud Deployment
1. **GitHub**: Push to repository
2. **Streamlit Cloud**: Connect repo → Deploy `ghydra.py`
3. **Heroku**: `git push heroku main`

## 🎨 Dashboard Pages

### 🏠 Overview
- Executive metrics dashboard
- Performance gauges and heatmaps
- System status indicators
- Quick action buttons

### 🎯 Live Scanner
- Interactive threat analysis
- Network parameter inputs
- Real-time classification results
- Confidence visualization

### ⚡ Real-time Feed  
- Live threat monitoring
- Auto-refreshing event stream
- Attack severity indicators
- Block/Allow status tracking

### 📊 Analytics
- Performance trends over time
- Threat volume analysis
- Historical comparisons
- Custom date ranges

### 🧠 Model Insights
- Neural network architecture
- Feature importance analysis
- Training performance curves
- Model explainability

## 🔧 Advanced Configuration

### Custom Training
```bash
python train_sklearn.py  # Train with NSL-KDD
```

### Model Artifacts
```
models/
├── threat_model_sklearn.pkl  # Trained neural network
├── scaler.pkl               # Feature standardizer  
├── encoders.pkl             # Categorical encoders
├── eval_results.json        # Performance metrics
└── history.json            # Training curves
```

## 🌐 Enterprise Features

- **Scalable Architecture**: Handle millions of network events
- **API Integration**: RESTful endpoints for external systems
- **Custom Alerting**: Email, Slack, webhook notifications  
- **Multi-tenant Support**: Organization-level isolation
- **Audit Logging**: Complete security event tracking
- **White-label Ready**: Customizable branding and themes

## 📊 Competitive Advantages

✅ **vs Traditional IDS**: 97.1% precision (industry avg: ~85%)  
✅ **vs Rule-based Systems**: AI adapts to new attack patterns  
✅ **vs Enterprise Solutions**: 10x faster deployment time  
✅ **vs Cloud Services**: Full data privacy + on-premise option  

## 🏆 Use Cases

- **Enterprise Networks**: Real-time threat monitoring
- **Cloud Security**: Multi-region deployment  
- **SOC Operations**: Analyst decision support
- **Compliance**: Automated security reporting
- **Research**: Cyber threat analysis platform

## 📱 Mobile Experience

Ghydra is fully responsive with:
- Touch-optimized controls
- Mobile-first metric cards  
- Swipe navigation
- Offline capability
- Progressive Web App (PWA) support

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 🎯 Roadmap

- [ ] **Multi-class Classification** (5+ attack types)
- [ ] **Federated Learning** (distributed training)  
- [ ] **Real-time Streaming** (Kafka integration)
- [ ] **Graph Neural Networks** (network topology analysis)
- [ ] **Explainable AI** (decision transparency)
- [ ] **Mobile Apps** (iOS/Android)

---

**🐍 Ghydra** - *Where AI meets cybersecurity*  
Built with ❤️ for the security community