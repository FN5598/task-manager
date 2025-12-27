# 📝 Drawing Game

This Drawing Game project is a React + Vite application is guessing word game where you draw and other players try to guess the word you are trying to draw. The core idea is to provide a simple, intuitive interface where users can chat, overtime some letters of word get shown so users can guess more easily.

# 🚀 Features
- Interactive Drawing Board
- Chat functionality
- Gradual word revelation for easier guessing
- Light/Dark theme toggle
- Clean and responsive UI
- Organized client/server folder structure
- Modern stack (Vite, React, Express)

# 🛠 Tech Stack
## Frontend (client/)
- React (With TypeScript and Vite and TailwindCSS v4 with vite set up)

## Backend (server/)
- Node.js with Express (Using TypeScript) and Websocket.io
- Database: MySQL
- Key Libraries:
    - mongoose for DB connection
    - swagger-jsdoc and swagger-ui-express for API Documentation

# 🚀 Getting Started

Follow these steps to set up and run the project locally.

## Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)

## Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/FN5598/drawing-game.git
    cd drawing-game
    ```

2.  Install client dependencies:
    ```bash
    cd client
    npm install
    cd ..
    ```

3.  Install server dependencies:
    ```bash
    cd server
    npm install
    cd ..
    ```

## Running the Project

### 1. Start the Backend Server

From the project root directory, navigate to the `server` directory and start the server:
 
```bash
npm run dev
```

### 2. Start the Frontend Application

Open a new terminal, navigate to the `client` directory, and start the frontend:

```bash
npm run dev
```

The client application will open in your browser, typically at `http://localhost:5173`.