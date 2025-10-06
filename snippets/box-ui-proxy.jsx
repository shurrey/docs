const { useEffect, useRef, useState } = React;

const ContentPreview = ({
  fileId = 'sample-doc',
  hasHeader = true,
  hasDownload = true,
  language = 'en-US',
  onLoad,
  onError,
  useProxy = true,
  proxyUrl = '/api/box/proxy',
  ...props
}) => {
  const containerRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializePreview = async () => {
      if (!containerRef.current) return;

      // Load Box UI Elements
      if (!window.Box) {
        const script = document.createElement('script');
        script.src = 'https://cdn01.boxcdn.net/platform/elements/latest/en-US/preview.js';
        script.onload = () => setupPreview();
        document.head.appendChild(script);

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdn01.boxcdn.net/platform/elements/latest/en-US/preview.css';
        document.head.appendChild(link);
      } else {
        setupPreview();
      }
    };

    const setupPreview = () => {
      if (!window.Box || !containerRef.current) return;

      if (!useProxy) {
        showDemoInterface();
        return;
      }

      try {
        // Request interceptor - routes all API calls through our proxy
        const requestInterceptor = (config) => {
          console.log('Intercepting request:', config);

          // Only intercept Box API requests
          if (config.url && config.url.includes('api.box.com')) {
            // Route through our proxy instead of directly to Box API
            const originalUrl = config.url;
            const method = config.method || 'GET';

            // Replace Box API URL with our proxy URL
            config.url = proxyUrl;
            config.method = 'POST';

            // Send original request details to proxy
            config.data = {
              originalUrl,
              originalMethod: method,
              originalData: config.data,
              originalParams: config.params,
              originalHeaders: config.headers
            };

            // Set content type for proxy request
            config.headers = {
              'Content-Type': 'application/json',
              ...config.headers
            };

            // Clear original params since they're now in data
            delete config.params;
          }

          return config;
        };

        // Response interceptor - can modify responses from our proxy
        const responseInterceptor = (config) => {
          console.log('Intercepting response:', config);

          // Add any custom response handling here
          // For example, logging, error handling, data transformation

          return config;
        };

        const preview = new window.Box.ContentPreview();

        // Use a placeholder token since the proxy will handle real authentication
        const placeholderToken = 'proxy-handled';

        preview.show(fileId, placeholderToken, {
          container: containerRef.current,
          showDownload: hasDownload,
          showPrint: false,
          showAnnotations: false,
          header: hasHeader ? 'light' : 'none',
          locale: language,
          requestInterceptor: requestInterceptor,
          responseInterceptor: responseInterceptor
        });

        preview.addListener('load', (data) => {
          setIsLoaded(true);
          if (onLoad) onLoad(data);
        });

        preview.addListener('error', (err) => {
          console.error('Preview error:', err);
          setError(err.message || 'Preview failed to load');
          showDemoInterface();
          if (onError) onError(err);
        });

      } catch (err) {
        console.error('Setup error:', err);
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
                🔗 Proxy Demo Mode<br/>
                Real files require backend proxy service
              </div>
            </div>
          </div>
        </div>
      `;
      setIsLoaded(true);
    };

    initializePreview();
  }, [fileId, hasHeader, hasDownload, language, useProxy, proxyUrl]);

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
        <small>Make sure your proxy service is running at {proxyUrl}</small>
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
          <div>🔗 Initializing Proxy Preview...</div>
          <div style={{ marginTop: '10px', fontSize: '12px' }}>
            File: {fileId}
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

// Content Explorer with proxy support
const ContentExplorer = ({
  folderId = '0',
  hasHeader = true,
  language = 'en-US',
  onLoad,
  onError,
  useProxy = true,
  proxyUrl = '/api/box/proxy',
  ...props
}) => {
  const containerRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeExplorer = async () => {
      if (!containerRef.current) return;

      // Load Box UI Elements
      if (!window.Box) {
        const script = document.createElement('script');
        script.src = 'https://cdn01.boxcdn.net/platform/elements/latest/en-US/explorer.js';
        script.onload = () => setupExplorer();
        document.head.appendChild(script);

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdn01.boxcdn.net/platform/elements/latest/en-US/explorer.css';
        document.head.appendChild(link);
      } else {
        setupExplorer();
      }
    };

    const setupExplorer = () => {
      if (!window.Box || !containerRef.current) return;

      try {
        // Request interceptor for explorer
        const requestInterceptor = (config) => {
          console.log('Explorer request interceptor:', config);

          if (config.url && config.url.includes('api.box.com')) {
            const originalUrl = config.url;
            const method = config.method || 'GET';

            config.url = proxyUrl;
            config.method = 'POST';
            config.data = {
              originalUrl,
              originalMethod: method,
              originalData: config.data,
              originalParams: config.params,
              originalHeaders: config.headers
            };
            config.headers = {
              'Content-Type': 'application/json',
              ...config.headers
            };
            delete config.params;
          }

          return config;
        };

        // Response interceptor for explorer
        const responseInterceptor = (config) => {
          console.log('Explorer response interceptor:', config);
          return config;
        };

        const explorer = new window.Box.ContentExplorer();
        const placeholderToken = 'proxy-handled';

        explorer.show(folderId, placeholderToken, {
          container: containerRef.current,
          header: hasHeader ? 'light' : 'none',
          locale: language,
          requestInterceptor: requestInterceptor,
          responseInterceptor: responseInterceptor
        });

        explorer.addListener('load', (data) => {
          setIsLoaded(true);
          if (onLoad) onLoad(data);
        });

        explorer.addListener('error', (err) => {
          setError(err.message || 'Explorer failed to load');
          if (onError) onError(err);
        });

      } catch (err) {
        setError(err.message);
      }
    };

    initializeExplorer();
  }, [folderId, hasHeader, language, useProxy, proxyUrl]);

  if (error) {
    return (
      <div style={{
        border: '2px solid #ff4444',
        borderRadius: '8px',
        padding: '20px',
        backgroundColor: '#fff5f5',
        color: '#cc0000'
      }}>
        <h4>⚠️ Explorer Error</h4>
        <p>{error}</p>
        <small>Make sure your proxy service is running at {proxyUrl}</small>
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
          🔗 Loading Content Explorer...
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

export { ContentPreview, ContentExplorer };