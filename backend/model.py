import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score

class model:
    def __init__(self):
        self.model = PolynomialFeatures(degree=2, include_bias=False)


    def fetch_data(self,name):
        # Send request with JSON payload
        payload = {"workout_name": f"{name}"}  # Replace with your workout name
        response = requests.post(url, json=payload, headers={"Content-Type": "application/json"})
        
        # Convert response to DataFrame
        if response.status_code == 200:
            data = response.json()
            df = pd.DataFrame.from_dict(data)  # Correct way to convert dictionary of lists
            df["date"] = pd.to_datetime(df["date"])
            
        else:
            print("Error:", response.json())  # Show error message
        
        
        df["days_since_start"] = (df["date"] - df["date"].min()).dt.days
        df = df.sort_values(by=["date"])
        df["set_index"] = df.groupby("date").cumcount()
        
        
        df["last_weight"] = df.groupby("set_index")["weight"].shift(1).fillna(0)
        df["last_rep"] = df.groupby("set_index")["reps"].shift(1).fillna(0)
        
        
        df["time_since_last_lift"] = df["days_since_start"].diff().fillna(0)
        
        df["time_since_last_lift"] = df.groupby("date")["time_since_last_lift"].transform("first")
        df["fatigue_factor"] = df["last_rep"] / (df["time_since_last_lift"] + 1)
    
        df = df[df["days_since_start"] != 0]  # Remove rows where days_since_start is 0
        self.df = df
    



    def create_synthetic_data(self):
        
        # Ensure df exists
        if 'df' not in locals():
            raise ValueError("The original dataframe 'df' is not defined.")
        
        num_samples = 10000  # Number of new synthetic samples
        
        # Get first and last points from original data
        first_point = df.iloc[0]
        last_point = df.iloc[-1]
        
        # Compute slope between first and last data points
        slope = (last_point["last_weight"] - first_point["last_weight"]) / (last_point["days_since_start"] - first_point["days_since_start"])
        
        # Define range for days_since_start
        days_range = np.linspace(first_point["days_since_start"], last_point["days_since_start"], num_samples)
        
        # Generate synthetic data following the computed slope
        synthetic_data = pd.DataFrame({
            "days_since_start": days_range,
        })
        
        # Calculate corresponding last_weight values along the linear trend
        synthetic_data["last_weight"] = first_point["last_weight"] + slope * (synthetic_data["days_since_start"] - first_point["days_since_start"])
        
        # Add small noise to simulate real variations
        synthetic_data["last_weight"] += np.random.normal(0, 0.8, num_samples)  
        
        # Generate other random features with realistic ranges
        synthetic_data["reps"] = np.random.uniform(df["reps"].min(), df["reps"].max(), num_samples)
        synthetic_data["last_rep"] = np.random.uniform(df["last_rep"].min(), df["last_rep"].max(), num_samples)
        synthetic_data["time_since_last_lift"] = np.random.uniform(df["time_since_last_lift"].min(), df["time_since_last_lift"].max(), num_samples)
        synthetic_data["weight"] = synthetic_data["last_weight"] + np.random.normal(0, 1, num_samples)  # Small noise
        synthetic_data["index"] = [i % 3 for i in range(len(synthetic_data))]
        synthetic_data["index"].fillna(3)
        
        # Append synthetic data to the original dataset
        df_augmented = pd.concat([df, synthetic_data], ignore_index=True)
        df_augmented = df_augmented.dropna(subset=["last_weight"])
        df_augmented.fillna(0, inplace=True)  # Replace NaN with 0
        
        self.df_augmented = df_augmented
        
    def train_model(self):
        # Create a weight column: 1.0 for original data, 0.5 for synthetic data
        self.df_augmented["data_source"] = ["real" if i < len(df) else "synthetic" for i in range(len(df_augmented))]
        self.df_augmented["sample_weight"] = df_augmented["data_source"].apply(lambda x: 1.0 if x == "real" else 0.5)  # Adjust weight scale if needed
        
        # Define features and target
        X = self.df_augmented[["reps", "days_since_start", "last_weight", "last_rep"]]
        y = self.df_augmented["weight"]
        
        # Split into training and test sets (80% train, 20% test)
        #X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        X_train, X_test, y_train, y_test, sample_weights_train, sample_weights_test = train_test_split(
            X, y, sample_weights, test_size=0.2, random_state=42
        )
        
        
        # Scale features
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)
        
        # Apply Polynomial Transformation (degree=2 for quadratic, try 3 for cubic)
        poly = self.model
        X_train_poly = poly.fit_transform(X_train_scaled)
        X_test_poly = poly.transform(X_test_scaled)
        
        # Train Polynomial Regression Model
        model = LinearRegression()
        self.fitted_model = model.fit(X_train_poly, y_train, sample_weight=sample_weights_train)
        # Predict
        y_pred = model.predict(X_test_poly)
        
        # Evaluate Performance
        mae = mean_absolute_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)
        
        print("Mean Absolute Error:", mae)
        print("R² Score:", r2)

        
                