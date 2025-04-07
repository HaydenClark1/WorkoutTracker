import grpc
import workout_pb2
import workout_pb2_grpc

channel = grpc.insecure_channel('localhost:50051')
stub = workouts_pb2_grpc.WorkoutServiceStub(channel)

while True:
    print("\n1. Add Person")
    print("2. Add Workout")
    print("3. Log a Lift")
    print("4. Get Workout Stats")
    print("5. Exit")
    
    choice = input("Choose an option: ")

    if choice == "1":
        name = input("Enter person's name: ")
        response = stub.AddPerson(workouts_pb2.PersonRequest(name=name))
        print(response.message)

    elif choice == "2":
        workout = input("Enter workout name: ")
        response = stub.AddWorkout(workouts_pb2.WorkoutRequest(name=workout))
        print(response.message)

    elif choice == "3":
        name = input("Enter person name: ")
        workout_name = input("Enter workout name: ")
        weight = float(input("Enter weight: "))
        reps = int(input("Enter reps: "))
        response = stub.AddLift(workouts_pb2.LiftRequest(name=name, workout_name=workout_name, weight=weight, reps=reps))
        print(response.message)

    elif choice == "4":
        name = input("Enter person name: ")
        workout_name = input("Enter workout name: ")
        response = stub.GetWorkoutStats(workouts_pb2.StatsRequest(name=name, workout_name=workout_name))
        print("Workout Stats:", response.stats)

    elif choice == "5":
        print("Exiting...")
        break
