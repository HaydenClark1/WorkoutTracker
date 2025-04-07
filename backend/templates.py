import pandas as pd
import numpy as np
import json

class Template:
    def __init__(self,workout_names,reps,sets,template_name):
        self.workout_names = workout_names
        self.reps = reps
        self.sets = sets
        self.template_name = template_name
        self.workouts = []
        
        if not (len(workout_names) == len(reps) == len(sets)):
            raise ValueError("Workout names,reps, and sets must have the same length.")
                             
        for i in range(len(workout_names)):
            workout = {
                "name": workout_names[i],
                "exercises": [
                    { "sets": sets[i], "reps": reps[i]}  # Exercise details
                ]
            }
            self.workouts.append(workout)

    def store_template(self):
        with open("templates.json","w") as file:
            json.dump(self.workouts,file,indent=4)
