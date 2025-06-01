class InContextLookup {
  constructor() {
    this.selectedText = '';
    this.floatingBox = null;
    this.triggerKey = 'alt'; // Default, will be updated from settings
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
      this.triggerKey = settings.triggerKey || 'alt';
    } catch (error) {
      console.error('Error loading settings:', error);
      this.triggerKey = 'alt';
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
        this.triggerKey = changes.settings.newValue?.triggerKey || 'alt';
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
      </div>
    `;


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
    
    // Reset explanation content
    this.floatingBox.querySelector('.explanation').innerHTML = '<div class="loading">Analyzing...</div>';
  }

  hideFloatingBox() {
    this.floatingBox.style.display = 'none';
  }

  async openContinueConversation() {
    try {
      // Get current settings to determine which provider to use
      const result = await browser.storage.local.get('settings');
      const settings = result.settings || {};
      const provider = settings.provider || 'alt';

      const pageContext = await this.getPageContext();
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
    
    // Try to copy the prompt to clipboard with fallback methods
    this.copyToClipboard(prompt);
  }

  async copyToClipboard(text) {
    try {
      // First try the modern clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        this.showCopyNotification('Prompt copied to clipboard');
        return;
      }
      
      // Fallback method for older browsers or insecure contexts
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        this.showCopyNotification('Prompt copied to clipboard');
      } else {
        this.showCopyNotification('Copy failed - please copy manually', true);
      }
    } catch (err) {
      console.error('Failed to copy prompt:', err);
      this.showCopyNotification('Copy failed - please copy manually', true);
    }
  }

  showCopyNotification(message, isError = false) {
    // Create a temporary notification
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${isError ? '#f44336' : '#4caf50'};
      color: white;
      padding: 12px 16px;
      border-radius: 4px;
      font-size: 14px;
      z-index: 1000000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }

  async getPageContext() {
    const title = document.title || '';
    const url = window.location.href;
    const metaDescription = document.querySelector('meta[name="description"]')?.content || '';
    
    // Get max context length from settings
    let maxContextLength = 1000; // default
    try {
      const result = await browser.storage.local.get('settings');
      maxContextLength = result.settings?.maxContextLength || 1000;
    } catch (error) {
      console.error('Error getting context length setting:', error);
    }
    
    // Get surrounding text context by finding the selected text in the page
    let contextText = '';
    
    if (this.selectedText) {
      // Try to find the selected text in the page and get surrounding context
      const textContent = document.body.textContent || document.body.innerText || '';
      const selectedTextIndex = textContent.indexOf(this.selectedText);
      
      if (selectedTextIndex !== -1) {
        // Get context around the selected text
        const contextStart = Math.max(0, selectedTextIndex - Math.floor(maxContextLength / 2));
        const contextEnd = Math.min(textContent.length, selectedTextIndex + this.selectedText.length + Math.floor(maxContextLength / 2));
        contextText = textContent.substring(contextStart, contextEnd).trim();
        
        // If we truncated, add ellipsis
        if (contextStart > 0) contextText = '...' + contextText;
        if (contextEnd < textContent.length) contextText = contextText + '...';
      } else {
        // Fallback: try to find context using DOM elements
        const walker = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_TEXT,
          null,
          false
        );
        
        let node;
        while (node = walker.nextNode()) {
          if (node.textContent.includes(this.selectedText)) {
            const parentElement = node.parentElement;
            const contextElement = parentElement.closest('p, article, section, div.content, div.post, div.article, main');
            if (contextElement) {
              contextText = contextElement.textContent.trim().substring(0, maxContextLength);
              break;
            }
          }
        }
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

    const pageContext = await this.getPageContext();
    
    try {
      const response = await browser.runtime.sendMessage({
        action: 'explainText',
        data: pageContext
      });

      if (response.success) {
        this.floatingBox.querySelector('.explanation').innerHTML = `<div class="explanation-text">${response.explanation}<span class="continue-icon" title="Continue in AI">↗</span></div>`;
        
        // Add click handler to the continue icon
        this.floatingBox.querySelector('.continue-icon').addEventListener('click', () => {
          this.openContinueConversation();
        });
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