import { Modal } from "react-bootstrap";
import '../styles/NewWorkout.css';
import { useState } from "react";

export default function NewWorkout({ isOpen, onClose,template }) {
    const [inputValue, setInputValue] = useState("");
    const [bodyPart, setBodyPart] = useState("");
    const [isBodyPartModal, setIsBodyPartModal] = useState(false);

    const handleInputChange = (event) => {
        setInputValue(event.target.value);
    };

    const partsList = [
        "Abdominals", "Chest",
        "Biceps", "Calves", "Glutes", "Hamstring",
        "Lats", "Lower Back", "Middle Back", "Traps", "Neck",
        "Quadriceps", "Shoulders", "Triceps"
    ];

    const saveWorkout = async () => {
        try {
            const response = await fetch("http://127.0.0.1:5000/add_workout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"  
                },
                body: JSON.stringify({ name: inputValue, bodyPart:bodyPart })
            });
            const data = await response.json()
            onClose()
        } catch (error) {
            alert("Error adding workout")
        }
        
        
    };

    return (
        <>
            <Modal 
                show={isOpen} 
                onHide={onClose} 
                backdrop="static" 
                centered 
                animation={true} 
                className="new-workout-modal"
            >
                <Modal.Header closeButton className="new-workout-header">
                    <button 
                        className="save-btn"
                        disabled={inputValue.trim() === "" || bodyPart.trim() === ""}
                        onClick={saveWorkout}
                    >
                        Save
                    </button>
                    Create New Exercise
                </Modal.Header>
                
                <Modal.Body>
                    {!isBodyPartModal && (
                        
                                <>
                                    <input
                                        type="text"
                                        placeholder="Add Name"
                                        value={inputValue}
                                        onChange={handleInputChange}
                                        style={{
                                            width: "100%",
                                            backgroundColor: "#dedcdc",
                                            borderRadius: "5px",
                                            border: "0",
                                            height: "30px",
                                        }}
                                    />
                                    <div
                                        style={{
                                            display: "flex",
                                            flexDirection: "row",
                                            justifyContent: "space-between",
                                            marginTop: "30px",
                                            cursor: "pointer" 
                                        }}
                                        onClick={() => setIsBodyPartModal(true)}
                                    >
                                        <p>Body Part</p>
                                        <p>{bodyPart || "None >"}</p>
                                    </div>
                                </>
                    )}

                    {isBodyPartModal && (
                        <>
                            <Modal.Header style={{display:"flex"}}>
                                <button 
                                    onClick={() => setIsBodyPartModal(false)}
                                    style={{
                                        border: "0",
                                        color: "#007bff",
                                        backgroundColor: "white",
                                        cursor: "pointer",
                                        marginRight:"120px"
                                    }}
                                >
                                    {"< Back"}
                                </button>
                                Body Part
                            </Modal.Header>

                            <Modal.Body>
                                {/* Scrollable List Container */}
                                <div style={{
                                    maxHeight: "200px", 
                                    overflowY: "auto",
                                    paddingRight: "10px"
                                }}>
                                    <ul style={{ listStyle: "none", padding: 0 }}>
                                        {partsList.map((part, index) => (
                                            <li 
                                                key={index}
                                                onClick={() => {
                                                    setBodyPart(part);
                                                    setIsBodyPartModal(false); // Close modal on selection
                                                }}
                                                style={{
                                                    cursor: "pointer",
                                                    padding: "5px 0",
                                                    borderBottom: "1px solid #e0e0e0"
                                                }}
                                            >
                                                {part}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </Modal.Body>
                        </>
                    )}
                </Modal.Body>
            </Modal>
        </>
    );
}
