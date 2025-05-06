document.addEventListener("DOMContentLoaded", () => {
  // Check if authenticated before initializing
  const AUTH_SESSION_KEY = "sesherz_auth_verified";
  const isAuthenticated = sessionStorage.getItem(AUTH_SESSION_KEY) === "true";

  // Initialize app if already authenticated
  if (
    isAuthenticated ||
    document.getElementById("auth-screen").classList.contains("hidden")
  ) {
    initApp();
  }

  // Listen for authentication event from auth.js
  document.addEventListener("appAuthenticated", () => {
    console.log("Authentication event received, initializing app...");
    initApp();
  });

  function initApp() {
    // Prevent multiple initializations
    if (window.appInitialized) {
      console.log("App already initialized, skipping...");
      return;
    }

    console.log("Initializing application...");
    window.appInitialized = true;

    // DOM Elements
    const teamSizeButtons = document.querySelectorAll(".team-size-btn");
    const playerNameInput = document.getElementById("player-name");
    const addPlayerBtn = document.getElementById("add-player");
    const addRandomBtn = document.getElementById("add-random");
    const allPlayersContainer = document.getElementById("all-players");
    const playerCountElement = document.getElementById("player-count");
    const requiredPlayersElement = document.getElementById("required-players");
    const generateTeamsBtn = document.getElementById("generate-teams");
    const resetSelectionBtn = document.getElementById("reset-selection");
    const teamsContainer = document.getElementById("teams-container");
    const maxPlayersCountElement = document.getElementById("max-players-count");

    // References to Firestore collection
    const playersCollection = db.collection("players");

    // App State
    let selectedTeamSize = 2; // Default to 6v6 (matching the active button in HTML)
    let maxPlayers = selectedTeamSize * 2; // Maximum players allowed (based on team size)
    let allPlayers = []; // All players from the database
    let selectedPlayers = []; // Currently selected players
    let isLoading = true;

    // Helper function to capitalize first letter of a name
    function capitalizeFirstLetter(name) {
      if (!name || typeof name !== "string" || name.length === 0) return name;
      return name.charAt(0).toUpperCase() + name.slice(1);
    }

    // Initialize app
    init();

    async function init() {
      // Set default max players message
      updateMaxPlayersMessage();

      // Set required players count
      updateRequiredPlayersCount();

      // Show loading state
      allPlayersContainer.innerHTML =
        '<div class="loading-spinner">Loading players...</div>';

      try {
        // Load players from Firestore
        await loadPlayers();
      } catch (error) {
        allPlayersContainer.innerHTML =
          '<div class="error-message">Failed to load players. Please refresh.</div>';
      } finally {
        isLoading = false;
      }

      // Update player count
      updatePlayerCount();

      // Add event listeners
      addEventListeners();
    }

    function addEventListeners() {
      // Team size selection
      teamSizeButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
          teamSizeButtons.forEach((b) => b.classList.remove("active"));
          btn.classList.add("active");

          // Update selected team size
          selectedTeamSize = parseInt(btn.dataset.size);

          // Update maximum allowed players
          maxPlayers = selectedTeamSize * 2;

          // Update the maximum players message
          updateMaxPlayersMessage();

          // Update required players count
          updateRequiredPlayersCount();

          // Check if we need to deselect players due to new team size
          if (selectedPlayers.length > maxPlayers) {
            // Keep only the first maxPlayers selected players
            const removedPlayers = selectedPlayers.slice(maxPlayers);
            selectedPlayers = selectedPlayers.slice(0, maxPlayers);

            // Update player cards UI - remove selection class from deselected players
            removedPlayers.forEach((playerName) => {
              const playerCard = allPlayersContainer.querySelector(
                `[data-name="${playerName}"]`
              );
              if (playerCard) {
                playerCard.classList.remove("selected");
              }
            });

            // Notify user
            alert(
              `Team size changed to ${selectedTeamSize}v${selectedTeamSize}. ${removedPlayers.length} player(s) were deselected because the maximum is now ${maxPlayers} players.`
            );
          }

          // Update player count
          updatePlayerCount();

          // Update player cards to reflect max selection state
          updatePlayerCardStates();
        });
      });

      // Add player (to database and UI)
      addPlayerBtn.addEventListener("click", () => {
        addPlayer(true);
      });

      // Add random player (only to UI, not to database)
      addRandomBtn.addEventListener("click", () => {
        addPlayer(false);
      });

      playerNameInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") addPlayer(true);
      });

      // Generate teams
      generateTeamsBtn.addEventListener("click", generateTeams);

      // Reset selection
      resetSelectionBtn.addEventListener("click", resetSelection);
    }

    // Function to update the required players count display
    function updateRequiredPlayersCount() {
      if (requiredPlayersElement) {
        requiredPlayersElement.textContent = maxPlayers;
      }
    }

    // Function to update the max players message
    function updateMaxPlayersMessage() {
      if (maxPlayersCountElement) {
        maxPlayersCountElement.textContent = maxPlayers;
      }
    }

    // Function to update all player card states based on selection
    function updatePlayerCardStates() {
      const playerCards = allPlayersContainer.querySelectorAll(".player-card");

      // If we've reached max selection, disable non-selected cards
      const atMaxSelection = selectedPlayers.length >= maxPlayers;

      playerCards.forEach((card) => {
        const playerName = card.dataset.name;
        const isSelected = selectedPlayers.includes(playerName);

        // Update the selected class
        if (isSelected) {
          card.classList.add("selected");
        } else {
          card.classList.remove("selected");
        }

        // Update the disabled state
        if (atMaxSelection && !isSelected) {
          card.classList.add("disabled");
        } else {
          card.classList.remove("disabled");
        }
      });
    }

    async function addPlayer(saveToDB = true) {
      const playerName = playerNameInput.value.trim();

      if (!playerName) return;

      // Check if we're at maximum selected players
      if (selectedPlayers.length >= maxPlayers) {
        alert(
          `Maximum ${maxPlayers} players can be selected for ${selectedTeamSize}v${selectedTeamSize}. Please deselect some players first.`
        );
        return;
      }

      try {
        // For persistent players, save to Firestore if not already exists
        if (saveToDB && !allPlayers.includes(playerName)) {
          await playersCollection.doc(playerName).set({
            name: playerName,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          });
        }

        // Add to local array if not already in the list
        // For random players, we still add to allPlayers for UI tracking
        if (!allPlayers.includes(playerName)) {
          allPlayers.push(playerName);

          // Add to UI with appropriate class for random players
          addPlayerToDisplay(playerName, !saveToDB);
        }

        // Select the newly added player
        if (!selectedPlayers.includes(playerName)) {
          selectedPlayers.push(playerName);

          // Update the UI
          const playerCard = allPlayersContainer.querySelector(
            `[data-name="${playerName}"]`
          );
          if (playerCard) {
            playerCard.classList.add("selected");
          }
        }

        // Clear input
        playerNameInput.value = "";
        playerNameInput.focus();

        // Update player count
        updatePlayerCount();

        // Update player card states
        updatePlayerCardStates();
      } catch (error) {
        alert("Failed to add player. Please try again.");
      }
    }

    function addPlayerToDisplay(playerName, isRandom = false) {
      // Check if already exists in display
      if (allPlayersContainer.querySelector(`[data-name="${playerName}"]`)) {
        return;
      }

      const playerCard = document.createElement("div");
      playerCard.className = "player-card";
      if (isRandom) {
        playerCard.classList.add("random-player");
      }
      playerCard.dataset.name = playerName;

      // Player is selected if in selectedPlayers array
      if (selectedPlayers.includes(playerName)) {
        playerCard.classList.add("selected");
      }

      // Player is disabled if at max selection and not selected
      if (
        selectedPlayers.length >= maxPlayers &&
        !selectedPlayers.includes(playerName)
      ) {
        playerCard.classList.add("disabled");
      }

      // Capitalize the first letter of player name for display
      const displayName = capitalizeFirstLetter(playerName);

      playerCard.innerHTML = `
        <span class="player-name">${displayName}</span>
        <div class="player-actions">
          <button class="delete-btn" title="Delete"><i class="fas fa-trash"></i></button>
        </div>
      `;

      // Click to select/deselect player
      playerCard.addEventListener("click", (e) => {
        // If clicking on delete button, don't select/deselect
        if (e.target.closest(".delete-btn")) return;

        // Don't allow selecting if at max capacity and this player is not selected
        if (
          selectedPlayers.length >= maxPlayers &&
          !selectedPlayers.includes(playerName)
        ) {
          alert(
            `Maximum ${maxPlayers} players can be selected for ${selectedTeamSize}v${selectedTeamSize}. Please deselect some players first.`
          );
          return;
        }

        // Toggle selection
        if (selectedPlayers.includes(playerName)) {
          // Deselect
          selectedPlayers = selectedPlayers.filter((p) => p !== playerName);
          playerCard.classList.remove("selected");
        } else {
          // Select
          selectedPlayers.push(playerName);
          playerCard.classList.add("selected");
        }

        // Update count
        updatePlayerCount();

        // Update all player card states
        updatePlayerCardStates();
      });

      // Delete player
      playerCard
        .querySelector(".delete-btn")
        .addEventListener("click", async (e) => {
          e.stopPropagation(); // Prevent click event from bubbling up to card

          try {
            // Random players are only deleted from UI
            // Regular players are deleted from Firestore
            if (!playerCard.classList.contains("random-player")) {
              await playersCollection.doc(playerName).delete();
            }

            // Remove from arrays
            allPlayers = allPlayers.filter((p) => p !== playerName);
            selectedPlayers = selectedPlayers.filter((p) => p !== playerName);

            // Remove from display
            playerCard.remove();

            // Update player count
            updatePlayerCount();

            // Update player card states
            updatePlayerCardStates();
          } catch (error) {
            alert("Failed to delete player. Please try again.");
          }
        });

      allPlayersContainer.appendChild(playerCard);
    }

    async function loadPlayers() {
      // Clear the container first
      allPlayersContainer.innerHTML = "";

      // Get all players from Firestore
      const snapshot = await playersCollection.get();

      // Reset player arrays
      allPlayers = [];

      // Add each player to the array and display
      snapshot.forEach((doc) => {
        const playerName = doc.id;
        allPlayers.push(playerName);
        addPlayerToDisplay(playerName);
      });

      // Show empty state if no players
      if (allPlayers.length === 0) {
        allPlayersContainer.innerHTML = `
          <div class="empty-state">
            <p>No players yet. Add players using the input above.</p>
          </div>
        `;
      }
    }

    function updatePlayerCount() {
      playerCountElement.textContent = selectedPlayers.length;

      // Update the count color based on whether we have enough players
      const requiredPlayers = selectedTeamSize * 2;
      if (selectedPlayers.length === requiredPlayers) {
        playerCountElement.style.color = "var(--success-color)";
      } else if (selectedPlayers.length > requiredPlayers) {
        playerCountElement.style.color = "var(--warning-color)";
      } else {
        playerCountElement.style.color = "inherit";
      }

      // Enable/disable generate teams button
      if (selectedPlayers.length === requiredPlayers) {
        generateTeamsBtn.disabled = false;
        generateTeamsBtn.classList.remove("btn-disabled");
      } else {
        generateTeamsBtn.disabled = true;
        generateTeamsBtn.classList.add("btn-disabled");
      }
    }

    function generateTeams() {
      // Check if we have exactly the right number of players
      const requiredPlayers = selectedTeamSize * 2;

      if (selectedPlayers.length !== requiredPlayers) {
        alert(
          `You need exactly ${requiredPlayers} players selected for ${selectedTeamSize}v${selectedTeamSize} teams. You currently have ${selectedPlayers.length} selected.`
        );
        return;
      }

      // Create a copy of selected players
      let shuffledPlayers = [...selectedPlayers];

      // Perform multiple Fisher-Yates shuffles for better randomness
      for (let i = 0; i < 3; i++) {
        shuffledPlayers = fisherYatesShuffle(shuffledPlayers);
      }

      // Split into teams
      const team1 = shuffledPlayers.slice(0, selectedTeamSize);
      const team2 = shuffledPlayers.slice(
        selectedTeamSize,
        selectedTeamSize * 2
      );

      // Display teams
      displayTeams(team1, team2);
    }

    // Fisher-Yates shuffle algorithm
    function fisherYatesShuffle(array) {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        // Use window.crypto.getRandomValues for better randomness
        const j = Math.floor(
          (window.crypto.getRandomValues(new Uint32Array(1))[0] /
            (0xffffffff + 1)) *
            (i + 1)
        );
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    }

    function displayTeams(team1, team2) {
      // Clear previous teams
      teamsContainer.innerHTML = "";

      const battleGround = document.createElement("div");
      battleGround.className = "battleground";

      // Create team 1
      const team1Element = createTeamElement("Team 1", team1, "team-1");

      // Create VS text element
      const vsElement = document.createElement("div");
      vsElement.className = "vs-text";
      vsElement.textContent = "VS";

      // Create team 2
      const team2Element = createTeamElement("Team 2", team2, "team-2");

      // Add elements to the battleground
      battleGround.appendChild(team1Element);
      battleGround.appendChild(vsElement);
      battleGround.appendChild(team2Element);

      // Add battleground to the main teams container
      teamsContainer.appendChild(battleGround);

      // Show teams container
      teamsContainer.classList.add("active");

      // Scroll to teams
      teamsContainer.scrollIntoView({ behavior: "smooth" });
    }

    function createTeamElement(teamName, members, className) {
      const teamElement = document.createElement("div");
      teamElement.className = `team ${className}`;

      const teamHeader = document.createElement("div");
      teamHeader.className = "team-header";

      teamHeader.innerHTML = `
              <h3 class="team-name">${teamName}</h3>
          `;

      const membersList = document.createElement("ul");
      membersList.className = "team-members";

      members.forEach((member) => {
        const memberItem = document.createElement("li");
        // Capitalize the first letter of member name for display
        memberItem.textContent = capitalizeFirstLetter(member);
        membersList.appendChild(memberItem);
      });

      teamElement.appendChild(teamHeader);
      teamElement.appendChild(membersList);

      return teamElement;
    }

    function resetSelection() {
      // Clear selected players
      selectedPlayers = [];

      // Update all player cards to remove selection
      const playerCards = allPlayersContainer.querySelectorAll(".player-card");
      playerCards.forEach((card) => {
        card.classList.remove("selected");
        card.classList.remove("disabled");
      });

      // Hide teams
      teamsContainer.classList.remove("active");
      teamsContainer.innerHTML = "";

      // Reset player count
      updatePlayerCount();
    }
  }
});
