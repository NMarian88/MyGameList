import { Game, UserGameData } from "./types"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Calculate genre statistics from user's games
 * Returns genre distribution as percentile values (0-100)
 */
export function calculateGenreStats(games: Game[]) {
  const targetGenres = ["Action", "RPG", "Strategy", "Puzzle", "Adventure", "Sports", "Horror", "Indie"];
  const genreCounts: Record<string, number> = {};
  
  // Count occurrences of each genre
  games.forEach((game) => {
    if (!game.genres) return;
    
    const genres = game.genres.map((g) => g.name);
    genres.forEach((genres: string) => {
      if (targetGenres.includes(genres)) {
        genreCounts[genres] = (genreCounts[genres] || 0) + 1;
      }
    });
  });

  const maxCount = Math.max(...Object.values(genreCounts), 1);

  // Calculate percentile values (0-100)
  return targetGenres.map((genre) => ({
    name: genre,
    value: Math.round(((genreCounts[genre] || 0) / maxCount) * 100)
  }));
}

/**
 * Calculate genre statistics based on average review scores
 * Returns genre distribution weighted by how highly you rate each genre (0-100)
 */
export function calculateGenreStatsByScore(games: Game[], userGames: UserGameData[]) {
  const targetGenres = ["Action", "RPG", "Strategy", "Puzzle", "Adventure", "Sports", "Horror", "Indie"];
  const genreScores: Record<string, { totalScore: number; count: number }> = {};
  
  // Calculate average scores per genre
  games.forEach((game, idx) => {
    if (!game.genres) return;
    
    const userGame = userGames[idx];
    const latestReview = userGame?.reviews?.[userGame.reviews.length - 1];
    const score = latestReview?.reviewScore;
    
    if (score === undefined || score === null) return;
    
    const genres = game.genres.map((g) => g.name);
    genres.forEach((genreName: string) => {
      if (targetGenres.includes(genreName)) {
        if (!genreScores[genreName]) {
          genreScores[genreName] = { totalScore: 0, count: 0 };
        }
        genreScores[genreName].totalScore += score;
        genreScores[genreName].count += 1;
      }
    });
  });

  // Calculate average scores
  const averageScores = Object.entries(genreScores).reduce((acc, [genre, data]) => {
    acc[genre] = data.count > 0 ? data.totalScore / data.count : 0;
    return acc;
  }, {} as Record<string, number>);

  const maxScore = Math.max(...Object.values(averageScores), 1);

  // Calculate percentile values (0-100) based on average scores
  return targetGenres.map((genre) => ({
    name: genre,
    value: Math.round(((averageScores[genre] || 0) / maxScore) * 100)
  }));
}
