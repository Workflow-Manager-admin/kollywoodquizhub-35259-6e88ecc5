import React, { useEffect, useState } from 'react';
import './App.css';

// TMDb constants
const TMDB_API_KEY = '5bc67d3b06aecbd18121a3cbbc16eb59';
const TMDB_SEARCH_URL = 'https://api.themoviedb.org/3/discover/movie';

// PUBLIC_INTERFACE
/**
 * Fetches Tamil (Kollywood) movies from TMDb.
 * @param {number} [page=1] - The page of results to fetch.
 * @returns {Promise<Object>} - The movie data from TMDb.
 */
async function fetchKollywoodMovies(page = 1) {
  // Official TMDb language code for Tamil: 'ta'
  const url = `${TMDB_SEARCH_URL}?api_key=${TMDB_API_KEY}&with_original_language=ta&page=${page}&sort_by=popularity.desc&region=IN`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch Kollywood movies from TMDb');
  }
  return response.json();
}

function App() {
  const [movies, setMovies] = useState([]);
  const [apiError, setApiError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch movies on mount
  useEffect(() => {
    setLoading(true);
    fetchKollywoodMovies()
      .then(data => {
        setMovies(data.results || []);
        setLoading(false);
      })
      .catch(error => {
        setApiError(error.message);
        setLoading(false);
      });
  }, []);

  return (
    <div className="app">
      <nav className="navbar">
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <div className="logo">
              <span className="logo-symbol">*</span> KAVIA AI
            </div>
            <button className="btn">Template Button</button>
          </div>
        </div>
      </nav>

      <main>
        <div className="container">
          <div className="hero">
            <div className="subtitle">AI Workflow Manager Template</div>
            
            <h1 className="title">kollywoodquizhub</h1>
            
            <div className="description">
              Start building your application.
            </div>
            
            <button className="btn btn-large">Button</button>

            {/* Movie data from TMDb: For quiz/game integration */}
            <div style={{ width: '100%', marginTop: 36 }}>
              <h2 style={{ color: 'var(--base-light)', marginBottom: 8 }}>Popular Kollywood Movies (TMDb API Live Demo)</h2>
              {loading && <div>Loading movies...</div>}
              {apiError && <div style={{ color: 'red' }}>Error: {apiError}</div>}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
                {movies.slice(0, 8).map(movie => (
                  <div
                    key={movie.id}
                    style={{
                      background: 'rgba(20,20,34,0.85)',
                      borderRadius: 8,
                      padding: 12,
                      width: 180,
                      boxShadow: '0 2px 10px 0 rgba(0,0,0,0.16)'
                    }}
                  >
                    {movie.poster_path &&
                      <img
                        src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`}
                        alt={movie.title}
                        style={{ borderRadius: 4, width: '100%', marginBottom: 8 }}
                      />}
                    <div style={{ fontWeight: 600, fontSize: 16 }}>{movie.title}</div>
                    {movie.release_date && (
                      <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                        {movie.release_date.slice(0, 4)}
                      </div>
                    )}
                    <div style={{ fontSize: 13, color: 'var(--base-light)', marginTop: 4 }}>
                      Rating: {movie.vote_average ? movie.vote_average.toFixed(1) : '--'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
