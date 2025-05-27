import { marked } from "marked";
import { readFileSync } from "fs";

function decodeHtmlEntities(text: string): string {
  const entities: { [key: string]: string } = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'",
    "&#x27;": "'",
    "&#x2F;": "/",
    "&#x60;": "`",
    "&#x3D;": "=",
  };

  return text.replace(/&[#\w]+;/g, (entity) => {
    return entities[entity] || entity;
  });
}

function highlightPython(code: string): string {
  // First decode HTML entities to get the actual code
  const decodedCode = decodeHtmlEntities(code);

  // Split into tokens to avoid HTML conflicts
  const tokens = [];
  let currentPos = 0;
  const text = decodedCode;

  // Simple tokenizer - split by whitespace and special characters
  const tokenRegex =
    /(\s+|[(){}[\]:,;.=<>!+\-*/&|^%~]|@\w+|"[^"]*"|'[^']*'|\w+)/g;
  let match;

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > currentPos) {
      // Add any text between tokens
      tokens.push({
        type: "text",
        value: text.slice(currentPos, match.index),
      });
    }

    const token = match[0];
    let type = "text";

    // Classify tokens
    if (token.startsWith("@")) {
      type = "decorator";
    } else if (token.startsWith('"') || token.startsWith("'")) {
      type = "string";
    } else if (
      /^(def|class|import|from|if|else|elif|for|while|try|except|finally|with|as|return|yield|break|continue|pass|lambda|and|or|not|in|is|None|True|False)$/.test(
        token
      )
    ) {
      type = "keyword";
    } else if (token.startsWith("#")) {
      type = "comment";
    }

    tokens.push({ type, value: token });
    currentPos = match.index + match[0].length;
  }

  // Add any remaining text
  if (currentPos < text.length) {
    tokens.push({
      type: "text",
      value: text.slice(currentPos),
    });
  }

  // Helper function to escape HTML in token values
  function escapeHtml(text: string): string {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // Convert tokens back to HTML
  let result = "";
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    switch (token.type) {
      case "decorator":
        result += `<span class="decorator">${escapeHtml(token.value)}</span>`;
        break;
      case "string":
        result += `<span class="string">${escapeHtml(token.value)}</span>`;
        break;
      case "keyword":
        result += `<span class="keyword">${escapeHtml(token.value)}</span>`;
        // Check if next non-whitespace token is a function name
        if (token.value === "def") {
          let j = i + 1;
          while (j < tokens.length && /^\s+$/.test(tokens[j].value)) j++;
          if (
            j < tokens.length &&
            tokens[j].type === "text" &&
            /^\w+$/.test(tokens[j].value)
          ) {
            tokens[j].type = "function";
          }
        }
        break;
      case "function":
        result += `<span class="function">${escapeHtml(token.value)}</span>`;
        break;
      case "comment":
        // Handle full line comments
        let commentText = token.value;
        while (i + 1 < tokens.length && !tokens[i + 1].value.includes("\n")) {
          i++;
          commentText += tokens[i].value;
        }
        result += `<span class="comment">${escapeHtml(commentText)}</span>`;
        break;
      default:
        result += escapeHtml(token.value);
    }
  }

  return result;
}

export default function generateHTMLfromMD(filePath: string) {
  const tutorialMarkdown = readFileSync(filePath, { encoding: "utf-8" });

  // Configure marked to properly escape HTML in code blocks
  marked.setOptions({
    breaks: false,
    gfm: true,
  });

  // Custom renderer to ensure code blocks are properly escaped
  const renderer = new marked.Renderer();

  // Override code block rendering to ensure HTML is escaped
  renderer.code = function (token: { text: string; lang?: string }) {
    const code = token.text;
    const language = token.lang;

    // Ensure HTML entities are properly escaped in code blocks
    const escapedCode = code
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

    const langClass = language ? ` class="language-${language}"` : "";
    return `<pre><code${langClass}>${escapedCode}</code></pre>`;
  };

  // Process the markdown with custom renderer
  let html = marked(tutorialMarkdown, { renderer }) as string;

  // Post-process to add syntax highlighting to Python code blocks
  html = html.replace(
    /<pre><code(?:\s+class="language-python")?>([\s\S]*?)<\/code><\/pre>/g,
    (match, code) => {
      // Apply highlighting to the encoded code
      const highlightedCode = highlightPython(code);
      return `<pre><code class="language-python">${highlightedCode}</code></pre>`;
    }
  );

  // Also handle code blocks without explicit language
  html = html.replace(
    /<pre><code>([\s\S]*?)<\/code><\/pre>/g,
    (match, code) => {
      // Decode HTML entities first to check content properly
      const decodedCode = decodeHtmlEntities(code);

      // Check if it looks like Python code (contains @, def, etc.)
      if (
        decodedCode.includes("@") ||
        decodedCode.includes("def ") ||
        decodedCode.includes("import ")
      ) {
        const highlightedCode = highlightPython(code);
        return `<pre><code class="language-python">${highlightedCode}</code></pre>`;
      }
      return match;
    }
  );

  return html;
}
