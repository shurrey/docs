// Attempt to use actual Box UI Elements
// This tries to access the global Box object if available

const ContentPreview = (props) => {
  // Check if Box UI Elements is available globally
  if (typeof window !== 'undefined' && window.Box && window.Box.ContentPreview) {
    const BoxContentPreview = window.Box.ContentPreview;
    return React.createElement(BoxContentPreview, props);
  }

  // Fallback to loading from node_modules if possible
  try {
    // This might work if Mintlify allows dynamic imports
    const { ContentPreview: BoxContentPreview } = require('box-ui-elements');
    return React.createElement(BoxContentPreview, props);
  } catch (error) {
    console.warn('Box UI Elements not available:', error.message);
  }

  // Final fallback
  return (
    <div style={{
      border: '2px dashed #0061d5',
      borderRadius: '8px',
      padding: '40px',
      textAlign: 'center',
      backgroundColor: '#f6fafd',
      color: '#002947'
    }}>
      <h3 style={{ margin: '0 0 16px 0', color: '#0061d5' }}>
        📄 Box Content Preview
      </h3>
      <p style={{ margin: '8px 0', fontSize: '14px' }}>
        <strong>File ID:</strong> {props.fileId || 'Not specified'}
      </p>
      <p style={{ margin: '8px 0', fontSize: '14px' }}>
        <strong>Status:</strong> Ready to integrate
      </p>
      <div style={{
        marginTop: '20px',
        padding: '12px',
        backgroundColor: '#e3f2fd',
        borderRadius: '4px',
        fontSize: '12px'
      }}>
        💡 <strong>Integration Note:</strong> This component is ready for Box UI Elements integration.
        The actual preview will appear when properly configured with authentication.
      </div>
    </div>
  );
};

export { ContentPreview };