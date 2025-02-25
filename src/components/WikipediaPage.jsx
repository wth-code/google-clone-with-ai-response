import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import './WikipediaPage.css';

const WikipediaPage = ({ content, onClose }) => {
  const [pageContent, setPageContent] = useState(null);
  
  useEffect(() => {
    if (content) {
      // Format the content for Wikipedia-style display
      const formattedContent = formatWikipediaContent(content);
      setPageContent(formattedContent);
    }
  }, [content]);
  
  // Function to format content in Wikipedia style
  const formatWikipediaContent = (content) => {
    // Try to get the full content from different possible sources
    const fullText = 
      content.fullContent || 
      content.originalResponse || 
      (content.isPartOfSeries ? content.originalContent : content.snippet) || 
      content.snippet;
    
    return {
      title: content.title.replace(' - Wikipedia', ''),
      url: content.url,
      fullContent: fullText,
      // For compatibility with existing code
      sections: [{
        title: 'Overview',
        paragraphs: [fullText]
      }]
    };
  };
  
  // Get the domain for display in the URL bar
  const getDomain = (url) => {
    try {
      const domain = new URL(url).hostname;
      return domain;
    } catch (e) {
      return url;
    }
  };
  
  if (!pageContent) {
    return (
      <div className="wikipedia-loading">
        <div className="wikipedia-loader"></div>
        <p>Loading Wikipedia article...</p>
      </div>
    );
  }
  
  return (
    <div className="wikipedia-container">
      <div className="wikipedia-header">
        <div className="wikipedia-header-left">
          <div className="wikipedia-logo-container">
            <img 
              src="https://en.wikipedia.org/static/images/icons/wikipedia.png" 
              alt="Wikipedia" 
              className="wikipedia-logo" 
            />
          </div>
          <div className="wikipedia-search-container">
            <input 
              type="text" 
              className="wikipedia-search-input" 
              placeholder="Search Wikipedia" 
              value={pageContent.title}
              readOnly
            />
            <button className="wikipedia-search-button">
              <svg viewBox="0 0 16 16">
                <path d="M11.5 7c0 1.7-1.3 3-3 3s-3-1.3-3-3 1.3-3 3-3 3 1.3 3 3zm-3 4c2.2 0 4-1.8 4-4s-1.8-4-4-4-4 1.8-4 4 1.8 4 4 4zm5 .3L10.3 8l.7-.8 3.1 3.2z"/>
              </svg>
            </button>
          </div>
        </div>
        <div className="wikipedia-header-right">
          <a href="#" className="wikipedia-link">Create account</a>
          <a href="#" className="wikipedia-link">Log in</a>
          <div className="wikipedia-menu">
            <div className="wikipedia-menu-item">Article</div>
            <div className="wikipedia-menu-item">Talk</div>
            <div className="wikipedia-menu-divider"></div>
            <div className="wikipedia-menu-item active">Read</div>
            <div className="wikipedia-menu-item">Edit</div>
            <div className="wikipedia-menu-item">View history</div>
          </div>
        </div>
      </div>
      
      <div className="wikipedia-content">
        <div className="wikipedia-sidebar">
          <div className="wikipedia-sidebar-logo">
            <img 
              src="https://upload.wikimedia.org/wikipedia/en/thumb/8/80/Wikipedia-logo-v2.svg/1200px-Wikipedia-logo-v2.svg.png" 
              alt="Wikipedia" 
            />
          </div>
          <div className="wikipedia-sidebar-links">
            <div className="wikipedia-sidebar-section">
              <div className="wikipedia-sidebar-heading">Navigation</div>
              <ul>
                <li><a href="#">Main page</a></li>
                <li><a href="#">Contents</a></li>
                <li><a href="#">Current events</a></li>
                <li><a href="#">Random article</a></li>
                <li><a href="#">About Wikipedia</a></li>
                <li><a href="#">Contact us</a></li>
                <li><a href="#">Donate</a></li>
              </ul>
            </div>
            <div className="wikipedia-sidebar-section">
              <div className="wikipedia-sidebar-heading">Contribute</div>
              <ul>
                <li><a href="#">Help</a></li>
                <li><a href="#">Learn to edit</a></li>
                <li><a href="#">Community portal</a></li>
                <li><a href="#">Recent changes</a></li>
                <li><a href="#">Upload file</a></li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="wikipedia-main">
          <div className="wikipedia-article">
            <div className="wikipedia-article-header">
              <h1>{pageContent.title}</h1>
              <div className="wikipedia-article-meta">
                From Wikipedia, the free encyclopedia
              </div>
              <div className="wikipedia-article-url">
                URL: <a href={pageContent.url} target="_blank" rel="noopener noreferrer">
                  {getDomain(pageContent.url)}
                </a>
              </div>
            </div>
            
            <div className="wikipedia-article-content">
              <div className="wikipedia-markdown">
                <ReactMarkdown>{pageContent.fullContent}</ReactMarkdown>
              </div>
            </div>
            
            <div className="wikipedia-article-footer">
              <div className="wikipedia-categories">
                <span>Categories:</span>
                <a href="#">{pageContent.title.split(' ')[0]}</a> | 
                <a href="#">Knowledge</a> | 
                <a href="#">Information</a>
              </div>
              <div className="wikipedia-last-edited">
                This page was last edited on {new Date().toLocaleDateString()}, at {new Date().toLocaleTimeString()}.
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <button className="wikipedia-close-button" onClick={onClose}>
        Return to search results
      </button>
    </div>
  );
};

export default WikipediaPage; 