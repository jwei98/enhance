class InContextLookup {
  constructor() {
    this.selectedText = '';
    this.floatingBox = null;
    this.triggerKey = 'meta'; // Default, will be updated from settings
    this.keyPressed = {
      ctrl: false,
      alt: false,
      shift: false,
      meta: false
    };
    this.triggerKeyWasPressedOnMouseDown = false;
    this.init();
  }

  async init() {
    await this.loadSettings();
    this.createFloatingBox();
    this.bindEvents();
  }

  async loadSettings() {
    try {
      const result = await browser.storage.local.get('settings');
      const settings = result.settings || {};
      this.triggerKey = settings.triggerKey || 'meta';
    } catch (error) {
      console.error('Error loading settings:', error);
      this.triggerKey = 'meta';
    }
  }

  bindEvents() {
    // Track key states
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    document.addEventListener('keyup', (e) => this.handleKeyUp(e));
    
    // Track trigger key state on mouse down
    document.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    
    // Handle text selection
    document.addEventListener('mouseup', (e) => this.handleTextSelection(e));
    
    // Handle escape key to close floating box
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hideFloatingBox();
      }
    });

    // Hide floating box when clicking elsewhere
    document.addEventListener('click', (e) => {
      if (this.floatingBox && !this.floatingBox.contains(e.target)) {
        this.hideFloatingBox();
      }
    });

    // Listen for settings changes
    browser.storage.onChanged.addListener((changes) => {
      if (changes.settings) {
        this.triggerKey = changes.settings.newValue?.triggerKey || 'meta';
      }
    });
  }

  handleKeyDown(e) {
    this.keyPressed.ctrl = e.ctrlKey;
    this.keyPressed.alt = e.altKey;
    this.keyPressed.shift = e.shiftKey;
    this.keyPressed.meta = e.metaKey;
  }

  handleKeyUp(e) {
    this.keyPressed.ctrl = e.ctrlKey;
    this.keyPressed.alt = e.altKey;
    this.keyPressed.shift = e.shiftKey;
    this.keyPressed.meta = e.metaKey;
  }

  handleMouseDown(e) {
    // Capture if trigger key was pressed when mouse went down
    this.triggerKeyWasPressedOnMouseDown = this.keyPressed[this.triggerKey];
  }

  handleTextSelection(e) {
    setTimeout(() => {
      const selection = window.getSelection();
      const selectedText = selection.toString().trim();

      if (selectedText.length > 0 && this.triggerKeyWasPressedOnMouseDown) {
        this.selectedText = selectedText;
        this.explainText(selection);
      } else {
        this.hideFloatingBox();
      }

      // Reset the flag after handling selection
      this.triggerKeyWasPressedOnMouseDown = false;
    }, 10);
  }

  createFloatingBox() {
    this.floatingBox = document.createElement('div');
    this.floatingBox.id = 'in-context-lookup-box';
    this.floatingBox.style.display = 'none';
    this.floatingBox.innerHTML = `
      <div class="box-header">
        <span class="box-title">💡 Explanation</span>
        <button class="close-button" type="button">&times;</button>
      </div>
      <div class="box-body">
        <div class="selected-text"></div>
        <div class="explanation">
          <div class="loading">Analyzing...</div>
        </div>
      </div>
    `;

    this.floatingBox.querySelector('.close-button').addEventListener('click', () => {
      this.hideFloatingBox();
    });

    document.body.appendChild(this.floatingBox);
  }

  showFloatingBox(selection) {
    if (!selection || selection.rangeCount === 0) {
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    // Position the box to the right of the selection
    const boxWidth = 320;
    const boxHeight = 200;
    const margin = 10;
    
    let left = rect.right + margin + window.scrollX;
    let top = rect.top + window.scrollY;
    
    // Adjust if box would go off screen
    if (left + boxWidth > window.innerWidth + window.scrollX) {
      left = rect.left - boxWidth - margin + window.scrollX;
    }
    
    if (top + boxHeight > window.innerHeight + window.scrollY) {
      top = window.innerHeight + window.scrollY - boxHeight - margin;
    }
    
    // Ensure box doesn't go above viewport
    if (top < window.scrollY) {
      top = window.scrollY + margin;
    }
    
    this.floatingBox.style.left = `${Math.max(margin, left)}px`;
    this.floatingBox.style.top = `${top}px`;
    this.floatingBox.style.display = 'block';
    
    this.floatingBox.querySelector('.selected-text').textContent = `"${this.selectedText}"`;
    
    // Reset explanation content
    this.floatingBox.querySelector('.explanation').innerHTML = '<div class="loading">Analyzing...</div>';
  }

  hideFloatingBox() {
    this.floatingBox.style.display = 'none';
  }

  getPageContext() {
    const title = document.title || '';
    const url = window.location.href;
    const metaDescription = document.querySelector('meta[name="description"]')?.content || '';
    
    // Get surrounding text context
    const selection = window.getSelection();
    let contextText = '';
    
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const container = range.commonAncestorContainer;
      const parentElement = container.nodeType === Node.TEXT_NODE ? 
        container.parentElement : container;
      
      // Get paragraph or article context
      const contextElement = parentElement.closest('p, article, section, div.content, div.post, div.article');
      if (contextElement) {
        contextText = contextElement.textContent.trim().substring(0, 1000);
      }
    }

    return {
      title,
      url,
      metaDescription,
      contextText,
      selectedText: this.selectedText
    };
  }

  async explainText(selection) {
    this.showFloatingBox(selection);

    const pageContext = this.getPageContext();
    
    try {
      const response = await browser.runtime.sendMessage({
        action: 'explainText',
        data: pageContext
      });

      if (response.success) {
        this.floatingBox.querySelector('.explanation').innerHTML = `
          <div class="explanation-text">${response.explanation}</div>
        `;
      } else {
        this.floatingBox.querySelector('.explanation').innerHTML = `
          <div class="error">Error: ${response.error}</div>
        `;
      }
    } catch (error) {
      this.floatingBox.querySelector('.explanation').innerHTML = `
        <div class="error">Failed to get explanation: ${error.message}</div>
      `;
    }
  }
}

// Initialize the extension
new InContextLookup();