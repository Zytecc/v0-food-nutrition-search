"use client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronRight, Info } from "lucide-react"

interface SearchResult {
  id: string
  name: string
  brand: string
  image: string
  quantity: string
  categories: string
  nutriScore: string
}

interface SearchResultsProps {
  results: SearchResult[]
  onSelectProduct: (productId: string) => void
}

export function SearchResults({ results, onSelectProduct }: SearchResultsProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">Search Results</h2>
      {results.map((result) => (
        <Card key={result.id} className="overflow-hidden hover:shadow-md transition-shadow">
          <CardContent className="p-0">
            <div className="flex items-center p-4">
              <div className="flex-shrink-0 mr-4">
                {result.image ? (
                  <img
                    src={result.image || "/placeholder.svg"}
                    alt={result.name}
                    className="h-16 w-16 object-contain rounded-md bg-gray-50"
                  />
                ) : (
                  <div className="h-16 w-16 flex items-center justify-center bg-gray-100 rounded-md">
                    <Info className="h-8 w-8 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex-grow min-w-0">
                <h3 className="font-medium text-base truncate">{result.name}</h3>
                {result.brand && <p className="text-sm text-muted-foreground">{result.brand}</p>}
                {result.quantity && <p className="text-xs text-muted-foreground">{result.quantity}</p>}
                {result.categories && (
                  <p className="text-xs text-muted-foreground truncate mt-1">{result.categories}</p>
                )}
              </div>
              <div className="flex-shrink-0 ml-4">
                {result.nutriScore && (
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white mb-2 uppercase ${getNutriScoreColor(
                      result.nutriScore,
                    )}`}
                  >
                    {result.nutriScore}
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto"
                  onClick={() => onSelectProduct(result.id)}
                  aria-label={`View nutrition for ${result.name}`}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function getNutriScoreColor(score: string): string {
  switch (score.toLowerCase()) {
    case "a":
      return "bg-green-500"
    case "b":
      return "bg-green-400"
    case "c":
      return "bg-yellow-500"
    case "d":
      return "bg-orange-500"
    case "e":
      return "bg-red-500"
    default:
      return "bg-gray-400"
  }
}
