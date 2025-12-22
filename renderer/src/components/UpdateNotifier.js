import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

function UpdateBanner() {
  const [status, setStatus] = useState('idle'); // idle, available, downloaded, error
  const [info, setInfo] = useState(null);

  useEffect(() => {
    const api = (window && window.electronAPI && window.electronAPI.updates) ? window.electronAPI.updates : null;
    if (!api) return;

    const onAvailable = (data) => { setInfo(data || null); setStatus('available'); };
    const onDownloaded = (data) => { setInfo(data || null); setStatus('downloaded'); };

    try { api.onUpdateAvailable(onAvailable); } catch (e) {}
    try { api.onUpdateDownloaded(onDownloaded); } catch (e) {}

    return () => {
      // ipcRenderer.on handlers are not removed here because the exposed API
      // uses the renderer's `ipcRenderer.on` directly; leaving them is ok for app lifetime.
    };
  }, []);

  const apply = async () => {
    try {
      setStatus('applying');
      if (window && window.electronAPI && window.electronAPI.updates && typeof window.electronAPI.updates.applyUpdate === 'function') {
        await window.electronAPI.updates.applyUpdate();
      }
    } catch (e) {
      console.warn('Update apply failed', e);
      setStatus('error');
    }
  };

  if (status === 'idle') return null;

  const bannerStyle = {
    position: 'relative',
    margin: '8px auto',
    maxWidth: '1100px',
    padding: '8px 12px',
    borderRadius: 6,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: status === 'downloaded' ? '#10b981' : status === 'available' ? '#f59e0b' : '#ef4444',
    color: '#fff',
    boxShadow: '0 2px 6px rgba(0,0,0,0.12)'
  };

  return (
    React.createElement('div', { style: bannerStyle, role: 'status', 'aria-live': 'polite' },
      React.createElement('div', null, status === 'available' ? 'Update available — downloading...' : status === 'downloaded' ? 'Update ready — restart to install' : status === 'applying' ? 'Installing update...' : 'Update error'),
      React.createElement('div', null,
        status === 'downloaded' ? React.createElement('button', { onClick: apply, style: { marginLeft: 12, padding: '6px 10px', borderRadius: 6, border: 'none', cursor: 'pointer' } }, 'Restart & Install') : null
      )
    )
  );
}

export function mountUpdateNotifier() {
  try {
    const mount = document.getElementById('updateBanner');
    if (!mount) return;
    const root = createRoot(mount);
    root.render(React.createElement(UpdateBanner));
  } catch (e) {
    console.warn('mountUpdateNotifier failed', e);
  }
}

export default UpdateBanner;
