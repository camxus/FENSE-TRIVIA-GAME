# Fense Trivia Game

Fense Trivia Game is a fun, interactive quiz game where players test their knowledge across multiple categories. With a clean, responsive design and dynamic feedback, Fense Trivia combines classic trivia gameplay with modern UI features for a seamless gaming experience.

---

## Features

* **Multiple Categories** – Choose from a variety of trivia topics.
* **Dynamic Question Display** – Supports single-word and multi-word answers with real-time input validation.
* **Interactive Feedback** – Visual feedback for correct and incorrect letters, similar to Wordle.
* **Audio Cues** – Play correct answer sounds to enhance user engagement.
* **Responsive Layout** – Inputs adjust to screen size and wrap if necessary.
* **Keyboard Navigation** – Supports typing, backspace, and arrow navigation.
* **Real-Time Input Handling** – Each letter input is tracked individually, with focus automatically moving to the next cell.

---

## Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/fense-trivia.git
```

2. Install dependencies:

```bash
npm install
# or
pnpm install
# or
yarn install
```

3. Start the development server:

```bash
npm run dev
# or
pnpm dev
# or
yarn dev
```

The game should now be available at `http://localhost:3000`.

---

## Socket.IO Server

The Fense Trivia Game uses **Socket.IO** for real-time multiplayer features, chat, and live updates. The Socket.IO server runs **separately** from the main frontend app.

### Steps to run the Socket.IO server

1. Navigate to the `socket.io` folder:

```bash
cd /socket.io
```

2. Install dependencies:

```bash
pnpm install
```

3. Start the development server:

```bash
pnpm dev
```

The server will typically be available at `http://localhost:3000` (or whichever port is configured).

### Notes

* Make sure the frontend is configured to connect to this server. Example in `.env`:

```
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
```

* The Socket.IO server must start running **via or before the frontend starts** to enable real-time features.

---

## Usage

1. Select a trivia category.
2. Read the question displayed on the screen.
3. Type your answer in the letter boxes.
4. Correct letters will be highlighted in green, partially correct letters in yellow.
5. Press backspace to delete letters or move back.
6. Complete the question to see if you got it right.

---

## Technologies

* **React** / **Next.js** – Frontend framework for building UI.
* **TypeScript** – Type safety and better development experience.
* **Tailwind CSS / NativeWind** – Styling and layout.
* **Framer Motion** – Animations for smoother interactions.
* **Custom hooks** – For audio playback, state management, and input handling.

---

## File Structure

```
src/
├─ components/      # WordleInput, QuestionCard, etc.
├─ hooks/           # useGameAudio, useTriviaLogic
├─ pages/           # App pages and routing
├─ utils/           # Helper functions
└─ styles/          # Tailwind / global styles
```

---

## Contributing

Contributions are welcome! If you want to help improve Fense Trivia:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/my-feature`)
3. Make your changes
4. Commit your changes (`git commit -am 'Add new feature'`)
5. Push to the branch (`git push origin feature/my-feature`)
6. Open a Pull Request

---

## License

This project is licensed under the MIT License – see the [LICENSE](LICENSE) file for details.

---

## Future Improvements

* Multiplayer mode with live scoring.
* Leaderboards and achievements.
* dditional question categories and difficulty levels.
* Mobile-friendly swipe input for touch devices.

