import './App.css'
import 'bootstrap/dist/css/bootstrap.min.css';
import Workout from './components/Workout'
import {WorkoutProvider} from './WorkoutProvider'
function App() {

  return (
    <>
        <WorkoutProvider>
            <Workout />
        </WorkoutProvider>      
    </>
  )
}

export default App
