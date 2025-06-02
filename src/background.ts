import browser from 'webextension-polyfill';

interface ProviderConfig {
  apiUrl: string;
  defaultModel: string;
  handler: (prompt: string, settings: Settings) => Promise<string>;
}

interface Settings {
  provider: string;
  openaiApiKey: string;
  anthropicApiKey: string;
  model: string;
  maxTokens: number;
  maxContextLength: number;
  triggerKey: string;
}

interface PageContext {
  title: string;
  url: string;
  metaDescription: string;
  contextText: string;
  selectedText: string;
}

interface ExplainTextMessage {
  action: 'explainText';
  data: PageContext;
}

interface TestAPIMessage {
  action: 'testAPI';
  data: PageContext;
}

type MessageType = ExplainTextMessage | TestAPIMessage;

interface APIResponse {
  success: boolean;
  explanation?: string;
  error?: string;
}

class EnhanceBackground {
  private providers: Record<string, ProviderConfig>;

  constructor() {
    this.providers = {
      openai: {
        apiUrl: 'https://api.openai.com/v1/chat/completions',
        defaultModel: 'gpt-3.5-turbo',
        handler: this.callOpenAI.bind(this)
      },
      anthropic: {
        apiUrl: 'https://api.anthropic.com/v1/messages',
        defaultModel: 'claude-3-sonnet-20240229',
        handler: this.callAnthropic.bind(this)
      }
    };
    
    this.init();
  }

  init(): void {
    browser.runtime.onMessage.addListener((message: MessageType, sender, sendResponse) => {
      if (message.action === 'explainText') {
        this.handleExplainText(message.data, sendResponse);
        return true; // Keep message channel open for async response
      } else if (message.action === 'testAPI') {
        this.handleTestAPI(message.data, sendResponse);
        return true; // Keep message channel open for async response
      }
    });
  }

  async handleExplainText(data: PageContext, sendResponse: (response: APIResponse) => void): Promise<void> {
    try {
      const settings = await this.getSettings();
      
      // Check if the selected provider has an API key
      const apiKey = settings.provider === 'openai' ? settings.openaiApiKey : settings.anthropicApiKey;
      if (!apiKey) {
        sendResponse({
          success: false,
          error: `No ${settings.provider === 'openai' ? 'OpenAI' : 'Anthropic'} API key configured. Please configure your API key in the extension options.`
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
        error: error instanceof Error ? error.message : 'Failed to get explanation'
      });
    }
  }

  async handleTestAPI(data: PageContext, sendResponse: (response: APIResponse) => void): Promise<void> {
    try {
      const settings = await this.getTestSettings();
      
      // Check if the selected provider has an API key
      const apiKey = settings.provider === 'openai' ? settings.openaiApiKey : settings.anthropicApiKey;
      if (!apiKey) {
        sendResponse({
          success: false,
          error: `No ${settings.provider === 'openai' ? 'OpenAI' : 'Anthropic'} API key configured. Please configure your API key in the extension options.`
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
        error: error instanceof Error ? error.message : 'Failed to test API'
      });
    }
  }

  async getSettings(): Promise<Settings> {
    const defaultSettings: Settings = {
      provider: 'openai',
      openaiApiKey: '',
      anthropicApiKey: '',
      model: 'gpt-3.5-turbo',
      maxTokens: 150,
      maxContextLength: 1000,
      triggerKey: 'alt'
    };

    try {
      const result = await browser.storage.local.get('settings');
      return { ...defaultSettings, ...result.settings };
    } catch (error) {
      console.error('Error getting settings:', error);
      return defaultSettings;
    }
  }

  async getTestSettings(): Promise<Settings> {
    const defaultSettings: Settings = {
      provider: 'openai',
      openaiApiKey: '',
      anthropicApiKey: '',
      model: 'gpt-3.5-turbo',
      maxTokens: 150,
      maxContextLength: 1000,
      triggerKey: 'alt'
    };

    try {
      const result = await browser.storage.local.get('testSettings');
      return { ...defaultSettings, ...result.testSettings };
    } catch (error) {
      console.error('Error getting test settings:', error);
      return defaultSettings;
    }
  }

  async callLLMAPI(data: PageContext, settings: Settings): Promise<string> {
    const prompt = this.buildPrompt(data);
    console.log('API Request:', {
      provider: settings.provider,
      model: settings.model,
      selectedText: data.selectedText,
      contextLength: data.contextText?.length || 0,
      promptLength: prompt.length,
      maxTokens: settings.maxTokens
    });

    const providerConfig = this.providers[settings.provider];
    if (!providerConfig) {
      throw new Error(`Unsupported API provider: ${settings.provider}`);
    }

    return await providerConfig.handler(prompt, settings);
  }

  buildPrompt(data: PageContext): string {
    return `Explain this selected text from a webpage in 2-3 sentences.

Page: ${data.title}
Context: ${data.contextText || 'No context'}
Selected: "${data.selectedText}"

Provide a brief, clear explanation focusing on what it means and why it's relevant to the page topic. Be concise.`;
  }

  async callOpenAI(prompt: string, settings: Settings): Promise<string> {
    const requestBody = {
      model: settings.model || 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user' as const,
          content: prompt
        }
      ],
      max_tokens: settings.maxTokens || 500,
      temperature: 0.7
    };
    
    console.log('OpenAI API request body:', requestBody);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${settings.openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `API request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'No explanation received';
  }

  async callAnthropic(prompt: string, settings: Settings): Promise<string> {
    const requestBody = {
      model: settings.model || 'claude-3-sonnet-20240229',
      max_tokens: settings.maxTokens || 500,
      messages: [
        {
          role: 'user' as const,
          content: prompt
        }
      ]
    };
    
    console.log('Anthropic API request body:', requestBody);
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': settings.anthropicApiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify(requestBody)
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
new EnhanceBackground();