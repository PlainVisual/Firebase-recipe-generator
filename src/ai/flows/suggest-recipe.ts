// 'use server'
'use server';

/**
 * @fileOverview Recipe suggestion AI agent that takes a list of ingredients and returns recipe suggestions.
 *
 * - suggestRecipe - A function that suggests recipes based on the given ingredients.
 * - SuggestRecipeInput - The input type for the suggestRecipe function.
 * - SuggestRecipeOutput - The return type for the suggestRecipe function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestRecipeInputSchema = z.object({
  ingredients: z
    .string()
    .describe('A comma-separated list of ingredients available to use in a recipe.'),
});
export type SuggestRecipeInput = z.infer<typeof SuggestRecipeInputSchema>;

const SuggestRecipeOutputSchema = z.object({
  recipes: z.array(
    z.object({
      name: z.string().describe('The name of the recipe.'),
      ingredients: z.string().describe('A list of ingredients required for the recipe.'),
      instructions: z.string().describe('Step-by-step instructions for preparing the recipe.'),
      substitutions: z.string().optional().describe('Suggested substitutions for ingredients, if any.'),
      sideDishes: z.string().optional().describe('Suggested side dishes to accompany the recipe.'),
    })
  ).describe('An array of recipe suggestions based on the provided ingredients.'),
});
export type SuggestRecipeOutput = z.infer<typeof SuggestRecipeOutputSchema>;

export async function suggestRecipe(input: SuggestRecipeInput): Promise<SuggestRecipeOutput> {
  return suggestRecipeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestRecipePrompt',
  input: {schema: SuggestRecipeInputSchema},
  output: {schema: SuggestRecipeOutputSchema},
  prompt: `You are a world-class chef specializing in creating recipes based on a given list of ingredients.

  Given the following ingredients, suggest a few recipes that can be made, including potential substitutions and side dishes where appropriate.
  Return the recipes in JSON format.

  Ingredients: {{{ingredients}}}
  `,
});

const suggestRecipeFlow = ai.defineFlow(
  {
    name: 'suggestRecipeFlow',
    inputSchema: SuggestRecipeInputSchema,
    outputSchema: SuggestRecipeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
