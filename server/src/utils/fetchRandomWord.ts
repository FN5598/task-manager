import { words } from "./guessable_words_1000";

export async function fetchRandomWord() {
    const randomIndex = Math.floor(Math.random() * words.length);
    return words[randomIndex];
}