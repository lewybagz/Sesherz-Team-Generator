# Team Generator Web App

A web app for creating random teams from a pool of players.

## Features

- Create teams ranging from 2v2 to 7v7
- PIN-protected access for privacy using Firebase Authentication
- Cloud-based player database with Firebase Firestore
- Add persistent players (saved to cloud) or temporary random players
- Select/deselect players from the saved list for team generation
- Delete saved players permanently
- Elegant, modern UI with responsive design and dynamic updates
- One-click team generation with randomized selection
- Reset current player selection and generated teams easily
- Accessible from any device with a web browser
- Offline support via Firestore persistence

## How to Use

1.  **Access the App**: Enter the 6-digit PIN to unlock the application.
2.  **Select Team Size**: Choose your preferred team size (2v2 through 7v7). The required number of players updates automatically.
3.  **Add Players**:
    - Enter a player name and click "Add Homie" or press Enter to add a player permanently (saved to Firestore).
    - Click "Add Random" to add a temporary player for the current session only (not saved).
    - Added players appear in the player grid.
4.  **Select Players for Teams**:
    - Click on player cards in the grid to select or deselect them.
    - The display shows how many players are selected out of the required total for the chosen team size.
    - You must select the exact number of players required (e.g., 12 players for 6v6).
5.  **Delete Saved Players**: Click the trash icon on a player card (non-random players only) to permanently delete them from the database.
6.  **Generate Teams**: Once the correct number of players is selected, click the "Generate Teams" button to create two random teams.
7.  **Reset**: Click the "Clear Selection" button to deselect all players and clear any generated teams.

## Data Persistence and Security

The app uses multiple approaches for data management and security:

1.  **PIN Authentication**:
    - App access is protected with a 6-digit PIN.
    - PIN is verified against a specific document in the Firestore database.
    - Authentication state is saved for the current browser session using `sessionStorage`.
    - Maximum 5 PIN attempts before temporary lockout.
2.  **Firebase Firestore**:
    - Persistently added players are saved to the cloud via Firestore.
    - Data is synchronized across devices logged into the same session (though primarily designed for single-user sessions).
    - Offline support allows viewing and interacting with cached data when the internet connection is lost (changes sync when reconnected).

## Firebase Setup

To set up your own instance with Firebase:

1. Create a Firebase account at [firebase.google.com](https://firebase.google.com/)
2. Create a new Firebase project.
3. **Enable Firestore**: Set up Cloud Firestore database in your project. For initial setup, you can use test mode rules, but **ensure you configure proper security rules for production use.** See `firebase-rules.txt` for example rules, but tailor them to your needs.
4. **Create PIN Document**:
   - In your Firestore database, create a collection named `pin`.
   - Within the `pin` collection, create a document. You can use the ID `bq6plNBCru71wW5AKO4X` or choose your own (if you choose your own, update the `PIN_DOC_ID` constant in `auth.js`).
   - Add a field named `pin` (type: string) to this document and set its value to your desired 6-digit PIN code.
5. **Register Web App**: In your Firebase project settings, register a new web application.
6. **Get Configuration**: Copy the Firebase configuration object (containing `apiKey`, `authDomain`, etc.) provided after registering your web app.
7. **Update Config File**: Paste your Firebase configuration object into the `firebase-config.js` file, replacing the placeholder values.
8. **Create Players Collection**: Although the app creates the `players` collection automatically when the first player is added, you might want to create it manually in the Firebase console initially.

## Local Development

To run this app locally:

1. Clone the repository: `git clone <repository-url>`
2. Navigate to the project directory: `cd <project-directory>`
3. Update the Firebase configuration in `firebase-config.js` with your own Firebase project details.
4. Open the `index.html` file directly in your web browser.
5. No build steps or external dependencies (besides Firebase SDK loaded via CDN) are required.

## GitHub Pages Deployment

This app is a static web application and can be easily deployed on GitHub Pages:

1. Ensure your code (including your updated `firebase-config.js`) is pushed to your GitHub repository.
2. Go to your repository's **Settings** tab.
3. Navigate to the **Pages** section in the left sidebar.
4. Under **Build and deployment**, select **Deploy from a branch**.
5. Choose the branch you want to deploy (e.g., `main` or `master`) and the folder (usually `/root`).
6. Click **Save**. GitHub Pages will build and deploy your site, providing you with a URL.

## Technologies Used

- HTML5
- CSS3
- JavaScript (ES6+)
- Firebase Firestore (for database and PIN verification)
- Firebase SDK (v9 Compat version via CDN)
- Font Awesome (for icons)

## License

MIT License - Feel free to use, modify and distribute as needed.

## Created By

Sesherz Team Generator - A simple but powerful team generation tool.
