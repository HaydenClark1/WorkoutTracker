const BASE_URL = "http://127.0.0.1:5000";
let workoutList = [];

async function addPerson() {
    const name = document.getElementById("personName").value;
    const response = await fetch(`${BASE_URL}/add_person`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
    });
    const data = await response.json();
    document.getElementById("output").innerText = data.message;
}

// ✅ Fetch all workouts once when the page loads
async function fetchAllWorkouts() {
    try {
        const response = await fetch(`${BASE_URL}/get_all_workouts`);
        workoutList = await response.json();
        console.log("Loaded Workouts:", workoutList);  // Debugging
    } catch (error) {
        console.error("Error fetching workouts:", error);
    }
}

function searchWorkouts() {
    const input = document.getElementById("logWorkoutName");
    const query = input.value.trim().toLowerCase();
    const suggestionsDiv = document.getElementById("workoutSuggestions");

    if (query.length === 0) {
        suggestionsDiv.innerHTML = "";
        return;
    }

    // ✅ Filter workouts locally
    let suggestions = workoutList
        .filter(workout => workout.toLowerCase().includes(query))
        .map(workout => `<div class="suggestion" onclick="selectWorkout('${workout}')">${workout}</div>`)
        .join("");

    suggestionsDiv.innerHTML = suggestions;
}



function selectWorkout(workout) {
    document.getElementById("workoutName").value = workout;
    document.getElementById("workoutSuggestions").innerHTML = "";
}

async function addWorkout() {
    const name = document.getElementById("workoutName").value;
    if (!name) return;

    const response = await fetch(`${BASE_URL}/add_workout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
    });

    const data = await response.json();
    document.getElementById("workoutSuggestions").innerHTML = "";  // Clear suggestions
    alert(data.message);
}

async function logWorkout() {
    const name = document.getElementById("logPersonName").value;
    const workout_name = document.getElementById("logWorkoutName").value;
    const weight = document.getElementById("weight").value;
    const reps = document.getElementById("reps").value;

    const response = await fetch(`${BASE_URL}/add_lift`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, workout_name, weight, reps }),
    });
    const data = await response.json();
    document.getElementById("output").innerText = data.message;
}

async function getStats() {
    const name = document.getElementById("statsPersonName").value;
    const workout_name = document.getElementById("statsWorkoutName").value;

    const response = await fetch(`${BASE_URL}/get_workout_stats?name=${name}&workout_name=${workout_name}`);
    const data = await response.json();
    document.getElementById("output").innerText = JSON.stringify(data.stats, null, 2);
}

async function getWorkoutPlot() {
    const name = document.getElementById("plotPersonName").value;
    const workout_name = document.getElementById("plotWorkoutName").value;

    if (!name || !workout_name) {
        alert("Please enter a person and workout name.");
        return;
    }

    // ✅ Set the image source to the Flask route
    const img = document.getElementById("workoutPlot");
    img.src = `${BASE_URL}/plot_workout?name=${name}&workout_name=${workout_name}`;
    img.style.display = "block";  // Show image when ready
}


document.addEventListener("DOMContentLoaded", fetchAllWorkouts);

