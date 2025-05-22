import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_ANON_KEY || ""

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get("query")
  const productId = searchParams.get("id")

  // Initialize Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey)

  // If a specific product ID is provided, fetch that product
  if (productId) {
    try {
      // Check if we have this product cached
      const { data: cachedData } = await supabase
        .from("nutrition_cache")
        .select("nutrition_data")
        .eq("product_id", productId)
        .single()

      // If we have cached nutrition data, return it
      if (cachedData && cachedData.nutrition_data) {
        return NextResponse.json(cachedData.nutrition_data)
      }

      // Fetch the specific product from Open Food Facts
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${productId}.json`)

      if (!response.ok) {
        throw new Error(`Open Food Facts API responded with status: ${response.status}`)
      }

      const data = await response.json()

      // Check if the product was found
      if (!data.product) {
        return NextResponse.json({ error: "Product not found", notFound: true }, { status: 404 })
      }

      // Transform the data to match our expected format
      const nutritionData = transformOpenFoodFactsData(data.product)

      // Cache the result in Supabase
      await supabase.from("nutrition_cache").upsert(
        {
          product_id: productId,
          food_name: data.product.product_name || "",
          nutrition_data: nutritionData,
          created_at: new Date().toISOString(),
        },
        { onConflict: "product_id" },
      )

      return NextResponse.json(nutritionData)
    } catch (error) {
      console.error("Error fetching product:", error)
      return NextResponse.json({ error: "Failed to fetch product data" }, { status: 500 })
    }
  }

  // Handle search query
  if (!query) {
    return NextResponse.json({ error: "Query parameter is required" }, { status: 400 })
  }

  const searchTerm = query.toLowerCase().trim()

  try {
    // Query the Open Food Facts API for search results
    const response = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
        searchTerm,
      )}&search_simple=1&action=process&json=1&page_size=5`,
    )

    if (!response.ok) {
      throw new Error(`Open Food Facts API responded with status: ${response.status}`)
    }

    const data = await response.json()

    // Check if we found any products
    if (!data.products || data.products.length === 0) {
      return NextResponse.json({ error: "No food products found", notFound: true }, { status: 404 })
    }

    // Transform the search results to a simplified format
    const searchResults = data.products.map((product: any) => ({
      id: product.id || product._id || "",
      name: product.product_name || product.generic_name || "",
      brand: product.brands || "",
      image: product.image_url || product.image_small_url || "",
      quantity: product.quantity || "",
      categories: product.categories || "",
      nutriScore: product.nutriscore_grade || "",
    }))

    return NextResponse.json({ results: searchResults })
  } catch (error) {
    console.error("Error searching Open Food Facts:", error)
    return NextResponse.json({ error: "Failed to search food products" }, { status: 500 })
  }
}

function transformOpenFoodFactsData(product: any) {
  // Extract nutrient data
  const nutriments = product.nutriments || {}

  // Create a standardized nutrients object
  const nutrients: Record<string, { label: string; quantity: number; unit: string }> = {}

  // Map Open Food Facts nutrient names to our expected format
  const nutrientMappings = {
    energy: { code: "ENERC_KCAL", label: "Energy" },
    proteins: { code: "PROCNT", label: "Protein" },
    fat: { code: "FAT", label: "Fat" },
    carbohydrates: { code: "CHOCDF", label: "Carbs" },
    fiber: { code: "FIBTG", label: "Fiber" },
    calcium: { code: "CA", label: "Calcium" },
    iron: { code: "FE", label: "Iron" },
    "vitamin-c": { code: "VITC", label: "Vitamin C" },
    sugars: { code: "SUGAR", label: "Sugars" },
    sodium: { code: "NA", label: "Sodium" },
    salt: { code: "SALT", label: "Salt" },
    potassium: { code: "K", label: "Potassium" },
    magnesium: { code: "MG", label: "Magnesium" },
    "saturated-fat": { code: "FASAT", label: "Saturated Fat" },
  }

  // Process each nutrient
  for (const [key, mapping] of Object.entries(nutrientMappings)) {
    const value = nutriments[key]
    const unit = nutriments[`${key}_unit`] || getDefaultUnit(key)

    if (value !== undefined) {
      nutrients[mapping.code] = {
        label: mapping.label,
        quantity: Number(value),
        unit,
      }
    }
  }

  // Ensure we have at least some basic nutrients
  if (!nutrients.ENERC_KCAL && nutriments.energy_kcal) {
    nutrients.ENERC_KCAL = {
      label: "Energy",
      quantity: Number(nutriments.energy_kcal),
      unit: "kcal",
    }
  }

  // Extract diet and health labels
  const dietLabels = []
  const healthLabels = []

  // Add diet labels based on nutrient content
  if (nutriments.fat && nutriments.fat < 3) dietLabels.push("LOW_FAT")
  if (nutriments.sugars && nutriments.sugars < 5) dietLabels.push("LOW_SUGAR")
  if (nutriments.salt && nutriments.salt < 0.3) dietLabels.push("LOW_SODIUM")
  if (nutriments.proteins && nutriments.proteins > 20) dietLabels.push("HIGH_PROTEIN")
  if (nutriments.carbohydrates && nutriments.carbohydrates < 5) dietLabels.push("LOW_CARB")
  if (nutriments.fiber && nutriments.fiber > 6) dietLabels.push("HIGH_FIBER")

  // Add health labels based on product categories and labels
  const categories = product.categories_tags || []
  const labels = product.labels_tags || []

  if (categories.some((c) => c.includes("vegan")) || labels.some((l) => l.includes("vegan"))) healthLabels.push("VEGAN")
  if (categories.some((c) => c.includes("vegetarian")) || labels.some((l) => l.includes("vegetarian")))
    healthLabels.push("VEGETARIAN")
  if (labels.some((l) => l.includes("gluten-free"))) healthLabels.push("GLUTEN_FREE")
  if (labels.some((l) => l.includes("dairy-free"))) healthLabels.push("DAIRY_FREE")
  if (labels.some((l) => l.includes("organic"))) healthLabels.push("ORGANIC")

  return {
    calories: nutrients.ENERC_KCAL ? nutrients.ENERC_KCAL.quantity : 0,
    totalWeight: product.quantity ? Number.parseFloat(product.quantity) : 100,
    productName: product.product_name || product.generic_name || "",
    brand: product.brands || "",
    image: product.image_url || product.image_small_url || "",
    categories: product.categories || "",
    nutriScore: product.nutriscore_grade || "",
    dietLabels,
    healthLabels,
    nutrients,
  }
}

function getDefaultUnit(nutrient: string): string {
  switch (nutrient) {
    case "energy":
      return "kcal"
    case "proteins":
    case "fat":
    case "carbohydrates":
    case "fiber":
    case "sugars":
    case "saturated-fat":
      return "g"
    case "calcium":
    case "iron":
    case "sodium":
    case "salt":
    case "potassium":
    case "magnesium":
      return "mg"
    case "vitamin-c":
      return "mg"
    default:
      return "g"
  }
}
