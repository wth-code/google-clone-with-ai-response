# AISearch - Google-like UI with OpenAI Integration

A React application that simulates a Google search interface but uses OpenAI's API to generate search results.

## Features

- Google-inspired search interface
- Real-time AI responses from OpenAI
- Search results formatted like Google search results
- Responsive design

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- OpenAI API key

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/wth-code/google-clone-with-ai-response.git
   cd ai-search
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and add your OpenAI API key:
   ```
   VITE_OPENAI_API_KEY=your_openai_api_key_here
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:5173`

## Usage

1. Enter your search query in the search bar
2. Press Enter or click the search button
3. View AI-generated results formatted like Google search results

## How It Works

- User enters a search query
- Query is sent to OpenAI's API
- AI generates a comprehensive response
- Response is formatted to look like Google search results
- Results are displayed in a familiar search result interface

## Customization

You can customize the AI behavior by modifying the system prompt in the `openaiService.js` file:

```javascript
messages: [
  {
    role: "system",
    content: "You are a helpful assistant providing informative and factual answers..."
  },
  // ...
]
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- OpenAI for providing the API
- Google for UI inspiration
