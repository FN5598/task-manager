import { words } from "./guessableWordsList";

export async function fetchRandomWord() {
    const randomIndex = Math.floor(Math.random() * words.length);
    return words[randomIndex];
}