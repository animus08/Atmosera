import ChatHistory from "./ChatHistory";

export default function AssistantView({
  question,
  setQuestion,
  language,
  setLanguage,
  aiAnswer,
  aiLoading,
  onAskWeatherGPT,
  chatHistory,
  clearChatHistory,
}) {
  return (
    <>
      <section className="assistant-card page-section">
        <div className="assistant-icon">🤖</div>

        <div className="assistant-content">
          <p className="small-label">ATMOSERA AI</p>
          <h3>Ask Atmosera</h3>
          <p>
            Ask questions about the current weather and get intelligent
            recommendations.
          </p>
        </div>

        <div className="language-selector">
          <label htmlFor="language">Response language</label>
          <select
            id="language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="English">English</option>
            <option value="Hindi">हिन्दी (Hindi)</option>
          </select>
        </div>

        <div className="ai-chat-area">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onAskWeatherGPT();
              }
            }}
            placeholder="Example: Should I water my crops tomorrow? / क्या कल बारिश होगी?"
            rows="4"
          />

          <button
            className="assistant-button"
            onClick={onAskWeatherGPT}
            disabled={aiLoading}
          >
            {aiLoading ? "Thinking..." : "Ask Atmosera →"}
          </button>
        </div>

        {aiAnswer && (
          <div className="ai-response">
            <div className="ai-response-header">
              <span>🤖</span>
              <strong>Atmosera</strong>
            </div>
            <p>{aiAnswer}</p>
          </div>
        )}
      </section>

      <ChatHistory
        chatHistory={chatHistory}
        clearChatHistory={clearChatHistory}
      />
    </>
  );
}

