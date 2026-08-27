/**
 * API Service — Fetches dynamic words for the game
 * ============================================================
 * Uses the Random Word API to get unlimited words.
 * 
 * Why an API?
 * - Unlimited words (no hardcoded list)
 * - Fresh words every game
 * - No manual updates needed
 */

// Fetch a single random word
export const fetchRandomWord = async () => {
  try {
    const response = await fetch(
      'https://random-word-api.herokuapp.com/word?number=1'
    );
    const data = await response.json();
    return data[0].toUpperCase();
  } catch (error) {
    console.error('Failed to fetch word:', error);
    return 'REACT'; // Fallback word
  }
};

// Fetch multiple words at once (for variety)
export const fetchMultipleWords = async (count = 15) => {
  try {
    const response = await fetch(
      `https://random-word-api.herokuapp.com/word?number=${count}`
    );
    const data = await response.json();
    return data.map((word) => word.toUpperCase());
  } catch (error) {
    console.error('Failed to fetch words:', error);
    // Fallback words if API fails
    return ['REACT', 'STATE', 'PROPS', 'HOOKS', 'CODE', 'DATA', 'MAP', 'SET', 'GET', 'POST'];
  }
};