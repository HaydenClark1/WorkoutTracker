import { Card,Modal } from "react-bootstrap"
import '../styles/Template.css'
import EmptyWorkout from "./EmptyWorkout"
import WorkoutSearch from "./WorkoutSearch"
import { useState } from "react"
import { useContext } from "react"
import NewWorkout from "./NewWorkout"
import { WorkoutContext } from "../WorkoutProvider"
import WorkoutCard from "./WorkoutCard"

export default function Template({onClose,isOpen,workouts}){

    const {savedWorkouts,cancelWorkout,addTemplate,deleteWorkout,updateWorkout, finishWorkout, addWorkout, addSet} = useContext(WorkoutContext)
    const [newWorkoutOpen,setNewWorkoutOpen] = useState(false)
    const [search, setSearch] = useState(false)
    const [templateName,setTemplateName] = useState("")

    const handleSave = ()=>{
        addTemplate(templateName,savedWorkouts)
        onClose()
        
    }


    return (
        <>
        <Modal className="template-modal" show={isOpen} onHide={onClose} backdrop="static" centered animation={true}>
            <Modal.Header closeButton style={{maxHeight:"80px",height:"80px"}}>
                <input  
                    className = "template-name"
                    type="text" 
                    placeholder="Unnamed Template"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                />
            </Modal.Header>
            <Modal.Body>
                <button
                    onClick={()=>setSearch(true)}
                    hidden={search}
                    style={{
                        
                    }}
                >Search</button>
                {search && (
                    <WorkoutSearch 
                        workouts={workouts}
                        addWorkout={(name) => addWorkout(name)}
                        newWorkout={() => setNewWorkoutOpen(true)}
                        onClose={() => setSearch(false)}
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
                <button onClick={handleSave}>Submit</button>
                {newWorkoutOpen && (
                     <NewWorkout 
                        isOpen={newWorkoutOpen}
                        onClose={() => setNewWorkoutOpen(false)}
                    />
                )}

                
               
            </Modal.Body>

        </Modal>
        </>
    )
}
