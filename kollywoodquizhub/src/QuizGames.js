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
// PUBLIC_INTERFACE
export function QuizGame({ movies, onDone }) {
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
export const MCQGame = QuizGame;

/* 3. TrueFalseGame
   Props: { movies, onDone({score, total, answers}) }
   Quiz: Is this a real Kollywood movie? Sometimes shows a "fake" invented title.
*/
// PUBLIC_INTERFACE
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
