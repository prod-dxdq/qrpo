# RF Efficiency Machine Learning Feature

## Overview
This feature allows you to upload CSV data containing RF (Radio Frequency) measurements and predict efficiency using a Linear Regression model.

## Usage

### 1. Backend Setup
The RF efficiency endpoint is already integrated into `backend/api/main.py` at:
```
POST /rf_efficiency
```

### 2. Frontend Access
- Navigate to the dashboard
- Click on the "🤖 Machine Learning" section in the sidebar
- Click "📈 RF Efficiency Analysis"
- Upload your CSV file

### 3. CSV Format
Your CSV file must contain the following columns:
- `freq_MHz`: Frequency in MHz (e.g., 2500)
- `power_dBm`: Power in dBm (e.g., 10)
- `temp_C`: Temperature in Celsius (e.g., 25)
- `efficiency`: Efficiency percentage (e.g., 89.5)

### Sample Data
A sample CSV file is provided at `sample_rf_data.csv` with 20 data points for testing.

## Model Details
- **Algorithm**: Linear Regression (sklearn)
- **Features**: Frequency, Power, Temperature
- **Target**: Efficiency (%)
- **Prediction Point**: 2500 MHz, 10 dBm, 25°C

## Response
The API returns:
- `predicted_efficiency`: Predicted efficiency percentage
- `plot_path`: Path to visualization (frequency vs efficiency scatter plot)
- `model_coefficients`: Feature coefficients [freq, power, temp]
- `model_intercept`: Model intercept value

## Visualization
A scatter plot showing the relationship between frequency and efficiency is automatically generated and displayed in the UI.
