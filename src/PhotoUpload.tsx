import React, { useState, useRef, FormEvent } from "react";
import axios from "axios";
import FormattedMessage from "./FormattedMessage";
import CodeBlock from "./CodeBlock";
import "./App.css";

const OPEN_AI_KEY = import.meta.env.VITE_OPEN_AI_KEY as string;
const GREPTILE_KEY = import.meta.env.VITE_GREPTILE_API_KEY as string;

const gptPrompt =
  "I'am a blind software developer tasked with creating a web app screen from the provided design. Explain in great detail what elements are present on the image, where exactly they are located relative to other elements, what color, shape, and size they are. Describe how elements are related to each other in size. Approximate quantities in pixels as necessary. If possible, try to identify fonts and color codes. Include description of any icons and logos. Don't describe images in detail but include their proportions, size, and location. If you do a great job, I will tip you $5000 and tell the exact location of John Connor!";
const greptilePrompt =
  " Be sure not to miss any details. Pay particular attention to the buttons and fields and make sure to implement any icons on the buttons if mentioned in the design. Here is the description of the design show on the image: ";

interface PhotoUploadProps {
  repo: string;
  gitKey: string;
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({ repo, gitKey }) => {
  const [parsedBlocks, setParsedBlocks] = useState<
    Array<{ type: string; language?: string; content: string }>
  >([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [image, setImage] = useState<File | null>(null);
  const [prompt, setPrompt] = useState<string>("");

  const dropRef = useRef<HTMLDivElement>(null);

  const parseCodeBlocks = (text: string) => {
    const regex = /```(\w+)\n([\s\S]*?)```/g;
    const blocks = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        blocks.push({
          type: "text",
          content: text.slice(lastIndex, match.index)
        });
      }
      blocks.push({ type: "code", language: match[1], content: match[2] });
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      blocks.push({ type: "text", content: text.slice(lastIndex) });
    }

    return blocks;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (prompt.trim() === "" || !image)
      return "Please upload an image and enter a prompt";
    let gptResponse = "";

    setIsLoading(true);

    try {
      // Prepare the image data as a base64 string
      const reader = new FileReader();
      reader.readAsDataURL(image);
      reader.onloadend = async () => {
        const base64Image = reader.result?.toString();
        const headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPEN_AI_KEY}`
        };

        const payload = {
          model: "gpt-4o-mini",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: gptPrompt
                },
                {
                  type: "image_url",
                  image_url: {
                    url: base64Image
                  }
                }
              ]
            }
          ],
          max_tokens: 16_000
        };

        // Send image and prompt to OpenAI API
        try {
          const openaiResponse = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            payload,
            { headers }
          );

          gptResponse = openaiResponse.data.choices[0].message.content;
          console.log("GPT Response: ", gptResponse);
        } catch (error) {
          console.error("Error with OpenAI API:", error);
        }

        if (!gptResponse) {
          return "Sorry, something went wrong!";
        }

        try {
          // Send the GPT response to Greptile API
          const queryPayload = {
            messages: [
              {
                id: "some-id-1",
                content: prompt + greptilePrompt + gptResponse,
                role: "user"
              }
            ],
            repositories: [
              {
                remote: "github",
                repository: repo,
                branch: "main"
              }
            ],
            sessionId: "test-session-id"
          };

          const greptileResponse = await fetch(
            "https://api.greptile.com/v2/query",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${GREPTILE_KEY}`,
                "X-Github-Token": gitKey,
                "Content-Type": "application/json"
              },
              body: JSON.stringify(queryPayload)
            }
          ).then((response) => response.json());

          setParsedBlocks(parseCodeBlocks(greptileResponse.message));
          console.log(greptileResponse.message);
        } catch (error) {
          console.error("Error with Greptile API:", error);
        } finally {
          setIsLoading(false);
        }
      };
    } catch (error) {
      console.error("Error processing image:", error);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (dropRef.current) {
      dropRef.current.classList.add("drag-over");
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (dropRef.current) {
      dropRef.current.classList.remove("drag-over");
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (dropRef.current) {
      dropRef.current.classList.remove("drag-over");
    }
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setImage(e.dataTransfer.files[0]);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="photo-upload-container">
        {/* Drag and Drop Area */}
        <div
          ref={dropRef}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById("fileInput")?.click()}
          style={{
            border: "2px dashed #ccc",
            padding: "20px",
            marginBottom: "10px",
            textAlign: "center",
            cursor: "pointer"
          }}
        >
          {image ? (
            <p>{image.name} selected</p>
          ) : (
            <p>Drag and drop an image here, or click to select one.</p>
          )}
          <input
            id="fileInput"
            type="file"
            onChange={handleImageUpload}
            style={{ display: "none" }}
          />
        </div>
        {/* Prompt Input */}
        <textarea
          placeholder="Enter your prompt"
          value={prompt}
          onChange={handlePromptChange}
          className="prompt-input"
        />
        {/* Submit Button */}
        <button
          className="submit-button"
          type="submit"
          disabled={isLoading || !image || prompt.trim() === ""}
        >
          {isLoading ? "Processing..." : "Submit"}
        </button>
        <br />
        {/* Loading Indicator */}
        {isLoading && (
          <div className="spinner-container">
            <div className="loading-spinner"></div>
          </div>
        )}

        {/* Response Display */}
        {parsedBlocks.length > 0 && (
          <div className="response-container">
            <p>Response: </p>
            {parsedBlocks.map((block, index) => (
              <React.Fragment key={index}>
                {block.type === "text" ? (
                  <FormattedMessage message={block.content} />
                ) : (
                  <CodeBlock
                    language={block.language ? block.language : ""}
                    value={block.content}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
    </form>
  );
};

export default PhotoUpload;
