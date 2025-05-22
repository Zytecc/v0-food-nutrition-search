"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { useAuth } from "@/components/auth/auth-provider"
import { createClientSide } from "@/lib/supabase"
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
import { DatabaseSetup } from "@/components/database-setup"

interface Workout {
  id: string
  title: string
  date: string
  notes: string | null
  duration: number | null
  created_at: string
  exercise_count?: number
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
  const supabase = createClientSide()

  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showNewWorkoutDialog, setShowNewWorkoutDialog] = useState(false)
  const [showExerciseDialog, setShowExerciseDialog] = useState(false)
  const [tableExists, setTableExists] = useState(true)
  const [setupAttempted, setSetupAttempted] = useState(false)

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
      fetchWorkouts()
    }
  }, [user, isLoading, router])

  const fetchWorkouts = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get workouts with exercise count
      const { data, error } = await supabase
        .from("workouts")
        .select(`
          *,
          exercise_count:exercises(count)
        `)
        .order("date", { ascending: false })

      if (error) {
        // Check if the error is because the table doesn't exist
        if (error.message.includes("does not exist") || error.code === "42P01") {
          setTableExists(false)
          return
        }
        throw error
      }

      // Transform the data to get the exercise count
      const workoutsWithCount = data.map((workout) => ({
        ...workout,
        exercise_count: workout.exercise_count?.[0]?.count || 0,
      }))

      setWorkouts(workoutsWithCount)
      setTableExists(true)
    } catch (error) {
      console.error("Error fetching workouts:", error)
      setError("Failed to load workouts")
    } finally {
      setLoading(false)
    }
  }

  const fetchExercises = async (workoutId: string) => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from("exercises")
        .select("*")
        .eq("workout_id", workoutId)
        .order("created_at", { ascending: true })

      if (error) throw error

      setExercises(data || [])
    } catch (error) {
      console.error("Error fetching exercises:", error)
      setError("Failed to load exercises")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateWorkout = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from("workouts")
        .insert({
          user_id: user?.id,
          title: newWorkout.title,
          date: newWorkout.date,
          notes: newWorkout.notes || null,
          duration: newWorkout.duration ? Number.parseInt(newWorkout.duration) : null,
        })
        .select()

      if (error) throw error

      // Reset form and close dialog
      setNewWorkout({
        title: "",
        date: format(new Date(), "yyyy-MM-dd"),
        notes: "",
        duration: "",
      })
      setShowNewWorkoutDialog(false)

      // Refresh workouts
      fetchWorkouts()
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

      const { data, error } = await supabase
        .from("exercises")
        .insert({
          workout_id: selectedWorkout.id,
          name: newExercise.name,
          sets: Number.parseInt(newExercise.sets),
          reps: Number.parseInt(newExercise.reps),
          weight: newExercise.weight ? Number.parseFloat(newExercise.weight) : null,
          weight_unit: newExercise.weight_unit,
          notes: newExercise.notes || null,
        })
        .select()

      if (error) throw error

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

      // Refresh exercises
      fetchExercises(selectedWorkout.id)
      fetchWorkouts() // To update exercise count
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

      const { error } = await supabase.from("workouts").delete().eq("id", workoutId)

      if (error) throw error

      // If the deleted workout was selected, clear selection
      if (selectedWorkout?.id === workoutId) {
        setSelectedWorkout(null)
        setExercises([])
      }

      // Refresh workouts
      fetchWorkouts()
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

      const { error } = await supabase.from("exercises").delete().eq("id", exerciseId)

      if (error) throw error

      // Refresh exercises
      if (selectedWorkout) {
        fetchExercises(selectedWorkout.id)
        fetchWorkouts() // To update exercise count
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
    fetchExercises(workout.id)
  }

  const handleSetupComplete = () => {
    setSetupAttempted(true)
    fetchWorkouts()
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

  // If the table doesn't exist, show the setup component
  if (!tableExists) {
    return (
      <>
        <NavHeader />
        <div className="container mx-auto py-8 px-4">
          <h1 className="text-3xl font-bold mb-8">Workout Tracker</h1>
          <DatabaseSetup onSetupComplete={handleSetupComplete} />

          {setupAttempted && (
            <div className="mt-6">
              <Alert variant="info" className="mb-6">
                <AlertDescription>
                  If you've completed the setup but still see this message, please refresh the page. If the issue
                  persists, double-check that the SQL script executed successfully in your Supabase dashboard.
                </AlertDescription>
              </Alert>
              <div className="flex justify-center">
                <Button onClick={() => window.location.reload()}>Refresh Page</Button>
              </div>
            </div>
          )}
        </div>
      </>
    )
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
                    {workouts.map((workout) => (
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
                            {workout.exercise_count} exercise{workout.exercise_count !== 1 ? "s" : ""}
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
                  ) : exercises.length === 0 ? (
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
                        {exercises.map((exercise) => (
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
