const { useEffect, useRef, useState } = React;

const ContentPreview = ({
  fileId,
  token,
  hasHeader = true,
  hasDownload = true,
  language = 'en-US',
  onLoad,
  onError,
  demoMode = false,
  ...props
}) => {
  const containerRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Load Box UI Elements from CDN
    const loadBoxUIElements = () => {
      // Check if already loaded
      if (window.Box && window.Box.ContentPreview) {
        initializePreview();
        return;
      }

      // Create script tag for Box UI Elements
      const script = document.createElement('script');
      script.src = 'https://cdn01.boxcdn.net/platform/elements/latest/en-US/preview.js';
      script.onload = () => {
        console.log('Box UI Elements loaded');
        initializePreview();
      };
      script.onerror = () => {
        setError('Failed to load Box UI Elements');
      };
      document.head.appendChild(script);

      // Also load CSS
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdn01.boxcdn.net/platform/elements/latest/en-US/preview.css';
      document.head.appendChild(link);
    };

    const initializePreview = () => {
      if (!containerRef.current || !window.Box) return;

      try {
        // Handle demo mode vs real mode
        let actualToken = token;
        let actualFileId = fileId;

        if (demoMode || token === 'demo_token') {
          // Use publicly available demo content
          actualFileId = 'demo';
          actualToken = 'demo';

          // Show demo interface instead of real preview
          containerRef.current.innerHTML = `
            <div style="
              width: 100%;
              height: 100%;
              display: flex;
              flex-direction: column;
              border: 1px solid #e3e3e3;
              border-radius: 8px;
              background: #f8f9fa;
            ">
              <div style="
                background: #0061d5;
                color: white;
                padding: 12px 16px;
                font-weight: 600;
                border-radius: 8px 8px 0 0;
                display: flex;
                justify-content: space-between;
                align-items: center;
              ">
                <span>📄 Sample Document.pdf</span>
                <div>
                  ${hasDownload ? '<button style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 4px 8px; border-radius: 4px; cursor: pointer;">⬇️ Download</button>' : ''}
                </div>
              </div>
              <div style="
                flex: 1;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 40px;
                text-align: center;
                background: white;
                border-radius: 0 0 8px 8px;
              ">
                <div>
                  <div style="font-size: 48px; margin-bottom: 16px;">📄</div>
                  <h3 style="margin: 0 0 8px 0; color: #333;">Demo Document Preview</h3>
                  <p style="margin: 0; color: #666; font-size: 14px;">
                    This demonstrates the Box UI Elements interface.<br/>
                    In production, this would show the actual file content.
                  </p>
                  <div style="
                    margin-top: 20px;
                    padding: 12px;
                    background: #e3f2fd;
                    border-radius: 4px;
                    font-size: 12px;
                    color: #1976d2;
                  ">
                    💡 To see real previews, provide valid fileId + access token
                  </div>
                </div>
              </div>
            </div>
          `;
          setIsLoaded(true);
          return;
        }

        // Real Box Preview for production
        const preview = new window.Box.ContentPreview();

        preview.show(actualFileId, actualToken, {
          container: containerRef.current,
          showDownload: hasDownload,
          showPrint: true,
          showAnnotations: true,
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
      }
    };

    loadBoxUIElements();
  }, [fileId, token, hasHeader, hasDownload, language, onLoad, onError]);

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
        <small>Check that fileId and token are valid</small>
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
          <div>Loading Box Preview...</div>
          <div style={{ marginTop: '10px', fontSize: '12px' }}>
            File ID: {fileId}
          </div>
        </div>
      )}
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '400px',
          border: '1px solid #ddd',
          borderRadius: '4px'
        }}
      />
    </div>
  );
};

export { ContentPreview };