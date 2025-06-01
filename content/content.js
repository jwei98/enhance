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
      <div class="box-body">
        <div class="explanation">
          <div class="loading">Analyzing...</div>
        </div>
        <div class="continue-button-container" style="display: none;">
          <button class="continue-button" type="button">Continue in AI →</button>
        </div>
      </div>
    `;

    this.floatingBox.querySelector('.continue-button').addEventListener('click', () => {
      this.openContinueConversation();
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
    
    // Reset explanation content and hide continue button
    this.floatingBox.querySelector('.explanation').innerHTML = '<div class="loading">Analyzing...</div>';
    this.floatingBox.querySelector('.continue-button-container').style.display = 'none';
  }

  hideFloatingBox() {
    this.floatingBox.style.display = 'none';
  }

  async openContinueConversation() {
    try {
      // Get current settings to determine which provider to use
      const result = await browser.storage.local.get('settings');
      const settings = result.settings || {};
      const provider = settings.provider || 'meta';

      const pageContext = this.getPageContext();
      const prompt = this.buildContinuePrompt(pageContext);

      if (provider === 'openai') {
        this.openChatGPT(prompt);
      } else if (provider === 'anthropic') {
        this.openClaude(prompt);
      } else {
        // Default to ChatGPT if unknown provider
        this.openChatGPT(prompt);
      }
    } catch (error) {
      console.error('Error opening continue conversation:', error);
    }
  }

  buildContinuePrompt(pageContext) {
    return `I'm reading an article and would like to discuss this text in more detail:

Page: ${pageContext.title}
URL: ${pageContext.url}

Selected text: "${pageContext.selectedText}"

Context: ${pageContext.contextText ? pageContext.contextText.substring(0, 500) + '...' : 'No additional context'}

Can you help me understand this better and discuss related concepts?`;
  }

  openChatGPT(prompt) {
    const encodedPrompt = encodeURIComponent(prompt);
    const url = `https://chatgpt.com/?q=${encodedPrompt}`;
    window.open(url, '_blank');
  }

  openClaude(prompt) {
    // Claude doesn't have URL parameters for pre-filling, so we'll open Claude and copy the prompt
    window.open('https://claude.ai/chat', '_blank');
    
    // Copy the prompt to clipboard so user can paste it
    navigator.clipboard.writeText(prompt).then(() => {
      // Could show a small notification that prompt was copied
      console.log('Prompt copied to clipboard for Claude');
    }).catch(err => {
      console.error('Failed to copy prompt:', err);
    });
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
        // Show continue button after successful explanation
        this.floatingBox.querySelector('.continue-button-container').style.display = 'block';
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