import React from 'react';
import { Check } from 'lucide-react';

interface CategoryFilterProps {
  categories: string[];
  selectedCategories: string[];
  onCategoryChange: (category: string) => void;
  onClearAll: () => void;
}

export function CategoryFilter({ categories, selectedCategories, onCategoryChange, onClearAll }: CategoryFilterProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Categorias</h3>
        {selectedCategories.length > 0 && (
          <button
            onClick={onClearAll}
            className="text-xs text-fikm-blue hover:underline font-medium"
          >
            Limpar
          </button>
        )}
      </div>
      <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
        {categories.map((category) => {
          const isSelected = selectedCategories.includes(category);
          return (
            <button
              key={category}
              type="button"
              onClick={() => onCategoryChange(category)}
              className="flex items-start gap-3 w-full text-left cursor-pointer group"
            >
              <div className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                isSelected ? 'bg-fikm-blue border-fikm-blue' : 'border-gray-300 group-hover:border-fikm-blue'
              }`}>
                {isSelected && <Check className="w-3 h-3 text-white" />}
              </div>
              <span className={`text-sm leading-tight ${isSelected ? 'text-gray-900 font-medium' : 'text-gray-600 group-hover:text-gray-900'}`}>
                {category}
              </span>
            </button>
          );
        })}
        {categories.length === 0 && (
          <p className="text-sm text-gray-500">Nenhuma categoria disponível.</p>
        )}
      </div>
    </div>
  );
}
