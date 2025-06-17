import React, { useEffect, useState, useCallback } from "react";
import "./App.css";

/**
 * =====================
 * KollywoodQuizHub Main App
 * Features:
 * - Main container with navigation
 * - Light, clean, modern, responsive
 * - Authentication (Login/Register, no backend: uses localStorage)
 * - Quiz game engine powered by TMDb "Tamil/Kollywood" movies API
 * - Quiz UI & result/progress tracking
 * - Safe API call handling
 * =====================
 */

// PUBLIC_INTERFACE
/**
 * Fetches Tamil (Kollywood) movies from TMDb.
 * @param {number} [page=1] - Page number of TMDb results.
 * @returns {Promise<Object>} - TMDb result (movies).
 */
async function fetchKollywoodMovies(page = 1) {
  const TMDB_API_KEY = "5bc67d3b06aecbd18121a3cbbc16eb59";
  const TMDB_SEARCH_URL =
    "https://api.themoviedb.org/3/discover/movie?api_key=" +
    TMDB_API_KEY +
    "&language=en-US&with_original_language=ta&sort_by=popularity.desc&page=" +
    page;
  const response = await fetch(TMDB_SEARCH_URL);
  if (!response.ok) {
    throw new Error("Failed to fetch Kollywood movies from TMDb");
  }
  return response.json();
}

// =========== UTILS ===========
/**
 * Mock "auth" and "user DB": Uses browser localStorage (replace with API in real use).
 */
const auth = {
  /**
   * Registers a new user.
   * @param {string} username
   * @param {string} password
   */
  register(username, password) {
    const users = JSON.parse(localStorage.getItem("users") || "{}");
    if (users[username]) {
      throw new Error("Username already exists");
    }
    users[username] = { password };
    localStorage.setItem("users", JSON.stringify(users));
    localStorage.setItem("kqh-session", username);
  },
  /**
   * Logs in user.
   * @param {string} username
   * @param {string} password
   */
  login(username, password) {
    const users = JSON.parse(localStorage.getItem("users") || "{}");
    if (!users[username]) throw new Error("User not found");
    if (users[username].password !== password)
      throw new Error("Incorrect password");
    localStorage.setItem("kqh-session", username);
  },
  /**
   * Logs out current user.
   */
  logout() {
    localStorage.removeItem("kqh-session");
  },
  /**
   * Checks if there's a logged-in user.
   * @returns {string|null} - Username or null
   */
  getSession() {
    return localStorage.getItem("kqh-session");
  },
};
// =========== END UTILS ===========

// =========== UI COMPONENTS ===========

/**
 * PUBLIC_INTERFACE
 * Main Navigation bar
 * @param {{ user: string|null, onLogout: () => void }} props
 */
function NavBar({ user, onLogout }) {
  return (
    <nav className="navbar" style={{ background: "var(--primary-color,#f9fafa)", color: "var(--accent-color,#121211)" }}>
      <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="logo" style={{ color: "#fc0388" }}>
          <span className="logo-symbol" style={{ color: "#fc0388" }}>
            🎬
          </span>
          KollywoodQuizHub
        </div>
        <div>
          {user ? (
            <>
              <span style={{ marginRight: 16, fontWeight: 500 }}>{user}</span>
              <button className="btn" style={{ background: "#fc0388", color: "#fff" }} onClick={onLogout}>
                Logout
              </button>
            </>
          ) : null}
        </div>
      </div>
    </nav>
  );
}

/**
 * PUBLIC_INTERFACE
 * Login/Register Form
 * @param {{ mode: "login"|"register", onAuth: (user:string)=>void, onSwitch: ()=>void }} props
 */
function AuthForm({ mode = "login", onAuth, onSwitch }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState(null);

  // Handle input change
  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  // Handle form submit
  function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    try {
      if (!form.username || !form.password) {
        throw new Error("Please fill all fields");
      }
      if (mode === "login") {
        auth.login(form.username, form.password);
      } else {
        auth.register(form.username, form.password);
      }
      onAuth(form.username);
    } catch (err) {
      setError(err.message);
    }
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
            <>
              New user?{" "}
              <button type="button" style={{ color: "#fc0388", background: "none", border: "none", cursor: "pointer", padding: 0 }} onClick={onSwitch}>
                Register
              </button>
            </>
          ) : (
            <>
              Have an account?{" "}
              <button type="button" style={{ color: "#fc0388", background: "none", border: "none", cursor: "pointer", padding: 0 }} onClick={onSwitch}>
                Login
              </button>
            </>
          )}
        </div>
        {error && <div style={{ color: "#ff2a44", fontSize: 14, marginTop: 8 }}>{error}</div>}
      </form>
    </div>
  );
}

/**
 * PUBLIC_INTERFACE
 * Quiz Game Interface
 * @param {{
 *   movies: Array,
 *   onDone: (results: {score: number, total: number, answers: object[]})=>void
 * }} props
 */
function QuizGame({ movies, onDone }) {
  // Prepare quiz questions from movie data: random pick N questions
  const [index, setIndex] = useState(0);
  const [shuffled, setShuffled] = useState([]);
  const [userAnswers, setUserAnswers] = useState([]); // {question, selected, isCorrect}
  const [showQuestion, setShowQuestion] = useState(true);

  // Prepare question objects on load
  useEffect(() => {
    // Shuffle and choose 10 movies for quiz
    if (movies && movies.length > 0) {
      let quizMovies = movies.slice();
      for (let i = quizMovies.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [quizMovies[i], quizMovies[j]] = [quizMovies[j], quizMovies[i]];
      }
      quizMovies = quizMovies.slice(0, 10);
      // Map to {movie, answerOptions}
      const questionObjs = quizMovies.map(m => {
        // Get 3 wrong options:
        let allTitles = movies
          .filter(mv => mv.id !== m.id)
          .map(mv => mv.title)
          .sort(() => Math.random() - 0.5)
          .slice(0, 3);
        // Add correct answer, shuffle:
        let options = [...allTitles, m.title].sort(() => Math.random() - 0.5);
        return { movie: m, options };
      });
      setShuffled(questionObjs);
      setIndex(0);
      setUserAnswers([]);
      setShowQuestion(true);
    }
  }, [movies]);

  // Handle answer selection
  function selectAnswer(opt) {
    if (!showQuestion) return;
    const currQ = shuffled[index];
    const isCorrect = opt === currQ.movie.title;
    setUserAnswers([
      ...userAnswers,
      {
        question: currQ.movie,
        selected: opt,
        isCorrect
      }
    ]);
    setShowQuestion(false);
    setTimeout(() => {
      if (index + 1 >= shuffled.length) {
        onDone({
          score: [...userAnswers, { isCorrect }].filter(a => a.isCorrect).length,
          total: shuffled.length,
          answers: [...userAnswers, { question: currQ.movie, selected: opt, isCorrect }]
        });
      } else {
        setIndex(index + 1);
        setShowQuestion(true);
      }
    }, 900);
  }

  // Prevent empty state
  if (!shuffled.length) {
    return <div style={{ textAlign: "center", color: "#fc0388", marginTop: 62 }}>Preparing your quiz...</div>;
  }

  const curr = shuffled[index];

  return (
    <div
      className="container"
      style={{
        maxWidth: 500,
        background: "rgba(255,255,255,0.95)",
        margin: "40px auto 16px",
        borderRadius: 12,
        padding: "28px 19px",
        boxShadow: "0 2px 16px 0 rgba(252,3,136,0.12)",
        color: "#121211"
      }}>
      <div style={{ marginBottom: 18, color: "#fc0388", fontWeight: 500 }}>
        Question {index + 1} / {shuffled.length}
      </div>
      <div style={{ minHeight: 60, marginBottom: 24, color: "#121211", fontSize: 22, fontWeight: 600, textAlign: "center" }}>
        {/* Movie Poster Guess, could make mode configurable */}
        Which is the <span style={{ color: "#fc0388" }}>correct title</span> for
        <br />
        <img
          src={`https://image.tmdb.org/t/p/w200/${curr.movie.poster_path}`}
          alt="movie poster"
          style={{ width: 120, borderRadius: 5, display: "block", margin: "13px auto" }}
        />
        <span style={{ fontSize: "17px", color: "#808080" }}>(Year: {curr.movie.release_date?.slice(0, 4) || "?"})</span>
      </div>
      <div style={{ margin: "0 0 24px 0", display: "flex", flexDirection: "column", gap: 13 }}>
        {curr.options.map(opt => {
          const lastAns = userAnswers[index];
          let bg =
            showQuestion
              ? "#f9fafa"
              : opt === curr.movie.title
                ? "#b0fbde"
                : lastAns && lastAns.selected === opt
                  ? "#ffd8e4"
                  : "#f9fafa";
          return (
            <button
              key={opt}
              disabled={!showQuestion}
              onClick={() => selectAnswer(opt)}
              style={{
                background: bg,
                border: "1.5px solid #fc03885c",
                borderRadius: 5,
                fontSize: 16,
                fontWeight: 500,
                padding: "10px 8px",
                transition: "background 0.2s",
                cursor: showQuestion ? "pointer" : "default",
                color: "#121211",
                outline: "none"
              }}>
              {opt}
            </button>
          );
        })}
      </div>
      {!showQuestion && (
        <div style={{ color: "#fc0388", fontWeight: 600, textAlign: "center", marginBottom: 5 }}>
          {userAnswers.length === shuffled.length - 1
            ? "Last question!"
            : shuffled[index].options.find(opt => opt === curr.movie.title)
              ? "Correct answer highlighted!"
              : ""}
        </div>
      )}
    </div>
  );
}

/**
 * PUBLIC_INTERFACE
 * Quiz Result Screen
 * @param {{
 *   result: {score: number, total: number, answers: object[]},
 *   onRestart: ()=>void
 * }} props
 */
function QuizResult({ result, onRestart }) {
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
            <img src={`https://image.tmdb.org/t/p/w92/${a.question.poster_path}`} alt="" style={{ width: 38, borderRadius: 4, marginRight: 8 }} />
            <div style={{ flex: 1, color: "#121211", textAlign: "left" }}>
              <span style={{ fontWeight: 600 }}>{a.question.title}</span>
              <span style={{ marginLeft: 5, color: "#fc0388" }}>
                ({a.question.release_date?.slice(0, 4) || "?"})
              </span>
              <span style={{ marginLeft: 13, color: a.isCorrect ? "#01ad4a" : "#e12956", fontWeight: 500 }}>
                {a.isCorrect ? "✅" : "❌"}
              </span>
              <div style={{ fontSize: 13, color: "#888" }}>
                Your answer: <b>{a.selected}</b>
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

/**
 * PUBLIC_INTERFACE
 * Root App Component
 */
function App() {
  // Basic theme CSS custom properties (override existing theme)
  useEffect(() => {
    // set theme variables dynamically (for color scheme per spec)
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
  const [user, setUser] = useState(auth.getSession()); // username or null
  const [authMode, setAuthMode] = useState("login"); // or "register"
  const [screen, setScreen] = useState("loading"); // "loading"|"quiz"|"results"
  const [movies, setMovies] = useState(null); // Array of movie objects
  const [apiError, setApiError] = useState(null);
  const [quizResult, setQuizResult] = useState(null);

  // -- Handlers --

  // On mount: check session, fetch movies
  useEffect(() => {
    if (user) {
      setScreen("quiz");
      // Fetch movie data for quiz
      setMovies(null);
      setApiError(null);
      fetchKollywoodMovies(1)
        .then((data) => {
          if (!data || !data.results || !data.results.length) throw new Error("No movie data found");
          setMovies(
            data.results.filter((m) => m.poster_path && m.title && m.release_date && Number(m.vote_count) > 4)
          );
          setScreen("quiz");
        })
        .catch((err) => {
          setApiError(err.message || "Could not load Kollywood movies");
          setMovies([]);
          setScreen("quiz");
        });
    } else {
      setScreen("auth");
    }
  }, [user]);

  // Login/Register complete handler
  const handleAuth = useCallback((username) => {
    setUser(username);
    setAuthMode("login");
    setQuizResult(null);
  }, []);

  // clear quiz state, refetch movies
  function restartQuiz() {
    setQuizResult(null);
    setMovies(null);
    setScreen("quiz");
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
        setQuizResult(null);
        setMovies(null);
      }} />
      {/* Main Content */}
      <main style={{ marginTop: 82, flex: 1 }}>
        {screen === "auth" && (
          <AuthForm
            mode={authMode}
            onAuth={handleAuth}
            onSwitch={() => setAuthMode((m) => (m === "login" ? "register" : "login"))}
          />
        )}

        {screen === "quiz" && user && (
          <>
            {!!apiError && (
              <div className="container" style={{
                color: "#e12956", background: "#ffe0ea",
                borderRadius: 6, padding: 12, margin: "18px auto 0", maxWidth: 500, fontWeight: 500
              }}>
                {apiError} <br />
                <button className="btn" onClick={restartQuiz} style={{ background: "#fc0388", color: "#fff", marginTop: 8 }}>
                  Retry
                </button>
              </div>
            )}

            {!apiError && !quizResult && movies && (
              <QuizGame movies={movies} onDone={(r) => {
                setQuizResult(r);
                setScreen("results");
              }} />
            )}
          </>
        )}

        {screen === "results" && quizResult && (
          <QuizResult result={quizResult} onRestart={restartQuiz} />
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

export default App;
