"use client"

import type React from "react"

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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { BookText, Plus, Trash2, Calendar, Edit, ChevronRight, Search } from "lucide-react"

interface JournalEntry {
  id: string
  title: string
  content: string
  mood: string | null
  date: string
  created_at: string
  user_id: string
}

export default function Journal() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showNewEntryDialog, setShowNewEntryDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  // Form states
  const [newEntry, setNewEntry] = useState({
    title: "",
    content: "",
    mood: "",
    date: format(new Date(), "yyyy-MM-dd"),
  })

  const [editEntry, setEditEntry] = useState({
    id: "",
    title: "",
    content: "",
    mood: "",
    date: "",
  })

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth/login")
    } else if (user) {
      loadJournalEntries()
    }
  }, [user, isLoading, router])

  // Load journal entries from localStorage
  const loadJournalEntries = () => {
    try {
      setLoading(true)
      const storedEntries = localStorage.getItem(`journal_entries_${user?.id}`)
      if (storedEntries) {
        const parsedEntries = JSON.parse(storedEntries) as JournalEntry[]
        setEntries(parsedEntries)
      } else {
        setEntries([])
      }
    } catch (error) {
      console.error("Error loading journal entries:", error)
      setError("Failed to load journal entries")
    } finally {
      setLoading(false)
    }
  }

  // Save entries to localStorage
  const saveEntriesToStorage = (updatedEntries: JournalEntry[]) => {
    try {
      localStorage.setItem(`journal_entries_${user?.id}`, JSON.stringify(updatedEntries))
    } catch (error) {
      console.error("Error saving journal entries:", error)
      setError("Failed to save journal entries")
    }
  }

  const handleCreateEntry = () => {
    try {
      setLoading(true)

      const newJournalEntry: JournalEntry = {
        id: uuidv4(),
        title: newEntry.title,
        content: newEntry.content,
        mood: newEntry.mood || null,
        date: newEntry.date,
        created_at: new Date().toISOString(),
        user_id: user?.id || "",
      }

      const updatedEntries = [newJournalEntry, ...entries]
      setEntries(updatedEntries)
      saveEntriesToStorage(updatedEntries)

      // Reset form and close dialog
      setNewEntry({
        title: "",
        content: "",
        mood: "",
        date: format(new Date(), "yyyy-MM-dd"),
      })
      setShowNewEntryDialog(false)
    } catch (error) {
      console.error("Error creating journal entry:", error)
      setError("Failed to create journal entry")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateEntry = () => {
    try {
      setLoading(true)

      const updatedEntries = entries.map((entry) =>
        entry.id === editEntry.id
          ? {
              ...entry,
              title: editEntry.title,
              content: editEntry.content,
              mood: editEntry.mood || null,
              date: editEntry.date,
            }
          : entry,
      )

      setEntries(updatedEntries)
      saveEntriesToStorage(updatedEntries)

      // Close dialog
      setShowEditDialog(false)

      // Update the selected entry
      if (selectedEntry && selectedEntry.id === editEntry.id) {
        setSelectedEntry({
          ...selectedEntry,
          title: editEntry.title,
          content: editEntry.content,
          mood: editEntry.mood || null,
          date: editEntry.date,
        })
      }
    } catch (error) {
      console.error("Error updating journal entry:", error)
      setError("Failed to update journal entry")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteEntry = (entryId: string) => {
    if (!confirm("Are you sure you want to delete this journal entry?")) return

    try {
      setLoading(true)

      const updatedEntries = entries.filter((entry) => entry.id !== entryId)
      setEntries(updatedEntries)
      saveEntriesToStorage(updatedEntries)

      // If the deleted entry was selected, clear selection
      if (selectedEntry?.id === entryId) {
        setSelectedEntry(null)
      }
    } catch (error) {
      console.error("Error deleting journal entry:", error)
      setError("Failed to delete journal entry")
    } finally {
      setLoading(false)
    }
  }

  const selectEntry = (entry: JournalEntry) => {
    setSelectedEntry(entry)
  }

  const openEditDialog = (entry: JournalEntry) => {
    setEditEntry({
      id: entry.id,
      title: entry.title,
      content: entry.content,
      mood: entry.mood || "",
      date: entry.date,
    })
    setShowEditDialog(true)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) {
      loadJournalEntries()
      return
    }

    const query = searchQuery.toLowerCase()
    const filteredEntries = entries.filter(
      (entry) =>
        entry.title.toLowerCase().includes(query) ||
        entry.content.toLowerCase().includes(query) ||
        (entry.mood && entry.mood.toLowerCase().includes(query)),
    )
    setEntries(filteredEntries)
  }

  const clearSearch = () => {
    setSearchQuery("")
    loadJournalEntries()
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
          <h1 className="text-3xl font-bold">Journal</h1>
          <Dialog open={showNewEntryDialog} onOpenChange={setShowNewEntryDialog}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" /> New Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Create New Journal Entry</DialogTitle>
                <DialogDescription>Record your thoughts, feelings, and experiences.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="Give your entry a title"
                    value={newEntry.title}
                    onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newEntry.date}
                      onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="mood">Mood (optional)</Label>
                    <Input
                      id="mood"
                      placeholder="How are you feeling?"
                      value={newEntry.mood}
                      onChange={(e) => setNewEntry({ ...newEntry, mood: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="content">Journal Entry</Label>
                  <Textarea
                    id="content"
                    placeholder="Write your thoughts here..."
                    className="min-h-[200px]"
                    value={newEntry.content}
                    onChange={(e) => setNewEntry({ ...newEntry, content: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowNewEntryDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateEntry} disabled={!newEntry.title || !newEntry.content}>
                  Save Entry
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
                <CardTitle>Your Journal Entries</CardTitle>
                <CardDescription>Select an entry to view</CardDescription>
                <form onSubmit={handleSearch} className="mt-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search entries..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 px-2"
                        onClick={clearSearch}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </form>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-4 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-sm text-muted-foreground">Loading entries...</p>
                  </div>
                ) : entries.length === 0 ? (
                  <div className="p-6 text-center">
                    <BookText className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                    <h3 className="mt-4 font-medium">No journal entries yet</h3>
                    <p className="text-sm text-muted-foreground mt-2">Create your first entry to get started.</p>
                  </div>
                ) : (
                  <div className="divide-y max-h-[600px] overflow-y-auto">
                    {entries
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((entry) => (
                        <div
                          key={entry.id}
                          className={`p-4 flex justify-between items-center cursor-pointer hover:bg-muted/50 ${
                            selectedEntry?.id === entry.id ? "bg-muted" : ""
                          }`}
                          onClick={() => selectEntry(entry)}
                        >
                          <div>
                            <div className="font-medium">{entry.title}</div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(entry.date), "MMM d, yyyy")}
                            </div>
                            {entry.mood && <div className="text-xs text-muted-foreground mt-1">Mood: {entry.mood}</div>}
                          </div>
                          <div className="flex items-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteEntry(entry.id)
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
            {selectedEntry ? (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{selectedEntry.title}</CardTitle>
                      <CardDescription>
                        {format(new Date(selectedEntry.date), "MMMM d, yyyy")}
                        {selectedEntry.mood && ` • Mood: ${selectedEntry.mood}`}
                      </CardDescription>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-1"
                      onClick={() => openEditDialog(selectedEntry)}
                    >
                      <Edit className="h-4 w-4" /> Edit
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    {selectedEntry.content.split("\n").map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-12">
                  <div className="text-center">
                    <BookText className="h-16 w-16 mx-auto text-muted-foreground opacity-50" />
                    <h2 className="text-xl font-semibold mt-4">No Entry Selected</h2>
                    <p className="text-muted-foreground mt-2">
                      Select an entry from the list or create a new one to get started.
                    </p>
                    <Button
                      className="mt-6 flex items-center gap-2 mx-auto"
                      onClick={() => setShowNewEntryDialog(true)}
                    >
                      <Plus className="h-4 w-4" /> Create New Entry
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Edit Entry Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Journal Entry</DialogTitle>
            <DialogDescription>Update your journal entry.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                placeholder="Give your entry a title"
                value={editEntry.title}
                onChange={(e) => setEditEntry({ ...editEntry, title: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-date">Date</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={editEntry.date}
                  onChange={(e) => setEditEntry({ ...editEntry, date: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-mood">Mood (optional)</Label>
                <Input
                  id="edit-mood"
                  placeholder="How are you feeling?"
                  value={editEntry.mood}
                  onChange={(e) => setEditEntry({ ...editEntry, mood: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-content">Journal Entry</Label>
              <Textarea
                id="edit-content"
                placeholder="Write your thoughts here..."
                className="min-h-[200px]"
                value={editEntry.content}
                onChange={(e) => setEditEntry({ ...editEntry, content: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateEntry} disabled={!editEntry.title || !editEntry.content}>
              Update Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
