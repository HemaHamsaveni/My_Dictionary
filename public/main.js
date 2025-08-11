// public/main.js

document.addEventListener("DOMContentLoaded", () => {
  // DOM Element Selectors
  const appContainer = document.getElementById("app-container");
  const authFormContainer = document.getElementById("auth-form-container");
  const loginBtn = document.getElementById("login-btn");
  const signupBtn = document.getElementById("signup-btn");
  const logoutBtn = document.getElementById("logout-btn");
  const modeToggleBtn = document.getElementById("mode-toggle-btn");
  const welcomeMessage = document.getElementById("welcome-message");
  const wordInput = document.getElementById("word-input");
  const searchBtn = document.getElementById("search-btn");
  const dictionaryResults = document.getElementById("dictionary-results");
  const historyList = document.getElementById("history-list");
  const clearHistoryBtn = document.getElementById("clear-history-btn");

  // State
  let token = localStorage.getItem("token");

  // --- UI State Management ---
  function updateUI() {
    if (token) {
      appContainer.style.display = "block";
      authFormContainer.style.display = "none";
      loginBtn.style.display = "none";
      signupBtn.style.display = "none";
      logoutBtn.style.display = "inline-block";
      welcomeMessage.style.display = "block";
      const username = localStorage.getItem("username");
      welcomeMessage.textContent = `Welcome, ${username}!`;
      fetchHistory();
    } else {
      appContainer.style.display = "none";
      authFormContainer.style.display = "block";
      loginBtn.style.display = "inline-block";
      signupBtn.style.display = "inline-block";
      logoutBtn.style.display = "none";
      welcomeMessage.style.display = "none";
      welcomeMessage.textContent = "";
      authFormContainer.innerHTML = "";
      loginBtn.click();
    }
  }

  // --- Dark/Light Mode Toggle ---
  modeToggleBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    const isDarkMode = document.body.classList.contains("dark-mode");
    localStorage.setItem("darkMode", isDarkMode);
  });

  const savedTheme = localStorage.getItem("darkMode");
  if (savedTheme === "true") {
    document.body.classList.add("dark-mode");
  }

  // --- Authentication Forms ---
  loginBtn.addEventListener("click", () => {
    authFormContainer.innerHTML = `
            <h2>Login</h2>
            <form id="login-form">
                <input type="text" id="login-username" placeholder="Username" required>
                <input type="password" id="login-password" placeholder="Password" required>
                <button type="submit">Login</button>
            </form>
        `;
    document
      .getElementById("login-form")
      .addEventListener("submit", handleLogin);
    loginBtn.style.display = "none";
    signupBtn.style.display = "inline-block";
  });

  signupBtn.addEventListener("click", () => {
    authFormContainer.innerHTML = `
            <h2>Sign Up</h2>
            <form id="signup-form">
                <input type="text" id="signup-username" placeholder="Username" required>
                <input type="password" id="signup-password" placeholder="Password" required>
                <button type="submit">Sign Up</button>
            </form>
        `;
    document
      .getElementById("signup-form")
      .addEventListener("submit", handleSignup);
    signupBtn.style.display = "none";
    loginBtn.style.display = "inline-block";
  });

  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    token = null;
    updateUI();
  });

  // --- Authentication Handlers ---
  async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById("login-username").value;
    const password = document.getElementById("login-password").value;

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("username", data.username);
        token = data.token;
        updateUI();
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Login fetch error:", error);
      alert("Failed to connect to the server.");
    }
  }

  async function handleSignup(e) {
    e.preventDefault();
    const username = document.getElementById("signup-username").value;
    const password = document.getElementById("signup-password").value;

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      if (response.ok) {
        alert(data.message);
        loginBtn.click();
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Signup fetch error:", error);
      alert("Failed to connect to the server.");
    }
  }

  // --- Dictionary Search ---
  searchBtn.addEventListener("click", async () => {
    const word = wordInput.value.trim();
    if (!word) return;

    try {
      const response = await fetch(`/api/dictionary/search?word=${word}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (response.ok) {
        displayDictionaryResults(data);
        fetchHistory();
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Search fetch error:", error);
      alert("Failed to connect to the server.");
    }
  });

  function displayDictionaryResults(data) {
    if (data.length === 0) {
      dictionaryResults.innerHTML = "<p>No results found.</p>";
      return;
    }

    const firstEntry = data[0];
    let html = `
            <h3>${firstEntry.word}</h3>
            ${
              firstEntry.phonetic
                ? `<p><strong>Pronunciation:</strong> ${firstEntry.phonetic}</p>`
                : ""
            }
        `;

    if (firstEntry.phonetics && firstEntry.phonetics.length > 0) {
      const audioUrl = firstEntry.phonetics.find((p) => p.audio)?.audio;
      if (audioUrl) {
        html += `<audio controls src="${audioUrl}"></audio>`;
      }
    }

    firstEntry.meanings.forEach((meaning) => {
      html += `
                <h4>Part of Speech: ${meaning.partOfSpeech}</h4>
                <ul>
            `;
      meaning.definitions.forEach((definition) => {
        html += `<li>${definition.definition}</li>`;
        if (definition.example) {
          html += `<blockquote>Example: ${definition.example}</blockquote>`;
        }
      });
      html += "</ul>";
    });

    dictionaryResults.innerHTML = html;
  }

  // --- History Management ---
  async function fetchHistory() {
    try {
      const response = await fetch("/api/history/get", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const history = await response.json();
        displayHistory(history);
      } else {
        console.error("Failed to fetch history:", response.status);
        localStorage.removeItem("token");
        token = null;
        updateUI();
      }
    } catch (error) {
      console.error("History fetch error:", error);
      alert("Failed to connect to the server.");
    }
  }

  function displayHistory(history) {
    historyList.innerHTML = "";
    if (history.length > 0) {
      clearHistoryBtn.style.display = "block"; // Show button if history exists
    } else {
      clearHistoryBtn.style.display = "none"; // Hide button if history is empty
    }

    history.forEach((item) => {
      const li = document.createElement("li");
      li.innerHTML = `
                <button class="history-word-btn" data-word="${item.word}">
                    ${item.word}
                </button>
                <button class="delete-btn" data-word="${item.word}">Delete</button>
            `;
      historyList.appendChild(li);
    });

    document.querySelectorAll(".history-word-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const word = e.target.dataset.word;
        wordInput.value = word;
        searchBtn.click();
      });
    });

    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", handleDeleteHistory);
    });
  }

  async function handleDeleteHistory(e) {
    const wordToDelete = e.target.dataset.word;
    try {
      const response = await fetch("/api/history/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ word: wordToDelete }),
      });

      if (response.ok) {
        fetchHistory();
      } else {
        alert("Failed to delete history item.");
      }
    } catch (error) {
      console.error("Delete history fetch error:", error);
      alert("Failed to connect to the server.");
    }
  }

  async function handleClearHistory() {
    if (
      !confirm("Are you sure you want to clear your entire search history?")
    ) {
      return;
    }

    try {
      const response = await fetch("/api/history/clear", {
        // New endpoint for clearing history
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchHistory();
      } else {
        alert("Failed to clear history.");
      }
    } catch (error) {
      console.error("Clear history fetch error:", error);
      alert("Failed to connect to the server.");
    }
  }

  clearHistoryBtn.addEventListener("click", handleClearHistory);

  updateUI();
});
