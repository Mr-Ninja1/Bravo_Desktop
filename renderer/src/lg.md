/**
 * Injects an animated, aggressive PCB trace background into the app root.
 */
function injectCyberTracesBackground() {
  try {
    if (document.getElementById('cyberTracesStyles')) return;

    // Optimized SVG with glowing traces and animated pulses
    const svg = `
    <svg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'>
      <defs>
        <filter id='glow'>
          <feGaussianBlur stdDeviation='1.5' result='coloredBlur'/>
          <feMerge>
            <feMergeNode in='coloredBlur'/><feMergeNode in='SourceGraphic'/>
          </feMerge>
        </filter>
      </defs>
      <g stroke='%2300f3ff' stroke-width='1' fill='none' opacity='0.2' filter='url(#glow)'>
        <!-- Main horizontal traces -->
        <path d='M0 100 h150 l50 50 h200' />
        <path d='M0 300 h100 l50 -50 h250' />
        <!-- Vertical connectors -->
        <path d='M200 0 v150' />
        <path d='M150 400 v-150 l-50 -50' />
        <!-- Solder Nodes -->
        <circle cx='150' cy='100' r='3' fill='%2300f3ff' />
        <circle cx='200' cy='150' r='3' fill='%23bd00ff' />
        <circle cx='100' cy='300' r='3' fill='%2300f3ff' />
      </g>
    </svg>`;

    const css = `
      #cyberTracesBG {
        position: fixed;
        inset: 0;
        z-index: -1;
        pointer-events: none;
        background-color: #020205;
        background-image: 
          linear-gradient(rgba(0, 243, 255, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 243, 255, 0.03) 1px, transparent 1px),
          url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}");
        background-size: 100px 100px, 100px 100px, 400px 400px;
        opacity: 0.4;
      }

      /* Scanning line overlay */
      #cyberTracesBG::after {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(to bottom, transparent, rgba(0, 243, 255, 0.1), transparent);
        background-size: 100% 200px;
        animation: cyberScan 8s linear infinite;
      }

      @keyframes cyberScan {
        from { background-position: 0 -200px; }
        to { background-position: 0 100%; }
      }

      /* Ensure the app is transparent enough to see the traces */
      body { background: transparent !important; }
      #app { background: rgba(5, 7, 12, 0.8) !important; backdrop-filter: blur(12px); }
    `;

    // Create a dedicated background div so we don't interfere with body::before
    const bgDiv = document.createElement('div');
    bgDiv.id = 'cyberTracesBG';
    document.body.prepend(bgDiv);

    const st = document.createElement('style');
    st.id = 'cyberTracesStyles';
    st.innerHTML = css;
    document.head.appendChild(st);
    
    console.log('⚡ Cyber Protocol: Background Traces Online');
  } catch (e) { 
    console.warn('injectCyberTracesBackground failed', e); 
  }
}

// Initialize on load
window.addEventListener('DOMContentLoaded', injectCyberTracesBackground);

One small tip: Make sure your main #app or container has some transparency (e.g., rgba(0,0,0,0.7)) so the traces can shine through from the background!