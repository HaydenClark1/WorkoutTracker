import os
import time
import sqlite3
import pandas as pd
import shutil
import gc 
import time
import subprocess
import templates

class Workouts:
    def __init__(self):
        self.workout_df = pd.read_csv("megaGymDataset.csv")
        self.workout_ids = {}
        
        # ✅ Connect to SQLite Database
        self.conn = sqlite3.connect("workout.db",check_same_thread=False)
        self.cursor = self.conn.cursor()
         # ✅ Enable WAL mode (prevents locks)
        self.cursor.execute("PRAGMA journal_mode=WAL;")

        # ✅ Set busy timeout (waits if database is locked)
        self.cursor.execute("PRAGMA busy_timeout = 5000;")

        # ✅ Drop tables if they exist
        self.cursor.execute("DROP TABLE IF EXISTS Person;")
        #self.cursor.execute("DROP TABLE IF EXISTS Workouts;")
        self.cursor.execute("DROP TABLE IF EXISTS connect;")
        #self.cursor.execute("DROP TABLE IF EXISTS Workout_Log;")
        
        # ✅ Recreate tables
        self.create_tables()
        
        # ✅ Add workouts from CSV
        for _, workout in self.workout_df.iterrows():
            self.add_workout(workout["Title"], workout["BodyPart"])

            

        # ✅ Store workout IDs in a dictionary
        workouts = self.get_workouts()

        for workout in workouts:
            self.workout_ids[workout[1].lower()] = workout[0]

        self.conn.commit()
        

    def create_tables(self):
        """Creates all required tables in the database."""
        self.cursor.execute("""
            CREATE TABLE Person (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT
            )
        """)

       
        self.cursor.execute("""
            CREATE TABLE connect (
                p_id INTEGER,
                w_id INTEGER,
                PRIMARY KEY (p_id, w_id),
                FOREIGN KEY (p_id) REFERENCES Person(id) ON DELETE CASCADE,
                FOREIGN KEY (w_id) REFERENCES Workouts(id) ON DELETE CASCADE
            )       
        """)
        self.cursor.execute("""
            CREATE TABLE IF NOT EXISTS Workouts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE,
                body_part TEXT
            )
        """)
        self.cursor.execute("""
            CREATE TABLE IF NOT EXISTS Workout_Log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                workout_id INTEGER,
                date TEXT DEFAULT CURRENT_TIMESTAMP, 
                weight REAL, 
                reps REAL,
                FOREIGN KEY (workout_id) REFERENCES Workouts(id) ON DELETE CASCADE
            )
        """)

    
       

    def delete_db(self):
        """Deletes the database file safely."""
        db_path = "workout.db"

        # ✅ Explicitly close cursor and connection
        if hasattr(self, 'cursor'):
            self.cursor.close()

        if hasattr(self, 'conn'):
            self.conn.close()

        try:
            # ✅ Wait to ensure SQLite releases the lock
            time.sleep(1)

            # ✅ Rename before deletion to prevent locking issues
            renamed_path = db_path + "_old"
            os.rename(db_path, renamed_path)
            time.sleep(0.5)  # Allow time for rename

            # ✅ Delete the renamed file
            os.remove(renamed_path)
            print(f"Database '{db_path}' deleted successfully.")

        except FileNotFoundError:
            print(f"File '{db_path}' not found.")
        except PermissionError:
            print(f"Permission denied: Close any programs using '{db_path}' and try again.")
        except Exception as e:
            print(f"Error deleting database: {e}")

    def create_person(self, name):
        """Adds a new person to the database."""
        self.cursor.execute("INSERT INTO Person (name) VALUES (?)", (name.lower(),))
        self.conn.commit()

    def return_person_id(self, name):
        """Returns the ID of a person by name."""
        self.cursor.execute("SELECT id FROM Person WHERE name = ?", (name,))
        result = self.cursor.fetchone()
        return result[0] if result else None

    def add_workout(self, workout,body_part):
        """Adds a new workout to the database, preventing duplicates."""
        try:
            self.cursor.execute("INSERT OR IGNORE INTO Workouts (name,body_part) VALUES (?,?)", (workout.lower(),body_part.lower()))
            self.conn.commit()
            
            self.cursor.execute("SELECT id FROM Workouts WHERE name = ?", (workout,))
            result = self.cursor.fetchone()
            if result is None:
                return None
            workout_id = result[0]
            self.workout_ids[workout] = workout_id
            
            self.conn.commit()
        except sqlite3.IntegrityError:
            print(f"Workout '{workout}' already exists!")

    def get_workouts(self):
        """Fetches all workouts from the database."""
        self.cursor.execute("SELECT * FROM Workouts ORDER BY id ASC")
        return self.cursor.fetchall()

    def get_workout_id(self,workout):
        return self.workout_ids.get(workout.lower())

        
    def add_lift(self,name,workout_name,weight,reps):
        person_id = self.return_person_id(name.lower())
        
        workout_id = self.get_workout_id(workout_name)
        
        if person_id is None:
            print("Person Not Found")
            return None
        self.cursor.execute("""
            INSERT INTO Workout_Log (person_id,workout_id,weight,reps) VALUES (?,?,?,?)
        """,(person_id,workout_id,weight,reps))
        self.conn.commit()

    def get_workout_stats(self,name,workout_name):
        person_id = self.return_person_id(name.lower())
        workout_id = self.get_workout_id(workout_name)
        
        print(f"Person ID: {person_id} and Workout ID: {workout_id}")
        self.cursor.execute("""
            SELECT * FROM Workout_Log 
            WHERE person_id = ? AND workout_id = ?
        """, (person_id, workout_id))
        result = self.cursor.fetchall()
        self.conn.commit()
        if not result:
            print(f"No logs found for {name} and {workout_name}.")
            return None
        return result