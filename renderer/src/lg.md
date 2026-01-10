@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&family=JetBrains+Mono&display=swap');

:root {
    --accent-blue: #007aff;
    --accent-cyan: #00f2ff;
    --accent-purple: #7000ff;
    --bg-dark: #020617;
    --glass: rgba(255, 255, 255, 0.03);
    --glass-border: rgba(255, 255, 255, 0.08);
    --text-main: #f8fafc;
    --text-muted: #94a3b8;
    --footer-height: 72px;
}

* { box-sizing: border-box; font-family: 'Inter', sans-serif; }

html, body {
    height: 100%;
    overflow: hidden;
    margin: 0;
    background: radial-gradient(circle at 50% 0%, #1e293b 0%, #020617 100%);
    color: var(--text-main);
}

#app {
    max-width: 1600px;
    margin: 0 auto;
    padding: 24px;
    height: calc(100vh - var(--footer-height));
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

/* Glassmorphism Cards */
.statCard, .yearCard, #landingWhite, .modalBox {
    background: var(--glass) !important;
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid var(--glass-border) !important;
    border-radius: 20px !important;
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.4) !important;
    position: relative;
    overflow: hidden;
    transition: transform 0.3s ease, border-color 0.3s ease;
}

.statCard:hover, .yearCard:hover {
    transform: translateY(-5px);
    border-color: var(--accent-cyan) !important;
    box-shadow: 0 0 25px rgba(0, 242, 255, 0.1) !important;
}

/* Neon Side-Accent */
.statCard::before {
    content: "";
    position: absolute;
    top: 0; left: 0; width: 3px; height: 100%;
    background: linear-gradient(to bottom, var(--accent-blue), var(--accent-purple));
    box-shadow: 2px 0 10px rgba(0, 122, 255, 0.5);
}

/* Typography */
.yearTitle { font-size: 28px; font-weight: 800; color: #fff; margin-bottom: 8px; }
.yearMeta { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--text-muted); text-transform: uppercase; }

/* Futuristic Buttons */
button, .futuristic-btn {
    background: linear-gradient(135deg, var(--accent-blue), #004fb1) !important;
    border: none !important;
    border-radius: 10px !important;
    color: white !important;
    font-weight: 600 !important;
    padding: 12px 24px;
    text-transform: uppercase;
    font-size: 11px !important;
    letter-spacing: 1.5px;
    cursor: pointer;
    box-shadow: 0 4px 15px rgba(0, 122, 255, 0.3) !important;
    transition: all 0.2s ease;
}

button:hover {
    filter: brightness(1.2);
    box-shadow: 0 0 25px rgba(0, 122, 255, 0.5) !important;
    transform: scale(1.02);
}

/* Footer HUD */
.app-footer {
    height: var(--footer-height);
    background: rgba(15, 23, 42, 0.9);
    backdrop-filter: blur(20px);
    border-top: 1px solid var(--glass-border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 40px;
    position: fixed;
    bottom: 0; width: 100%; z-index: 100;
}

/* Scrollbar */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-thumb { background: var(--glass-border); border-radius: 10px; }
::-webkit-scrollbar-thumb:hover { background: var(--accent-blue); }