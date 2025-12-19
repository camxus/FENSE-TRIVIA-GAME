# Fense - Multiplayer Trivia Game

A real-time multiplayer trivia game built with Next.js, React, and Socket.IO.

## Features

### Online Mode
- Create or join rooms with shareable room codes
- Real-time multiplayer gameplay
- Wordle-style answer feedback (green/yellow/gray tiles)
- Automatic scoring based on correctness and speed
- Live scoreboard
- Countdown timer for each question

### In-Person Mode
- Perfect for game nights with friends
- Leader controls for managing the game
- Add/remove players dynamically
- Manual point assignment
- Large question display for shared screens
- Timer controls (start/stop)

## Getting Started

### Installation

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Run the development server:
\`\`\`bash
npm run dev
\`\`\`

3. Open [http://localhost:3000](http://localhost:3000) in your browser

### How to Play

#### Online Mode
1. Enter your name and create a new room or join an existing one with a room code
2. Wait for other players to join
3. The room creator starts the game
4. Type your answer and submit before time runs out
5. See Wordle-style feedback on your guess
6. Points are awarded for correct answers with time bonuses

#### In-Person Mode
1. The game leader creates a room
2. Add all players who will participate
3. Start the game to begin showing questions
4. Display questions on a shared screen
5. Players answer verbally or via their devices
6. Leader manually assigns points to correct answers
7. Leader advances to the next question

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Real-time**: Socket.IO
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui

## Project Structure

\`\`\`
├── app/
│   ├── page.tsx              # Home page
│   ├── online/page.tsx       # Online mode
│   └── in-person/page.tsx    # In-person mode
├── components/
│   ├── ui/                   # shadcn/ui components
│   ├── timer.tsx             # Countdown timer
│   ├── scoreboard.tsx        # Player scoreboard
│   ├── wordle-guess.tsx      # Wordle-style feedback
│   ├── room-code-display.tsx # Room code display
│   ├── player-list.tsx       # Player list component
│   └── question-display.tsx  # Question display component
├── lib/
│   ├── socket-client.ts      # Socket.IO client
│   ├── socket-server.ts      # Socket.IO server types
│   └── game-utils.ts         # Game utility functions
└── server.js                 # Custom Next.js server with Socket.IO
\`\`\`

## Customization

### Adding Questions

Edit the `QUESTIONS` array in `server.js` to add your own trivia questions:

\`\`\`javascript
{
  id: "unique-id",
  question: "Your question here",
  answer: "ANSWER",
  category: "Category",
  timeLimit: 30
}
\`\`\`

### Scoring System

The default scoring system awards:
- 100 base points for correct answers
- 10 bonus points per second remaining on the timer

Modify the scoring logic in `server.js` under the `end-question` event handler.

## Deployment

To deploy to production:

1. Build the application:
\`\`\`bash
npm run build
\`\`\`

2. Start the production server:
\`\`\`bash
npm start
\`\`\`

For deployment to Vercel or other platforms, ensure Socket.IO is properly configured for your hosting environment.

## License

MIT
# FENSE-TRIVIA-GAME
