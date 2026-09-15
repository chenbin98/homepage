---
slug: 2026-04-24-drone-rice-growth-stage-inversion
date: 2026-04-24
title: UAV-Based Rice Growth-Stage Inversion and Prediction with AI and Remote Sensing
title_zh: 无人机水稻生育期反演预测：AI + 遥感的技术方案
summary: A complete technical roadmap for using UAV RGB, multispectral, and structural data with AI to infer and predict rice growth stages.
summary_zh: 利用无人机 RGB、多光谱与结构数据结合 AI，实现水稻生育期反演与预测的完整技术方案。
category: Smart Agriculture
category_zh: 智慧农业
tags: [UAV, Rice, Remote Sensing, Deep Learning, Precision Agriculture]
cover: image/blogs/2026-04-24-drone-rice-growth-stage-inversion.png
source_post: 2026-4-24-drone-rice-growth-stage-inversion.qmd
---

## Project Background

A central challenge in precision agriculture is obtaining crop-growth information **quickly, accurately, and non-destructively**. Conventional field surveys rely on manual observation; they are labor-intensive and difficult to scale.

Mature UAV remote-sensing systems provide high spatial and temporal resolution. Combined with deep-learning models, they can infer key crop physiological variables from imagery and forecast crop development.

> **Growth inversion:** remote-sensing features → growth parameters, such as leaf area index (LAI), biomass, and plant height.
>
> **Growth-stage prediction:** historical time series → future developmental stages, such as tillering, jointing, heading, and maturity.

This article outlines an end-to-end technical roadmap, from data collection through model deployment.

---

## System Architecture

~~~
┌─────────────────────────────────────────────────────────────┐
│               UAV Rice Growth-Stage Prediction System        │
├─────────────┬─────────────┬──────────────┬──────────────────┤
│ Data intake │ Model train │ Invert/predict│ Visualization    │
│ • RGB       │ • CNN / ViT │ • Stage class │ • Web dashboard  │
│ • Multispec │ • Time-series│ • Growth curve│ • Field map      │
│ • DSM / NDVI│ • Transformer│ • Alerts     │ • Reports         │
└─────────────┴─────────────┴──────────────┴──────────────────┘
~~~

---

## Data-Collection Layer

### Sensor configuration

| Sensor type | Resolution | Key information | Typical use |
|---|---:|---|---|
| **RGB camera** | 12–48 MP | Color, texture, canopy cover | Plant counts and initial disease screening |
| **Multispectral camera** | Five bands: B/G/R/RedEdge/NIR | NDVI, EVI, and other indices | Growth assessment and nitrogen inversion |
| **Thermal infrared** | 640 × 512 | Canopy temperature | Water-stress monitoring |
| **LiDAR** | 50–200 pts/m² point-cloud density | Height and 3-D structure | Biomass estimation and lodging detection |

### Flight planning

~~~python
# Calculate a suitable flight height and image coverage with Python
import math

GSD_target = 2.0       # Ground sampling distance (cm/pixel)
sensor_width = 13.2    # Sensor width (mm)
focal_length = 4.5     # Focal length (mm)
image_width = 5472     # Image width (pixels)

altitude = (GSD_target * focal_length) / (sensor_width / image_width)
print(f"Suggested flight altitude: {altitude:.0f} m")

coverage_width = (GSD_target * image_width) / 100  # metres
print(f"Single-image coverage width: {coverage_width:.1f} m")
~~~

### Processing workflow

~~~bash
# 1. Stitch imagery with OpenDroneMap or Pix4D
odm_project.sh /path/to/images /path/to/output

# 2. Extract vegetation indices
python extract_vegetation_indices.py \
    --multispec orthomosaic.tif \
    --indices NDVI,EVI,GNDVI \
    --output vegetation_indices/

# 3. Produce a digital surface model
python generate_dsm.py \
    --point_cloud dense_point_cloud.laz \
    --resolution 0.05 \
    --output dsm.tif
~~~

---

## Feature Engineering

### Vegetation indices

| Index | Formula | Appropriate use |
|---|---|---|
| **NDVI** | (NIR − R) / (NIR + R) | Overall vigor and biomass |
| **EVI** | 2.5 × (NIR − R) / (NIR + 6R − 7.5B + 1) | High-biomass areas |
| **GNDVI** | (NIR − G) / (NIR + G) | Chlorophyll content |
| **NDRE** | (NIR − RedEdge) / (NIR + RedEdge) | Canopy nitrogen status |
| **CIrededge** | (NIR / RedEdge) − 1 | Photosynthetic activity |

~~~python
import rasterio
import numpy as np

def calculate_ndvi(nir_band, red_band):
    """Calculate NDVI."""
    ndvi = (nir_band.astype(float) - red_band.astype(float)) / \
           (nir_band.astype(float) + red_band.astype(float) + 1e-8)
    return np.clip(ndvi, -1, 1)

with rasterio.open("orthomosaic.tif") as src:
    nir = src.read(4)  # Band 4: near infrared
    red = src.read(3)  # Band 3: red
    ndvi = calculate_ndvi(nir, red)
~~~

### Building time-series features

~~~python
# Shape: (number_of_fields, time_steps, number_of_features)
features = {
    "spectral": ["NDVI", "EVI", "GNDVI", "NDRE"],
    "texture": ["ASM", "Contrast", "Entropy"],
    "structural": ["plant_height", "canopy_cover"],
    "environmental": ["temp", "precip", "soil_moist"],
}
~~~

---

## Model Design

### Option 1: Single-date classification with ViT or ResNet

This option identifies the current stage from a single image.

~~~python
from transformers import ViTForImageClassification, ViTFeatureExtractor
import torch

feature_extractor = ViTFeatureExtractor.from_pretrained(
    "google/vit-base-patch16-224-in21k"
)
model = ViTForImageClassification.from_pretrained(
    "google/vit-base-patch16-224-in21k",
    num_labels=5,  # Five growth-stage classes
)

inputs = feature_extractor(images=images, return_tensors="pt")
outputs = model(**inputs)
logits = outputs.logits
predictions = torch.argmax(logits, dim=-1)
~~~

### Option 2: Time-series modeling with LSTM or Transformer

This option forecasts developmental progress using multi-date observations.

~~~python
import torch
import torch.nn as nn

class RiceGrowthPredictor(nn.Module):
    """Time-series rice growth-stage prediction model."""

    def __init__(self, num_features=12, hidden_dim=256, num_classes=5):
        super().__init__()
        self.encoder = nn.Sequential(
            nn.Linear(num_features, hidden_dim),
            nn.LayerNorm(hidden_dim),
            nn.GELU(),
            nn.Dropout(0.1),
        )
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=hidden_dim, nhead=8, dim_feedforward=512,
            dropout=0.1, batch_first=True,
        )
        self.transformer = nn.TransformerEncoder(encoder_layer, num_layers=4)
        self.classifier = nn.Sequential(
            nn.Linear(hidden_dim, hidden_dim // 2),
            nn.GELU(), nn.Dropout(0.1),
            nn.Linear(hidden_dim // 2, num_classes),
        )

    def forward(self, x):
        """x has shape (batch, time_steps, num_features)."""
        encoded = self.encoder(x)
        temporal = self.transformer(encoded)
        return self.classifier(temporal[:, -1, :])
~~~

### Option 3: Multimodal fusion

Fuse imagery, meteorological data, and soil attributes.

~~~python
class MultiModalPredictor(nn.Module):
    """Multimodal rice growth-stage prediction."""

    def __init__(self):
        super().__init__()
        self.vision_encoder = ViTForImageClassification.from_pretrained(
            "google/vit-base-patch16-224", num_labels=256
        )
        self.weather_encoder = nn.Sequential(
            nn.Linear(8),  # Temperature, precipitation, humidity, and more
            nn.Linear(128), nn.GELU(), nn.Linear(64),
        )
        self.soil_encoder = nn.Sequential(
            nn.Linear(5),  # pH, organic matter, N, P, K, and related attributes
            nn.Linear(64), nn.GELU(), nn.Linear(32),
        )
        self.fusion = nn.Sequential(
            nn.Linear(256 + 64 + 32, 256), nn.LayerNorm(256),
            nn.GELU(), nn.Dropout(0.1), nn.Linear(256, 5),
        )

    def forward(self, images, weather, soil):
        with torch.no_grad():
            vision_feat = self.vision_encoder(images).logits
        weather_feat = self.weather_encoder(weather)
        soil_feat = self.soil_encoder(soil)
        return self.fusion(torch.cat([vision_feat, weather_feat, soil_feat], dim=1))
~~~

---

## Training Strategy

### Data augmentation

~~~python
from albumentations import Compose, RandomRotate90, HorizontalFlip, \
    VerticalFlip, RandomBrightnessContrast, HueSaturationValue

train_transform = Compose([
    RandomRotate90(p=0.5),
    HorizontalFlip(p=0.5),
    VerticalFlip(p=0.5),
    RandomBrightnessContrast(p=0.3),
    HueSaturationValue(p=0.3),
])
~~~

### Loss functions

~~~python
import torch.nn as nn

# Weighted cross entropy for imbalanced classes
class_weights = torch.tensor([1.0, 1.5, 2.0, 1.5, 1.0])
criterion = nn.CrossEntropyLoss(weight=class_weights)

# Focal loss for difficult examples
class FocalLoss(nn.Module):
    def __init__(self, alpha=0.25, gamma=2.0):
        super().__init__()
        self.alpha, self.gamma = alpha, gamma

    def forward(self, logits, targets):
        ce = nn.functional.cross_entropy(logits, targets, reduction="none")
        pt = torch.exp(-ce)
        return (self.alpha * (1 - pt) ** self.gamma * ce).mean()
~~~

### Training configuration

~~~python
from accelerate import Accelerator

accelerator = Accelerator()
model, optimizer, train_dataloader = accelerator.prepare(
    model, optimizer, train_dataloader
)

for epoch in range(num_epochs):
    for batch in train_dataloader:
        outputs = model(batch["images"])
        loss = criterion(outputs, batch["labels"])
        accelerator.backward(loss)
        optimizer.step()
        optimizer.zero_grad()
~~~

---

## Evaluation Metrics

| Metric | Formula | Meaning |
|---|---|---|
| **Accuracy** | (TP + TN) / Total | Overall classification accuracy |
| **F1 score** | 2 × P × R / (P + R) | More reliable for imbalanced classes |
| **MAE** | \|prediction − truth\| | Regression error, e.g. LAI prediction |
| **RMSE** | √(MAE²) | More sensitive to large errors |
| **R²** | 1 − SS_res / SS_tot | Goodness of fit |

~~~python
from sklearn.metrics import classification_report, confusion_matrix
import seaborn as sns
import matplotlib.pyplot as plt

print(classification_report(y_true, y_pred, target_names=class_names))
cm = confusion_matrix(y_true, y_pred)
sns.heatmap(cm, annot=True, cmap="Blues",
            xticklabels=class_names, yticklabels=class_names)
plt.xlabel("Predicted")
plt.ylabel("True")
plt.title("Confusion Matrix")
plt.show()
~~~

---

## Deployment Options

### Local deployment with FastAPI

~~~python
from fastapi import FastAPI, UploadFile
from PIL import Image
import torch

app = FastAPI()

@app.post("/predict")
async def predict(image: UploadFile):
    img = Image.open(image.file).convert("RGB")
    inputs = feature_extractor(img, return_tensors="pt")
    with torch.no_grad():
        outputs = model(**inputs)
        probs = torch.softmax(outputs.logits, dim=-1)

    stage_idx = torch.argmax(probs, dim=-1).item()
    confidence = probs[0][stage_idx].item()
    return {
        "growth_stage": class_names[stage_idx],
        "confidence": f"{confidence:.2%}",
        "probabilities": {
            name: f"{prob:.2%}" for name, prob in zip(class_names, probs[0])
        },
    }
~~~

### Cloud deployment with a Hugging Face Space

A Hugging Face Space can expose a web application quickly.

~~~python
import gradio as gr

def predict_rice_stage(image):
    inputs = feature_extractor(image, return_tensors="pt")
    with torch.no_grad():
        outputs = model(**inputs)
        probs = torch.softmax(outputs.logits, dim=-1)
    results = [f"{name}: {prob:.2%}" for name, prob in zip(class_names, probs[0])]
    return "\n".join(results)

iface = gr.Interface(
    fn=predict_rice_stage,
    inputs=gr.Image(type="pil"),
    outputs=gr.Textbox(lines=8),
    title="Rice Growth-Stage Prediction",
    description="Upload a UAV image of a rice field and let AI identify its current growth stage.",
)
iface.launch()
~~~

---

## Recommended Technology Stack

| Module | Recommended option | Alternative |
|---|---|---|
| Image processing | OpenCV + rasterio + GDAL | scikit-image |
| Vegetation indices | Custom calculation | RSGISLib |
| Feature extraction | ViT / ResNet-50 | EfficientNet |
| Time-series modeling | Transformer / LSTM | TimesNet |
| Training framework | Hugging Face transformers + accelerate | PyTorch Lightning |
| Experiment tracking | Weights & Biases | TensorBoard |
| Web interface | Gradio / Streamlit | FastAPI + Vue |
| Deployment | HF Space / Docker | AWS SageMaker |

---

## Core Scientific Questions

### 1. Inversion

Inferring crop physiological parameters from imagery is an **ill-posed inverse problem**. A practical solution needs to establish mappings between image features and physiological variables, constrain the solution space with prior knowledge such as crop-growth models, and combine mechanistic models with physics-informed neural networks (PINNs).

### 2. Prediction

Forecasting future growth stages from historical time series must address:

- **Temporal alignment:** years and cultivars have different growth rhythms;
- **Extrapolation:** generalization under growth conditions absent from training;
- **Uncertainty quantification:** confidence intervals for predictions.

### 3. Fusion

The main challenges in multisource fusion are:

- **Spatiotemporal alignment:** matching the scale of spatial imagery to temporal weather data;
- **Missing modalities:** remaining robust when some sources are unavailable;
- **Feature interaction:** modeling nonlinear relationships among modalities.

---

## Available Datasets

| Dataset | Contents | Source |
|---|---|---|
| **EuroSAT** | Multispectral satellite-image classification | HF Datasets |
| **CropNet** | Crop-type recognition | Public datasets |
| **PHENO** | Crop phenotyping data | Research datasets |
| **Custom dataset** | UAV imagery plus field labels | Project collection |

> A **custom dataset** is the most important component. Cover several cultivars and fields, collect at least three to five observations per growth stage, and record field truth such as LAI, biomass, and height at the same time.

---

## Implementation Roadmap

~~~text
Phase 1: Technical review (1–2 weeks)
├── Find relevant datasets and models on Hugging Face
├── Review key literature and select the route
└── Set up the development environment

Phase 2: Data preparation (2–3 weeks)
├── Collect UAV data or obtain public datasets
├── Preprocess imagery and extract features
└── Label and split data

Phase 3: Model training (3–4 weeks)
├── Baseline model: ResNet classification
├── Time-series model: Transformer
├── Multimodal fusion model
└── Evaluation and tuning

Phase 4: System integration (2–3 weeks)
├── Automate the training pipeline
├── Build a web visualization interface
└── Deploy to a Hugging Face Space
~~~

---

## References

- [Hugging Face Datasets](https://huggingface.co/datasets)
- [Hugging Face Models](https://huggingface.co/models)
- [OpenDroneMap](https://www.opendronemap.org/)
- [Albumentations documentation](https://albumentations.ai/docs/)
- [smolagents/ml-intern](https://huggingface.co/spaces/smolagents/ml-intern) — an official Hugging Face ML research agent

*Originally published April 24, 2026. Tags: agricultural AI, remote sensing, deep learning, precision agriculture, UAV.*
