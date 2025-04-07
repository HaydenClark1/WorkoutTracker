import { Card,Table,Spinner } from "react-bootstrap"
import '../styles/WorkoutCard.css'
import { useEffect, useState } from "react"
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function WorkoutCard({workout,deleteWorkout,updateWorkout}){


    const [sets,setSets] = useState(1);
    const [graphUrl, setGraphUrl] = useState(null); // ✅ Store the graph URL
    const [showPic,setShowPic] = useState(false)
    const [workoutData,setWorkoutData] = useState([
        { set: 1, lbs: "", reps: "" , date:""}
    ])
    const [prediction, setPrediction] = useState("")
    const [loading,setLoading] = useState(false)
    const [storedPredictions, setStoredPredictions] = useState({});
    
    useEffect(() =>{
        updateWorkout(workout.name,workoutData)
    },[workoutData])

    const [showMenu, setShowMenu] = useState(false)

    const addSet = () => {
        setWorkoutData([...workoutData, { set: sets + 1, lbs: "", reps: "", date:""}]);
        setSets(sets + 1); // Increase the count
    };
    const removeSet = (index) => {
        if (workoutData.length > 1) { 
            const updatedData = workoutData
            .filter((_, i) => i !== index)
            .map((item, i) => ({ ...item, set: i + 1 }))
            
            setWorkoutData(updatedData);
            setSets((prev) => prev -1)
        }
    };

    const toggleMenu = () => {
        setShowMenu(!showMenu);
    };

    const handleProgressClick = async () => {
        setLoading(true)
        setPrediction("");
        try {
            const response = await fetch(`http://127.0.0.1:5000/plot_workout?workout_name=${encodeURIComponent(workout.name)}`);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const blob = await response.blob();  // Convert response to an image
            const imageUrl = URL.createObjectURL(blob);
            setGraphUrl(imageUrl);
            console.log("GraphURL: " ,imageUrl)
            setShowPic(true)
        } catch (error) {
            console.error("Error fetching progress graph:", error);
        }
        setShowMenu(false);
        setLoading(false)
    };

    const precictWorkout = async (workout) => {
        const today = new Date().toISOString().split("T")[0]; // ✅ Get today's date in YYYY-MM-DD format

        if (storedPredictions[workout]) {
            console.log("Using cached prediction:", storedPredictions[workout]);
            setPrediction(storedPredictions[workout].prediction);
            return;
        }

        setLoading(true);
        setShowPic(false); // ✅ Hide progress graph if switching

            try {
                const response = await fetch("http://127.0.0.1:5000/model", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: workout })
                });

                const data = await response.json();
                
                if (data.model_response) {
                    setPrediction(data.model_response);
                    setStoredPredictions((prev) => ({
                        ...prev,
                        [workout]: { prediction: data.model_response }, // ✅ Store in state
                    }));
                }

            } catch (error) {
                console.error("Error:", error);
            }

            setLoading(false);
        };

    const handleOptionClick = async (option) => {
        switch(option){
            case("Progress"):
                await handleProgressClick()
                break
            case("Delete"):
                deleteWorkout()
                break;
            case("Predict"):
                await precictWorkout(workout.name)
                console.log(prediction);

                break;


        }
        setShowMenu(false);
        setLoading(false);
     };

    return (
        <>
        <Card>
            <Card.Header 
                style={{
                    textAlign:"center",
                    fontWeight:"bold", 
                    display:"flex", 
                    flexDirection:"row",
                    justifyContent:"space-between",
                    alignItems:"center",
                    position:"relative",
                    }}>
                <div>
                    {workout.name}
                </div>
                <div onClick={toggleMenu} className="menu-btn">
                    ...
                </div>
                {showMenu && (
                    <div
                    style={{
                        position: "absolute",
                        top: "40px", // Positions menu above the "..."
                        right: "0px",
                        backgroundColor: "white",
                        boxShadow: "0px 4px 6px rgba(0,0,0,0.1)",
                        borderRadius: "5px",
                        padding: "5px 0",
                        width: "100px",
                        zIndex: 10,
                    }}
                    >
                    <div
                        style={{
                        padding: "10px",
                        cursor: "pointer",
                        borderBottom: "1px solid #ddd",
                        }}
                        onClick={() => handleOptionClick("Progress")}
                    >
                        Progress
                    </div>
                    <div
                        style={{
                        padding: "10px",
                        cursor: "pointer",
                        color: "green",
                        }}
                        onClick={() => handleOptionClick("Predict")}
                    
                    >
                        Predict
                    </div>
                    <div
                        style={{
                        padding: "10px",
                        cursor: "pointer",
                        color: "red",
                        }}
                        onClick={() => handleOptionClick("Delete")}
                    >
                        Delete
                    </div>
                    
                    </div>
            )}
                
                
            </Card.Header>
            <Card.Body>
            {loading ? ( // ✅ Show spinner when loading
                    <div style={{ textAlign: "center", padding: "20px" }}>
                        <Spinner animation="border" variant="primary" />
                    </div>
                ) : prediction ? (
                    <>              
                        <div style={{ textAlign: "center" }}>
                            <button onClick={() => setPrediction("")}>X</button>
                            <h5>Predicted Workout:</h5>
                            <p>{prediction}</p>
                        </div>
                    </>  
                ) : (
                    showPic ? (
                    <div style={{ textAlign: "center" }}>
                        <div>
                            <button onClick={() => setShowPic(false)}>X</button>
                        </div>
                        <h5>Progress Graph</h5>
                        <img src={graphUrl} alt="Workout Progress Graph" style={{ width: "100%", maxWidth: "600px" }} />
                    </div>
                    ):(
                <div className="workout-table-container">
                    <Table striped bordered hover>
                        <thead>
                            <tr>
                                <th>Set</th>
                                <th>lbs</th>
                                <th>Reps</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {workoutData.map((row, index) => (
                                <tr key={index}>
                                    <td>{row.set}</td>
                                    <td>
                                        <input
                                            className="card-input"
                                            type="text"
                                            value={row.lbs}
                                            onChange={(e) => {
                                                let updatedData = [...workoutData];
                                                updatedData[index].lbs = e.target.value;
                                                setWorkoutData(updatedData);
                                            }}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            className="card-input"
                                            type="text"
                                            value={row.reps}
                                            onChange={(e) => {
                                                let updatedData = [...workoutData];
                                                updatedData[index].reps = e.target.value;
                                                setWorkoutData(updatedData);
                                            }}
                                        />
                                    </td>
                                    <td>
                                        <DatePicker
                                            selected={row.date ? new Date(row.date + "T00:00:00") : null} // Ensure local time
                                            onChange={(date) => {
                                                let formattedDate = date.toISOString().split("T")[0]; // Keep YYYY-MM-DD
                                                let updatedData = [...workoutData];
                                                updatedData[index].date = formattedDate;
                                                setWorkoutData(updatedData);
                                            }}
                                            dateFormat="yyyy-MM-dd"
                                            className="card-input"
                                        />
                                    </td>
                                    <td>
                                    <button className="remove-set-btn" onClick={() => removeSet(index)}>❌</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                    <button className="add-set-btn" onClick={addSet}>+ Add Set</button>
                </div>
                 )
            )
        }
                
            </Card.Body>

        </Card>
        </>
    )
}