// Use React from global scope (provided by Mintlify)
const { useState, useEffect } = React;

// Choice State Manager
// Handles persistent choice storage and event management for Choose/Choice components
class ChoiceStateManager {
  constructor() {
    this.storageKey = 'com.box.developer.choice_events';
    this.listeners = new Map();
    this.state = this.loadState();
  }

  loadState() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.warn('Failed to load choice state:', error);
      return {};
    }
  }

  saveState() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.state));
    } catch (error) {
      console.warn('Failed to save choice state:', error);
    }
  }

  trigger(option, value) {
    const oldValue = this.state[option];
    this.state[option] = value;
    this.saveState();

    const optionListeners = this.listeners.get(option) || [];
    optionListeners.forEach(listener => {
      try {
        listener(value, oldValue);
      } catch (error) {
        console.warn('Choice listener error:', error);
      }
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('choiceStateUpdate', {
        detail: { option, value, oldValue }
      }));
    }
  }

  listen(option, callback) {
    if (!this.listeners.has(option)) {
      this.listeners.set(option, []);
    }
    this.listeners.get(option).push(callback);

    return () => {
      const callbacks = this.listeners.get(option) || [];
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    };
  }

  getValue(option) {
    return this.state[option];
  }

  hasValue(option) {
    return option in this.state && this.state[option] !== undefined && this.state[option] !== null;
  }

  matchesValues(option, values) {
    const currentValue = this.getValue(option);
    if (!currentValue) return false;
    if (!values || typeof values !== 'string') return false;

    const allowedValues = values.split(',').map(v => v.trim());
    return allowedValues.includes(currentValue);
  }

  getState() {
    return { ...this.state };
  }
}

// Initialize global state manager and utility functions
if (typeof window !== 'undefined' && !window.choiceStateManager) {
  window.choiceStateManager = new ChoiceStateManager();

  window.triggerChoice = function(option, value) {
    window.choiceStateManager?.trigger(option, value);
  };

  window.getChoiceValue = function(option) {
    return window.choiceStateManager?.getValue(option);
  };

  window.listenToChoice = function(option, callback) {
    return window.choiceStateManager?.listen(option, callback) || (() => {});
  };

  window.hasChoiceValue = function(option) {
    return window.choiceStateManager?.hasValue(option) || false;
  };

  window.matchesChoiceValues = function(option, values) {
    return window.choiceStateManager?.matchesValues(option, values) || false;
  };
}

// Choose Component - Creates selectable option cards
export const Choose = ({
  option,
  value,
  color = '',
  children,
  ...props
}) => {
  const [isSelected, setIsSelected] = useState(false);
  const [hasOptionTriggered, setHasOptionTriggered] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check initial state
    const currentValue = window.getChoiceValue?.(option);
    const optionTriggered = window.hasChoiceValue?.(option) || false;

    setIsSelected(currentValue === value);
    setHasOptionTriggered(optionTriggered);

    // Listen for state changes
    const unsubscribe = window.listenToChoice?.(option, (newValue) => {
      setIsSelected(newValue === value);
      setHasOptionTriggered(true);
    }) || (() => {});

    return unsubscribe;
  }, [option, value]);

  useEffect(() => {
    // Detect initial dark mode
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark') ||
                     window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(isDark);
    };

    checkDarkMode();

    // Listen for dark mode changes via media query
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleMediaChange = (e) => {
      if (!document.documentElement.classList.contains('dark') && !document.documentElement.classList.contains('light')) {
        setIsDarkMode(e.matches);
      }
    };
    mediaQuery.addEventListener('change', handleMediaChange);

    // Listen for class changes on documentElement (Mintlify theme toggle)
    const observer = new MutationObserver(() => {
      checkDarkMode();
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => {
      mediaQuery.removeEventListener('change', handleMediaChange);
      observer.disconnect();
    };
  }, []);

  const handleClick = () => {
    window.triggerChoice?.(option, value);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  const getColorStyles = () => {
    const baseStyles = {
      border: isDarkMode ? '1px dashed #4a5568' : '1px dashed #e1e5e9',
      cursor: 'pointer',
      padding: '20px',
      position: 'relative',
      backgroundColor: isDarkMode ? '#2d3748' : '#f8f9fa',
      outline: 'none',
      height: '100%',
      borderRadius: '8px',
      transition: 'all 0.2s ease',
      display: 'flex',
      flexDirection: 'column'
    };

    const colorMap = {
      green: {
        light: { backgroundColor: '#e8f5e8', borderColor: '#4caf50' },
        dark: { backgroundColor: '#1a3a2a', borderColor: '#66bb6a' }
      },
      red: {
        light: { backgroundColor: '#ffeaea', borderColor: '#f44336' },
        dark: { backgroundColor: '#3a1a1a', borderColor: '#ef5350' }
      },
      blue: {
        light: { backgroundColor: '#e3f2fd', borderColor: '#2196f3' },
        dark: { backgroundColor: '#1a2a3a', borderColor: '#42a5f5' }
      },
    };

    const colorStyles = colorMap[color]?.[isDarkMode ? 'dark' : 'light'] || {};

    if (isSelected) {
      return {
        ...baseStyles,
        ...colorStyles,
        borderStyle: 'solid',
        borderWidth: '3px',
        borderColor: colorStyles.borderColor || (isDarkMode ? '#42a5f5' : '#0061d5'),
        backgroundColor: colorStyles.backgroundColor || (isDarkMode ? '#1a2a3a' : '#e3f2fd'),
        boxShadow: isDarkMode
          ? '0 2px 8px rgba(66, 165, 245, 0.3)'
          : '0 2px 8px rgba(0, 97, 213, 0.3)',
        transform: 'scale(1.02)'
      };
    }

    if (hasOptionTriggered && !isSelected) {
      return {
        ...baseStyles,
        ...colorStyles,
        opacity: 0.5
      };
    }

    return {
      ...baseStyles,
      ...colorStyles
    };
  };

  const iconStyles = {
    float: 'left',
    position: 'relative',
    top: '2px',
    marginRight: '12px',
    width: '20px',
    height: '20px',
    color: isSelected
      ? (isDarkMode ? '#42a5f5' : '#0061d5')
      : (isDarkMode ? '#a0aec0' : '#666')
  };

  return (
    <div
      onClick={handleClick}
      style={getColorStyles()}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      {...props}
    >
      <div style={iconStyles}>
        {isSelected ? (
          <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '100%', height: '100%' }}>
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '100%', height: '100%' }}>
            <circle cx="12" cy="12" r="10" />
          </svg>
        )}
      </div>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
};

// Choice Component - Shows/hides content based on selections
export const Choice = ({
  option,
  value,
  color = '',
  unset = false,
  lazy = false,
  children,
  ...props
}) => {
  const [shouldShow, setShouldShow] = useState(false);
  const [hasEverShown, setHasEverShown] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const updateVisibility = () => {
      const hasOptionValue = window.hasChoiceValue?.(option) || false;
      const matchesValue = window.matchesChoiceValues?.(option, value) || false;

      let show = false;

      if (unset && !hasOptionValue) {
        show = true;
      } else if (!unset && matchesValue) {
        show = true;
      }

      setShouldShow(show);
      if (show && !hasEverShown) {
        setHasEverShown(true);
      }
    };

    updateVisibility();

    const unsubscribe = window.listenToChoice?.(option, updateVisibility) || (() => {});

    return unsubscribe;
  }, [option, value, unset, hasEverShown]);

  useEffect(() => {
    // Detect initial dark mode
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark') ||
                     window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(isDark);
    };

    checkDarkMode();

    // Listen for dark mode changes via media query
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleMediaChange = (e) => {
      if (!document.documentElement.classList.contains('dark') && !document.documentElement.classList.contains('light')) {
        setIsDarkMode(e.matches);
      }
    };
    mediaQuery.addEventListener('change', handleMediaChange);

    // Listen for class changes on documentElement (Mintlify theme toggle)
    const observer = new MutationObserver(() => {
      checkDarkMode();
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => {
      mediaQuery.removeEventListener('change', handleMediaChange);
      observer.disconnect();
    };
  }, []);

  const getColorStyles = () => {
    const baseStyles = {
      border: isDarkMode ? '1px dashed #4a5568' : '1px dashed #e1e5e9',
      padding: '20px',
      marginBottom: '20px',
      borderRadius: '8px',
      backgroundColor: isDarkMode ? '#1a202c' : '#ffffff'
    };

    const colorMap = {
      green: {
        light: { backgroundColor: '#e8f5e8', borderColor: '#4caf50' },
        dark: { backgroundColor: '#1a3a2a', borderColor: '#66bb6a' }
      },
      red: {
        light: { backgroundColor: '#ffeaea', borderColor: '#f44336' },
        dark: { backgroundColor: '#3a1a1a', borderColor: '#ef5350' }
      },
      blue: {
        light: { backgroundColor: '#e3f2fd', borderColor: '#2196f3' },
        dark: { backgroundColor: '#1a2a3a', borderColor: '#42a5f5' }
      },
      none: { backgroundColor: 'transparent', padding: '0', margin: '0', border: 'none' },
    };

    const colorStyles = color !== 'none'
      ? (colorMap[color]?.[isDarkMode ? 'dark' : 'light'] || {})
      : colorMap.none;

    return {
      ...baseStyles,
      ...colorStyles
    };
  };

  if (lazy && !hasEverShown && !shouldShow) {
    return null;
  }

  return (
    <div
      style={{
        ...getColorStyles(),
        display: shouldShow ? 'block' : 'none'
      }}
      {...props}
    >
      {children}
    </div>
  );
};

// Grid Component - Helper for laying out Choose options and other content
export const Grid = ({ columns = 2, compact = false, children, ...props }) => {
  const gridStyles = {
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap: compact ? '8px' : '16px',
    marginBottom: compact ? '10px' : '20px'
  };

  return (
    <div style={gridStyles} {...props}>
      {children}
    </div>
  );
};

// Trigger Component - Triggers choice events when clicked
export const Trigger = ({ option, value, children, ...props }) => {
  const handleClick = () => {
    window.triggerChoice?.(option, value);
  };

  return (
    <div onClick={handleClick} style={{ cursor: 'pointer' }} {...props}>
      {children}
    </div>
  );
};

// Observe Component - Shows/hides content based on choice state
export const Observe = ({ option, value, children, ...props }) => {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    const updateVisibility = () => {
      const matches = window.matchesChoiceValues?.(option, value) || false;
      setShouldShow(matches);
    };

    updateVisibility();

    const unsubscribe = window.listenToChoice?.(option, updateVisibility) || (() => {});

    return unsubscribe;
  }, [option, value]);

  if (!shouldShow) {
    return null;
  }

  return <div {...props}>{children}</div>;
};

// Debug Component - Shows current choice state
export const ChoiceDebug = ({ option }) => {
  const [currentValue, setCurrentValue] = useState(null);
  const [allState, setAllState] = useState({});
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const updateState = () => {
      if (window.choiceStateManager) {
        setCurrentValue(window.choiceStateManager.getValue(option));
        setAllState(window.choiceStateManager.getState());
      }
    };

    updateState();

    const unsubscribe = window.listenToChoice?.(option, updateState) || (() => {});

    const handleGlobalUpdate = () => updateState();
    window.addEventListener('choiceStateUpdate', handleGlobalUpdate);

    return () => {
      unsubscribe();
      window.removeEventListener('choiceStateUpdate', handleGlobalUpdate);
    };
  }, [option]);

  useEffect(() => {
    // Detect initial dark mode
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark') ||
                     window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(isDark);
    };

    checkDarkMode();

    // Listen for dark mode changes via media query
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleMediaChange = (e) => {
      if (!document.documentElement.classList.contains('dark') && !document.documentElement.classList.contains('light')) {
        setIsDarkMode(e.matches);
      }
    };
    mediaQuery.addEventListener('change', handleMediaChange);

    // Listen for class changes on documentElement (Mintlify theme toggle)
    const observer = new MutationObserver(() => {
      checkDarkMode();
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => {
      mediaQuery.removeEventListener('change', handleMediaChange);
      observer.disconnect();
    };
  }, []);

  return (
    <div
      style={{
        padding: '10px',
        backgroundColor: isDarkMode ? '#2d3748' : '#f5f5f5',
        border: isDarkMode ? '1px solid #4a5568' : '1px solid #ddd',
        borderRadius: '4px',
        fontSize: '12px',
        fontFamily: 'monospace',
        marginTop: '20px',
        color: isDarkMode ? '#e2e8f0' : 'inherit'
      }}
    >
      <strong>Choice Debug:</strong>
      <br />
      Option: {option}
      <br />
      Current Value: {currentValue || 'undefined'}
      <br />
      All State: {JSON.stringify(allState, null, 2)}
    </div>
  );
};
