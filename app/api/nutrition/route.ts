import { type NextRequest, NextResponse } from "next/server"

// This would normally use environment variables
const APP_ID = "YOUR_EDAMAM_APP_ID"
const APP_KEY = "YOUR_EDAMAM_APP_KEY"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const food = searchParams.get("food")

  if (!food) {
    return NextResponse.json({ error: "Food parameter is required" }, { status: 400 })
  }

  try {
    // For demo purposes, we'll return mock data instead of making a real API call
    // In a real application, you would use:
    // const response = await fetch(`https://api.edamam.com/api/nutrition-data?app_id=${APP_ID}&app_key=${APP_KEY}&ingr=${encodeURIComponent(food)}`)

    // Mock data based on the food query
    const mockData = getMockNutritionData(food)

    return NextResponse.json(mockData)
  } catch (error) {
    console.error("Error fetching nutrition data:", error)
    return NextResponse.json({ error: "Failed to fetch nutrition data" }, { status: 500 })
  }
}

function getMockNutritionData(food: string) {
  // Lowercase the food for easier matching
  const foodLower = food.toLowerCase()

  // Basic mock data structure
  const mockData = {
    calories: 0,
    totalWeight: 0,
    dietLabels: [] as string[],
    healthLabels: [] as string[],
    nutrients: {} as Record<string, { label: string; quantity: number; unit: string }>,
  }

  // Different mock data based on common foods
  if (foodLower.includes("apple")) {
    mockData.calories = 95
    mockData.totalWeight = 182
    mockData.dietLabels = ["LOW_FAT", "LOW_SODIUM"]
    mockData.healthLabels = ["VEGAN", "VEGETARIAN", "PESCATARIAN", "PALEO", "DAIRY_FREE", "GLUTEN_FREE", "WHEAT_FREE"]
    mockData.nutrients = {
      ENERC_KCAL: { label: "Energy", quantity: 95, unit: "kcal" },
      PROCNT: { label: "Protein", quantity: 0.5, unit: "g" },
      FAT: { label: "Fat", quantity: 0.3, unit: "g" },
      CHOCDF: { label: "Carbs", quantity: 25.1, unit: "g" },
      FIBTG: { label: "Fiber", quantity: 4.4, unit: "g" },
      SUGAR: { label: "Sugars", quantity: 18.9, unit: "g" },
      CA: { label: "Calcium", quantity: 11, unit: "mg" },
      FE: { label: "Iron", quantity: 0.2, unit: "mg" },
      P: { label: "Phosphorus", quantity: 20, unit: "mg" },
      K: { label: "Potassium", quantity: 195, unit: "mg" },
      VITA_RAE: { label: "Vitamin A", quantity: 5.5, unit: "µg" },
      VITC: { label: "Vitamin C", quantity: 8.4, unit: "mg" },
    }
  } else if (foodLower.includes("banana")) {
    mockData.calories = 105
    mockData.totalWeight = 118
    mockData.dietLabels = ["LOW_FAT", "LOW_SODIUM"]
    mockData.healthLabels = ["VEGAN", "VEGETARIAN", "PESCATARIAN", "DAIRY_FREE", "GLUTEN_FREE", "WHEAT_FREE"]
    mockData.nutrients = {
      ENERC_KCAL: { label: "Energy", quantity: 105, unit: "kcal" },
      PROCNT: { label: "Protein", quantity: 1.3, unit: "g" },
      FAT: { label: "Fat", quantity: 0.4, unit: "g" },
      CHOCDF: { label: "Carbs", quantity: 27, unit: "g" },
      FIBTG: { label: "Fiber", quantity: 3.1, unit: "g" },
      SUGAR: { label: "Sugars", quantity: 14.4, unit: "g" },
      CA: { label: "Calcium", quantity: 5, unit: "mg" },
      FE: { label: "Iron", quantity: 0.3, unit: "mg" },
      MG: { label: "Magnesium", quantity: 31.9, unit: "mg" },
      K: { label: "Potassium", quantity: 422, unit: "mg" },
      VITB6A: { label: "Vitamin B6", quantity: 0.4, unit: "mg" },
      VITC: { label: "Vitamin C", quantity: 10.3, unit: "mg" },
    }
  } else if (foodLower.includes("chicken") || foodLower.includes("breast")) {
    mockData.calories = 165
    mockData.totalWeight = 100
    mockData.dietLabels = ["HIGH_PROTEIN", "LOW_CARB"]
    mockData.healthLabels = ["SUGAR_CONSCIOUS", "LOW_SUGAR", "KETO_FRIENDLY", "PALEO"]
    mockData.nutrients = {
      ENERC_KCAL: { label: "Energy", quantity: 165, unit: "kcal" },
      PROCNT: { label: "Protein", quantity: 31, unit: "g" },
      FAT: { label: "Fat", quantity: 3.6, unit: "g" },
      CHOCDF: { label: "Carbs", quantity: 0, unit: "g" },
      FIBTG: { label: "Fiber", quantity: 0, unit: "g" },
      CHOLE: { label: "Cholesterol", quantity: 85, unit: "mg" },
      NA: { label: "Sodium", quantity: 74, unit: "mg" },
      CA: { label: "Calcium", quantity: 15, unit: "mg" },
      FE: { label: "Iron", quantity: 1, unit: "mg" },
      ZN: { label: "Zinc", quantity: 1, unit: "mg" },
      P: { label: "Phosphorus", quantity: 210, unit: "mg" },
      VITB12: { label: "Vitamin B12", quantity: 0.3, unit: "µg" },
      VITB6A: { label: "Vitamin B6", quantity: 0.6, unit: "mg" },
    }
  } else if (foodLower.includes("rice")) {
    mockData.calories = 130
    mockData.totalWeight = 100
    mockData.dietLabels = ["LOW_FAT", "LOW_SODIUM"]
    mockData.healthLabels = [
      "VEGAN",
      "VEGETARIAN",
      "PESCATARIAN",
      "DAIRY_FREE",
      "EGG_FREE",
      "PEANUT_FREE",
      "TREE_NUT_FREE",
    ]
    mockData.nutrients = {
      ENERC_KCAL: { label: "Energy", quantity: 130, unit: "kcal" },
      PROCNT: { label: "Protein", quantity: 2.7, unit: "g" },
      FAT: { label: "Fat", quantity: 0.3, unit: "g" },
      CHOCDF: { label: "Carbs", quantity: 28.2, unit: "g" },
      FIBTG: { label: "Fiber", quantity: 0.4, unit: "g" },
      SUGAR: { label: "Sugars", quantity: 0.1, unit: "g" },
      NA: { label: "Sodium", quantity: 1, unit: "mg" },
      CA: { label: "Calcium", quantity: 10, unit: "mg" },
      FE: { label: "Iron", quantity: 0.2, unit: "mg" },
      MG: { label: "Magnesium", quantity: 12, unit: "mg" },
      K: { label: "Potassium", quantity: 35, unit: "mg" },
      ZN: { label: "Zinc", quantity: 0.6, unit: "mg" },
    }
  } else if (foodLower.includes("salmon")) {
    mockData.calories = 208
    mockData.totalWeight = 100
    mockData.dietLabels = ["HIGH_PROTEIN", "LOW_CARB"]
    mockData.healthLabels = ["SUGAR_CONSCIOUS", "KETO_FRIENDLY", "PALEO", "DAIRY_FREE", "GLUTEN_FREE"]
    mockData.nutrients = {
      ENERC_KCAL: { label: "Energy", quantity: 208, unit: "kcal" },
      PROCNT: { label: "Protein", quantity: 20.4, unit: "g" },
      FAT: { label: "Fat", quantity: 13.4, unit: "g" },
      FASAT: { label: "Saturated", quantity: 3.1, unit: "g" },
      FAMS: { label: "Monounsaturated", quantity: 3.8, unit: "g" },
      FAPU: { label: "Polyunsaturated", quantity: 3.9, unit: "g" },
      CHOCDF: { label: "Carbs", quantity: 0, unit: "g" },
      FIBTG: { label: "Fiber", quantity: 0, unit: "g" },
      CHOLE: { label: "Cholesterol", quantity: 55, unit: "mg" },
      NA: { label: "Sodium", quantity: 59, unit: "mg" },
      CA: { label: "Calcium", quantity: 12, unit: "mg" },
      FE: { label: "Iron", quantity: 0.3, unit: "mg" },
      VITD: { label: "Vitamin D", quantity: 11.2, unit: "µg" },
      VITB12: { label: "Vitamin B12", quantity: 2.6, unit: "µg" },
    }
  } else {
    // Generic data for any other food
    mockData.calories = Math.floor(Math.random() * 300) + 50
    mockData.totalWeight = Math.floor(Math.random() * 200) + 50
    mockData.dietLabels = ["LOW_SODIUM"]
    mockData.healthLabels = ["VEGAN", "VEGETARIAN"]
    mockData.nutrients = {
      ENERC_KCAL: { label: "Energy", quantity: mockData.calories, unit: "kcal" },
      PROCNT: { label: "Protein", quantity: Math.floor(Math.random() * 20) + 1, unit: "g" },
      FAT: { label: "Fat", quantity: Math.floor(Math.random() * 15) + 0.5, unit: "g" },
      CHOCDF: { label: "Carbs", quantity: Math.floor(Math.random() * 30) + 5, unit: "g" },
      FIBTG: { label: "Fiber", quantity: Math.floor(Math.random() * 5) + 0.5, unit: "g" },
      CA: { label: "Calcium", quantity: Math.floor(Math.random() * 100) + 10, unit: "mg" },
      FE: { label: "Iron", quantity: Number((Math.random() * 2).toFixed(1)), unit: "mg" },
      K: { label: "Potassium", quantity: Math.floor(Math.random() * 400) + 50, unit: "mg" },
      VITC: { label: "Vitamin C", quantity: Math.floor(Math.random() * 20), unit: "mg" },
    }
  }

  return mockData
}
