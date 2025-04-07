from flask import Flask,request, jsonify,render_template,send_file
from workouts import Workouts  # Import your Workouts class
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from flask_cors import CORS
import io
import pandas as pd
from datetime import datetime, timedelta
from chatgpt import ChatGPT_model
import os
import json

app = Flask(__name__)
CORS(app)
# Initialize Workout database
try:
    workout_db = Workouts()
except Exception as e:
    import traceback
    print("❌ Error initializing `Workouts()`: ", traceback.format_exc())  # Print full traceback
    workout_db = None
chatgpt = ChatGPT_model()
print(workout_db)


@app.route('/save_workout', methods=['POST'])
def save_workout():
    try:
        # ✅ Get JSON data from request
        data = request.get_json()
        print("Found data: ",data)
        if not data or 'workouts' not in data:
            return jsonify({"error": "Invalid data, 'workouts' field is required"}), 400

        cursor = workout_db.conn.cursor()

        # ✅ Loop through each workout
        for workout in data["workouts"]:
            workout_name = workout.get("name")

            workout_id = workout_db.get_workout_id(workout_name)
            
            # ✅ Insert each set individually
            
            for set_data in workout.get("sets", []):
                workout_date = set_data.get("date") or datetime.today().strftime('%Y-%m-%d')
                print(f"Found date: {workout_date}")
                
                weight = float(set_data.get("lbs", 0))
                reps = int(set_data.get("reps", 0))
                
                cursor.execute("""
                    INSERT INTO Workout_Log (workout_id, weight, reps, date) 
                    VALUES (?, ?, ?, ?)
                """, (workout_id, weight, reps, workout_date)) 
            
                workout_db.conn.commit()
        return jsonify({"message": "Workout sets saved successfully!"}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500
        
@app.route('/get_saved_workouts', methods=['GET'])
def get_saved_workouts():
    try:
        cursor = workout_db.conn.cursor()
        cursor.execute("SELECT * FROM Workout_Log")
        logs = cursor.fetchall()

        if not logs:
            return jsonify({"message": "No workout logs found."}), 404

        # ✅ Convert logs to a list of dictionaries
        workout_logs = []
        for log in logs:
            workout_logs.append({
                "id": log[0],
                "workout_id": log[1],
                "date": log[2],
                "weight": log[3],
                "reps": log[4]
            })

        return jsonify({"workout_logs": workout_logs}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

        
@app.route('/get_all_workouts', methods=['GET'])
def get_all_workouts():
    if workout_db is None:
        return jsonify({"error": "Database not initialized"}), 500
        
    cursor = workout_db.conn.cursor()
    cursor.execute("SELECT name FROM Workouts ORDER BY id ASC")
    workouts = [row[0] for row in cursor.fetchall()]  # Extract only workout names
    return jsonify(workouts)

@app.route('/check_workout_log', methods=['GET'])
def check_workout_log():
    try:
        print(workout_db)
        cursor = workout_db.conn.cursor()
        cursor.execute("SELECT * FROM Workout_Log")
        logs = cursor.fetchall()

        if not logs:
            return jsonify({"message": "No workout logs found."}), 404

        return jsonify({"workout_logs": logs}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
        
@app.route('/check_workouts', methods=['GET'])
def check_workouts():
    try:
        cursor = workout_db.conn.cursor()
        cursor.execute("SELECT * FROM Workouts WHERE id > 2917")
        logs = cursor.fetchall()

        if not logs:
            return jsonify({"message": "No workouts found."}), 404

        return jsonify({"workouts": logs}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/search_workouts', methods=['GET'])
def search_workouts():
    query = request.args.get("query", "").strip().lower()
    if not query:
        return jsonify([])

    # ✅ Create a new database connection for each request
    temp_db = Workouts()
    all_workouts = temp_db.get_workouts()  # Fetch workouts safely

    # ✅ Close the temp connection after use
    temp_db.conn.close()

    # Filter workouts by query
    matching_workouts = [name for _, name in all_workouts if query in name.lower()]

    return jsonify(matching_workouts)

@app.route('/add_workout_dev', methods=['POST'])
def manually_add_workouts():
    data = request.get_json()    
    
    workout_name = data.get("name").lower()
    workout_part = data.get("bodyPart").lower()
    
    workout_db.add_workout(workout_name,workout_part)
    
    workout_id =workout_db.get_workout_id(workout_name)
    
    
    date = data.get("date")
    sets = data.get("sets")
    
    try:
        for set_entry in sets:
            weight = set_entry.get('lbs',0)
            reps = set_entry.get('reps', 0)   # Default to 0 if not provided

            workout_db.cursor.execute("""
                INSERT INTO Workout_Log (workout_id,weight,reps,date) VALUES (?,?,?,?)
            """,(workout_id,weight,reps,date))
            

            
            workout_db.conn.commit()
    except Exception as e:
        return jsonify({"error": str(e)}),500

    return jsonify({"message": "Workout log added successfully!"}), 201



@app.route('/plot_workout', methods=['GET'])
def plot_workout():
    print("DEBUG: workout_db is", workout_db)

    """Generate a workout progress plot (Total Weight Lifted Over Time)."""
    workout_name = request.args.get("workout_name")  # Get workout name from request

    if not workout_name:
        return jsonify({"error": "Workout name is required"}), 400

    # ✅ Get workout ID
    workout_id = workout_db.get_workout_id(workout_name)
    print(f"Workout name: {workout_name} and workout ID: {workout_id}")
    
    if not workout_id:
        return jsonify({"error": f"Workout '{workout_name}' not found"}), 404

    # ✅ Fetch workout logs from the database
    cursor = workout_db.conn.cursor()
    cursor.execute("""
        SELECT date, weight, reps FROM Workout_Log 
        WHERE workout_id = ? ORDER BY date ASC
    """, (workout_id,))
    
    logs = cursor.fetchall()
    print(logs)
    if not logs:
        start_date = datetime.today() - timedelta(days=5)
        end_date = datetime.today() + timedelta(days=5)
        date_range = pd.date_range(start=start_date, end=end_date)
        
        # If no exercise is found return an empty graph
        plt.figure(figsize=(8, 5))
        plt.plot(date_range, [0] * len(date_range), linestyle ="-", color="b",label = "Total Weight (lbs)")
        plt.title(f"Progress: {workout_name}")
        plt.xlabel("Date")
        plt.ylabel("Total Weight Lifted (lbs)")
        plt.ylim(bottom=0)
        plt.grid()

        img = io.BytesIO()
        plt.savefig(img, format="png")
        img.seek(0)
        plt.close()

        return send_file(img, mimetype='image/png')
        
    
    # ✅ Convert to a DataFrame
    df = pd.DataFrame(logs, columns=["date", "weight", "reps"])
    df["date"] = pd.to_datetime(df["date"])  # Convert date column to datetime
    #df["total_weight"] = df["weight"] * df["reps"]  # Calculate total weight lifted
    df["one_rep_max"] = df["weight"] * (1 + df["reps"] / 30)
    
    
    
    #df = df.groupby("date",as_index=False)["total_weight"].sum()
    df = df.groupby("date",as_index=False)["one_rep_max"].max()
    
    # ✅ Generate the plot
    plt.figure(figsize=(8, 5))
    #plt.plot(df["date"], df["total_weight"], marker="o", linestyle="-", color="b", label="Total Weight (lbs)")
    plt.plot(df["date"], df["one_rep_max"], marker="s", color="b", label="Max 1RM (lbs)")

    plt.xlabel("Date")
    plt.ylabel("One Rep Max (lbs)",fontsize=18)
    plt.yticks(fontsize=15)
    plt.title(f"One Rep Max: {workout_name}")
    plt.legend()
    plt.xticks(rotation=45,ha="right")
    plt.grid()
    plt.tight_layout()


    img2 = io.BytesIO()
    plt.figure(figsize=(8, 5))
    plt.plot(total_weight_df["date"], total_weight_df["total_weight"], marker="s", label="Total Weight")
    plt.title(f"Total Weight Lifted: {workout_name}")
    plt.xlabel("Date")
    plt.ylabel("Weight (lbs)")
    plt.grid()
    plt.tight_layout()
    plt.savefig(img2, format="png")
    img2.seek(0)
    plt.close()
    total_weight_b64 = base64.b64encode(img2.read()).decode("utf-8")



    # ✅ Save the image to a BytesIO object
    img = io.BytesIO()
    plt.savefig(img, format="png")
    img.seek(0)
    plt.close()

    return send_file(img, mimetype='image/png')  # ✅ Return the image
    
@app.route('/add_workout',methods=['POST'])
def add_workout():
    try:
        data = request.get_json()
        print("New workout created for ",data)
        name = data.get('name', '')  
        body_part = data.get('bodyPart', '')  
        workout_db.add_workout(name,body_part)

        return jsonify({"msg": "Workout successfully added to database"}), 200
    except Exception as e:
        return jsonify({"error":str(e)}), 500

@app.route('/get_logs',methods= ['POST'])
def get_logs():
    data = request.get_json()

    workout_name = data.get("workout_name","")
    
    if workout_name == "":
        return jsonify({"error": "Workout name is required"}), 400

    # ✅ Get workout ID
    workout_id = workout_db.get_workout_id(workout_name)

    cursor = workout_db.conn.cursor()

    cursor.execute("""
        SELECT weight,reps,date
        FROM Workout_Log
        WHERE workout_id == ?
    """,(int(workout_id),))
    logs = cursor.fetchall()

    if not logs:
        empty_df = pd.DataFrame(columns=["weight", "reps", "date"])  # Create an empty DataFrame
        return empty_df.to_json(orient="records")  # Return an empty JSON list []

    df = pd.DataFrame(logs, columns=["weight", "reps","date"])
    print(df.head(3))
    return df.to_json(orient="records")

PREDICTION_FILE = "predictions.txt"

def load_predictions():
    if not os.path.exists(PREDICTION_FILE):
        return {}
    with open(PREDICTION_FILE,"r") as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return {}
            
def save_predictions(predictions):
    with open(PREDICTION_FILE, "w") as f:
        json.dump(predictions,f,indent=4)

def get_workout_count(workout_name):
    cursor = workout_db.conn.cursor()
    cursor.execute("""
        SELECT COUNT(*) FROM Workout_Log WHERE workout_id = ?
    """, (workout_db.get_workout_id(workout_name),))
    count = cursor.fetchone()[0]
    return count
    

@app.route('/model',methods=["POST"])
def create_model():
    data = request.get_json()
    if not data or "name" not in data:
        return jsonify({"error": "Missing 'name' in request body"}), 400
    name = data["name"]
    
    print("Creating model for ", data["name"])

    if chatgpt is None:
        return jsonify({"error": "chatgpt object is not initialized"}), 500

    predictions = load_predictions()
    
    current_workout_count = get_workout_count(name)

    if name in predictions and predictions[name]["workout_count"] == current_workout_count:
        return jsonify({
            "message": "Using cached prediction",
            "model_response": predictions[name]["prediction"]
        })


    
    chatgpt.fetch_data(name)
    next_weights = chatgpt.calculate_next_weight(name,3)

    # Save new prediction in file
    predictions[name] = {
        "workout_count": current_workout_count,  
        "prediction": next_weights
    }
    save_predictions(predictions)
    
    
    return jsonify({"message": f"Model created for {name}", "model_response":next_weights})

@app.route('/')
def home():
    return render_template("index.html")

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
