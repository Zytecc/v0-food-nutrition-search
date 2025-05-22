import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { createClient } from "@supabase/supabase-js"

// Common non-food words that users might enter
const COMMON_NON_FOOD_WORDS = [
  "car",
  "computer",
  "phone",
  "building",
  "house",
  "table",
  "chair",
  "desk",
  "television",
  "laptop",
  "keyboard",
  "mouse",
  "monitor",
  "window",
  "door",
  "shoe",
  "shirt",
  "pants",
  "dress",
  "hat",
  "glove",
  "sock",
  "watch",
  "clock",
  "camera",
  "book",
  "pen",
  "pencil",
  "paper",
  "notebook",
  "calculator",
]

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const food = searchParams.get("food")

  if (!food) {
    return NextResponse.json({ error: "Food parameter is required" }, { status: 400 })
  }

  // Basic validation for obviously non-food items
  const searchTerm = food.toLowerCase().trim()

  // Check against common non-food words
  if (COMMON_NON_FOOD_WORDS.includes(searchTerm)) {
    return NextResponse.json(
      {
        error: "The search term doesn't appear to be a food item",
        isFood: false,
      },
      { status: 400 },
    )
  }

  // Initialize Supabase client
  const supabase = createClient(process.env.SUPABASE_URL || "", process.env.SUPABASE_ANON_KEY || "")

  // Check if we already have this item cached
  try {
    const { data: cachedData } = await supabase
      .from("nutrition_cache")
      .select("nutrition_data, is_food")
      .eq("food_name", searchTerm)
      .single()

    // If we have cached data and it's marked as not a food, return early
    if (cachedData && cachedData.is_food === false) {
      return NextResponse.json(
        {
          error: "The search term doesn't appear to be a food item",
          isFood: false,
        },
        { status: 400 },
      )
    }

    // If we have cached nutrition data, return it
    if (cachedData && cachedData.nutrition_data) {
      return NextResponse.json(cachedData.nutrition_data)
    }
  } catch (error) {
    // Continue if no cached data is found
    console.log("No cached data found for:", searchTerm)
  }

  try {
    // Create a structured prompt for the AI that first validates if this is a food
    const prompt = `
First, determine if "${food}" is a food item that would have nutritional information.
If it is NOT a food item, respond with ONLY this exact JSON: {"isFood": false}

If it IS a food item, generate accurate nutrition information in this JSON format:
{
  "isFood": true,
  "calories": number,
  "totalWeight": number,
  "dietLabels": ["LABEL1", "LABEL2"],
  "healthLabels": ["LABEL1", "LABEL2"],
  "nutrients": {
    "NUTRIENT_CODE": {
      "label": "Nutrient Name",
      "quantity": number,
      "unit": "g/mg/µg"
    }
  }
}

Include these nutrients at minimum:
- ENERC_KCAL (Energy)
- PROCNT (Protein)
- FAT (Fat)
- CHOCDF (Carbs)
- FIBTG (Fiber)
- CA (Calcium)
- FE (Iron)
- VITC (Vitamin C)

Return ONLY valid JSON with no explanations or additional text.
`

    // Generate nutrition data using AI
    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt,
      temperature: 0.2, // Lower temperature for more consistent results
    })

    // Parse the response as JSON
    let response
    try {
      response = JSON.parse(text)
    } catch (error) {
      console.error("Failed to parse AI response as JSON:", text)
      return NextResponse.json({ error: "Failed to generate valid nutrition data" }, { status: 500 })
    }

    // Check if the AI determined this is not a food item
    if (!response.isFood) {
      // Cache this non-food result
      await supabase.from("nutrition_cache").upsert(
        {
          food_name: searchTerm,
          nutrition_data: null,
          is_food: false,
          created_at: new Date().toISOString(),
        },
        { onConflict: "food_name" },
      )

      return NextResponse.json(
        {
          error: "The search term doesn't appear to be a food item",
          isFood: false,
        },
        { status: 400 },
      )
    }

    // Store the result in Supabase for future reference
    await supabase.from("nutrition_cache").upsert(
      {
        food_name: searchTerm,
        nutrition_data: response,
        is_food: true,
        created_at: new Date().toISOString(),
      },
      { onConflict: "food_name" },
    )

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error generating nutrition data:", error)
    return NextResponse.json({ error: "Failed to generate nutrition data" }, { status: 500 })
  }
}
