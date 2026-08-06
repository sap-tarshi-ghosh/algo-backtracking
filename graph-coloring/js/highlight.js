/*
 * highlight.js
 * -----------------------------------------------------------------------
 * A minimal JS syntax highlighter, output-compatible in spirit with
 * Prism.js (span.tok-* tokens) but self-written so the project has zero
 * external dependencies and works with no network access. Good enough
 * for the small annotated pseudocode block this deck displays - not a
 * general-purpose tokenizer.
 * -----------------------------------------------------------------------
 */

const Highlight = {
  KEYWORDS: new Set([
    "function", "const", "let", "var", "if", "else", "for", "while",
    "return", "true", "false", "null", "new", "break", "continue"
  ]),

  /** Tokenize one line of JS-ish source into an array of {text, cls}. */
  tokenizeLine(line) {
    const tokens = [];
    // Order matters: comments/strings first, then numbers/identifiers/punct.
    const re = /(\/\/.*$)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(\b\d+\b)|([A-Za-z_$][A-Za-z0-9_$]*)|(\s+)|([^\sA-Za-z0-9_$]+)/g;
    let match;
    while ((match = re.exec(line)) !== null) {
      const [full, comment, str, num, ident, space, punct] = match;
      if (comment) tokens.push({ text: comment, cls: "tok-comment" });
      else if (str) tokens.push({ text: str, cls: "tok-string" });
      else if (num) tokens.push({ text: num, cls: "tok-number" });
      else if (ident) {
        if (Highlight.KEYWORDS.has(ident)) tokens.push({ text: ident, cls: "tok-keyword" });
        else if (/^(findEmptyCell|isValid|solve)$/.test(ident)) tokens.push({ text: ident, cls: "tok-function" });
        else tokens.push({ text: ident, cls: "tok-ident" });
      } else if (space) tokens.push({ text: full, cls: "" });
      else if (punct) tokens.push({ text: punct, cls: "tok-punct" });
    }
    return tokens;
  },

  /** Escape text for safe innerHTML insertion. */
  escape(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  },

  /** Render a single line of source to an HTML string of <span> tokens. */
  renderLine(text) {
    return Highlight.tokenizeLine(text)
      .map(tok => tok.cls ? `<span class="${tok.cls}">${Highlight.escape(tok.text)}</span>` : Highlight.escape(tok.text))
      .join("");
  }
};
