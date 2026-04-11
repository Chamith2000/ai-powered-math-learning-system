import mathsWords from "./maths_words.json";

/** Always a 6x5 (rows × letters) board to match the UI */
export const getboardDefault = () => {
  return Array.from({ length: 6 }, () => Array(5).fill(""));
};

export const generateWordSet = async () => {
  // Only 5-letter words; list is curated for the word guess game
  const words = mathsWords.words
    .map(w => (w.word || "").trim().toLowerCase())
    .filter(w => w.length === 5);

  const todaysWord = words[Math.floor(Math.random() * words.length)];

  return {
    wordSet: new Set(words),
    todaysWord
  };
};
