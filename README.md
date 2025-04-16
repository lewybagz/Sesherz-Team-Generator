# Pick Teams Pussy

A premium team generator web app for creating random teams from a pool of players.

## Features

- Create teams ranging from 2v2 to 7v7
- PIN-protected access for privacy
- Cloud-based player database with Firebase
- Export/import player data for local backup
- Elegant, modern UI with responsive design
- One-click team generation with randomized selection
- Accessible from any device with a web browser

## How to Use

1. **Access the App**: Enter the 6-digit PIN to unlock the application
2. **Select Team Size**: Choose your preferred team size (2v2 through 7v7)
3. **Add Players**: Enter player names in the input field and click "Add" or press Enter
   - Players are automatically saved to the cloud
   - Click on saved players to quickly add them to the current selection
   - Delete saved players with the trash icon button
4. **Generate Teams**: Click the "Generate Teams" button to create random balanced teams
5. **Reset**: Clear current player selection and generated teams with the "Reset" button
6. **Data Management**:
   - **Export Players**: Download a JSON backup of all saved players
   - **Import Players**: Upload a previously exported JSON file to restore player data

## Data Persistence and Security

The app uses multiple approaches for data management and security:

1. **PIN Authentication**:

   - App access is protected with a 6-digit PIN
   - PIN is verified against Firestore database
   - Authentication state is saved for the session
   - Maximum 5 attempts before temporary lockout

2. **Firebase Firestore**: Players are automatically saved to the cloud
   - Data is synchronized across devices
   - Offline support when internet connection is lost
   - No need to manually back up data
3. **Export/Import**: For manual backups or data migration:
   - Use the Export button to download a JSON file containing all saved players
   - Use the Import button to upload a previously exported JSON file

## Firebase Setup

To set up your own instance with Firebase:

1. Create a Firebase account at [firebase.google.com](https://firebase.google.com/)
2. Create a new Firebase project
3. Set up Firestore Database in test mode
4. Create a document at the path `pin/access` with a field `value` containing your 6-digit PIN
5. Register a web app in your Firebase project
6. Copy the Firebase configuration from the Firebase console
7. Update the `firebase-config.js` file with your configuration

## Local Development

To run this app locally:

1. Clone the repository
2. Update the Firebase configuration in `firebase-config.js`
3. Open `index.html` in your browser
4. That's it! No build steps or dependencies required

## GitHub Pages Deployment

This app is designed to be deployed on GitHub Pages. To deploy:

1. Push your changes to the repository
2. Enable GitHub Pages in the repository settings
3. Select the branch you want to deploy (usually `main` or `master`)

## Technologies Used

- HTML5
- CSS3
- JavaScript (ES6+)
- Firebase Firestore for data persistence
- File API for import/export functionality

## License

MIT License - Feel free to use, modify and distribute as needed.

## Created By

Sesherz Team Generator - A simple but powerful team generation tool.
