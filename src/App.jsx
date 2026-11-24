import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const socket = io({
  autoConnect: false,
});

function formatTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export default function App() {
  const [messages, setMessages] = useState([]);
  const [activeUsers, setActiveUsers] = useState(0);
  const [connection, setConnection] = useState("connecting");
  const [announcement, setAnnouncement] = useState("");
  const [username, setUsername] = useState(
    () => localStorage.getItem("chat-username") || "",
  );
  const [draft, setDraft] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    const addSystemMessage = (text) => {
      setMessages((current) => [
        ...current,
        {
          id: `${Date.now()}-${Math.random()}`,
          type: "system",
          text,
          timestamp: new Date().toISOString(),
        },
      ]);
    };

    const onConnect = () => setConnection("connected");
    const onDisconnect = () => setConnection("disconnected");
    const onActive = (count) => setActiveUsers(count);
    const onChat = (text) => addSystemMessage(text);
    const onJoin = (text) => addSystemMessage(text);
    const onAnnouncement = (text) => setAnnouncement(text);
    const onMessage = (message) => {
      if (typeof message === "string") {
        addSystemMessage(message);
        return;
      }
      setMessages((current) => [...current, { ...message, type: "message" }]);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("active", onActive);
    socket.on("chat", onChat);
    socket.on("join", onJoin);
    socket.on("announce", onAnnouncement);
    socket.on("msg", onMessage);
    socket.connect();

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("active", onActive);
      socket.off("chat", onChat);
      socket.off("join", onJoin);
      socket.off("announce", onAnnouncement);
      socket.off("msg", onMessage);
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function saveUsername(value) {
    setUsername(value);
    localStorage.setItem("chat-username", value);
  }

  function sendMessage(event) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || connection !== "connected") return;

    socket.emit("msg", {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      text,
      username: username.trim() || "Guest",
    });
    setDraft("");
  }

  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Chatter home">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M5 18.5 3.8 21l4.3-1.1c1.2.6 2.5.9 3.9.9 5.3 0 9.5-3.8 9.5-8.5S17.3 3.8 12 3.8 2.5 7.6 2.5 12c0 2.5 1 4.7 2.5 6.5Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
              <path d="M8 12h.01M12 12h.01M16 12h.01" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </span>
          <span>chatter<span className="brand-period">.</span></span>
        </a>
        <div className="topbar-note">
          <span className="sparkle" aria-hidden="true">✦</span>
          good conversations start here
        </div>
        <div className="profile-chip">
          <span className="profile-avatar">{(username.trim()[0] || "G").toUpperCase()}</span>
          <span>{username.trim() || "Guest"}</span>
        </div>
      </header>

      <section className="chat-layout" aria-label="Chat room">
        <aside className="room-panel">
          <div className="room-heading">
            <span className="room-icon" aria-hidden="true">✳</span>
            <span className="eyebrow">YOUR SPACE</span>
          </div>
          <h1>The<br />Common Room<span className="heading-period">.</span></h1>
          <p className="room-description">
            A little corner of the internet to say hello, share a thought, or just be here.
          </p>

          <div className="room-divider" />
          <div className="room-stats">
            <span className="online-indicator" />
            <span className="stat-count">{activeUsers}</span>
            <span>{activeUsers === 1 ? "person" : "people"} here now</span>
          </div>
          <div className="room-guidelines">
            <span className="guideline-icon" aria-hidden="true">♡</span>
            <p>Keep it kind.<br />Make someone&apos;s day.</p>
          </div>
          <div className="room-footer">
            <span className={`connection-dot ${connection}`} />
            {connection === "connected" ? "Connected and listening" : "Reconnecting to the room…"}
          </div>
        </aside>

        <section className="conversation">
          <div className="conversation-header">
            <div className="conversation-title">
              <span className="room-icon small" aria-hidden="true">✳</span>
              <div>
                <h2>The Common Room</h2>
                <p>A shared space for everyone</p>
              </div>
            </div>
            <div className="member-count" aria-label={`${activeUsers} people online`}>
              <span className="mini-avatars" aria-hidden="true">
                <span>✦</span><span>◉</span><span>♥</span>
              </span>
              <span>{activeUsers} online</span>
            </div>
          </div>

          {announcement && (
            <div className="announcement">
              <span aria-hidden="true">📣</span>
              <span>{announcement}</span>
              <button
                type="button"
                className="dismiss-announcement"
                onClick={() => setAnnouncement("")}
                aria-label="Dismiss announcement"
              >
                ×
              </button>
            </div>
          )}

          <div className="message-list" aria-live="polite">
            {messages.length === 0 ? (
              <div className="empty-state">
                <div className="empty-illustration" aria-hidden="true">
                  <span className="bubble bubble-one">hey!</span>
                  <span className="bubble bubble-two">✦</span>
                  <span className="empty-flower">✿</span>
                </div>
                <h3>It&apos;s nice and quiet in here.</h3>
                <p>Be the first to break the silence. Say hello!</p>
              </div>
            ) : (
              <div className="messages">
                {messages.map((message) => {
                  if (message.type === "system") {
                    return (
                      <div className="system-message" key={message.id}>
                        <span className="system-star" aria-hidden="true">✦</span>
                        {message.text}
                      </div>
                    );
                  }
                  const isOwn = message.senderId === socket.id;
                  return (
                    <article
                      className={`message-row${isOwn ? " own" : ""}`}
                      key={message.id}
                    >
                      {!isOwn && (
                        <span className="message-avatar">
                          {(message.username?.[0] || "G").toUpperCase()}
                        </span>
                      )}
                      <div className="message-content">
                        <div className="message-meta">
                          <span>{isOwn ? "You" : message.username || "Guest"}</span>
                          <time dateTime={message.timestamp}>
                            {formatTime(message.timestamp)}
                          </time>
                        </div>
                        <p className="message-bubble">{message.text}</p>
                      </div>
                    </article>
                  );
                })}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          <form className="composer" onSubmit={sendMessage}>
            <div className="composer-fields">
              <input
                className="name-input"
                type="text"
                value={username}
                onChange={(event) => saveUsername(event.target.value.slice(0, 24))}
                placeholder="Your name"
                aria-label="Your name"
                maxLength={24}
              />
              <span className="input-divider" />
              <input
                className="message-input"
                type="text"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={connection === "connected" ? "Write something lovely…" : "Connecting to chat…"}
                aria-label="Type a message"
                maxLength={2000}
                disabled={connection !== "connected"}
              />
              <button
                className="send-button"
                type="submit"
                disabled={!draft.trim() || connection !== "connected"}
                aria-label="Send message"
              >
                <span>Send</span>
                <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="m3.5 10 12-6-3.7 12-2.2-5.1L3.5 10Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                  <path d="m9.6 10.9 5.9-6.1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <p className="composer-hint">Press <kbd>Enter</kbd> to send <span>·</span> Be kind to each other</p>
          </form>
        </section>
      </section>
      <footer className="page-footer">
        <span>Made for good conversations</span>
        <span className="footer-heart" aria-hidden="true">♥</span>
      </footer>
    </main>
  );
}
