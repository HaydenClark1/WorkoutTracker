import React from "react";
import { Modal, Button } from "react-bootstrap";
import { useState,useContext,createContext, useEffect} from "react";
import '../styles/EmptyWorkout.css';
import WorkoutSearch from "./WorkoutSearch";
import { WorkoutContext } from "../WorkoutProvider";
import WorkoutCard from "./WorkoutCard";
import NewWorkout from "./NewWorkout";
const EmptyWorkout = ({ isOpen, onClose, serverURL }) => {
    const[workouts, setWorkouts] = useState([])
    const [workoutSearch, setWorkoutSearch] = useState(false)
    const {savedWorkouts,cancelWorkout,deleteWorkout,updateWorkout, finishWorkout, addWorkout, addSet} = useContext(WorkoutContext)
    const [newWorkoutOpen,setNewWorkoutOpen] = useState(false)
    

    useEffect(() =>{
        searchWorkouts()
        
    },[newWorkoutOpen])

    const searchWorkouts = () =>{
            fetch(`${serverURL}/get_all_workouts`)
            .then((response) => response.json())
            .then((data)=>{
                setWorkouts(data)
        })
    }
    
   
    const handleFinish = () =>{
        finishWorkout()
        onClose()
    }

    

    return (
            <Modal show={isOpen} onHide={onClose} backdrop="static" centered animation={true} className="empty-workout-modal">
                <Modal.Header style={{display:"flex",flexDirection:"row", justifyContent:"space-between"}}>
                    <Modal.Title>Workout</Modal.Title>
                    <button className="finish-btn" onClick={handleFinish}>Finish</button>
                </Modal.Header>
                    <Modal.Body className="modal-body">
                        {workoutSearch &&(
                            <WorkoutSearch 
                                isOpen={workoutSearch} 
                                onClose={() => setWorkoutSearch(false)}
                                workouts={workouts}
                                addWorkout={(name) => addWorkout(name)}
                                newWorkout={() => setNewWorkoutOpen(true)}
                            />
                        )}
                        {savedWorkouts.length > 0 && (
                            savedWorkouts.map((workout,index)=>(
                                <WorkoutCard 
                                    key={index} 
                                    workout={workout} 
                                    deleteWorkout = {() => deleteWorkout(workout.name)}
                                    updateWorkout = {(name,workoutData) => updateWorkout(name,workoutData)}
                                    />
                            ))
                        )}
                        <button className="add-exercise-btn" onClick={()=> setWorkoutSearch(true)}>Add an Exercise</button>
                        <button className="cancel-workout-btn" onClick={() => {cancelWorkout(); onClose()}}>Cancel Workout</button>
                        {newWorkoutOpen && (
                            <NewWorkout 
                                isOpen={newWorkoutOpen}
                                onClose={() => setNewWorkoutOpen(false)}
                            />
                        )}
                    </Modal.Body> 
               
            </Modal>
            
    );
    };

export default EmptyWorkout;
