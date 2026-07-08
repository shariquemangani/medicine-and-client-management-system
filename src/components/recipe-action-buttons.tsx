'use client';

import { Button } from "@/components/ui/button";

// Define a generic component that works with any recipe-like object
export function RecipeActionButtons<T extends { recipeId: string }>({ 
  recipe, 
  onApprove, 
  onDeny 
}: { 
  recipe: T; 
  onApprove: (recipeId: string) => void; 
  onDeny: (recipe: T) => void; 
}) {
  return (
    <div className="mt-4 flex gap-2">
      <Button 
        size="sm" 
        className="h-8 rounded-md bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
        onClick={() => onApprove(recipe.recipeId)}
      >
        Approve
      </Button>
      <Button 
        size="sm" 
        variant="outline" 
        className="h-8 rounded-md" 
        onClick={() => onDeny(recipe)}
      >
        Deny
      </Button>
    </div>
  );
}