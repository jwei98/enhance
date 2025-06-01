class InContextLookupBackground {
  constructor() {
    this.init();
  }

  init() {
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'explainText') {
        this.handleExplainText(message.data, sendResponse);
        return true; // Keep message channel open for async response
      } else if (message.action === 'testAPI') {
        this.handleTestAPI(message.data, sendResponse);
        return true; // Keep message channel open for async response
      }
    });
  }

  async handleExplainText(data, sendResponse) {
    try {
      const settings = await this.getSettings();
      
      if (!settings.apiKey) {
        sendResponse({
          success: false,
          error: 'No API key configured. Please configure your API key in the extension options.'
        });
        return;
      }

      const explanation = await this.callLLMAPI(data, settings);
      
      sendResponse({
        success: true,
        explanation: explanation
      });
    } catch (error) {
      console.error('Error explaining text:', error);
      sendResponse({
        success: false,
        error: error.message || 'Failed to get explanation'
      });
    }
  }

  async handleTestAPI(data, sendResponse) {
    try {
      const settings = await this.getTestSettings();
      
      if (!settings.apiKey) {
        sendResponse({
          success: false,
          error: 'No API key configured. Please configure your API key in the extension options.'
        });
        return;
      }

      const explanation = await this.callLLMAPI(data, settings);
      
      sendResponse({
        success: true,
        explanation: explanation
      });
    } catch (error) {
      console.error('Error testing API:', error);
      sendResponse({
        success: false,
        error: error.message || 'Failed to test API'
      });
    }
  }

  async getSettings() {
    const defaultSettings = {
      provider: 'openai',
      apiKey: '',
      model: 'gpt-3.5-turbo',
      maxTokens: 150,
      triggerKey: 'meta'
    };

    try {
      const result = await browser.storage.local.get('settings');
      return { ...defaultSettings, ...result.settings };
    } catch (error) {
      console.error('Error getting settings:', error);
      return defaultSettings;
    }
  }

  async getTestSettings() {
    const defaultSettings = {
      provider: 'openai',
      apiKey: '',
      model: 'gpt-3.5-turbo',
      maxTokens: 150,
      triggerKey: 'meta'
    };

    try {
      const result = await browser.storage.local.get('testSettings');
      return { ...defaultSettings, ...result.testSettings };
    } catch (error) {
      console.error('Error getting test settings:', error);
      return defaultSettings;
    }
  }

  async callLLMAPI(data, settings) {
    const prompt = this.buildPrompt(data);

    if (settings.provider === 'openai') {
      return await this.callOpenAI(prompt, settings);
    } else if (settings.provider === 'anthropic') {
      return await this.callAnthropic(prompt, settings);
    } else {
      throw new Error('Unsupported API provider');
    }
  }

  buildPrompt(data) {
    return `Explain this selected text from a webpage in 2-3 sentences.

Page: ${data.title}
Context: ${data.contextText || 'No context'}
Selected: "${data.selectedText}"

Provide a brief, clear explanation focusing on what it means and why it's relevant to the page topic. Be concise.`;
  }

  async callOpenAI(prompt, settings) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${settings.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: settings.model || 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: settings.maxTokens || 500,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `API request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'No explanation received';
  }

  async callAnthropic(prompt, settings) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': settings.apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: settings.model || 'claude-3-sonnet-20240229',
        max_tokens: settings.maxTokens || 500,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `API request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.content[0]?.text || 'No explanation received';
  }
}

// Initialize background script
new InContextLookupBackground();