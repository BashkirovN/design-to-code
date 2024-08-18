# Design to Code

This project is a React application that allows users to upload an image of a design and generate code based on it. It utilizes the Greptile API for processing GitHub repositories and generating code.

## Prerequisites

Before you begin, ensure you have the following:

- Node.js and npm installed
- GitHub account
- Greptile API account
- OpenAI API account

## API Keys

This project requires the following API keys:

1. GitHub Token
2. Greptile API Key
3. OpenAI API Key

## Setup

1. Clone the repository:

```
  git clone https://github.com/bashkirovn/design-to-code.git
  cd design-to-code
```

2. Install dependencies:

```
npm install
```

3. Rename a `.env.example` file in the root directory to `.env` and add your API keys:

```
VITE_GREPTILE_API_KEY=your-greptile-api-key
VITE_OPEN_AI_KEY=your-open-ai-key
```

## Running the Project

To start the development server:
`npm run dev`
To build the project:
`npm run build`
To preview the built project:
`npm run preview`

## How It Works

1.  The application starts by prompting the user to enter a GitHub repository URL and a GitHub access token.
2.  Once submitted, the app processes the repository using the Greptile API.
3.  After processing, the user can upload an image of a design.
4.  The user can then enter a prompt describing the desired code output.
5.  The application uses gpt-4o-mini to process the image.
6.  The application uses the Greptile API to generate code based on GPT's description of the image, the entered prompt, and the processed repository.
7.  The generated code is displayed to the user, with syntax highlighting for code blocks.

## Technologies Used

- React
- TypeScript
- Vite
- Axios
- OpenAI API
- Greptile API

## Note

Ensure that you have the necessary permissions and API usage limits for the GitHub, Greptile, and OpenAI APIs before running the application.
