export default function ChatHistory({ chatHistory, clearChatHistory }) {
  return (
    <section className="chat-history-card page-section">
      <div className="section-heading">
        <div>
          <p className="small-label">CONVERSATION</p>
          <h3>Previous Questions</h3>
        </div>

        {chatHistory.length > 0 && (
          <button className="clear-chat-button" onClick={clearChatHistory}>
            Clear Chat
          </button>
        )}
      </div>

      {chatHistory.length === 0 ? (
        <div className="empty-alert">
          <div className="empty-icon">💬</div>
          <div>
            <strong>No previous conversations</strong>
            <p>Your Atmosera questions will appear here.</p>
          </div>
        </div>
      ) : (
        <div className="chat-history-list">
          {chatHistory.map((chat) => (
            <div className="conversation-item" key={chat.id}>
              <div className="user-message">
                <div className="message-label">
                  <span>👤</span>
                  <strong>You</strong>
                </div>
                <p>{chat.question}</p>
              </div>

              <div className="assistant-message">
                <div className="message-label">
                  <span>🤖</span>
                  <strong>Atmosera</strong>
                </div>
                <p>{chat.answer}</p>

                <div className="conversation-meta">
                  <span>📍 {chat.location}</span>
                  <span>🌐 {chat.language}</span>
                  <span>
                    {new Date(chat.timestamp).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

