from openai import OpenAI
import openai
import requests
import pandas as pd
import numpy as np
import os

class ChatGPT_model:
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY") 
        if not self.api_key:
            raise ValueError("Missing OpenAI API Key. Set the 'OPENAI_API_KEY' environment variable.")

        self.client = OpenAI(api_key=self.api_key)
        self.df = None
    def fetch_data(self, name):
        url = "http://127.0.0.1:5000/get_logs"
        payload = {"workout_name": name}

        try:
            response = requests.post(url, json=payload, headers={"Content-Type": "application/json"})

            print(f"🔍 Response Status: {response.status_code}")
            print(f"🔍 Response Text: '{response.text}'")  # ✅ Print raw response

            if response.status_code != 200:
                print("❌ Error: Non-200 response received.")
                return None

            if not response.text.strip():  # ✅ Handle empty response
                print("❌ Error: Received empty response from /get_logs")
                return None

            try:
                data = response.json()  # ✅ Parse JSON safely
            except ValueError:
                print("❌ Error: Response could not be parsed as JSON")
                return None

            # ✅ Convert to DataFrame and handle empty case
            if not data:
                print("❌ Error: No workout data received.")
                return None
            
            df = pd.DataFrame.from_dict(data)
            if "date" not in df.columns:
                raise KeyError("❌ 'date' column is missing from the query results")
            
            df["date"] = pd.to_datetime(df["date"])
            df["days_since_start"] = (df["date"] - df["date"].min()).dt.days
            df = df.sort_values(by=["date"])
            df["set_index"] = df.groupby("date").cumcount()
            df["last_weight"] = df.groupby("set_index")["weight"].shift(1).fillna(0)

            self.df = df
            print(df)
            return df

        except requests.exceptions.RequestException as e:
            print(f"❌ Request failed: {e}")
            return None
        except ValueError as e:
            print(f"❌ JSON Parsing Error: {e}")
            return None

    def calculate_next_weight(self, name, num_sets):
        if self.df is None or self.df.empty:
            print("❌ No previous workout data available. Using default strategy.")
            return None

        last_5_days = self.df[self.df["date"] >= self.df["date"].max() - pd.Timedelta(days=4)]
        if last_5_days.empty:
            print("❌ No data available for the last 5 days.")
            return None

        
        workout_data_text = "\n".join(
            f"{row['date'].strftime('%Y-%m-%d')} - {row['weight']} lbs x {row['reps']} reps on set {row['set_index'] + 1}"
            for _, row in last_5_days.iterrows()
        )

        print(workout_data_text)

        prompt = f"""
        I have been progressively overloading on {name}.
        Here are my last 5 workout days with all sets (date, weight, reps):

        {workout_data_text}
    
        Based on the last 5 or so days, how much weight should I lift and how many reps should I do per set 
        in my next session to maximize my muscle growth. I want your response to only give me the weight, the 
        number of reps, and the number of sets in the format: "Weight lbs x Reps reps x Sets sets"
        """

        try:
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[{"role": "system", "content": "You are a strength training expert that wants to help me build muscle."},
                          {"role": "user", "content": prompt}],
                max_tokens=100  # Adjust based on response length
            )
            
            # ✅ Extract recommendation safely
            next_weight = response.choices[0].message.content.strip()
            print(f"🔍 Suggested Next Weight: {next_weight}")
            
            return next_weight
            
        except openai.OpenAIError as e:
            print(f"❌ OpenAI API Error: {e}")
            return None