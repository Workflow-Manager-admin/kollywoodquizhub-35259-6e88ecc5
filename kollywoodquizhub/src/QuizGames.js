import React, { useEffect, useState } from "react";

/**
 * All modular KollywoodQuizHub quiz game components.
 * - Each is standalone and receives movies[] and onDone(result) props.
 * - Color scheme and responsive.
 * - Uses TMDb movie data (props.movies), expects poster_path, title, overview, release_date, etc.
 * 
 * All COMPONENTS in this file:
 * 1. GameMenu                  (game selector UI)
 * 2. MCQGame                   (Multiple Choice)
 * 3. MovieTimelineGame         (Order movies by release date - Timeline challenge)
 * 4. PosterMatchGame           (Image-based: Match title to poster)
 */

// 1. GameMenu: Lets user select among available game types 
// PUBLIC_INTERFACE
export function GameMenu({ onSelect }) {
  return (
    <div className="container" style={{
      margin: "48px auto 2px",
      maxWidth: 540,
      padding: "28px 19px",
      background: "#fff",
      borderRadius: 13,
      boxShadow: "0 2px 15px 0 rgba(252,3,136,0.09)",
      color: "#121211",
      textAlign: "center"
    }}>
      <h2 style={{color: "#fc0388", marginBottom: 12}}>Pick a Game Mode</h2>
      <div style={{fontSize: "16.5px", color: "#676075", marginBottom: 16}}>
        Challenge your Kollywood movie knowledge!
      </div>
      <div style={{display: "flex", flexDirection: "column", gap: 17, alignItems: "center", marginBottom: 16}}>
        <button className="btn btn-large" style={{width: "85%",background: "#fc0388", color: "#fff"}} onClick={() => onSelect("mcq")}>
          🎬 Multiple Choice
        </button>
        <button className="btn btn-large" style={{width: "85%",background: "#cbeffd", color: "#121211"}} onClick={() => onSelect("timeline")}>
          🕒 Movie Timeline Challenge
        </button>
        <button className="btn btn-large" style={{width: "85%",background: "#f5fdcf", color: "#121211"}} onClick={() => onSelect("postermatch")}>
          🖼️ Poster Match
        </button>
      </div>
      <div style={{color: "#b7afc9", fontSize: 15, marginTop: 7}}>All games use live TMDb data – tap one to begin!</div>
    </div>
  );
}

/* 2. MCQGame and QuizGame (standard multiple choice)
   Props: { movies, onDone }
   The same core "multiple choice" experience as in the App.js version.
*/
/**
 * PUBLIC_INTERFACE
 * QuizGame refactored for blurred poster guessing with clues and text input.
 * Props: { movies, onDone }
 */
/**
 * PUBLIC_INTERFACE
 * QuizGame refactored for blurred poster guessing with clues and text input.
 * Ensures only post-2010 Kollywood movies are presented with no repeat within the session.
 * @param {object} props
 * @param {Array} props.movies
 * @param {function} props.onDone
 * @param {Set} props.usedMovieIds
 */
export function QuizGame({ movies, onDone, usedMovieIds }) {
  // Prepare quiz questions from movie data: random pick N questions (no repeats)
  const [index, setIndex] = useState(0);
  const [shuffled, setShuffled] = useState([]);
  const [userAnswers, setUserAnswers] = useState([]); // {question, selected, isCorrect}
  const [showFeedback, setShowFeedback] = useState(null); // null | true | false
  const [input, setInput] = useState("");
  const [loadingCast, setLoadingCast] = useState(false);
  const [mainActors, setMainActors] = useState([]);
  const [feedbackText, setFeedbackText] = useState("");
  const [showQuestion, setShowQuestion] = useState(true);
  const [reveal, setReveal] = useState(false); // For Reveal Answer button

  // Prepare question objects on load (basic shuffle)
  useEffect(() => {
    if (movies && movies.length > 0) {
      // --- NEW: Only allow movies released after 2010 with no repeats for this session
      let quizMovies = movies.filter(
        m =>
          m.release_date &&
          Number(m.release_date.slice(0, 4)) > 2010 &&
          !(
            usedMovieIds &&
            (usedMovieIds.has(m.id) || usedMovieIds.has(m.id + ""))
          )
      );
      // Exclude most obvious blockbusters (for variety!)
      quizMovies = quizMovies.filter(
        m => m.title && !/baahubali|kabali|enthiran|2\.0|bigil|viswasam|sivaji/i.test(m.title)
      );
      // Shuffle
      for (let i = quizMovies.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [quizMovies[i], quizMovies[j]] = [quizMovies[j], quizMovies[i]];
      }
      // Pick up to 10 (or fewer, if not enough left)
      quizMovies = quizMovies.slice(0, Math.min(10, quizMovies.length));
      setShuffled(quizMovies);
      setIndex(0);
      setUserAnswers([]);
      setInput("");
      setShowFeedback(null);
      setMainActors([]);
      setShowQuestion(true);
      setFeedbackText("");
      setReveal(false);
    }
  }, [movies, usedMovieIds]);

  // Fetch the main actors (cast) for the current question
  useEffect(() => {
    async function fetchCast(movieId) {
      if (!movieId) return [];
      setLoadingCast(true);
      try {
        const TMDB_API_KEY = "5bc67d3b06aecbd18121a3cbbc16eb59";
        const url = `https://api.themoviedb.org/3/movie/${movieId}/credits?api_key=${TMDB_API_KEY}&language=en-US`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch cast");
        const data = await response.json();
        if (data.cast && data.cast.length > 0) {
          const sortedCast = [...data.cast].sort((a, b) => a.order - b.order);
          const topActors = sortedCast.slice(0, 3).map(c => c.name);
          setMainActors(topActors);
        } else {
          setMainActors([]);
        }
      } catch (e) {
        setMainActors([]);
      }
      setLoadingCast(false);
    }
    if (shuffled.length > 0 && shuffled[index]) {
      fetchCast(shuffled[index].id);
      setInput("");   // Clear input for new question
      setShowFeedback(null);
      setShowQuestion(true);
      setFeedbackText("");
      setReveal(false);
    }
  }, [shuffled, index]);

  // Validate user's answer (case-insensitive, trimmed)
  function handleSubmit(e) {
    e.preventDefault();
    if (!showQuestion) return;
    const currMovie = shuffled[index];
    const userVal = input.trim().toLowerCase();
    const actual = currMovie.title.trim().toLowerCase();
    const isCorrect =
      userVal === actual ||
      // allow minor spacing/punctuation mismatch (remove non-alphanum and compare):
      userVal.replace(/[^a-z0-9]/gi, "") === actual.replace(/[^a-z0-9]/gi, "");
    setUserAnswers([
      ...userAnswers,
      {
        question: currMovie,
        selected: input,
        isCorrect,
      }
    ]);
    setShowFeedback(isCorrect ? true : false);
    setFeedbackText(isCorrect ? "🎉 Correct!" : `❌ Not quite! The answer was: ${currMovie.title}`);
    setShowQuestion(false);

    setTimeout(() => {
      if (index + 1 >= shuffled.length) {
        onDone({
          score: [...userAnswers, { isCorrect }].filter(a => a.isCorrect).length,
          total: shuffled.length,
          answers: [
            ...userAnswers,
            { question: currMovie, selected: input, isCorrect }
          ]
        });
      } else {
        setIndex(index + 1);
        setShowFeedback(null);
        setShowQuestion(true);
        setInput("");
        setFeedbackText("");
        setReveal(false);
      }
    }, isCorrect ? 1100 : 2100);
  }

  // Handler for Reveal Answer button
  function handleReveal() {
    // When user reveals, show answer and auto move to next after a short delay
    if (!showQuestion || reveal) return;
    setReveal(true);
    // Store answer as incorrect but mark user as having seen
    const currMovie = shuffled[index];
    setUserAnswers([
      ...userAnswers,
      {
        question: currMovie,
        selected: "", // empty since user did not submit anything
        isCorrect: false,
        revealed: true
      }
    ]);
    setShowFeedback(false);
    setShowQuestion(false);
    setFeedbackText(`🎬 The answer was: ${currMovie.title}`);
    setTimeout(() => {
      if (index + 1 >= shuffled.length) {
        onDone({
          score: userAnswers.filter(a => a.isCorrect).length,
          total: shuffled.length,
          answers: [
            ...userAnswers,
            { question: currMovie, selected: "", isCorrect: false, revealed: true }
          ]
        });
      } else {
        setIndex(index + 1);
        setShowFeedback(null);
        setShowQuestion(true);
        setInput("");
        setFeedbackText("");
        setReveal(false);
      }
    }, 1700);
  }

  if (!shuffled.length) {
    return <div style={{ textAlign: "center", color: "#fc0388", marginTop: 62 }}>Preparing your quiz...</div>;
  }

  const curr = shuffled[index];

  // Clue 2: Accurate release year (show always slice 0,4 if possible)
  let releaseYear = "?";
  if (curr && curr.release_date && /^\d{4}/.test(curr.release_date)) {
    releaseYear = curr.release_date.slice(0, 4);
  }

  return (
    <div
      className="container"
      style={{
        maxWidth: 500,
        background: "rgba(255,255,255,0.97)",
        margin: "40px auto 16px",
        borderRadius: 12,
        padding: "28px 19px",
        boxShadow: "0 2px 16px 0 rgba(252,3,136,0.10)",
        color: "#121211"
      }}
    >
      <div style={{ marginBottom: 18, color: "#fc0388", fontWeight: 500 }}>
        Question {index + 1} / {shuffled.length}
      </div>
      <div style={{ minHeight: 60, marginBottom: 22, textAlign: "center" }}>
        <div style={{ marginBottom: 9, fontSize: 21, fontWeight: 600 }}>
          Guess the <span style={{ color: "#fc0388" }}>movie title</span>!
        </div>
        <div style={{ width: "100%", display: "flex", justifyContent: "center", marginBottom: 10 }}>
          <img
            src={`https://image.tmdb.org/t/p/w300/${curr.poster_path}`}
            alt="movie poster"
            style={{
              width: 140,
              height: 207,
              borderRadius: 8,
              display: "block",
              filter: "blur(8px) brightness(0.96)",
              objectFit: "cover",
              boxShadow: "0 1px 8px 0 #fce6ef"
            }}
          />
        </div>
        <div style={{ margin: "8px 0 2px", fontSize: 17 }}>
          <b>Clue 1:</b>{" "}
          {loadingCast
            ? <span style={{ color: "#b7afc9" }}>Loading actors…</span>
            : (mainActors.length > 0
              ? <span style={{ color: "#706c7f" }}>{mainActors.join(", ")}</span>
              : <span style={{ color: "#b7afc9" }}>N/A</span>
            )}
        </div>
        <div style={{ fontSize: 17 }}>
          <b>Clue 2:</b>{" "}
          <span style={{ color: "#858" }}>{releaseYear}</span>
        </div>
      </div>
      <form
        onSubmit={handleSubmit}
        style={{
          margin: "0 0 8px 0",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          alignItems: "center"
        }}
        autoComplete="off"
      >
        <input
          type="text"
          placeholder="Type the movie name"
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={!showQuestion}
          autoFocus={true}
          style={{
            padding: "11px 12px",
            fontSize: 17,
            borderRadius: 6,
            border: "1.5px solid #fc038899",
            width: "98%",
            marginBottom: 8,
            outline: "none",
            background: showQuestion ? "#fff" : "#f9fafa",
            color: "#121211",
            letterSpacing: "0.02em",
            boxShadow: showFeedback === true
              ? "0 1px 7px 0 #b0fbde"
              : showFeedback === false
                ? "0 1px 7px 0 #ffd8e4"
                : undefined,
            transition: "border 0.19s"
          }}
        />
        <button
          className="btn"
          type="submit"
          style={{
            background: "#fc0388",
            color: "#fff",
            fontWeight: 570,
            padding: "9px 24px"
          }}
          disabled={!showQuestion || !input.trim()}
        >
          Guess
        </button>
        {/* Reveal Answer Button */}
        <button
          type="button"
          className="btn"
          style={{
            marginTop: 3,
            background: showQuestion ? "#dbdde6" : "#e5e7ee",
            color: "#fc0388",
            fontWeight: 540,
            border: "1.5px solid #fc038899",
            opacity: 1,
            transition: ".2s border"
          }}
          onClick={handleReveal}
          disabled={!showQuestion || reveal}
        >
          Reveal Answer
        </button>
        {reveal && showQuestion && (
          <div style={{
            marginTop: 7,
            fontWeight: 600,
            fontSize: 16,
            color: "#e12956",
            letterSpacing: "0.01em"
          }}>
            🎬 <span style={{ color: "#fc0388" }}>Answer:</span> {curr.title}
          </div>
        )}
      </form>
      {showFeedback !== null && (
        <div style={{
          color: showFeedback === true ? "#08ad66" : "#e12956",
          fontWeight: 600,
          textAlign: "center",
          fontSize: 17,
          margin: "8px 0 3px"
        }}>
          {feedbackText}
        </div>
      )}
    </div>
  );
}
export const MCQGame = QuizGame;
export const TimelineGame = MovieTimelineGame;

/**
 * PUBLIC_INTERFACE
 * MovieTimelineGame - Multi-round: Arrange sets of movies by release date for several rounds per session.
 * After each submission, feedback is shown and the next round is set up, with no movies repeated across rounds.
 * On session end, shows a summary and calls onDone.
 * @param {object} props
 * @param {Array} props.movies
 * @param {function} props.onDone
 * @param {Set} props.usedMovieIds
 */
export function MovieTimelineGame({ movies, onDone, usedMovieIds }) {
  // --- CONFIGURATION ---
  const MOVIE_COUNT = 4;      // Movies per round
  const ROUNDS_PER_SESSION = 5;

  // --- STATE ---
  // sessionRounds: Array of rounds, each is array of MOVIE_COUNT movies (no repeats in session)
  const [sessionRounds, setSessionRounds] = useState([]);
  // currentRound: 0-based index of current round
  const [currentRound, setCurrentRound] = useState(0);
  // order: indices into round's movie array - user's current ordering
  const [order, setOrder] = useState([]);
  // submitted: whether user submitted for this round
  const [submitted, setSubmitted] = useState(false);
  // isCorrect: array, true/false, for each position in user submission
  const [isCorrect, setIsCorrect] = useState([]);
  // revealOrder: indices into movieSet (original round), but sorted chronological
  const [revealOrder, setRevealOrder] = useState([]);
  // feedback: per-movie feedback array for round
  const [feedback, setFeedback] = useState([]);
  // For session summary: answers array, one per round, accumulating after each submit
  const [sessionAnswers, setSessionAnswers] = useState([]);
  // To prevent redundant prep/rehydration
  const [initialized, setInitialized] = useState(false);

  // Initial session set-up: pick all rounds (with no repeat movies during session)
  useEffect(() => {
    if (!movies || !Array.isArray(movies) || initialized) return;
    // Filter for eligible movies (post-2010, has poster and title, not used in session)
    let avail = movies.filter(
      m =>
        m.release_date &&
        Number(m.release_date.slice(0, 4)) > 2010 &&
        m.poster_path &&
        m.title &&
        !(usedMovieIds && (usedMovieIds.has(m.id) || usedMovieIds.has(String(m.id))))
    );
    // Compute max possible rounds
    const maxRounds = Math.min(ROUNDS_PER_SESSION, Math.floor(avail.length / MOVIE_COUNT));
    if (maxRounds < 1) {
      setSessionRounds([]);
      setInitialized(true);
      return;
    }
    // Shuffle pool for fairness
    const shuffle = arr => {
      let copy = [...arr];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    };
    avail = shuffle(avail);
    // Partition into rounds: no repeat movies in session
    const rounds = [];
    let pool = [...avail];
    for (let r = 0; r < maxRounds; r++) {
      if (pool.length < MOVIE_COUNT) break;
      rounds.push(pool.slice(0, MOVIE_COUNT));
      pool = pool.slice(MOVIE_COUNT);
    }
    setSessionRounds(rounds);
    setCurrentRound(0);
    setSessionAnswers([]);
    setInitialized(true);
    // Set up order for round 0
    if (rounds[0]) {
      const indices = rounds[0].map((_, i) => i);
      setOrder(shuffle(indices));
      setSubmitted(false);
      setIsCorrect([]);
      setRevealOrder([]);
      setFeedback([]);
    }
  }, [movies, usedMovieIds, initialized]);

  // Whenever the round number OR sessionRounds changes (new round): shuffle order array
  useEffect(() => {
    if (!sessionRounds.length || !sessionRounds[currentRound]) return;
    const indices = sessionRounds[currentRound].map((_, i) => i);
    // Shuffle for randomized initial order
    let arr = [...indices];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    setOrder(arr);
    setSubmitted(false);
    setIsCorrect([]);
    setRevealOrder([]);
    setFeedback([]);
    // eslint-disable-next-line
  }, [currentRound, sessionRounds]);

  // --- MOVEMENT HELPERS ---
  function moveCard(from, to) {
    const newOrder = [...order];
    const [removed] = newOrder.splice(from, 1);
    newOrder.splice(to, 0, removed);
    setOrder(newOrder);
  }
  function moveUp(idx) {
    if (idx === 0) return;
    moveCard(idx, idx - 1);
  }
  function moveDown(idx) {
    if (idx === order.length - 1) return;
    moveCard(idx, idx + 1);
  }

  // --- HANDLE SUBMIT ---
  function handleSubmit() {
    const movieSet = sessionRounds[currentRound];
    // User's arrangement
    const arranged = order.map(i => movieSet[i]);
    // Correct order
    const sorted = [...movieSet].sort((a, b) => new Date(a.release_date) - new Date(b.release_date));
    const correctIds = sorted.map(m => m.id);
    const guessIds = arranged.map(m => m.id);
    const feedbackArr = arranged.map((m, idx) => m.id === correctIds[idx]);
    setIsCorrect(feedbackArr);
    setRevealOrder(sorted.map(m => movieSet.findIndex(x => x.id === m.id)));
    setFeedback(feedbackArr.map(right => right ? "✅ Correct" : "❌ Wrong place"));
    setSubmitted(true);

    // Compute detail object for session summary
    const answerObj = {
      round: currentRound + 1,
      questionSet: movieSet,
      userOrder: [...order],
      arranged,
      trueOrder: sorted,
      isCorrectArr: feedbackArr,
      correctCount: feedbackArr.filter(Boolean).length,
      total: movieSet.length,
    };

    // Delay feedback, then auto-advance or session end
    setTimeout(() => {
      setSessionAnswers(prev => [...prev, answerObj]);
      if (currentRound + 1 >= sessionRounds.length) {
        // End of session: summarize & return
        setTimeout(() => {
          const details = [...sessionAnswers, answerObj];
          const totalCorrect = details.reduce((s, d) => s + d.correctCount, 0);
          const total = details.reduce((s, d) => s + d.total, 0);
          onDone &&
            onDone({
              score: totalCorrect,
              total,
              answers: details,
              isTimelineSession: true
            });
        }, 2100); // short pause for summary
      } else {
        // Move to next round after short feedback delay
        setTimeout(() => {
          setCurrentRound(r => r + 1);
        }, 1300);
      }
    }, 400); // show feedback briefly before moving on
  }

  // --- DEFENSIVE: loading/empty state ---
  if (!initialized) {
    return (
      <div style={{ textAlign: "center", color: "#fc0388", marginTop: 62 }}>
        Preparing your Movie Timeline Challenge session...
      </div>
    );
  }
  if (!sessionRounds.length || !sessionRounds[0]) {
    return (
      <div style={{ textAlign: "center", color: "#fc0388", marginTop: 62 }}>
        Not enough movies for Timeline Challenge!
      </div>
    );
  }

  const movieSet = sessionRounds[currentRound];
  if (!movieSet) return null;

  // --- RENDER ---
  return (
    <div
      className="container"
      style={{
        maxWidth: 540,
        background: "#eafdff",
        margin: "38px auto 16px",
        borderRadius: 12,
        padding: "31px 16px",
        boxShadow: "0 2px 16px 0 rgba(76, 182, 255, 0.12)",
        color: "#121211",
        textAlign: "center"
      }}
    >
      <div style={{
        color: "#2196f3", fontSize: 21, fontWeight: 700, marginBottom: 10
      }}>
        Timeline Challenge{" "}
        <span style={{
          fontWeight: 500,
          color: "#56565a",
          fontSize: "0.76em"
        }}>Round {currentRound + 1} / {sessionRounds.length}</span>
      </div>
      <div style={{ fontSize: 15, color: "#5a7a92", marginBottom: 17 }}>
        Arrange the movies from earliest (top) to latest (bottom), <br />
        then submit! No repeat movies in this session.
      </div>
      <div>
        {order.map((idx, i) => {
          const m = movieSet[idx];
          let borderC = submitted
            ? (isCorrect[i] ? "#32d183" : "#f9586c")
            : "#959fb1";
          let borderW = submitted ? 2.6 : 2.0;
          return (
            <div
              key={m.id}
              style={{
                display: "flex",
                alignItems: "center",
                background: "#fff",
                boxShadow: "0 1px 10px 0 #b1e9ff0f",
                border: `${borderW}px solid ${borderC}`,
                borderRadius: 9,
                margin: "9px 0",
                padding: "6px 8px",
                position: "relative",
                maxWidth: 435,
                marginLeft: "auto",
                marginRight: "auto",
                userSelect: "none"
              }}
              draggable={!submitted}
              onDragStart={e => {
                if (submitted) return;
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/plain", i);
              }}
              onDragOver={e => {
                if (submitted) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
              }}
              onDrop={e => {
                if (submitted) return;
                const from = parseInt(e.dataTransfer.getData("text/plain"));
                moveCard(from, i);
              }}
            >
              <img
                src={`https://image.tmdb.org/t/p/w92/${m.poster_path}`}
                alt={m.title}
                style={{
                  width: 54,
                  height: 80,
                  objectFit: "cover",
                  borderRadius: 7,
                  marginRight: 14,
                  background: "#eee"
                }}
              />
              <div style={{ flex: 1, textAlign: "left" }}>
                <div style={{ fontWeight: 600, fontSize: 17 }}>
                  {m.title}
                </div>
              </div>
              {!submitted && (
                <div style={{ display: "flex", flexDirection: "column", marginLeft: 9 }}>
                  <button onClick={() => moveUp(i)} style={{ background: "none", border: "none", color: "#fc0388", fontSize: "1.6em", cursor: i === 0 ? "not-allowed" : "pointer" }} disabled={i === 0}>↑</button>
                  <button onClick={() => moveDown(i)} style={{ background: "none", border: "none", color: "#fc0388", fontSize: "1.6em", cursor: i === order.length - 1 ? "not-allowed" : "pointer" }} disabled={i === order.length - 1}>↓</button>
                </div>
              )}
              {submitted && (
                <span style={{
                  fontWeight: 700,
                  color: isCorrect[i] ? "#2bb97d" : "#f6455b",
                  fontSize: 25,
                  marginLeft: 12
                }}>{isCorrect[i] ? "✔" : "✕"}</span>
              )}
            </div>
          );
        })}
      </div>
      {submitted && revealOrder.length === order.length && (
        <div style={{ marginTop: 18, background: "#fff7df", borderRadius: 8, padding: 14, boxShadow: "0 2px 10px 0 #c7b87c1a" }}>
          <b style={{ color: "#fc9003" }}>Correct Order:</b>
          <ol style={{ margin: "9px auto 5px", paddingLeft: 19, color: "#644" }}>
            {revealOrder.map(idx => {
              const m = movieSet[idx];
              return (
                <li key={m.id} style={{ fontWeight: 600, margin: "4px 0" }}>
                  {m.title}
                </li>
              );
            })}
          </ol>
        </div>
      )}
      <button
        className="btn btn-large"
        style={{
          background: "#2196f3",
          color: "#fff",
          fontWeight: 600,
          padding: "10px 25px",
          margin: "15px 0 0 0",
          fontSize: 18,
          opacity: submitted ? 0.54 : 1
        }}
        disabled={submitted}
        onClick={handleSubmit}
      >
        Submit
      </button>
      {submitted && (
        <div style={{ marginTop: 14, color: "#56565a", fontSize: 15, fontWeight: 500 }}>
          {isCorrect.every(x => x)
            ? "🎉 All correct for this round!"
            : "Some positions were incorrect. Study the correct order above."}
        </div>
      )}
      {submitted && currentRound + 1 < sessionRounds.length && (
        <div style={{ color: "#2196f3", fontSize: 15, marginTop: 7 }}>
          Next round starting...
        </div>
      )}
      {submitted && currentRound + 1 >= sessionRounds.length && (
        <div style={{ color: "#fc0388", fontWeight: 600, fontSize: 15, marginTop: 8 }}>
          Timeline Challenge Summary coming up!
        </div>
      )}
    </div>
  );
}

/* 4. PosterMatchGame (Reverse image MCQ: Shows MOVIE title, and 4 posters, pick the one that matches) 
   Props: { movies, onDone }
*/
// PUBLIC_INTERFACE
/**
 * PUBLIC_INTERFACE
 * PosterMatchGame (Reverse image MCQ, no repeats; uses movies post-2010 only)
 */
export function PosterMatchGame({ movies, onDone, usedMovieIds }) {
  const [index, setIndex] = useState(0);
  const [qdata, setQdata] = useState([]);
  const [userAnswers, setUserAnswers] = useState([]);
  const [showFeedback, setShowFeedback] = useState(null);

  useEffect(() => {
    if (movies && movies.length >= 4) {
      // Only movies post-2010 and unused in this session.
      const availMovies = movies.filter(
        m =>
          m.release_date &&
          Number(m.release_date.slice(0, 4)) > 2010 &&
          !(
            usedMovieIds &&
            (usedMovieIds.has(m.id) || usedMovieIds.has(m.id + ""))
          )
      );
      const shuffled = availMovies.slice().sort(() => Math.random() - 0.5).slice(0, Math.min(10, availMovies.length));
      const questions = shuffled.map(m => {
        // 3 wrong posters + correct (ensure not reused)
        const bad = availMovies.filter(mv => mv.id !== m.id && mv.poster_path)
          .sort(() => Math.random() - 0.5)
          .slice(0, 3);
        let posterOptions = [...bad, m].sort(() => Math.random() - 0.5);
        return {
          correct: m,
          options: posterOptions
        };
      });
      setQdata(questions);
      setIndex(0);
      setUserAnswers([]);
      setShowFeedback(null);
    }
  }, [movies, usedMovieIds]);

  function selectPoster(opt) {
    const curr = qdata[index];
    const isCorrect = opt.id === curr.correct.id;
    setUserAnswers([...userAnswers, {
      question: curr,
      selected: opt,
      isCorrect
    }]);
    setShowFeedback(opt.id);
    setTimeout(() => {
      if (index + 1 >= qdata.length) {
        onDone({
          score: [...userAnswers, { isCorrect }].filter(a => a.isCorrect).length,
          total: qdata.length,
          answers: [...userAnswers, {
            question: curr,
            selected: opt,
            isCorrect
          }]
        });
      } else {
        setIndex(index + 1);
        setShowFeedback(null);
      }
    }, 930);
  }

  if (!qdata.length) return <div style={{ textAlign: "center", color: "#fc0388", marginTop: 62 }}>Loading your poster game...</div>;
  const curr = qdata[index];

  return (
    <div className="container"
      style={{
        maxWidth: 500,
        background: "#fffbe6",
        margin: "40px auto 16px",
        borderRadius: 12,
        padding: "28px 19px",
        boxShadow: "0 2px 16px 0 rgba(245,253,207,0.13)",
        color: "#121211"
      }}>
      <div style={{ marginBottom: 13, color: "#efe153", fontWeight: 500 }}>
        Poster Match {index + 1} / {qdata.length}
      </div>
      <div style={{
        marginBottom: 23,
        color: "#121211",
        fontSize: 21,
        fontWeight: 600,
        textAlign: "center"
      }}>
        Which is the poster for: 
        <br />
        <span style={{ color: "#e1c802", fontWeight: 700, fontSize: "1.1em" }}>{curr.correct.title}</span>
        <div style={{fontSize: "15px", color:"#737161", marginTop:4}}>
          (Year: {curr.correct.release_date?.slice(0,4) || "?"})
        </div>
      </div>
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 14,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 15
      }}>
        {curr.options.map(opt => {
          let border =
            !showFeedback ? "2px solid #e6e6e6"
              : opt.id === curr.correct.id ? "2.8px solid #29c878"
              : opt.id === (showFeedback) ? "2.8px solid #e12956"
              : "2px solid #cbc6c6";
          let opacity = (!showFeedback || opt.id === curr.correct.id || opt.id === showFeedback) ? 1.0 : 0.45;
          return (
            <button key={opt.id}
              disabled={!!showFeedback}
              onClick={() => selectPoster(opt)}
              style={{
                border,
                borderRadius: 6,
                padding: 0,
                background: "#fff",
                boxShadow: "0 2px 10px 0 #f9f9ef",
                cursor: !showFeedback ? "pointer" : "default",
                opacity,
              }}>
              <img src={`https://image.tmdb.org/t/p/w185/${opt.poster_path}`}
                alt={opt.title}
                style={{ width: 84, height: 128, objectFit: "cover", display: "block", borderRadius: 6 }} />
            </button>
          );
        })}
      </div>
      {showFeedback && (
        <div style={{
          color: (showFeedback === curr.correct.id) ? "#08ad66" : "#e12956",
          fontWeight: 600,
          textAlign: "center",
          marginTop: 5
        }}>
          {showFeedback === curr.correct.id ? "✅ Correct!" : "❌ Wrong!"}
        </div>
      )}
    </div>
  );
}

/*
  If any occurrence of PUBLIC_URL is used anywhere as a bare variable, replace with process.env.PUBLIC_URL.
  (Note: No such usage found in this file body, but reference check for maintainers.)
*/
// =========== END QuizGames.js ===========
