import { useState, useEffect } from 'react'
import './App.css'
import { searchWithAI } from './services/openaiService'
import WikipediaPage from './components/WikipediaPage'

function App() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [processedResults, setProcessedResults] = useState(null)
  const [selectedResult, setSelectedResult] = useState(null)
  
  // Process results to split long content into multiple search results
  useEffect(() => {
    if (!results) return;
    
    // Function to process search results
    const processResults = (originalResults) => {
      if (!originalResults || !originalResults.results) return originalResults;
      
      const maxSnippetLength = 200; // Maximum length for a realistic snippet
      let newResults = [];
      
      originalResults.results.forEach(result => {
        // Don't try to split if the snippet is already short enough
        if (result.snippet.length <= maxSnippetLength) {
          newResults.push(result);
          return;
        }
        
        // Split the content into chunks that make sense
        let contentParts = [];
        
        // First try to split by sentences
        const sentences = result.snippet.match(/[^.!?]+[.!?]+/g) || [];
        
        if (sentences.length > 0) {
          let currentPart = '';
          
          sentences.forEach(sentence => {
            // If a single sentence is longer than max length, we'll need to split it
            if (sentence.length > maxSnippetLength) {
              // If we have accumulated content, add it first
              if (currentPart) {
                contentParts.push(currentPart);
                currentPart = '';
              }
              
              // Split the long sentence into chunks
              let i = 0;
              while (i < sentence.length) {
                // Try to split at word boundaries when possible
                let end = Math.min(i + maxSnippetLength, sentence.length);
                
                // If we're not at the end yet, try to find a space to break at
                if (end < sentence.length) {
                  const lastSpace = sentence.lastIndexOf(' ', end);
                  if (lastSpace > i && lastSpace > end - 30) { // Don't go back too far
                    end = lastSpace;
                  }
                }
                
                contentParts.push(sentence.substring(i, end).trim());
                i = end;
              }
            } else if ((currentPart + sentence).length <= maxSnippetLength) {
              // This sentence fits in the current part
              currentPart += sentence;
            } else {
              // This sentence would make the current part too long
              contentParts.push(currentPart.trim());
              currentPart = sentence;
            }
          });
          
          // Add any remaining content
          if (currentPart) {
            contentParts.push(currentPart.trim());
          }
        } else {
          // If we couldn't split by sentences, split by character count
          for (let i = 0; i < result.snippet.length; i += maxSnippetLength) {
            const chunk = result.snippet.substring(i, i + maxSnippetLength);
            contentParts.push(chunk);
          }
        }
        
        // Create a search result for each content part
        contentParts.forEach((content, index) => {
          // Generate a title for each part
          let newTitle;
          if (index === 0) {
            newTitle = result.title;
          } else {
            newTitle = `${result.title} (Part ${index + 1})`;
          }
          
          // Generate a URL that looks like it's from the same website
          const urlParsed = new URL(result.url);
          const domain = urlParsed.hostname;
          const path = urlParsed.pathname === '/' ? '' : urlParsed.pathname;
          
          // Create a path that looks like a different page on the same site
          let newPath;
          if (index === 0) {
            newPath = path;
          } else {
            const pathWithoutTrailingSlash = path.endsWith('/') ? path.slice(0, -1) : path;
            const basePath = pathWithoutTrailingSlash || '/page';
            newPath = `${basePath}/part-${index + 1}`;
          }
          
          const newUrl = `https://${domain}${newPath}`;
          
          newResults.push({
            title: newTitle,
            url: newUrl,
            snippet: content,
            partIndex: index,
            isPartOfSeries: contentParts.length > 1,
            totalParts: contentParts.length,
            // Store the full original content for the Wikipedia view
            fullContent: result.fullContent || originalResults.originalResponse || result.snippet
          });
        });
      });
      
      return {
        ...originalResults,
        results: newResults
      };
    };
    
    setProcessedResults(processResults(results));
  }, [results]);
  
  const handleSearch = async (e) => {
    e.preventDefault()
    if (!query.trim()) return
    
    setLoading(true)
    setError(null)
    
    try {
      // Use the real OpenAI API to get search results
      const searchResults = await searchWithAI(query);
      setResults(searchResults);
      setLoading(false);
      
      // Mock response code is commented out but kept for reference
      /*
      setTimeout(() => {
        const mockResponse = {
          title: `Results for "${query}"`,
          searchTime: 0.42,
          totalResults: "About 42,000,000 results",
          results: [
            {
              title: "Understanding " + query + " - Comprehensive Guide",
              url: "https://example.com/guide",
              snippet: `${query} is a fascinating topic that spans multiple disciplines. This comprehensive guide explores the key concepts and applications related to ${query}.`
            },
            {
              title: query + " - Wikipedia",
              url: "https://en.wikipedia.org/wiki/" + query.replace(/\s+/g, '_'),
              snippet: `${query} refers to a concept that has evolved significantly over time. It encompasses various aspects including historical context, modern applications, and future directions.`
            },
            {
              title: "Latest Research on " + query,
              url: "https://research.org/" + query.toLowerCase().replace(/\s+/g, '-'),
              snippet: `Recent studies have shown remarkable advances in understanding ${query}. Researchers have identified several key factors that contribute to the overall framework of ${query}.`
            }
          ]
        }
        setResults(mockResponse)
        setLoading(false)
      }, 1000)
      */
      
    } catch (error) {
      console.error('Error searching:', error)
      
      // Provide more specific error messages
      if (error.message?.includes('api_key') || error.message?.includes('API key')) {
        setError('OpenAI API key is missing or invalid. Please check your .env file and add a valid API key.');
      } else if (error.message?.includes('network') || error.message?.includes('connect')) {
        setError('Network error. Please check your internet connection and try again.');
      } else {
        setError(`An error occurred while fetching results: ${error.message || 'Unknown error'}. Please try again.`);
      }
      
      setLoading(false)
    }
  }

  const handleResultClick = (result) => {
    setSelectedResult(result);
  };

  const handleCloseWikipedia = () => {
    setSelectedResult(null);
  };

  return (
    <div className="app-container">
      {selectedResult ? (
        <WikipediaPage content={selectedResult} onClose={handleCloseWikipedia} />
      ) : (
        !results ? (
          // Google Home Page
          <>
            <header className="home-header">
              <nav className="top-nav">
                <div className="left-nav">
                  <a href="#" className="nav-link">About</a>
                  <a href="#" className="nav-link">Store</a>
                </div>
                <div className="right-nav">
                  <a href="#" className="nav-link">Gmail</a>
                  <a href="#" className="nav-link">Images</a>
                  <button className="apps-button">
                    <svg className="apps-icon" focusable="false" viewBox="0 0 24 24">
                      <path d="M6,8c1.1,0 2,-0.9 2,-2s-0.9,-2 -2,-2 -2,0.9 -2,2 0.9,2 2,2zM12,20c1.1,0 2,-0.9 2,-2s-0.9,-2 -2,-2 -2,0.9 -2,2 0.9,2 2,2zM6,20c1.1,0 2,-0.9 2,-2s-0.9,-2 -2,-2 -2,0.9 -2,2 0.9,2 2,2zM6,14c1.1,0 2,-0.9 2,-2s-0.9,-2 -2,-2 -2,0.9 -2,2 0.9,2 2,2zM12,14c1.1,0 2,-0.9 2,-2s-0.9,-2 -2,-2 -2,0.9 -2,2 0.9,2 2,2zM16,6c0,1.1 0.9,2 2,2s2,-0.9 2,-2 -0.9,-2 -2,-2 -2,0.9 -2,2zM12,8c1.1,0 2,-0.9 2,-2s-0.9,-2 -2,-2 -2,0.9 -2,2 0.9,2 2,2zM18,14c1.1,0 2,-0.9 2,-2s-0.9,-2 -2,-2 -2,0.9 -2,2 0.9,2 2,2zM18,20c1.1,0 2,-0.9 2,-2s-0.9,-2 -2,-2 -2,0.9 -2,2 0.9,2 2,2z"></path>
                    </svg>
                  </button>
                  <button className="signin-button">Sign in</button>
                </div>
              </nav>
              
              <div className="logo-container">
                <img 
                  src="https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png" 
                  alt="Google" 
                  className="google-logo" 
                />
              </div>
              
              <div className="search-container">
                <form className="search-form" onSubmit={handleSearch}>
                  <div className="search-input-wrapper">
                    <div className="search-icon">
                      <svg focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"></path>
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="search-input"
                      title="Search"
                    />
                    {query && (
                      <div className="clear-icon" onClick={() => setQuery('')}>
                        <svg focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path>
                        </svg>
                      </div>
                    )}
                    <div className="voice-search">
                      <svg className="voice-icon" focusable="false" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path fill="#4285f4" d="m12 15c1.66 0 3-1.31 3-2.97v-7.02c0-1.66-1.34-3.01-3-3.01s-3 1.34-3 3.01v7.02c0 1.66 1.34 2.97 3 2.97z"></path>
                        <path fill="#34a853" d="m11 18.08h2v3.92h-2z"></path>
                        <path fill="#fbbc05" d="m7.05 16.87c-1.27-1.33-2.05-2.83-2.05-4.87h2c0 1.45 0.56 2.42 1.47 3.38v0.32l-1.15 1.18z"></path>
                        <path fill="#ea4335" d="m12 16.93a4.97 5.25 0 0 1 -3.54 -1.55l-1.41 1.49c1.26 1.34 3.02 2.13 4.95 2.13 3.87 0 6.99-2.92 6.99-7h-1.99c0 2.92-2.24 4.93-5 4.93z"></path>
                      </svg>
                    </div>
                    <div className="camera-search">
                      <svg className="camera-icon" focusable="false" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg">
                        <rect fill="none" height="192" width="192"></rect>
                        <g>
                          <circle fill="#4285f4" cx="96" cy="104.15" r="28"></circle>
                          <path fill="#ea4335" d="M160,72v40.15V136c0,1.69-0.34,3.29-0.82,4.82v0v0c-1.57,4.92-5.43,8.78-10.35,10.35h0v0 c-1.53,0.49-3.13,0.82-4.82,0.82H66l16,16h50h12c4.42,0,8.63-0.9,12.46-2.51c3.83-1.62,7.28-3.96,10.17-6.86 c1.45-1.45,2.76-3.03,3.91-4.74c2.3-3.4,3.96-7.28,4.81-11.44c0.43-2.08,0.65-4.24,0.65-6.45v-12V96.15V84l-6-19l-10.82,2.18 C159.66,68.71,160,70.31,160,72z"></path>
                          <path fill="#4285f4" d="M32,72c0-1.69,0.34-3.29,0.82-4.82c1.57-4.92,5.43-8.78,10.35-10.35C44.71,56.34,46.31,56,48,56 h96c1.69,0,3.29,0.34,4.82,0.82c0,0,0,0,0,0L149,45l-17-5l-16-16h-13.44H96h-6.56H76L60,40H48c-17.67,0-32,14.33-32,32v12v20 l16,16V72z"></path>
                          <path fill="#34a853" d="M144,40h-12l16.83,16.83c1.23,0.39,2.39,0.93,3.47,1.59c2.16,1.32,3.97,3.13,5.29,5.29 c0.66,1.08,1.2,2.24,1.59,3.47v0L176,84V72C176,54.33,161.67,40,144,40z"></path>
                          <path fill="#fbbc05" d="M48,168h39.89l-16-16H48c-8.82,0-16-7.18-16-16v-23.89l-16-16V136C16,153.67,30.33,168,48,168z"></path>
                        </g>
                      </svg>
                    </div>
                  </div>
                  <div className="search-buttons">
                    <button type="submit" className="google-search-button">Google Search</button>
                    <button type="button" className="feeling-lucky-button">I'm Feeling Lucky</button>
                  </div>
                </form>
              </div>
            </header>
            
            <footer className="home-footer">
              <div className="footer-top">
                <span className="footer-country">United States</span>
              </div>
              <div className="footer-bottom">
                <div className="footer-left">
                  <a href="#" className="footer-link">Advertising</a>
                  <a href="#" className="footer-link">Business</a>
                  <a href="#" className="footer-link">How Search works</a>
                </div>
                <div className="footer-center">
                  <a href="#" className="footer-link">
                    <span className="leaf-icon">🍃</span>
                    Our third decade of climate action: join us
                  </a>
                </div>
                <div className="footer-right">
                  <a href="#" className="footer-link">Privacy</a>
                  <a href="#" className="footer-link">Terms</a>
                  <a href="#" className="footer-link">Settings</a>
                </div>
              </div>
            </footer>
          </>
        ) : (
          // Search Results Page
          <>
            <header className="results-header">
              <div className="results-header-top">
                <div className="results-logo-container">
                  <img 
                    src="https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png" 
                    alt="Google" 
                    className="results-google-logo" 
                  />
                </div>
                <form className="results-search-form" onSubmit={handleSearch}>
                  <div className="results-search-input-wrapper">
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="results-search-input"
                    />
                    {query && (
                      <div className="results-clear-icon" onClick={(e) => {
                        e.preventDefault();
                        setQuery('');
                      }}>
                        <svg focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path>
                        </svg>
                      </div>
                    )}
                    <div className="results-voice-search">
                      <svg className="results-voice-icon" focusable="false" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path fill="#4285f4" d="m12 15c1.66 0 3-1.31 3-2.97v-7.02c0-1.66-1.34-3.01-3-3.01s-3 1.34-3 3.01v7.02c0 1.66 1.34 2.97 3 2.97z"></path>
                        <path fill="#34a853" d="m11 18.08h2v3.92h-2z"></path>
                        <path fill="#fbbc05" d="m7.05 16.87c-1.27-1.33-2.05-2.83-2.05-4.87h2c0 1.45 0.56 2.42 1.47 3.38v0.32l-1.15 1.18z"></path>
                        <path fill="#ea4335" d="m12 16.93a4.97 5.25 0 0 1 -3.54 -1.55l-1.41 1.49c1.26 1.34 3.02 2.13 4.95 2.13 3.87 0 6.99-2.92 6.99-7h-1.99c0 2.92-2.24 4.93-5 4.93z"></path>
                      </svg>
                    </div>
                    <div className="results-camera-search">
                      <svg className="results-camera-icon" focusable="false" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg">
                        <rect fill="none" height="192" width="192"></rect>
                        <g>
                          <circle fill="#4285f4" cx="96" cy="104.15" r="28"></circle>
                          <path fill="#ea4335" d="M160,72v40.15V136c0,1.69-0.34,3.29-0.82,4.82v0v0c-1.57,4.92-5.43,8.78-10.35,10.35h0v0 c-1.53,0.49-3.13,0.82-4.82,0.82H66l16,16h50h12c4.42,0,8.63-0.9,12.46-2.51c3.83-1.62,7.28-3.96,10.17-6.86 c1.45-1.45,2.76-3.03,3.91-4.74c2.3-3.4,3.96-7.28,4.81-11.44c0.43-2.08,0.65-4.24,0.65-6.45v-12V96.15V84l-6-19l-10.82,2.18 C159.66,68.71,160,70.31,160,72z"></path>
                          <path fill="#4285f4" d="M32,72c0-1.69,0.34-3.29,0.82-4.82c1.57-4.92,5.43-8.78,10.35-10.35C44.71,56.34,46.31,56,48,56 h96c1.69,0,3.29,0.34,4.82,0.82c0,0,0,0,0,0L149,45l-17-5l-16-16h-13.44H96h-6.56H76L60,40H48c-17.67,0-32,14.33-32,32v12v20 l16,16V72z"></path>
                          <path fill="#34a853" d="M144,40h-12l16.83,16.83c1.23,0.39,2.39,0.93,3.47,1.59c2.16,1.32,3.97,3.13,5.29,5.29 c0.66,1.08,1.2,2.24,1.59,3.47v0L176,84V72C176,54.33,161.67,40,144,40z"></path>
                          <path fill="#fbbc05" d="M48,168h39.89l-16-16H48c-8.82,0-16-7.18-16-16v-23.89l-16-16V136C16,153.67,30.33,168,48,168z"></path>
                        </g>
                      </svg>
                    </div>
                    <button type="submit" className="results-search-button">
                      <svg focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"></path>
                      </svg>
                    </button>
                  </div>
                </form>
                <div className="results-header-right">
                  <button className="results-apps-button">
                    <svg className="results-apps-icon" focusable="false" viewBox="0 0 24 24">
                      <path d="M6,8c1.1,0 2,-0.9 2,-2s-0.9,-2 -2,-2 -2,0.9 -2,2 0.9,2 2,2zM12,20c1.1,0 2,-0.9 2,-2s-0.9,-2 -2,-2 -2,0.9 -2,2 0.9,2 2,2zM6,20c1.1,0 2,-0.9 2,-2s-0.9,-2 -2,-2 -2,0.9 -2,2 0.9,2 2,2zM6,14c1.1,0 2,-0.9 2,-2s-0.9,-2 -2,-2 -2,0.9 -2,2 0.9,2 2,2zM12,14c1.1,0 2,-0.9 2,-2s-0.9,-2 -2,-2 -2,0.9 -2,2 0.9,2 2,2zM16,6c0,1.1 0.9,2 2,2s2,-0.9 2,-2 -0.9,-2 -2,-2 -2,0.9 -2,2zM12,8c1.1,0 2,-0.9 2,-2s-0.9,-2 -2,-2 -2,0.9 -2,2 0.9,2 2,2zM18,14c1.1,0 2,-0.9 2,-2s-0.9,-2 -2,-2 -2,0.9 -2,2 0.9,2 2,2zM18,20c1.1,0 2,-0.9 2,-2s-0.9,-2 -2,-2 -2,0.9 -2,2 0.9,2 2,2z"></path>
                    </svg>
                  </button>
                  <button className="results-signin-button">Sign in</button>
                </div>
              </div>
              <div className="results-header-bottom">
                <nav className="results-nav">
                  <a href="#" className="results-nav-item active">
                    <svg focusable="false" viewBox="0 0 24 24">
                      <path fill="#34a853" d="M10 2v2a6 6 0 0 1 6 6h2a8 8 0 0 0-8-8"></path>
                      <path fill="#ea4335" d="M10 4V2a8 8 0 0 0-8 8h2c0-3.3 2.7-6 6-6"></path>
                      <path fill="#fbbc04" d="M4 10H2a8 8 0 0 0 8 8v-2c-3.3 0-6-2.69-6-6"></path>
                      <path fill="#4285f4" d="M22 20.59l-5.69-5.69A7.96 7.96 0 0 0 18 10h-2a6 6 0 0 1-6 6v2c1.85 0 3.52-.64 4.88-1.68l5.69 5.69L22 20.59"></path>
                    </svg>
                    All
                  </a>
                  <a href="#" className="results-nav-item">Images</a>
                  <a href="#" className="results-nav-item">Videos</a>
                  <a href="#" className="results-nav-item">Maps</a>
                  <a href="#" className="results-nav-item">News</a>
                  <a href="#" className="results-nav-item">Shopping</a>
                  <a href="#" className="results-nav-item">More</a>
                  <a href="#" className="results-nav-item">Tools</a>
                </nav>
              </div>
            </header>
            
            <main className="results-main">
              <div className="results-info">
                {results.totalResults} ({results.searchTime} seconds)
              </div>
              
              <div className="results-content">
                {loading ? (
                  <div className="loading">
                    <div className="loader"></div>
                    <p>Searching...</p>
                  </div>
                ) : error ? (
                  <div className="error-message">
                    <p>{error}</p>
                  </div>
                ) : (
                  <div className="results-list">
                    {processedResults && processedResults.results.map((result, index) => (
                      <div key={index} className="result-item">
                        <div className="result-url">{result.url}</div>
                        <h3 className="result-title">
                          <a 
                            href="#" 
                            onClick={(e) => {
                              e.preventDefault();
                              handleResultClick(result);
                            }}
                          >
                            {result.title}
                          </a>
                        </h3>
                        <p className="result-snippet">
                          {result.snippet}
                          {result.isPartOfSeries && (
                            <span className="part-indicator">
                              {result.partIndex > 0 ? 
                                ` (Continued from previous result)` : 
                                ` (Continues in next result)`}
                            </span>
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </main>
            
            <footer className="results-footer">
              <div className="results-footer-top">
                <span className="results-footer-country">United States</span>
              </div>
              <div className="results-footer-bottom">
                <div className="results-footer-left">
                  <a href="#" className="results-footer-link">Help</a>
                  <a href="#" className="results-footer-link">Send feedback</a>
                  <a href="#" className="results-footer-link">Privacy</a>
                  <a href="#" className="results-footer-link">Terms</a>
                </div>
              </div>
            </footer>
          </>
        )
      )}
    </div>
  )
}

export default App
