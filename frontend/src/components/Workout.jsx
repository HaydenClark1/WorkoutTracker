import React, { useState,useContext ,useEffect} from "react";
import EmptyWorkout from "./EmptyWorkout";
import { WorkoutContext } from "../WorkoutProvider";
import '../styles/Workout.css'
import Template from "./Template";
import { Card } from "react-bootstrap";

export default function Workout() {
    const serverURL = "http://127.0.0.1:5000"
    const [isOpen, setIsOpen] = useState(false);
    const {addTemplate,getSavedTemplates,deleteTemplate,savedTemplates} = useContext(WorkoutContext)
    const [template, showTemplate] = useState(false)
    const[workouts, setWorkouts] = useState([])
    const [templates, setTemplates] = useState([])
    const [activeDropdown, setActiveDropdown] = useState(null); 


    useEffect(() =>{
        if (workouts.length == 0) {
            searchWorkouts()
        }

        console.log(getSavedTemplates())
        setTemplates(getSavedTemplates())
            
    })
    
    const searchWorkouts = () =>{
        fetch(`${serverURL}/get_all_workouts`)
        .then((response) => response.json())
        .then((data)=>{
            setWorkouts(data)
    })
    }

   const callGPT = async(workout) =>{
        try {
            const response = await fetch("http://127.0.0.1:5000/model", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({name:workout})
            });

            const data = await response.json();
            console.log(data);
        } catch (error) {
            console.error("Error:", error);
        }
   }
   const toggleDropdown = (index) => {
    setActiveDropdown(activeDropdown === index ? null : index); // Toggle dropdown
    };

    const handleModify = (templateName) => {
        console.log("Modify:", templateName);
        // Implement modify functionality
    };

    const handleDelete = (templateName) => {
        console.log("Delete:", templateName);
        deleteTemplate(templateName);
    };

    
    return (
        <div className="workout-container">
            <div className="workout-interactive-container">
                <h1>Start Workout</h1>
                <div 
                    style={{
                        width:"100%",
                        display: "flex",
                        justifyContent:"center"

                }}>
                    <button onClick={() => setIsOpen(true)} className="start-workout-btn">
                    Start an Empty Workout
                    </button>
                </div>

                <div>
                    <div 
                    style={{
                        marginTop:"50px",
                        display:"flex",
                        justifyContent:"space-between"
                    }}>
                        <h3>Templates</h3>
                        <button
                        style={{
                            border:"none",
                            backgroundColor:"#89CFF040",
                            color:"#47a6ff",
                            borderRadius:"5px",
                            marginRight:"20px"

                        }}
                        onClick={() => showTemplate(true)}
                        
                        >Add Template</button>
                    </div>
                    <div style={{display:"flex"}}>
                    {savedTemplates.length > 0 && !template ? (
                                savedTemplates.map((template,index)=>(
                                    <Card key={index}>
                                        <Card.Header style={{display:"flex", justifyContent:"space-between", height:"40px"}}>
                                            {template.name}
                                            <p
                                                className="close-template-btn"
                                                onClick={() => toggleDropdown(index)}
                                             >...</p>
                                              {activeDropdown === index && (
                                                <div className="dropdown-menu">
                                                    <button onClick={() => handleModify(template.name)}>Modify</button>
                                                    <button onClick={() => handleDelete(template.name)}>Delete</button>
                                                </div>
                                            )}
                                        </Card.Header>
                                        <Card.Body>
                                            {template.workouts.map((workout,index)=>(
                                                <div key={index}>
                                                    <p>{workout.name}</p>
                                                </div>
                                            ))}
                                        </Card.Body>
                                    </Card>
                            ))
                        ):(
                           <Template onClose={() => showTemplate(false)} isOpen={template} workouts={workouts}/>
                        )}
                    </div>
                </div>

                <EmptyWorkout isOpen={isOpen} onClose={() => setIsOpen(false)} serverURL={serverURL}/>

                <button onClick={(name) => callGPT}>Test GPT</button>

            </div>


        
        </div>
    );
}
