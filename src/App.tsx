import React, { useState } from "react";
//import axios from "axios";
import PhotoUpload from "./PhotoUpload";
import "./App.css";

const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN as string;
const GREPTILE_KEY = import.meta.env.VITE_GREPTILE_API_KEY as string;

const App: React.FC = () => {
  const [screen, setScreen] = useState<"enterRepo" | "imageUpload">(
    //"enterRepo"
    "imageUpload" // TODO: change to "enterRepo"
  );
  const [gitRepo, setGitRepo] = useState<string>("");
  const [processing, setProcessing] = useState<boolean>(false);
  const [polling, setPolling] = useState<boolean>(false);

  // Handles repository URL input change
  const handleGitRepoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGitRepo(e.target.value);
  };

  // Submits the repository to Greptile for processing
  const handleRepoSubmit = async () => {
    setProcessing(true);

    const repositoryPayload = {
      remote: "github",
      repository: gitRepo
    };

    try {
      const response = await fetch("https://api.greptile.com/v2/repositories", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GREPTILE_KEY}`,
          "X-Github-Token": GITHUB_TOKEN,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(repositoryPayload)
      });

      const data = await response.json();

      if (response.ok) {
        // Assuming the Greptile API returns an ID for polling
        const repoId = encodeURIComponent(`github:main:${gitRepo}`);
        pollRepoStatus(repoId);
      } else {
        console.error("Error:", data);
        setProcessing(false);
      }
    } catch (error) {
      console.error("Error submitting repo to Greptile:", error);
      setProcessing(false);
    }
  };

  // Polls the repository processing status
  const pollRepoStatus = async (repoId: string) => {
    setPolling(true);

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(
          `https://api.greptile.com/v2/repositories/${repoId}`,
          {
            headers: {
              Authorization: `Bearer ${GREPTILE_KEY}`,
              "X-Github-Token": GITHUB_TOKEN
            }
          }
        );

        const statusData = await response.json();
        const { status, sha } = statusData;

        if (sha) {
          clearInterval(pollInterval);
          setPolling(false);
          setProcessing(false);
          setScreen("imageUpload");
        } else if (status === "submitted") {
          console.log("Job is in queue...");
        } else if (status === "cloning") {
          console.log("Repository is being cloned...");
        } else if (status === "processing") {
          console.log("Repository is being processed...");
        }
      } catch (error) {
        console.error("Error polling repo status:", error);
        clearInterval(pollInterval);
        setPolling(false);
        setProcessing(false);
      }
    }, 3000);
  };

  // Renders the repository entry screen
  const renderEnterRepoScreen = () => (
    <div>
      <h1>Enter GitHub Repository</h1>
      <input
        type="text"
        placeholder="Enter GitHub Repo URL"
        value={gitRepo}
        onChange={handleGitRepoChange}
      />
      <button onClick={handleRepoSubmit} disabled={processing || polling}>
        Submit
      </button>
      {processing && <p>Processing repository... Please wait.</p>}
      {polling && <p>Polling repository status...</p>}
    </div>
  );

  // Renders the image upload and prompt entering screen
  const renderImageUploadScreen = () => (
    <div>
      <h1>Repository Processed!</h1>
      <PhotoUpload repo={gitRepo} />
    </div>
  );

  return (
    <div>
      {screen === "enterRepo"
        ? renderEnterRepoScreen()
        : renderImageUploadScreen()}
    </div>
  );
};

export default App;
