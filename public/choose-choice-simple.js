// Pure JavaScript Choose/Choice Components for Mintlify
// No React dependencies, no ES6 modules, works with any build system

(function() {
  'use strict';

  // Choice State Manager - handles persistent storage and events
  function ChoiceStateManager() {
    this.storageKey = 'com.box.developer.choice_events';
    this.listeners = new Map();
    this.state = this.loadState();
  }

  ChoiceStateManager.prototype.loadState = function() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.warn('Failed to load choice state:', error);
      return {};
    }
  };

  ChoiceStateManager.prototype.saveState = function() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.state));
    } catch (error) {
      console.warn('Failed to save choice state:', error);
    }
  };

  ChoiceStateManager.prototype.trigger = function(option, value) {
    const oldValue = this.state[option];
    this.state[option] = value;
    this.saveState();

    const optionListeners = this.listeners.get(option) || [];
    optionListeners.forEach(function(listener) {
      try {
        listener(value, oldValue);
      } catch (error) {
        console.warn('Choice listener error:', error);
      }
    });

    window.dispatchEvent(new CustomEvent('choiceStateUpdate', {
      detail: { option: option, value: value, oldValue: oldValue }
    }));
  };

  ChoiceStateManager.prototype.listen = function(option, callback) {
    if (!this.listeners.has(option)) {
      this.listeners.set(option, []);
    }
    this.listeners.get(option).push(callback);

    const self = this;
    return function() {
      const callbacks = self.listeners.get(option) || [];
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    };
  };

  ChoiceStateManager.prototype.getValue = function(option) {
    return this.state[option];
  };

  ChoiceStateManager.prototype.hasValue = function(option) {
    return option in this.state && this.state[option] !== undefined && this.state[option] !== null;
  };

  ChoiceStateManager.prototype.matchesValues = function(option, values) {
    const currentValue = this.getValue(option);
    if (!currentValue) return false;
    if (!values || typeof values !== 'string') return false;

    const allowedValues = values.split(',').map(function(v) { return v.trim(); });
    return allowedValues.includes(currentValue);
  };

  ChoiceStateManager.prototype.getState = function() {
    return Object.assign({}, this.state);
  };

  // Initialize global state manager if not exists
  if (typeof window !== 'undefined' && !window.choiceStateManager) {
    window.choiceStateManager = new ChoiceStateManager();

    // Global utility functions
    window.triggerChoice = function(option, value) {
      if (window.choiceStateManager) {
        window.choiceStateManager.trigger(option, value);
      }
    };

    window.getChoiceValue = function(option) {
      if (window.choiceStateManager) {
        return window.choiceStateManager.getValue(option);
      }
      return undefined;
    };

    window.listenToChoice = function(option, callback) {
      if (window.choiceStateManager) {
        return window.choiceStateManager.listen(option, callback);
      }
      return function() {};
    };

    window.hasChoiceValue = function(option) {
      if (window.choiceStateManager) {
        return window.choiceStateManager.hasValue(option);
      }
      return false;
    };

    window.matchesChoiceValues = function(option, values) {
      if (window.choiceStateManager) {
        return window.choiceStateManager.matchesValues(option, values);
      }
      return false;
    };
  }

  // Choose Component Creator
  window.createChoose = function(container, options) {
    const option = options.option;
    const value = options.value;
    const color = options.color || '';
    const content = options.content || '';

    let isSelected = false;
    let hasOptionTriggered = false;

    function updateState() {
      const currentValue = window.getChoiceValue(option);
      const optionTriggered = window.hasChoiceValue(option);

      isSelected = currentValue === value;
      hasOptionTriggered = optionTriggered;
      updateVisuals();
    }

    function updateVisuals() {
      const baseStyles = {
        border: '1px dashed #e1e5e9',
        cursor: 'pointer',
        padding: '20px',
        position: 'relative',
        backgroundColor: '#f8f9fa',
        outline: 'none',
        height: '100%',
        borderRadius: '8px',
        transition: 'all 0.2s ease',
        display: 'flex',
        flexDirection: 'column'
      };

      const colorMap = {
        green: { backgroundColor: '#e8f5e8', borderColor: '#4caf50' },
        red: { backgroundColor: '#ffeaea', borderColor: '#f44336' },
        blue: { backgroundColor: '#e3f2fd', borderColor: '#2196f3' }
      };

      const colorStyles = colorMap[color] || {};
      let finalStyles = Object.assign({}, baseStyles, colorStyles);

      if (isSelected) {
        finalStyles.borderStyle = 'solid';
        finalStyles.borderWidth = '3px';
        finalStyles.borderColor = colorStyles.borderColor || '#0061d5';
        finalStyles.backgroundColor = colorStyles.backgroundColor || '#e3f2fd';
        finalStyles.boxShadow = '0 2px 8px rgba(0, 97, 213, 0.3)';
        finalStyles.transform = 'scale(1.02)';
      } else if (hasOptionTriggered && !isSelected) {
        finalStyles.opacity = '0.5';
      }

      // Apply styles to container
      Object.keys(finalStyles).forEach(function(key) {
        container.style[key] = finalStyles[key];
      });

      // Update icon
      const iconEl = container.querySelector('.choose-icon');
      if (iconEl) {
        iconEl.style.color = isSelected ? '#0061d5' : '#666';
        iconEl.innerHTML = isSelected ?
          '<svg viewBox="0 0 24 24" fill="currentColor" style="width: 100%; height: 100%;"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>' :
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 100%; height: 100%;"><circle cx="12" cy="12" r="10"/></svg>';
      }
    }

    function handleClick() {
      window.triggerChoice(option, value);
    }

    function handleKeyDown(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleClick();
      }
    }

    // Setup container
    container.setAttribute('tabindex', '0');
    container.addEventListener('click', handleClick);
    container.addEventListener('keydown', handleKeyDown);

    // Create content structure
    container.innerHTML =
      '<div class="choose-icon" style="float: left; position: relative; top: 2px; margin-right: 12px; width: 20px; height: 20px;"></div>' +
      '<div style="flex: 1;">' + content + '</div>';

    // Initial state setup
    updateState();

    // Listen for changes
    const unsubscribe = window.listenToChoice(option, updateState);

    // Return cleanup function
    return unsubscribe;
  };

  // Choice Component Creator
  window.createChoice = function(container, options) {
    const option = options.option;
    const value = options.value;
    const color = options.color || '';
    const unset = options.unset || false;
    const lazy = options.lazy || false;
    const content = options.content || '';

    let shouldShow = false;
    let hasEverShown = false;
    let originalContent = content;

    function updateVisibility() {
      const hasOptionValue = window.hasChoiceValue(option);
      const matchesValue = window.matchesChoiceValues(option, value);

      let show = false;

      if (unset && !hasOptionValue) {
        show = true;
      } else if (!unset && matchesValue) {
        show = true;
      }

      shouldShow = show;
      if (show && !hasEverShown) {
        hasEverShown = true;
      }

      updateVisuals();
    }

    function updateVisuals() {
      if (lazy && !hasEverShown && !shouldShow) {
        container.style.display = 'none';
        return;
      }

      const baseStyles = {
        border: '1px dashed #e1e5e9',
        padding: '20px',
        marginBottom: '20px',
        borderRadius: '8px',
        backgroundColor: '#ffffff'
      };

      const colorMap = {
        green: { backgroundColor: '#e8f5e8', borderColor: '#4caf50' },
        red: { backgroundColor: '#ffeaea', borderColor: '#f44336' },
        blue: { backgroundColor: '#e3f2fd', borderColor: '#2196f3' },
        none: { backgroundColor: 'transparent', padding: '0', margin: '0', border: 'none' }
      };

      const colorStyles = colorMap[color] || {};
      const finalStyles = Object.assign({}, baseStyles, colorStyles);

      // Apply styles
      Object.keys(finalStyles).forEach(function(key) {
        container.style[key] = finalStyles[key];
      });

      container.style.display = shouldShow ? 'block' : 'none';

      if (shouldShow && container.innerHTML !== originalContent) {
        container.innerHTML = originalContent;
      }
    }

    // Set initial content
    container.innerHTML = originalContent;

    // Initial visibility check
    updateVisibility();

    // Listen for changes
    const unsubscribe = window.listenToChoice(option, updateVisibility);

    // Return cleanup function
    return unsubscribe;
  };

  // Grid Creator
  window.createGrid = function(container, options) {
    const columns = options.columns || 2;
    const compact = options.compact || false;

    container.style.display = 'grid';
    container.style.gridTemplateColumns = 'repeat(' + columns + ', 1fr)';
    container.style.gap = compact ? '8px' : '16px';
    container.style.marginBottom = compact ? '10px' : '20px';
  };

  // Auto-initialize components when DOM is ready
  function initializeComponents() {
    // Initialize Choose components
    document.querySelectorAll('[data-choose]').forEach(function(el) {
      const data = JSON.parse(el.getAttribute('data-choose'));
      data.content = el.innerHTML;
      window.createChoose(el, data);
    });

    // Initialize Choice components
    document.querySelectorAll('[data-choice]').forEach(function(el) {
      const data = JSON.parse(el.getAttribute('data-choice'));
      data.content = el.innerHTML;
      window.createChoice(el, data);
    });

    // Initialize Grid components
    document.querySelectorAll('[data-grid]').forEach(function(el) {
      const data = JSON.parse(el.getAttribute('data-grid'));
      window.createGrid(el, data);
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeComponents);
  } else {
    initializeComponents();
  }

  // Re-initialize on dynamic content changes
  window.reinitializeChoiceComponents = initializeComponents;

})();