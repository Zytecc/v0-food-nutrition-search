"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { v4 as uuidv4 } from "uuid"
import { useAuth } from "@/components/auth/auth-provider"
import { NavHeader } from "@/components/nav-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dumbbell, Plus, Trash2, Calendar, ChevronRight } from "lucide-react"

interface Workout {
  id: string
  title: string
  date: string
  notes: string | null
  duration: number | null
  created_at: string
  user_id: string
  exercises: Exercise[]
}

interface Exercise {
  id: string
  workout_id: string
  name: string
  sets: number
  reps: number
  weight: number | null
  weight_unit: string
  notes: string | null
}

export default function WorkoutTracker() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showNewWorkoutDialog, setShowNewWorkoutDialog] = useState(false)
  const [showExerciseDialog, setShowExerciseDialog] = useState(false)

  // Form states
  const [newWorkout, setNewWorkout] = useState({
    title: "",
    date: format(new Date(), "yyyy-MM-dd"),
    notes: "",
    duration: "",
  })

  const [newExercise, setNewExercise] = useState({
    name: "",
    sets: "3",
    reps: "10",
    weight: "",
    weight_unit: "lbs",
    notes: "",
  })

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth/login")
    } else if (user) {
      loadWorkouts()
    }
  }, [user, isLoading, router])

  // Load workouts from localStorage
  const loadWorkouts = () => {
    try {
      setLoading(true)
      const storedWorkouts = localStorage.getItem(`workouts_${user?.id}`)
      if (storedWorkouts) {
        const parsedWorkouts = JSON.parse(storedWorkouts) as Workout[]
        setWorkouts(parsedWorkouts)
      } else {
        setWorkouts([])
      }
    } catch (error) {
      console.error("Error loading workouts:", error)
      setError("Failed to load workouts")
    } finally {
      setLoading(false)
    }
  }

  // Save workouts to localStorage
  const saveWorkoutsToStorage = (updatedWorkouts: Workout[]) => {
    try {
      localStorage.setItem(`workouts_${user?.id}`, JSON.stringify(updatedWorkouts))
    } catch (error) {
      console.error("Error saving workouts:", error)
      setError("Failed to save workouts")
    }
  }

  const handleCreateWorkout = async () => {
    try {
      setLoading(true)

      const newWorkoutEntry: Workout = {
        id: uuidv4(),
        title: newWorkout.title,
        date: newWorkout.date,
        notes: newWorkout.notes || null,
        duration: newWorkout.duration ? Number.parseInt(newWorkout.duration) : null,
        created_at: new Date().toISOString(),
        user_id: user?.id || "",
        exercises: [],
      }

      const updatedWorkouts = [newWorkoutEntry, ...workouts]
      setWorkouts(updatedWorkouts)
      saveWorkoutsToStorage(updatedWorkouts)

      // Reset form and close dialog
      setNewWorkout({
        title: "",
        date: format(new Date(), "yyyy-MM-dd"),
        notes: "",
        duration: "",
      })
      setShowNewWorkoutDialog(false)
    } catch (error) {
      console.error("Error creating workout:", error)
      setError("Failed to create workout")
    } finally {
      setLoading(false)
    }
  }

  const handleAddExercise = async () => {
    if (!selectedWorkout) return

    try {
      setLoading(true)

      const newExerciseEntry: Exercise = {
        id: uuidv4(),
        workout_id: selectedWorkout.id,
        name: newExercise.name,
        sets: Number.parseInt(newExercise.sets),
        reps: Number.parseInt(newExercise.reps),
        weight: newExercise.weight ? Number.parseFloat(newExercise.weight) : null,
        weight_unit: newExercise.weight_unit,
        notes: newExercise.notes || null,
      }

      const updatedWorkouts = workouts.map((workout) =>
        workout.id === selectedWorkout.id
          ? { ...workout, exercises: [...workout.exercises, newExerciseEntry] }
          : workout,
      )

      setWorkouts(updatedWorkouts)
      saveWorkoutsToStorage(updatedWorkouts)

      // Update selected workout
      const updatedSelectedWorkout = updatedWorkouts.find((w) => w.id === selectedWorkout.id)
      if (updatedSelectedWorkout) {
        setSelectedWorkout(updatedSelectedWorkout)
      }

      // Reset form and close dialog
      setNewExercise({
        name: "",
        sets: "3",
        reps: "10",
        weight: "",
        weight_unit: "lbs",
        notes: "",
      })
      setShowExerciseDialog(false)
    } catch (error) {
      console.error("Error adding exercise:", error)
      setError("Failed to add exercise")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteWorkout = async (workoutId: string) => {
    if (!confirm("Are you sure you want to delete this workout?")) return

    try {
      setLoading(true)

      const updatedWorkouts = workouts.filter((workout) => workout.id !== workoutId)
      setWorkouts(updatedWorkouts)
      saveWorkoutsToStorage(updatedWorkouts)

      // If the deleted workout was selected, clear selection
      if (selectedWorkout?.id === workoutId) {
        setSelectedWorkout(null)
      }
    } catch (error) {
      console.error("Error deleting workout:", error)
      setError("Failed to delete workout")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteExercise = async (exerciseId: string) => {
    if (!confirm("Are you sure you want to delete this exercise?")) return

    try {
      setLoading(true)

      const updatedWorkouts = workouts.map((workout) =>
        workout.id === selectedWorkout?.id
          ? { ...workout, exercises: workout.exercises.filter((ex) => ex.id !== exerciseId) }
          : workout,
      )

      setWorkouts(updatedWorkouts)
      saveWorkoutsToStorage(updatedWorkouts)

      // Update selected workout
      const updatedSelectedWorkout = updatedWorkouts.find((w) => w.id === selectedWorkout?.id)
      if (updatedSelectedWorkout) {
        setSelectedWorkout(updatedSelectedWorkout)
      }
    } catch (error) {
      console.error("Error deleting exercise:", error)
      setError("Failed to delete exercise")
    } finally {
      setLoading(false)
    }
  }

  const selectWorkout = (workout: Workout) => {
    setSelectedWorkout(workout)
  }

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // If not authenticated and not loading, don't render anything
  if (!user) {
    return null
  }

  return (
    <>
      <NavHeader />
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Workout Tracker</h1>
          <Dialog open={showNewWorkoutDialog} onOpenChange={setShowNewWorkoutDialog}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" /> New Workout
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Workout</DialogTitle>
                <DialogDescription>Enter the details for your new workout session.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Workout Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Leg Day, Upper Body, etc."
                    value={newWorkout.title}
                    onChange={(e) => setNewWorkout({ ...newWorkout, title: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newWorkout.date}
                    onChange={(e) => setNewWorkout({ ...newWorkout, date: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    placeholder="e.g., 60"
                    value={newWorkout.duration}
                    onChange={(e) => setNewWorkout({ ...newWorkout, duration: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any additional notes about this workout"
                    value={newWorkout.notes}
                    onChange={(e) => setNewWorkout({ ...newWorkout, notes: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowNewWorkoutDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateWorkout} disabled={!newWorkout.title}>
                  Create Workout
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Your Workouts</CardTitle>
                <CardDescription>Select a workout to view details</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {loading && workouts.length === 0 ? (
                  <div className="p-4 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-sm text-muted-foreground">Loading workouts...</p>
                  </div>
                ) : workouts.length === 0 ? (
                  <div className="p-6 text-center">
                    <Dumbbell className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                    <h3 className="mt-4 font-medium">No workouts yet</h3>
                    <p className="text-sm text-muted-foreground mt-2">Create your first workout to get started.</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {workouts
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((workout) => (
                        <div
                          key={workout.id}
                          className={`p-4 flex justify-between items-center cursor-pointer hover:bg-muted/50 ${
                            selectedWorkout?.id === workout.id ? "bg-muted" : ""
                          }`}
                          onClick={() => selectWorkout(workout)}
                        >
                          <div>
                            <div className="font-medium">{workout.title}</div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(workout.date), "MMM d, yyyy")}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {workout.exercises.length} exercise{workout.exercises.length !== 1 ? "s" : ""}
                            </div>
                          </div>
                          <div className="flex items-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteWorkout(workout.id)
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-muted-foreground" />
                            </Button>
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2">
            {selectedWorkout ? (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{selectedWorkout.title}</CardTitle>
                      <CardDescription>
                        {format(new Date(selectedWorkout.date), "MMMM d, yyyy")}
                        {selectedWorkout.duration && ` • ${selectedWorkout.duration} minutes`}
                      </CardDescription>
                    </div>
                    <Dialog open={showExerciseDialog} onOpenChange={setShowExerciseDialog}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="flex items-center gap-1">
                          <Plus className="h-4 w-4" /> Add Exercise
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Exercise</DialogTitle>
                          <DialogDescription>Enter the details for your exercise.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <Label htmlFor="exercise-name">Exercise Name</Label>
                            <Input
                              id="exercise-name"
                              placeholder="e.g., Bench Press, Squats, etc."
                              value={newExercise.name}
                              onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                              <Label htmlFor="sets">Sets</Label>
                              <Input
                                id="sets"
                                type="number"
                                value={newExercise.sets}
                                onChange={(e) => setNewExercise({ ...newExercise, sets: e.target.value })}
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="reps">Reps</Label>
                              <Input
                                id="reps"
                                type="number"
                                value={newExercise.reps}
                                onChange={(e) => setNewExercise({ ...newExercise, reps: e.target.value })}
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                              <Label htmlFor="weight">Weight (optional)</Label>
                              <Input
                                id="weight"
                                type="number"
                                placeholder="e.g., 50"
                                value={newExercise.weight}
                                onChange={(e) => setNewExercise({ ...newExercise, weight: e.target.value })}
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="weight-unit">Unit</Label>
                              <select
                                id="weight-unit"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={newExercise.weight_unit}
                                onChange={(e) => setNewExercise({ ...newExercise, weight_unit: e.target.value })}
                              >
                                <option value="lbs">lbs</option>
                                <option value="kg">kg</option>
                              </select>
                            </div>
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="exercise-notes">Notes (optional)</Label>
                            <Textarea
                              id="exercise-notes"
                              placeholder="Any additional notes about this exercise"
                              value={newExercise.notes}
                              onChange={(e) => setNewExercise({ ...newExercise, notes: e.target.value })}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setShowExerciseDialog(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleAddExercise} disabled={!newExercise.name}>
                            Add Exercise
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {selectedWorkout.notes && (
                    <div className="mb-4 p-3 bg-muted/50 rounded-md">
                      <p className="text-sm">{selectedWorkout.notes}</p>
                    </div>
                  )}

                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-2 text-sm text-muted-foreground">Loading exercises...</p>
                    </div>
                  ) : selectedWorkout.exercises.length === 0 ? (
                    <div className="text-center py-8">
                      <Dumbbell className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                      <h3 className="mt-4 font-medium">No exercises added yet</h3>
                      <p className="text-sm text-muted-foreground mt-2">Add your first exercise to this workout.</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Exercise</TableHead>
                          <TableHead className="text-center">Sets</TableHead>
                          <TableHead className="text-center">Reps</TableHead>
                          <TableHead className="text-center">Weight</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedWorkout.exercises.map((exercise) => (
                          <TableRow key={exercise.id}>
                            <TableCell className="font-medium">
                              {exercise.name}
                              {exercise.notes && <p className="text-xs text-muted-foreground mt-1">{exercise.notes}</p>}
                            </TableCell>
                            <TableCell className="text-center">{exercise.sets}</TableCell>
                            <TableCell className="text-center">{exercise.reps}</TableCell>
                            <TableCell className="text-center">
                              {exercise.weight ? `${exercise.weight} ${exercise.weight_unit}` : "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteExercise(exercise.id)}>
                                <Trash2 className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-12">
                  <div className="text-center">
                    <Dumbbell className="h-16 w-16 mx-auto text-muted-foreground opacity-50" />
                    <h2 className="text-xl font-semibold mt-4">No Workout Selected</h2>
                    <p className="text-muted-foreground mt-2">
                      Select a workout from the list or create a new one to get started.
                    </p>
                    <Button
                      className="mt-6 flex items-center gap-2 mx-auto"
                      onClick={() => setShowNewWorkoutDialog(true)}
                    >
                      <Plus className="h-4 w-4" /> Create New Workout
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
