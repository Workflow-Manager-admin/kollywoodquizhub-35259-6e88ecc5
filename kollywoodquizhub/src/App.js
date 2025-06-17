import React, { useEffect, useState, useCallback } from "react";
import "./App.css";
import { GameMenu, QuizGame, TrueFalseGame, PosterMatchGame } from "./QuizGames";

/**
 * =====================
 * KollywoodQuizHub Main App (modular & multi-game)
 * - Modular, responsive game selector & loader
 * - Login/registration (mock)
 * - MCQ, True/False, Poster Match games (powered by TMDb)
 * - Progress/results for each session
 * - Modern, light-themed, documented
 * =====================
 */

/** 
 * PUBLIC_INTERFACE
 * Fetches Tamil (Kollywood) movies from TMDb API, filtered for less mainstream/harder options
 * - Only returns movies with POPULARITY < 10 and RELEASE DATE before 2015 (harder/obscure)
 */
async function fetchKollywoodMovies(page = 1) {
  const TMDB_API_KEY = "5bc67d3b06aecbd18121a3cbbc16eb59";
  // 'sort_by=popularity.asc' gets least popular first
  // 'release_date.lte=2014-12-31' restricts to movies released <= 2014
  // 'vote_count.gte=3' means filter out movies with too few votes (reduces junk data)
  const TMDB_SEARCH_URL =
    `https://api.themoviedb.org/3/discover/movie` +
    `?api_key=${TMDB_API_KEY}` +
    `&language=en-US` +
    `&with_original_language=ta` +
    `&sort_by=popularity.asc` +
    `&vote_count.gte=3` +
    `&popularity.lte=10` +
    `&release_date.lte=2014-12-31` +
    `&page=${page}`;
  const response = await fetch(TMDB_SEARCH_URL);
  if (!response.ok) {
    throw new Error("Failed to fetch Kollywood movies from TMDb");
  }
  return response.json();
}

// =========== UTILS ===========
/** Mock "auth" with localStorage */
const auth = {
  register(username, password) {
    const users = JSON.parse(localStorage.getItem("users") || "{}");
    if (users[username]) throw new Error("Username already exists");
    users[username] = { password };
    localStorage.setItem("users", JSON.stringify(users));
    localStorage.setItem("kqh-session", username);
  },
  login(username, password) {
    const users = JSON.parse(localStorage.getItem("users") || "{}");
    if (!users[username]) throw new Error("User not found");
    if (users[username].password !== password) throw new Error("Incorrect password");
    localStorage.setItem("kqh-session", username);
  },
  logout() { localStorage.removeItem("kqh-session"); },
  getSession() { return localStorage.getItem("kqh-session"); },
};
// =========== END UTILS ===========

// =========== UI COMPONENTS ===========
/** PUBLIC_INTERFACE
 * Navigation bar for user/logout info
 * @param {{ user: string|null, onLogout: () => void }} props
 */
function NavBar({ user, onLogout }) {
  return (
    <nav className="navbar" style={{ background: "var(--primary-color,#f9fafa)", color: "var(--accent-color,#121211)" }}>
      <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="logo" style={{ color: "#fc0388" }}>
          <span className="logo-symbol" style={{ color: "#fc0388" }}>🎬</span>
          KollywoodQuizHub
        </div>
        <div>
          {user ? (
            <>
              <span style={{ marginRight: 16, fontWeight: 500 }}>{user}</span>
              <button className="btn" style={{ background: "#fc0388", color: "#fff" }} onClick={onLogout}>Logout</button>
            </>
          ) : null}
        </div>
      </div>
    </nav>
  );
}

/** PUBLIC_INTERFACE
 * Login/Register Form
 * @param {{ mode: "login"|"register", onAuth: (user:string)=>void, onSwitch: ()=>void }}
 */
function AuthForm({ mode = "login", onAuth, onSwitch }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState(null);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }
  function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    try {
      if (!form.username || !form.password) throw new Error("Please fill all fields");
      if (mode === "login") { auth.login(form.username, form.password); }
      else { auth.register(form.username, form.password); }
      onAuth(form.username);
    } catch (err) { setError(err.message); }
  }
  return (
    <div className="auth-box" style={{
      background: "#ffffff",
      color: "#121211",
      maxWidth: 340,
      margin: "120px auto 24px",
      borderRadius: 10,
      boxShadow: "0 2px 16px 0 rgba(0,0,0,0.08)",
      padding: 32,
      display: "flex",
      flexDirection: "column",
      alignItems: "stretch"
    }}>
      <h2 style={{ color: "#fc0388", marginBottom: 12, textAlign: "center" }}>{mode === "login" ? "Login" : "Register"}</h2>
      <form onSubmit={handleSubmit} autoComplete="off">
        <input
          type="text"
          name="username"
          placeholder="Username"
          value={form.username}
          autoFocus
          onChange={handleChange}
          style={{
            marginBottom: 12,
            padding: 10,
            border: "1px solid #e3e3e3",
            borderRadius: 5,
            fontSize: 16,
            width: "100%",
            outline: "none"
          }}
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          style={{
            marginBottom: 16,
            padding: 10,
            border: "1px solid #e3e3e3",
            borderRadius: 5,
            fontSize: 16,
            width: "100%",
            outline: "none"
          }}
        />
        <button className="btn btn-large" style={{
          width: "100%", background: "#fc0388", color: "#fff", marginBottom: 8
        }}>
          {mode === "login" ? "Login" : "Register"}
        </button>
        <div style={{ fontSize: 15, marginTop: 8, color: "#808080", textAlign: "center" }}>
          {mode === "login" ? (
            <>New user?{" "}
              <button type="button" style={{ color: "#fc0388", background: "none", border: "none", cursor: "pointer", padding: 0 }} onClick={onSwitch}>Register</button>
            </>
          ) : (
            <>Have an account?{" "}
              <button type="button" style={{ color: "#fc0388", background: "none", border: "none", cursor: "pointer", padding: 0 }} onClick={onSwitch}>Login</button>
            </>
          )}
        </div>
        {error && <div style={{ color: "#ff2a44", fontSize: 14, marginTop: 8 }}>{error}</div>}
      </form>
    </div>
  );
}

/** PUBLIC_INTERFACE
 * Quiz Result Screen (shown for ALL game types)
 * @param {{ result: {score: number, total: number, answers: object[]}, onRestart: ()=>void }}
 */
function QuizResult({ result, onRestart }) {
  // Smartly render answers for MCQ or PosterMatch or TrueFalse
  return (
    <div className="container" style={{ maxWidth: 500, margin: "60px auto 16px", textAlign: "center" }}>
      <div style={{ fontSize: 30, color: "#fc0388", fontWeight: 700, marginBottom: 18 }}>Quiz Results!</div>
      <div style={{ fontSize: 20, color: "#121211", marginBottom: 18 }}>
        Your Score:{" "}
        <span style={{ color: "#00b39a", fontWeight: 600 }}>
          {result.score} / {result.total}
        </span>
      </div>
      <div>
        {result.answers.map((a, i) => (
          <div key={i} style={{
            display: "flex",
            alignItems: "center",
            background: a.isCorrect ? "#d6fce5" : "#ffe1ee",
            marginBottom: 7,
            borderRadius: 6,
            padding: "8px 11px"
          }}>
            {/* For MCQ/Poster: show poster; for TrueFalse-fake, show icon */}
            {a.question && a.question.poster_path && (
              <img src={`https://image.tmdb.org/t/p/w92/${a.question.poster_path}`} alt="" style={{ width: 38, borderRadius: 4, marginRight: 8 }} />
            )}
            {a.question && a.question.correct && a.selected && a.selected.poster_path && (
              <img src={`https://image.tmdb.org/t/p/w92/${a.selected.poster_path}`} alt="" style={{ width: 38, borderRadius: 4, marginRight: 8 }} />
            )}
            {a.question && a.question.fakeTitle && (
              <span style={{ width: 38, display: "inline-block", textAlign: "center", color: "#888", marginRight: 8 }}>?</span>
            )}
            <div style={{ flex: 1, color: "#121211", textAlign: "left" }}>
              <span style={{ fontWeight: 600 }}>
                {/* MCQ/Poster: question.title; TrueFalse: real/fake title */}
                {a.question
                  ? (
                      a.question.title ||
                      (a.question.correct && a.question.correct.title) ||
                      a.question.fakeTitle ||
                      (typeof a.question === "string" ? a.question : "")
                    )
                  : ""
                }
                {a.question && a.question.release_date && (
                  <span style={{ marginLeft: 5, color: "#fc0388" }}>
                    ({(a.question.release_date && a.question.release_date.slice
                      ? a.question.release_date.slice(0, 4)
                      : "?")})
                  </span>
                )}
              </span>
              <span style={{ marginLeft: 13, color: a.isCorrect ? "#01ad4a" : "#e12956", fontWeight: 500 }}>
                {a.isCorrect ? "✅" : "❌"}
              </span>
              <div style={{ fontSize: 13, color: "#888" }}>
                Your answer: <b>
                  {a.selected && (typeof a.selected === "object")
                    ? a.selected.title || a.selected.fakeTitle || "Poster"
                    : a.selected
                  }
                </b>
              </div>
            </div>
          </div>
        ))}
      </div>
      <button className="btn btn-large" style={{ background: "#fc0388", color: "#fff", marginTop: 24 }} onClick={onRestart}>
        Restart Quiz
      </button>
    </div>
  );
}

// =========== APP ENTRY ===========
/** PUBLIC_INTERFACE
 * Root App Component.
 * Supports modular switching between game types: Multiple Choice, True/False, Poster Match.
 */
function App() {
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--primary-color", "#f9fafa");
    root.style.setProperty("--secondary-color", "#fc0388");
    root.style.setProperty("--accent-color", "#121211");
    root.style.setProperty("--base-light", "#f9fafa");
    root.style.setProperty("--base-dark", "#f9fafa");
    root.style.setProperty("--text-color", "#121211");
    root.style.setProperty("--border-color", "#efefef");
  }, []);

  // -- State --
  const [user, setUser] = useState(auth.getSession());
  const [authMode, setAuthMode] = useState("login");
  const [screen, setScreen] = useState("loading"); // "auth" | "menu" | "game" | "results"
  const [movies, setMovies] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [selectedGame, setSelectedGame] = useState(null); // "mcq"|"truefalse"|"postermatch"|null
  const [gameResult, setGameResult] = useState(null);

  // On mount: check session, fetch movies
  useEffect(() => {
    if (user) {
      setScreen("menu");
      setSelectedGame(null);
      setGameResult(null);
      setMovies(null);
      setApiError(null);
      fetchKollywoodMovies(1)
        .then((data) => {
          if (!data || !data.results || !data.results.length) throw new Error("No movie data found");
          setMovies(
            data.results.filter((m) => m.poster_path && m.title && m.release_date && Number(m.vote_count) > 4)
          );
        })
        .catch((err) => {
          setApiError(err.message || "Could not load Kollywood movies");
          setMovies([]);
        });
    } else {
      setScreen("auth");
    }
  }, [user]);

  // Login/Register complete handler
  const handleAuth = useCallback((username) => {
    setUser(username);
    setAuthMode("login");
    setGameResult(null);
    setSelectedGame(null);
    setScreen("menu");
  }, []);

  function startGame(gameType) {
    setSelectedGame(gameType);
    setGameResult(null);
    setScreen("game");
  }
  function restartMenu() {
    setGameResult(null);
    setSelectedGame(null);
    setScreen("menu");
  }
  function handleGameDone(result) {
    setGameResult(result);
    setScreen("results");
  }
  function retryApi() {
    setApiError(null);
    setMovies(null);
    fetchKollywoodMovies(1)
      .then((data) => {
        setMovies(
          data.results.filter((m) => m.poster_path && m.title && m.release_date && Number(m.vote_count) > 4)
        );
      })
      .catch((err) => {
        setApiError(err.message || "Could not load Kollywood movies");
        setMovies([]);
      });
  }

  // =========== RENDER ===========
  return (
    <div className="app" style={{ background: "#f9fafa", minHeight: "100vh", color: "#121211" }}>
      <NavBar user={user} onLogout={() => {
        auth.logout();
        setUser(null);
        setScreen("auth");
        setGameResult(null);
        setMovies(null);
        setSelectedGame(null);
      }} />
      <main style={{ marginTop: 82, flex: 1 }}>
        {screen === "auth" && (
          <AuthForm
            mode={authMode}
            onAuth={handleAuth}
            onSwitch={() => setAuthMode((m) => (m === "login" ? "register" : "login"))}
          />
        )}

        {/* Game Menu */}
        {screen === "menu" && user && (
          <>
            {!!apiError && (
              <div className="container" style={{
                color: "#e12956", background: "#ffe0ea",
                borderRadius: 6, padding: 12, margin: "18px auto 0", maxWidth: 500, fontWeight: 500
              }}>
                {apiError} <br />
                <button className="btn" onClick={retryApi} style={{ background: "#fc0388", color: "#fff", marginTop: 8 }}>
                  Retry
                </button>
              </div>
            )}
            {!apiError && (
              <GameMenu onSelect={startGame} />
            )}
          </>
        )}

        {/* Show selected game (if loaded) */}
        {screen === "game" && user && selectedGame && (
          <>
            {!movies && (
              <div className="container" style={{
                color: "#fc0388",
                background: "#f7e6fa",
                borderRadius: 7,
                padding: 18,
                margin: "18px auto 0",
                maxWidth: 440,
                fontWeight: 500
              }}>
                Loading Kollywood movie data...
              </div>
            )}
            {!!movies && !apiError && (
              <>
                {selectedGame === "mcq" && <QuizGame movies={movies} onDone={handleGameDone} />}
                {selectedGame === "truefalse" && <TrueFalseGame movies={movies} onDone={handleGameDone} />}
                {selectedGame === "postermatch" && <PosterMatchGame movies={movies} onDone={handleGameDone} />}
              </>
            )}
          </>
        )}

        {/* Show game results with option to return to menu */}
        {screen === "results" && user && selectedGame && gameResult && (
          <div>
            <QuizResult result={gameResult} onRestart={restartMenu} />
            <div style={{ textAlign: "center", marginTop: 20 }}>
              <button className="btn"
                onClick={restartMenu}
                style={{
                  background: "#fff",
                  color: "#fc0388",
                  border: "1.5px solid #fc038899",
                  marginRight: 8
                }}>Back to Game Menu</button>
              <button className="btn"
                onClick={() => startGame(selectedGame)}
                style={{ background: "#fc0388", color: "#fff" }}
              >Play Again</button>
            </div>
          </div>
        )}

        {/* App Header/Blurb: Only if not logged in */}
        {screen === "auth" && (
          <section style={{ margin: "0 auto", maxWidth: 540, padding: "12px 18px" }}>
            <div className="subtitle"
              style={{ color: "#fc0388", fontWeight: 600, fontSize: 25, marginBottom: 8, textAlign: "center" }}>
              Kollywood/Movie Quiz Game 🎬
            </div>
            <div className="description" style={{ color: "#666", fontSize: 17, textAlign: "center", marginBottom: 0 }}>
              Experience the magic of Tamil cinema! <br />
              <b>Login or Register</b> to test your Kollywood movie knowledge.
              <br /><br />
              <span style={{ color: "#fc0388" }}>
                Quizzes are powered by live movie data from <b>TMDb</b>.<br />
                Your session and scores stay on this device.
              </span>
            </div>
          </section>
        )}
      </main>
      {/* Footer */}
      <footer style={{
        borderTop: "1px solid #ececec", background: "#f9fafa", color: "#aaa", padding: "18px",
        textAlign: "center", fontSize: "0.98rem"
      }}>
        <span>KollywoodQuizHub &copy; 2024. Data by <a href="https://www.themoviedb.org" target="_blank" rel="noopener noreferrer" style={{ color: "#fc0388" }}>TMDb</a>.</span>
      </footer>
    </div>
  );
}

/* 
  If any occurrence of PUBLIC_URL is used anywhere as a bare variable, replace with process.env.PUBLIC_URL.
  (Note: no such usage found in this file or in App.js body, but adding this as a reference for maintainers.)
*/

export default App;
