"use client"

import type React from "react"

import { useState } from "react"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"

interface NutritionData {
  calories: number
  totalWeight: number
  dietLabels: string[]
  healthLabels: string[]
  productName?: string
  brand?: string
  image?: string
  nutrients: {
    [key: string]: {
      label: string
      quantity: number
      unit: string
    }
  }
}

export default function FoodNutritionSearch() {
  const [searchQuery, setSearchQuery] = useState("")
  const [nutritionData, setNutritionData] = useState<NutritionData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)

  const searchFood = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!searchQuery.trim()) {
      setError("Please enter a food to search")
      return
    }

    setLoading(true)
    setError(null)
    setNotFound(false)

    try {
      const response = await fetch(`/api/open-food-facts?query=${encodeURIComponent(searchQuery)}`)

      if (response.status === 404) {
        setNotFound(true)
        throw new Error("Food not found in database")
      }

      if (!response.ok) {
        throw new Error("Failed to fetch nutrition data")
      }

      const data = await response.json()
      setNutritionData(data)
    } catch (err) {
      if ((err as Error).message === "Food not found in database") {
        setError("This food wasn't found in the Open Food Facts database. Try a different search term.")
      } else {
        setError("Error fetching nutrition data. Please try again.")
        console.error(err)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Food Nutrition Search</h1>
          <p className="text-muted-foreground">
            Search for any food to get detailed nutrition information from Open Food Facts
          </p>
        </div>

        <form onSubmit={searchFood} className="flex gap-2 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Enter a food (e.g., nutella, coca cola, rice)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Searching..." : "Search"}
          </Button>
        </form>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {notFound && (
          <Alert className="mb-6">
            <AlertTitle>Food Not Found</AlertTitle>
            <AlertDescription>
              This food wasn't found in the Open Food Facts database. Try searching for a branded product or a more
              common food name.
            </AlertDescription>
          </Alert>
        )}

        {loading && (
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-1/3 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </CardContent>
          </Card>
        )}

        {nutritionData && !loading && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="capitalize">
                    {nutritionData.productName || searchQuery}
                    {nutritionData.brand && <span className="text-sm font-normal ml-2">by {nutritionData.brand}</span>}
                  </CardTitle>
                  <CardDescription>
                    {typeof nutritionData.totalWeight === "number"
                      ? nutritionData.totalWeight.toFixed(1)
                      : nutritionData.totalWeight}
                    g •{" "}
                    {typeof nutritionData.calories === "number"
                      ? nutritionData.calories.toFixed(0)
                      : nutritionData.calories}{" "}
                    calories
                  </CardDescription>
                </div>
                {nutritionData.image && (
                  <img
                    src={nutritionData.image || "/placeholder.svg"}
                    alt={nutritionData.productName || searchQuery}
                    className="h-16 w-16 object-contain rounded-md"
                  />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-2">Macronutrients</h3>
                  <ul className="space-y-2">
                    {Object.entries(nutritionData.nutrients)
                      .filter(([key]) => ["PROCNT", "FAT", "CHOCDF", "FIBTG", "SUGAR", "FASAT"].includes(key))
                      .map(([key, nutrient]) => (
                        <li key={key} className="flex justify-between">
                          <span>{nutrient.label}</span>
                          <span className="font-medium">
                            {typeof nutrient.quantity === "number" ? nutrient.quantity.toFixed(1) : nutrient.quantity}
                            {nutrient.unit}
                          </span>
                        </li>
                      ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Vitamins & Minerals</h3>
                  <ul className="space-y-2">
                    {Object.entries(nutritionData.nutrients)
                      .filter(
                        ([key]) => !["PROCNT", "FAT", "CHOCDF", "FIBTG", "ENERC_KCAL", "SUGAR", "FASAT"].includes(key),
                      )
                      .slice(0, 6)
                      .map(([key, nutrient]) => (
                        <li key={key} className="flex justify-between">
                          <span>{nutrient.label}</span>
                          <span className="font-medium">
                            {typeof nutrient.quantity === "number" ? nutrient.quantity.toFixed(1) : nutrient.quantity}
                            {nutrient.unit}
                          </span>
                        </li>
                      ))}
                  </ul>
                </div>
              </div>

              {nutritionData.dietLabels.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-medium mb-2">Diet Labels</h3>
                  <div className="flex flex-wrap gap-2">
                    {nutritionData.dietLabels.map((label) => (
                      <span key={label} className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                        {label.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {nutritionData.healthLabels.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-medium mb-2">Health Labels</h3>
                  <div className="flex flex-wrap gap-2">
                    {nutritionData.healthLabels.slice(0, 8).map((label) => (
                      <span key={label} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                        {label.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 text-xs text-muted-foreground">
                Data provided by{" "}
                <a
                  href="https://world.openfoodfacts.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  Open Food Facts
                </a>
              </div>
            </CardContent>
          </Card>
        )}

        {!loading && !nutritionData && !error && !notFound && (
          <div className="text-center py-12">
            <img
              src="/placeholder.svg?height=120&width=120"
              alt="Food illustration"
              className="mx-auto mb-4 opacity-50"
            />
            <p className="text-muted-foreground">Search for a food to see its nutrition information</p>
          </div>
        )}
      </div>
    </div>
  )
}
