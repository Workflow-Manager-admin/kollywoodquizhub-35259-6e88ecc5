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
 * 3. TrueFalseGame             (True/False: ie: "Is this a real Kollywood movie?")
 * 4. PosterMatchGame           (Image-based: Match title to poster)
 */

/* 1. GameMenu: Lets user select among available game types 
   Props: { onSelect: (game) => void }
*/
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
        <button className="btn btn-large" style={{width: "85%",background: "#b7f8d8", color: "#121211"}} onClick={() => onSelect("truefalse")}>
          ✅ True/False
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
export function QuizGame({ movies, onDone }) {
  // Prepare quiz questions from movie data: random pick N questions
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
      // --- MAKE QUIZ EASIER: Mainstream Kollywood filter:
      // - popularity between 10 and 80 (more mainstream, but not blockbusters)
      // - at least 30 votes (avoid obscure)
      // - release year 2005-2021 (modern, but not new)
      // - Exclude most obvious blockbusters ("Baahubali", "Kabali", etc.)
      let quizMovies = movies.filter(m =>
        Number(m.popularity) >= 10 &&
        Number(m.popularity) <= 80 &&
        Number(m.vote_count) >= 30 &&
        m.release_date &&
        Number(m.release_date.slice(0, 4)) >= 2005 &&
        Number(m.release_date.slice(0, 4)) <= 2021 &&
        m.title &&
        !/baahubali|kabali|enthiran|2\.0|bigil|viswasam|sivaji/i.test(m.title)
      );
      // If not enough, loosen filter (just drop lower bound on popularity)
      if (quizMovies.length < 8) {
        quizMovies = movies.filter(m =>
          Number(m.popularity) >= 3 &&
          Number(m.vote_count) >= 12 &&
          m.release_date &&
          Number(m.release_date.slice(0, 4)) >= 2002 &&
          Number(m.release_date.slice(0, 4)) <= 2023 &&
          m.title);
      }
      // If still not enough, take all movies as fallback (edge case)
      if (quizMovies.length < 8) {
        quizMovies = movies.slice();
      }
      // Shuffle and pick 10
      for (let i = quizMovies.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [quizMovies[i], quizMovies[j]] = [quizMovies[j], quizMovies[i]];
      }
      quizMovies = quizMovies.slice(0, 10);

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
  }, [movies]);

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

// 3. TrueFalseGame (no change needed)
export function TrueFalseGame({ movies, onDone }) {
  const [index, setIndex] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState([]);
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    if (movies && movies.length > 0) {
      // Generate 10 questions. Half are real, half are fake.
      const shuffled = movies.slice().sort(() => Math.random() - 0.5);
      const realQ = shuffled.slice(0, 5).map(m => ({
        isReal: true,
        text: `Is "${m.title}" a real Kollywood movie?`,
        movie: m,
        fakeTitle: null
      }));
      const adjectives = ["Mystic", "Shadow", "Golden", "Fierce", "Dream", "Majestic", "Enchanting"];
      const nouns = ["Heritage", "Saga", "Voyage", "Mirage", "Whisper", "Revenge", "Tango"];
      const fakeQ = Array(5).fill(0).map((_, i) => {
        // Generate a title not found in movies
        let fake = adjectives[Math.floor(Math.random() * adjectives.length)] + " " + nouns[Math.floor(Math.random() * nouns.length)];
        while (movies.find(m => m.title && m.title.toLowerCase() === fake.toLowerCase())) {
          fake = adjectives[Math.floor(Math.random() * adjectives.length)] + " " + nouns[Math.floor(Math.random() * nouns.length)];
        }
        return {
          isReal: false,
          text: `Is "${fake}" a real Kollywood movie?`,
          movie: null,
          fakeTitle: fake
        };
      });
      const merged = [...realQ, ...fakeQ].sort(() => Math.random() - 0.5).slice(0, 10);
      setQuestions(merged);
      setIndex(0);
      setUserAnswers([]);
      setShowFeedback(false);
    }
  }, [movies]);

  function selectAnswer(ans) {
    const curr = questions[index];
    const correct = ans === (curr.isReal ? "yes" : "no");
    setUserAnswers([...userAnswers, {
      question: curr,
      selected: ans,
      isCorrect: correct
    }]);
    setShowFeedback(ans);
    setTimeout(() => {
      if (index + 1 >= questions.length) {
        onDone({
          score: [...userAnswers, { isCorrect: correct }].filter(a => a.isCorrect).length,
          total: questions.length,
          answers: [...userAnswers, { question: curr, selected: ans, isCorrect: correct }]
        });
      } else {
        setIndex(index + 1);
        setShowFeedback(false);
      }
    }, 700);
  }

  if (!questions.length) return <div style={{textAlign:"center",color:"#fc0388",marginTop:62}}>Preparing your game...</div>;

  const curr = questions[index];

  return (
    <div className="container"
      style={{
        maxWidth: 500,
        background: "#f7fff6",
        margin: "40px auto 16px",
        borderRadius: 12,
        padding: "28px 19px",
        boxShadow: "0 2px 16px 0 rgba(183,248,216,0.11)",
        color: "#121211"
      }}>
      <div style={{marginBottom:18, color:"#31c77e", fontWeight:500}}>
        True/False Question {index + 1} / {questions.length}
      </div>
      <div style={{
        minHeight: 44,
        marginBottom: 29,
        color: "#121211",
        fontSize: 21,
        fontWeight: 600,
        textAlign: "center"
      }}>
        {curr.text}
        {curr.isReal && curr.movie.poster_path && (
          <div style={{marginTop:13}}>
            <img src={`https://image.tmdb.org/t/p/w154/${curr.movie.poster_path}`} alt="" style={{width:70, borderRadius:4, boxShadow: "0 1px 6px 0 #ececec"}} />
            <span style={{fontSize:"15px",color:"#808080",marginLeft:6}}>{curr.movie.release_date?.slice(0,4) || ""}</span>
          </div>
        )}
      </div>
      <div style={{display:"flex",gap:30,justifyContent:"center",marginBottom:11}}>
        <button
          className="btn"
          style={{background:"#09e078",color:"#fff",fontWeight:600,minWidth:90}}
          disabled={!!showFeedback}
          onClick={() => selectAnswer("yes")}
        >Yes</button>
        <button
          className="btn"
          style={{background:"#e11c70",color:"#fff",fontWeight:600,minWidth:90}}
          disabled={!!showFeedback}
          onClick={() => selectAnswer("no")}
        >No</button>
      </div>
      {showFeedback && (
        <div style={{
          color: questions[index].isReal === (showFeedback==="yes") ? "#09e078" : "#e11c70",
          fontWeight: 600,
          textAlign: "center",
          marginTop: 3
        }}>
          {questions[index].isReal === (showFeedback==="yes")
            ? "🎉 Correct!" : "❌ Wrong!"}
        </div>
      )}
    </div>
  );
}

/* 4. PosterMatchGame (Reverse image MCQ: Shows MOVIE title, and 4 posters, pick the one that matches) 
   Props: { movies, onDone }
*/
// PUBLIC_INTERFACE
export function PosterMatchGame({ movies, onDone }) {
  const [index, setIndex] = useState(0);
  const [qdata, setQdata] = useState([]);
  const [userAnswers, setUserAnswers] = useState([]);
  const [showFeedback, setShowFeedback] = useState(null);

  useEffect(() => {
    if (movies && movies.length >= 4) {
      const shuffled = movies.slice().sort(() => Math.random() - 0.5).slice(0, 10);
      const questions = shuffled.map(m => {
        // 3 wrong posters + correct
        const bad = movies.filter(mv => mv.id !== m.id && mv.poster_path)
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
  }, [movies]);

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
