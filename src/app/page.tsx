
"use client";

import { useState, useEffect, FormEvent } from 'react';
import { suggestRecipe, type SuggestRecipeOutput } from '@/ai/flows/suggest-recipe';
import { generateRecipeImage, type GenerateRecipeImageOutput } from '@/ai/flows/generate-recipe-image-flow';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, RefreshCw, ListChecks, Utensils, Info, Soup, Lightbulb, ChefHat, PackageSearch, Image as LucideImage } from 'lucide-react';
import { AppLogo } from '@/components/app-logo';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

type BaseRecipe = SuggestRecipeOutput['recipes'][0];

interface DisplayRecipe extends BaseRecipe {
  imageUrl?: string | null;
  imageLoading: boolean;
}

const LOCAL_STORAGE_KEY = 'fridgeFeastIngredients';

export default function HomePage() {
  const [ingredientsInput, setIngredientsInput] = useState<string>('');
  const [suggestedRecipes, setSuggestedRecipes] = useState<DisplayRecipe[] | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<DisplayRecipe | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const storedIngredients = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedIngredients) {
      setIngredientsInput(storedIngredients);
    }
  }, []);

  useEffect(() => {
    // This effect synchronizes the selectedRecipe in the dialog with updates from suggestedRecipes list,
    // particularly after an image has been generated for it.
    if (selectedRecipe && suggestedRecipes) {
      const recipeInList = suggestedRecipes.find(
        r => r.name === selectedRecipe.name && r.ingredients === selectedRecipe.ingredients
      );

      if (recipeInList) {
        // If the image URL in the list is different OR the loading state in the list is different
        if (recipeInList.imageUrl !== selectedRecipe.imageUrl || recipeInList.imageLoading !== selectedRecipe.imageLoading) {
          // Update selectedRecipe with the latest data from the list
          setSelectedRecipe(recipeInList);
        }
      }
    }
  }, [suggestedRecipes, selectedRecipe]);


  const handleSuggestRecipes = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!ingredientsInput.trim()) {
      setError("Please enter some ingredients.");
      toast({
        title: "Missing Ingredients",
        description: "Please enter some ingredients to get recipe suggestions.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuggestedRecipes(null); 
    localStorage.setItem(LOCAL_STORAGE_KEY, ingredientsInput);

    try {
      const output = await suggestRecipe({ ingredients: ingredientsInput });
      if (output.recipes && output.recipes.length > 0) {
        const recipesWithImageState: DisplayRecipe[] = output.recipes.map(r => ({
          ...r,
          imageUrl: null,
          imageLoading: true,
        }));
        setSuggestedRecipes(recipesWithImageState);
        toast({
          title: "Recipes Generated!",
          description: "We've cooked up some ideas for you. Images are loading...",
        });

        recipesWithImageState.forEach(async (recipe, index) => {
          try {
            const imageOutput = await generateRecipeImage({ recipeName: recipe.name, ingredients: recipe.ingredients });
            setSuggestedRecipes(prev => {
              if (!prev) return null;
              const updatedRecipes = [...prev];
              if (updatedRecipes[index]) {
                updatedRecipes[index] = { ...updatedRecipes[index], imageUrl: imageOutput.imageDataUri, imageLoading: false };
              }
              return updatedRecipes;
            });
          } catch (imgErr) {
            console.error(`Failed to generate image for ${recipe.name}:`, imgErr);
            toast({
              title: `Image Error: ${recipe.name}`,
              description: "Could not generate image, using placeholder.",
              variant: "destructive",
              duration: 3000,
            });
            setSuggestedRecipes(prev => {
              if (!prev) return null;
              const updatedRecipes = [...prev];
              if (updatedRecipes[index]) {
                updatedRecipes[index] = { ...updatedRecipes[index], imageLoading: false };
              }
              return updatedRecipes;
            });
          }
        });

      } else {
        setSuggestedRecipes([]);
        toast({
          title: "No Recipes Found",
          description: "Try different ingredients!",
        });
      }
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(`Failed to get recipes: ${errorMessage}`);
      toast({
        title: "Error Generating Recipes",
        description: `Oops! Something went wrong: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleClearIngredients = () => {
    setIngredientsInput('');
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setSuggestedRecipes(null);
    setError(null);
    toast({
      title: "Ingredients Cleared",
      description: "Ready for a new culinary adventure!",
    });
  };


  return (
    <div className="flex flex-col min-h-screen">
      <header className="py-6 px-4 md:px-8 border-b border-border/60 shadow-sm">
        <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <AppLogo />
          <p className="text-muted-foreground text-center sm:text-right">
            What culinary masterpiece can we create today?
          </p>
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 md:p-8">
        <section id="ingredient-input" aria-labelledby="ingredient-input-heading" className="mb-8 p-6 bg-card rounded-xl shadow-lg">
          <h2 id="ingredient-input-heading" className="text-2xl font-semibold mb-4 text-foreground flex items-center gap-2">
            <PackageSearch className="text-primary" />
            Your Ingredients
          </h2>
          <form onSubmit={handleSuggestRecipes} className="space-y-4">
            <Textarea
              value={ingredientsInput}
              onChange={(e) => setIngredientsInput(e.target.value)}
              placeholder="e.g., chicken breast, broccoli, soy sauce, rice..."
              rows={4}
              className="text-base"
              aria-label="Enter your ingredients"
            />
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Summoning Chef...
                  </>
                ) : (
                  <>
                    <Soup className="mr-2 h-4 w-4" />
                    Get Recipes
                  </>
                )}
              </Button>
              <Button type="button" variant="outline" onClick={handleClearIngredients} disabled={isLoading || !ingredientsInput} className="w-full sm:w-auto">
                <RefreshCw className="mr-2 h-4 w-4" />
                Clear Ingredients
              </Button>
            </div>
          </form>
        </section>

        {error && (
          <Alert variant="destructive" className="mb-8">
            <Info className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <section id="recipe-suggestions" aria-labelledby="recipe-suggestions-heading">
          {isLoading && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {[...Array(3)].map((_, i) => (
               <Card key={i} className="shadow-lg animate-pulse">
                 <CardHeader>
                   <div className="h-6 bg-muted rounded w-3/4"></div>
                 </CardHeader>
                  <div className="aspect-video bg-muted flex items-center justify-center">
                    <LucideImage className="h-12 w-12 text-foreground/30" />
                  </div>
                 <CardContent className="pt-4">
                   <div className="h-4 bg-muted rounded w-full mb-2"></div>
                   <div className="h-4 bg-muted rounded w-5/6"></div>
                 </CardContent>
                 <CardFooter>
                    <div className="h-10 bg-muted rounded w-1/3"></div>
                 </CardFooter>
               </Card>
             ))}
           </div>
          )}

          {!isLoading && suggestedRecipes && (
            <>
              <h2 id="recipe-suggestions-heading" className="text-3xl font-semibold mb-6 text-foreground flex items-center gap-2">
                <ChefHat className="text-primary" />
                Recipe Ideas
              </h2>
              {suggestedRecipes.length === 0 ? (
                <Alert className="text-center">
                  <Lightbulb className="h-4 w-4" />
                  <AlertTitle>No Recipes Found</AlertTitle>
                  <AlertDescription>
                    We couldn't find any recipes with the provided ingredients. Try adding more or different items!
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {suggestedRecipes.map((recipe, index) => (
                    <Card key={index} className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl">
                      <CardHeader>
                        <CardTitle className="text-xl text-primary">{recipe.name}</CardTitle>
                        <CardDescription className="truncate">Main ingredients: {recipe.ingredients.split(',').slice(0,3).join(', ')}...</CardDescription>
                      </CardHeader>
                      <div className="aspect-video bg-muted overflow-hidden">
                        {recipe.imageLoading ? (
                          <div className="w-full h-full flex items-center justify-center bg-secondary/30">
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                          </div>
                        ) : (
                          <Image 
                            src={recipe.imageUrl || `https://placehold.co/600x400.png?hash=${index}-${recipe.name}`} 
                            alt={recipe.name} 
                            width={600} 
                            height={400} 
                            className="object-cover w-full h-full" 
                            data-ai-hint={recipe.imageUrl ? recipe.name.toLowerCase().split(/\s+/).slice(0, 2).join(' ') : "food gourmet"}
                            onError={(e) => {
                              // Fallback if generated image fails to load (e.g. malformed data URI)
                              e.currentTarget.src = `https://placehold.co/600x400.png?hash=${index}-${recipe.name}-error`;
                              e.currentTarget.srcset = ""; // NextJS might add srcset, ensure it's cleared
                            }}
                          />
                        )}
                      </div>
                      <CardContent className="flex-grow pt-4">
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {recipe.instructions.length > 100 ? recipe.instructions.substring(0, 100) + "..." : recipe.instructions}
                        </p>
                      </CardContent>
                      <CardFooter>
                        <Button onClick={() => setSelectedRecipe(recipe)} className="w-full" variant="default">
                          <Utensils className="mr-2 h-4 w-4" />
                          View Recipe
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
           {!isLoading && !suggestedRecipes && !error && (
             <Alert className="text-center py-8">
                <ChefHat className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                <AlertTitle className="text-xl">Welcome to FridgeFeast!</AlertTitle>
                <AlertDescription className="text-muted-foreground">
                    Enter the ingredients you have on hand, and let our AI chef whip up some delicious recipe ideas for you.
                </AlertDescription>
             </Alert>
           )}
        </section>

        {selectedRecipe && (
          <Dialog open={!!selectedRecipe} onOpenChange={(isOpen) => !isOpen && setSelectedRecipe(null)}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col rounded-xl overflow-hidden">
              <DialogHeader className="p-6 border-b">
                <DialogTitle className="text-3xl text-primary">{selectedRecipe.name}</DialogTitle>
              </DialogHeader>
              <ScrollArea className="flex-grow min-h-0 p-6">
                {selectedRecipe.imageLoading ? (
                  <div className="w-full aspect-video flex items-center justify-center bg-muted rounded-lg mb-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  </div>
                ) : selectedRecipe.imageUrl ? (
                  <div className="mb-4 rounded-lg overflow-hidden shadow-md">
                    <Image
                      src={selectedRecipe.imageUrl}
                      alt={selectedRecipe.name}
                      width={409}
                      height={230}
                      className="object-cover w-full h-[230px]"
                       data-ai-hint={selectedRecipe.name.toLowerCase().split(/\s+/).slice(0, 2).join(' ')}
                    />
                  </div>
                ) : null }
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-2 flex items-center gap-2 text-foreground">
                      <ListChecks className="text-accent" /> Ingredients
                    </h3>
                    <p className="text-muted-foreground whitespace-pre-line bg-secondary/30 p-3 rounded-md">{selectedRecipe.ingredients}</p>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2 flex items-center gap-2 text-foreground">
                      <Utensils className="text-accent" /> Instructions
                    </h3>
                    <p className="text-muted-foreground whitespace-pre-line bg-secondary/30 p-3 rounded-md">{selectedRecipe.instructions}</p>
                  </div>
                  {selectedRecipe.substitutions && (
                    <div>
                      <h3 className="text-xl font-semibold mb-2 flex items-center gap-2 text-foreground">
                        <RefreshCw className="text-accent" /> Substitutions
                      </h3>
                      <p className="text-muted-foreground whitespace-pre-line bg-secondary/30 p-3 rounded-md">{selectedRecipe.substitutions}</p>
                    </div>
                  )}
                  {selectedRecipe.sideDishes && (
                    <div>
                      <h3 className="text-xl font-semibold mb-2 flex items-center gap-2 text-foreground">
                        <Soup className="text-accent" /> Side Dishes
                      </h3>
                      <p className="text-muted-foreground whitespace-pre-line bg-secondary/30 p-3 rounded-md">{selectedRecipe.sideDishes}</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
              <DialogFooter className="p-6 border-t">
                <DialogClose asChild>
                  <Button type="button" variant="outline">Close</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </main>

      <footer className="py-6 px-4 md:px-8 border-t border-border/60 mt-12 bg-card">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} FridgeFeast. All rights reserved.</p>
          <p>Happy Cooking!</p>
        </div>
      </footer>
    </div>
  );
}

