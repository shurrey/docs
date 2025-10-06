const { useEffect, useRef, useState } = React;

const ContentPreview = ({
  fileId,
  demoFileId = 'sample-doc',
  hasHeader = true,
  hasDownload = true,
  language = 'en-US',
  onLoad,
  onError,
  useSecureTokens = true,
  ...props
}) => {
  const containerRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(null);

  // Secure token fetching function
  const fetchSecureToken = async () => {
    try {
      // This would call your secure backend endpoint
      // Backend generates short-lived downscoped tokens
      const response = await fetch('/api/box/demo-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileId: fileId || demoFileId,
          permissions: ['read'], // Minimal permissions
          durationSeconds: 3600 // 1 hour expiry
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get secure token');
      }

      const data = await response.json();
      return data.accessToken;
    } catch (err) {
      // Fallback to demo mode if token service fails
      console.warn('Secure token service unavailable, using demo mode');
      return null;
    }
  };

  useEffect(() => {
    const initializePreview = async () => {
      if (!containerRef.current) return;

      // Get secure token if needed
      let actualToken = null;
      if (useSecureTokens) {
        actualToken = await fetchSecureToken();
      }

      // Load Box UI Elements
      if (!window.Box) {
        const script = document.createElement('script');
        script.src = 'https://cdn01.boxcdn.net/platform/elements/latest/en-US/preview.js';
        script.onload = () => setupPreview(actualToken);
        document.head.appendChild(script);

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdn01.boxcdn.net/platform/elements/latest/en-US/preview.css';
        document.head.appendChild(link);
      } else {
        setupPreview(actualToken);
      }
    };

    const setupPreview = (secureToken) => {
      if (!window.Box || !containerRef.current) return;

      // Demo mode if no secure token available
      if (!secureToken) {
        showDemoInterface();
        return;
      }

      try {
        const preview = new window.Box.ContentPreview();

        preview.show(fileId || demoFileId, secureToken, {
          container: containerRef.current,
          showDownload: hasDownload,
          showPrint: false, // Disable for demo
          showAnnotations: false, // Disable for demo
          header: hasHeader ? 'light' : 'none',
          locale: language
        });

        preview.addListener('load', (data) => {
          setIsLoaded(true);
          if (onLoad) onLoad(data);
        });

        preview.addListener('error', (err) => {
          setError(err.message || 'Preview failed to load');
          if (onError) onError(err);
        });

      } catch (err) {
        setError(err.message);
        showDemoInterface();
      }
    };

    const showDemoInterface = () => {
      if (!containerRef.current) return;

      containerRef.current.innerHTML = `
        <div style="
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          border: 1px solid #e3e3e3;
          border-radius: 8px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          position: relative;
          overflow: hidden;
        ">
          <!-- Header -->
          <div style="
            background: rgba(0,0,0,0.2);
            padding: 12px 16px;
            font-weight: 600;
            display: flex;
            justify-content: space-between;
            align-items: center;
            backdrop-filter: blur(10px);
          ">
            <span>📄 Box_Developer_Guide.pdf</span>
            <div style="display: flex; gap: 8px;">
              ${hasDownload ? '<button style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">⬇️ Download</button>' : ''}
              <button style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">🔍 Zoom</button>
            </div>
          </div>

          <!-- Content Area -->
          <div style="
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 40px;
            text-align: center;
            background: white;
            color: #333;
            position: relative;
          ">
            <!-- Mock Document -->
            <div style="
              width: 80%;
              max-width: 400px;
              background: #fafafa;
              border: 1px solid #ddd;
              border-radius: 8px;
              padding: 30px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            ">
              <div style="height: 4px; background: #0061d5; margin-bottom: 20px; border-radius: 2px;"></div>
              <div style="height: 16px; background: #ddd; margin-bottom: 12px; border-radius: 2px; width: 70%;"></div>
              <div style="height: 12px; background: #eee; margin-bottom: 8px; border-radius: 2px; width: 90%;"></div>
              <div style="height: 12px; background: #eee; margin-bottom: 8px; border-radius: 2px; width: 85%;"></div>
              <div style="height: 12px; background: #eee; margin-bottom: 16px; border-radius: 2px; width: 75%;"></div>

              <div style="height: 12px; background: #eee; margin-bottom: 8px; border-radius: 2px; width: 95%;"></div>
              <div style="height: 12px; background: #eee; margin-bottom: 8px; border-radius: 2px; width: 80%;"></div>
              <div style="height: 12px; background: #eee; margin-bottom: 16px; border-radius: 2px; width: 70%;"></div>

              <div style="
                background: #e3f2fd;
                padding: 12px;
                border-radius: 4px;
                font-size: 11px;
                color: #1976d2;
                text-align: center;
              ">
                🔒 Secure Demo Mode<br/>
                Real files require authentication
              </div>
            </div>
          </div>
        </div>
      `;
      setIsLoaded(true);
    };

    initializePreview();
  }, [fileId, demoFileId, hasHeader, hasDownload, language, useSecureTokens]);

  if (error) {
    return (
      <div style={{
        border: '2px solid #ff4444',
        borderRadius: '8px',
        padding: '20px',
        backgroundColor: '#fff5f5',
        color: '#cc0000'
      }}>
        <h4>⚠️ Preview Error</h4>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', minHeight: '400px' }}>
      {!isLoaded && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          color: '#666'
        }}>
          <div>🔐 Initializing Secure Preview...</div>
          <div style={{ marginTop: '10px', fontSize: '12px' }}>
            File: {fileId || demoFileId}
          </div>
        </div>
      )}
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '400px',
          border: '1px solid #ddd',
          borderRadius: '8px'
        }}
      />
    </div>
  );
};

export { ContentPreview };