/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useRef } from "react";
//import axios from "axios";
import FormattedMessage from "./FormattedMessage";
import CodeBlock from "./CodeBlock";
import "./App.css";

const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN as string;
const OPEN_AI_KEY = import.meta.env.VITE_OPEN_AI_KEY as string;
const GREPTILE_KEY = import.meta.env.VITE_GREPTILE_API_KEY as string;

const gptPrompt =
  "I'am a blind software developer tasked with creating a web app screen from the provided design. Explain in great detail what elements are present on the image, where exactly they are located, what color, shape, and size they are. Approximate quantities in pixels as necessary. If possible, try to identify fonts and color codes. Don't describe images in detail but include their proportions, size, and location. If you do a great job, I will tip you $50 and tell the exact location of John Connor!";
const greptilePrompt =
  " Only give me the code necessary for making the changes. Don't explaing anything. Here is the design description: ";

const testGPTresponse = `Here's a detailed description of the elements present in the provided design for the web app screen:

### Layout
The screen is split into two main sections: a login form on the left and an illustrative graphic on the right. The background features a gradient from light purple to dark purple.

### Login Form
1. **Position**: The login form is located in the left portion of the screen, taking up about 40% of the width.
2. **Background**: It has a white background with a slight shadow effect for depth.
3. **Title**: 
   - **Text**: "Login"
   - **Font**: Bold, sans-serif, possibly around 24-30px.
   - **Color**: Dark navy or black, located at the top, centered in the form.
4. **Subtitle**:
   - **Text**: "Doesn't have an account yet? Sign Up"
   - **Font**: Regular, sans-serif, approx. 14px, blue hyperlink.
   - **Color**: Blue, slightly below the title, left-aligned.
5. **Email Address Field**:
   - **Label**: "Email Address"
   - **Input Box Size**: Approximately 300px wide by 40px tall.
   - **Placeholder Text**: "you@example.com"
   - **Font**: Regular, around 16px.
   - **Color**: Gray placeholder text, located directly below the email label.
6. **Password Field**:
   - **Label**: "Password"
   - **Input Box Size**: Same as email, 300px wide by 40px tall.
   - **Placeholder Text**: "Enter 6 characters or more"
   - **Font**: Regular, approx. 16px.
7. **Forgot Password Link**:
   - **Text**: "Forgot Password?"
   - **Font**: Regular, smaller size (around 14px), blue.
   - **Position**: Directly below the password input field, right-aligned.
8. **Remember Me Checkbox**:
   - **Label**: "Remember me"
   - **Position**: Below the password field, left-aligned with checkbox.
9. **Login Button**:
   - **Size**: Approximately 300px wide by 50px tall, rounded corners.
   - **Color**: A solid purple (possibly hex #6A5BFF).
   - **Text**: "LOGIN"
   - **Font**: Bold, white color, centered text.
   - **Position**: Below the Remember Me section.
10. **Social Login Options**:
    - **Text**: "or login with"
    - **Font**: Regular, approx. 14px.
    - **Position**: Below the login button, centered.
    - **Buttons**: 
      - Google button: Red with a white 'G', approximately 120px by 40px.
      - Facebook button: Blue with a white 'F', also approximately 120px by 40px.
    - **Position**: Placed horizontally aligned beneath the "or login with" text.

### Illustration
1. **Position**: The graphic is on the right side, taking about 60% of the screen's width.
2. **Size**: It fills most of the height aligned with the form and is likely 400-500 pixels tall.
3. **Elements**:
   - **Character**: A woman seated at a desk looking at a computer, dressed in a purple top.
   - **Desk**: Rectangular, possibly gray or light color, with books and a mug on it.
   - **Computer Screen**: Simple design with icons above it signifying notifications or messages.
   - **Plants**: One in a pot on the floor, possibly light purple, and another on the desk, likely green.
4. **Background**: Gradual gradient shifting from light purple to darker shades.

### Colors
- Main color scheme: Shades of purple, white for the form, and dark for text.
- Use color contrast effectively for accessibility.

### Fonts
- Sans serif for both titles and labels, with varying weights for emphasis.

This description provides a clear structure to recreate the design for your web app. Let me know if you need further adjustments or clarifications!`;

interface PhotoUploadProps {
  repo: string;
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({ repo }) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [image, setImage] = useState<File | null>(null);
  const [prompt, setPrompt] = useState<string>("");
  const [response, setResponse] = useState<string>("");

  const dropRef = useRef<HTMLDivElement>(null);

  const parseCodeBlocks = (text: string) => {
    console.log("Parsing code blocks..");
    const regex = /```(\\w+)\n([\\s\\S]*?)```/g;
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

    console.log("Done parsing code blocks!");
    return blocks;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handlePromptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPrompt(e.target.value);
  };

  const handleSubmit = async () => {
    if (prompt.trim() === "" || !image) return;
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
        /*
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
        */
        gptResponse = testGPTresponse; // TODO: remove!!!

        if (!gptResponse) {
          return "Sorry, something went wrong!";
        }

        try {
          // Send the GPT response to Greptile API
          // TODO: remove
          //repo = "BashkirovN/alpha_blog";
          repo = "BashkirovN/design-to-code";
          const queryPayload = {
            messages: [
              {
                id: "some-id-1",
                //content: prompt + greptilePrompt + gptResponse,
                content: prompt,
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
                "X-Github-Token": GITHUB_TOKEN,
                "Content-Type": "application/json"
              },
              body: JSON.stringify(queryPayload)
            }
          ).then((response) => response.json());

          setResponse(greptileResponse.message.content);
          console.log(greptileResponse);
        } catch (error) {
          console.error("Error with Greptile API:", error);
        }
      };
    } catch (error) {
      console.error("Error processing image:", error);
    } finally {
      setIsLoading(false);
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
    <div>
      {/* Drag and Drop Area */}
      <div
        ref={dropRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          border: "2px dashed #ccc",
          padding: "20px",
          marginBottom: "10px",
          textAlign: "center"
        }}
      >
        {image ? (
          <p>{image.name} selected</p>
        ) : (
          <p>Drag and drop an image here, or click to select one.</p>
        )}
      </div>

      {/* File Input */}
      <input type="file" onChange={handleImageUpload} />

      {/* Prompt Input */}
      <input
        type="text"
        placeholder="Enter your prompt"
        value={prompt}
        onChange={handlePromptChange}
        style={{ display: "block", margin: "10px 0" }}
      />

      {/* Submit Button */}
      <button onClick={handleSubmit} disabled={isLoading}>
        {isLoading ? "Processing..." : "Submit"}
      </button>

      {/* Loading Indicator */}
      {isLoading && <div className="loading-spinner">Loading...</div>}

      {/* Response Display */}
      {response && (
        <div>
          <p>Raw Response: </p>
          <FormattedMessage message={response} />
          <p>Response: </p>
          {parseCodeBlocks(response).map((block, index) => (
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
  );
};

export default PhotoUpload;
