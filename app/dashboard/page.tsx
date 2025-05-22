"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { NavHeader } from "@/components/nav-header"
import { Search, History, LogOut, BookText, Calendar } from "lucide-react"

export default function Dashboard() {
  const { user, isLoading, signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Only redirect if we're sure the user is not authenticated
    if (!isLoading && !user) {
      router.push("/auth/login")
    }
  }, [user, isLoading, router])

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  // If not authenticated and not loading, don't render anything
  // The useEffect will handle the redirect
  if (!user) {
    return null
  }

  return (
    <>
      <NavHeader />
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <Button variant="outline" onClick={signOut} className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Welcome back!</CardTitle>
              <CardDescription>{user.email}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Track your nutrition and keep a personal journal all in one place.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Nutrition Search</CardTitle>
              <CardDescription>Find nutrition information</CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <p className="text-sm text-muted-foreground">
                Search our database of thousands of foods to get detailed nutrition information.
              </p>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href="/">
                  <Search className="mr-2 h-4 w-4" /> Search Foods
                </Link>
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Journal</CardTitle>
              <CardDescription>Record your thoughts</CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <p className="text-sm text-muted-foreground">
                Keep a personal journal to track your thoughts, goals, and progress.
              </p>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href="/journal">
                  <BookText className="mr-2 h-4 w-4" /> Write Journal
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>

        <Tabs defaultValue="features">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="activity">Recent Activity</TabsTrigger>
            <TabsTrigger value="stats">Stats</TabsTrigger>
          </TabsList>
          <TabsContent value="features" className="p-4 border rounded-md mt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col items-center text-center p-4">
                <div className="bg-primary/10 p-3 rounded-full mb-4">
                  <Search className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-medium mb-2">Food Search</h3>
                <p className="text-sm text-muted-foreground">
                  Search for any food to get detailed nutrition information from Open Food Facts database.
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-4">
                <div className="bg-primary/10 p-3 rounded-full mb-4">
                  <BookText className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-medium mb-2">Journal</h3>
                <p className="text-sm text-muted-foreground">
                  Keep a personal journal to record your thoughts, goals, and daily reflections.
                </p>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="activity" className="p-4 border rounded-md mt-2">
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
              <h3 className="mt-4 font-medium">No recent activity</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Your recent activity will appear here as you use the app.
              </p>
            </div>
          </TabsContent>
          <TabsContent value="stats" className="p-4 border rounded-md mt-2">
            <div className="text-center py-8">
              <History className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
              <h3 className="mt-4 font-medium">No stats available</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Start tracking your nutrition and journal entries to see your stats.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
