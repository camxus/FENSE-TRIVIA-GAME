import { Button } from "@/components/ui/button"

interface Category {
  id: string
  categoryName: string
}

interface CategorySelectProps {
  availableCategories: Category[]
  selectedCategoryIds: string[]
  onSelect: (id: string) => void
  onSelectAll?: (ids: string[]) => void
}

export function CategorySelect({
  availableCategories,
  selectedCategoryIds,
  onSelect,
  onSelectAll,
}: CategorySelectProps) {
  const allSelected = availableCategories.every(cat => selectedCategoryIds.includes(cat.id))

  const handleSelectAll = () => {
    if (allSelected) {
      // Deselect all
      onSelectAll?.([])
    } else {
      // Select all
      onSelectAll?.(availableCategories.map(cat => cat.id))
    }
  }

  return (
    <div className="space-y-4">
      <Button
        variant="secondary"
        className="w-full text-left"
        onClick={handleSelectAll}
      >
        {allSelected ? "Deselect All" : "Choose All"}
      </Button>

      {availableCategories.map((cat) => {
        const isSelected = selectedCategoryIds.includes(cat.id)
        return (
          <Button
            key={cat.id}
            variant={isSelected ? "default" : "outline"}
            className="w-full text-left"
            onClick={() => onSelect(cat.id)}
          >
            {cat.categoryName}
          </Button>
        )
      })}
    </div>
  )
}
