async function fetchRandomWord(count: number): Promise<string[]> {
    try {
        const response = await fetch(`https://random-word-api.herokuapp.com/word?number=${count}`);
        return response.json();
    } catch (err) {
        console.log("Failed to fetch words:", err);
        return [""];
    }
}

export default fetchRandomWord;