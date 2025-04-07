import '../styles/WorkoutSearch.css'
import { Modal, Card,Button } from "react-bootstrap";
import { useEffect, useState } from 'react';
import WorkoutCard from './WorkoutCard';
import NewWorkout from "./NewWorkout";


export default function WorkoutSearch({newWorkout,onClose,isOpen,workouts,addWorkout}){
    const [search,setSearch] = useState("")
    const [results, setResults] = useState([])

    useEffect(() =>{
        function searchWorkouts(){
            if(!search.trim()){
                setResults([]) //Clear results if search is empty
                return
            }
            const filteredWorkouts = workouts.filter(workout =>
                workout.toLowerCase().includes(search.toLowerCase())
            )
    
            setResults(filteredWorkouts)
        }
        searchWorkouts()

    },[search])
    const handleNewWorkout = () => {
        newWorkout()
        onClose()
        
    }
    return (
        <>
        <div className='search-container'>
            <Card style={{ width: '100%' }}>
           
                    <Card.Title>
                        <div style={{display:"flex", flexDirection:"row", justifyContent:"space-between",alignContent:"center", paddingTop:"10px"}}>
                            <button className='new-workout-btn' onClick={handleNewWorkout}>New</button>
                            <button className='card-close-btn' onClick={onClose}>✖</button>
                        </div>  
                    </Card.Title>
                <Card.Body className='search-card-body'>
                   
                    <input 
                        style={{width:'100%'}}
                        type="text" 
                        placeholder='Search'
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <div className='results-container'>
                        {results.length > 0 ? (
                            results.map((workout,index) => (
                                <div key={index} className="result-item" onClick={() => addWorkout(workout)}>{workout}</div>
                            ))
                        ): (
                            <div className="no-results">
                                No results found
                            </div>
                        )}

                    </div>

                </Card.Body>
            </Card>
            
        </div>
        </>
    )
}