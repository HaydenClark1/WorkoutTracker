import { createContext, useEffect, useState } from "react";

// ✅ Create WorkoutContext
export const WorkoutContext = createContext();

// ✅ Context Provider
export function WorkoutProvider({ children }) { 

    const [savedWorkouts, setSavedWorkouts] = useState(() => {
        const saved = localStorage.getItem("workouts");
        return saved ? JSON.parse(saved) : []; // Load from storage or initialize empty
    });

    const [savedTemplates, setSavedTemplates] = useState(() => {
        const saved = localStorage.getItem("templates");
        return saved ? JSON.parse(saved) : [];
    })

    // ✅ Persist workouts to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem("workouts", JSON.stringify(savedWorkouts));
    }, [savedWorkouts]);
    useEffect(() => {
        localStorage.setItem("templates", JSON.stringify(savedTemplates));
    }, [savedTemplates]);

    // ✅ Add a new workout
    const addWorkout = (name) => {
        const newWorkout = { name, sets: [] };
        const updatedWorkouts = [...savedWorkouts, newWorkout];
        setSavedWorkouts(updatedWorkouts);
        console.log("Adding Workout: ", name)
    };

    // ✅ Add a new set to an existing workout
    const addSet = (workoutName, setData) => {
        const updatedWorkouts = savedWorkouts.map(workout =>
            workout.name === workoutName
                ? { ...workout, sets: [...workout.sets, setData] }
                : workout
        );


        setSavedWorkouts(updatedWorkouts);
    };

    const deleteWorkout = (name) => {
        setSavedWorkouts(prevWorkouts =>
            prevWorkouts.filter(workout => workout.name !== name)
        );
        console.log("Deleted Workout:", name);
    };

    const cancelWorkout = () =>{
        localStorage.removeItem("workouts")
        setSavedWorkouts([])
        console.log("Canceled Workout")
    }
    const updateWorkout = (name,workoutData) =>{
        if (!name || !workoutData) {
            console.error("❌ updateWorkout called with undefined values!", name, workoutData);
            return;
        }
        setSavedWorkouts(prevWorkouts =>
            prevWorkouts.map(workout =>
                workout.name === name
                    ? { ...workout, sets: workoutData }  // ✅ Update sets
                    : workout
            )
        );
    }
    async function finishWorkout(){
        try{
            const response = await fetch("http://127.0.0.1:5000/save_workout", {
                method: "POST",  
                headers: {
                    "Content-Type": "application/json"  
                },
                body: JSON.stringify({workouts: savedWorkouts }) 
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();  // ✅ Parse JSON response
            console.log("Workout finished:", data);
            cancelWorkout()
            setSavedWorkouts([])

            
    } catch (error) {
        console.error("Error finishing workout:", error);
    }
    }

    const addTemplate = (name,workouts) =>{
        if(!name || !workouts.length){
            console.error("Invalid template name or empty workouts")
            return;
        }
        const newTemplate = {name,workouts}
        setSavedTemplates([...savedTemplates, newTemplate]);
        setSavedWorkouts([])
        console.log("Template Saved:", newTemplate);
    }

    const deleteTemplate = (name) => {
        setSavedTemplates(prevTemplates =>
            prevTemplates.filter(template => template.name !== name)
        );
        console.log("Deleted Template:", name);
    };

    const getSavedTemplates = () =>{
        return savedTemplates
    }

    return (
        <WorkoutContext.Provider value={{ 
            addTemplate,deleteTemplate,savedTemplates,
            updateWorkout,savedWorkouts,cancelWorkout,addWorkout,
            deleteWorkout,finishWorkout,addSet,getSavedTemplates
        }}>
            {children}
        </WorkoutContext.Provider>
    );
}
