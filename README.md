# GDG Kwizzer

A real-time quiz game application built for hosting interactive quiz sessions. Admins can create quizzes, host live games, and players can join using a game code.

## Tech Stack

- **Frontend**: React 18 with TypeScript
- **Routing**: React Router DOM
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Firestore, Authentication)
- **Build Tool**: Vite
- **Icons**: Lucide React

## Features

### For Admins
- Create and manage quizzes with multiple choice questions
- Set time limits per question
- Host live quiz games
- View real-time leaderboard during games
- Edit quiz titles, descriptions, questions, and options inline

### For Players
- Join games using a 6-character code
- Answer questions in real-time
- View results after each question
- See final leaderboard at game end

## Project Structure

```
src/
  admin/           # Admin pages (quizzes, host)
  auth/            # Authentication pages (signin, signup)
  components/      # Reusable components
    game/          # Game-specific components (Leaderboard, OptionButton, QuestionText)
    layout/        # Layout components
    ui/            # UI components (Button, Card, Input, etc.)
  contexts/        # React contexts (AuthContext)
  hooks/           # Custom hooks (useGame)
  lib/             # Utility functions and services
    firestore.ts   # Firestore database operations
    gameTimer.ts   # Server-side game timer
    scoring.ts     # Score calculation logic
  play/            # Player pages (join, game)
  types/           # TypeScript type definitions
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Firebase project with Firestore and Authentication enabled

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd gdg-kwizzer
```

2. Install dependencies
```bash
npm install
```

3. Create a `.env` file with your Firebase configuration
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

4. Start the development server
```bash
npm run dev
```

### Firebase Setup

1. Deploy Firestore rules
```bash
firebase deploy --only firestore:rules
```

2. Deploy Storage rules (if using)
```bash
firebase deploy --only storage:rules
```

## Usage

### Creating a Quiz (Admin)
1. Sign in with an admin account
2. Navigate to "My Quizzes"
3. Click "Create Quiz"
4. Add questions with 4 options each
5. Set time limits and mark correct answers

### Hosting a Game (Admin)
1. Go to a quiz detail page
2. Click "Host Quiz"
3. Share the game code with players
4. Start the game when players have joined
5. Control question flow and view results

### Joining a Game (Player)
1. Sign in to the app
2. Click "Join Game"
3. Enter the 6-character game code
4. Enter your nickname
5. Wait for the host to start

## Admin Access

Admin privileges are controlled via Firestore security rules. To add an admin, update the `isAdmin()` function in `firestore.rules`:

```javascript
function isAdmin() {
  return request.auth != null && (
    request.auth.token.email == 'admin1@example.com' ||
    request.auth.token.email == 'admin2@example.com'
  );
}
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## License

MIT
