class OptionsManager {
  constructor() {
    this.providers = {
      openai: {
        name: 'OpenAI',
        apiKeyUrl: 'https://platform.openai.com/api-keys',
        continueMethod: 'url',
        models: [
          { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (Recommended)' },
          { value: 'gpt-4', label: 'GPT-4' },
          { value: 'gpt-4-turbo-preview', label: 'GPT-4 Turbo' }
        ]
      },
      anthropic: {
        name: 'Anthropic',
        apiKeyUrl: 'https://console.anthropic.com/account/keys',
        continueMethod: 'clipboard',
        continueInfo: 'When using Anthropic, clicking the continue icon (↗) will open Claude and copy the prompt to your clipboard for pasting.',
        models: [
          { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet (Recommended)' },
          { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
          { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' }
        ]
      }
    };

    this.init();
  }

  init() {
    this.bindEvents();
    this.loadSettings();
  }

  bindEvents() {
    const openaiRadio = document.getElementById('provider-openai');
    const anthropicRadio = document.getElementById('provider-anthropic');
    const saveButton = document.getElementById('save-settings');
    const resetButton = document.getElementById('reset-settings');
    const testButton = document.getElementById('test-api');

    if (openaiRadio) {
      openaiRadio.addEventListener('change', () => this.onProviderChange('openai'));
    }
    if (anthropicRadio) {
      anthropicRadio.addEventListener('change', () => this.onProviderChange('anthropic'));
    }
    if (saveButton) {
      saveButton.addEventListener('click', () => this.saveSettings());
    }
    if (resetButton) {
      resetButton.addEventListener('click', () => this.resetSettings());
    }
    if (testButton) {
      testButton.addEventListener('click', () => this.testAPI());
    }
  }

  onProviderChange(provider) {
    this.updateModelOptions(provider);
    this.updateRadioStyles();
    this.updateAPIKeyVisibility(provider);
  }

  updateRadioStyles() {
    // Remove selected class from all radio labels
    document.querySelectorAll('.radio-label').forEach(label => {
      label.classList.remove('selected');
    });
    
    // Add selected class to the checked radio's label
    const checkedRadio = document.querySelector('input[name="provider"]:checked');
    if (checkedRadio) {
      checkedRadio.closest('.radio-label').classList.add('selected');
    }
  }

  updateModelOptions(provider) {
    const modelSelect = document.getElementById('model');
    modelSelect.innerHTML = '';
    
    const providerConfig = this.providers[provider];
    if (!providerConfig) return;
    
    providerConfig.models.forEach((model, index) => {
      const option = document.createElement('option');
      option.value = model.value;
      option.textContent = model.label;
      modelSelect.appendChild(option);
      
      // Auto-select the first model (which is the recommended one)
      if (index === 0) {
        option.selected = true;
      }
    });
  }

  updateAPIKeyVisibility(provider) {
    // Hide all provider-specific groups first
    Object.keys(this.providers).forEach(providerId => {
      const group = document.getElementById(`${providerId}-api-key-group`);
      if (group) {
        group.style.display = 'none';
      }
    });
    
    // Show the selected provider's group
    const selectedGroup = document.getElementById(`${provider}-api-key-group`);
    if (selectedGroup) {
      selectedGroup.style.display = 'block';
    }
    
    // Handle provider-specific info
    const providerConfig = this.providers[provider];
    const infoElement = document.getElementById('anthropic-continue-info');
    
    if (infoElement) {
      if (providerConfig?.continueInfo) {
        infoElement.style.display = 'block';
        // Update the info text if needed
        const helpText = infoElement.querySelector('.help-text');
        if (helpText) {
          helpText.innerHTML = `💡 <strong>Continue in AI:</strong> ${providerConfig.continueInfo}`;
        }
      } else {
        infoElement.style.display = 'none';
      }
    }
  }


  async loadSettings() {
    try {
      const result = await browser.storage.local.get('settings');
      const settings = result.settings || {};


      // Set provider (default to 'openai' if none set)
      const provider = settings.provider || 'openai';
      
      const providerRadio = document.getElementById(`provider-${provider}`);
      if (providerRadio) {
        providerRadio.checked = true;
      } else {
        console.error('Could not find radio button for provider:', provider);
      }
      
      // Set other fields first (except model - that needs to be set after provider change)
      const openaiKeyField = document.getElementById('openai-api-key');
      const anthropicKeyField = document.getElementById('anthropic-api-key');
      const maxTokensField = document.getElementById('max-tokens');
      const maxContextLengthField = document.getElementById('max-context-length');
      const triggerKeyField = document.getElementById('trigger-key');

      if (openaiKeyField) openaiKeyField.value = settings.openaiApiKey || '';
      if (anthropicKeyField) anthropicKeyField.value = settings.anthropicApiKey || '';
      if (maxTokensField) maxTokensField.value = settings.maxTokens || 150;
      if (maxContextLengthField) maxContextLengthField.value = settings.maxContextLength || 1000;
      if (triggerKeyField) triggerKeyField.value = settings.triggerKey || 'alt';

      // Trigger all provider-related updates (models, styling, visibility)
      this.onProviderChange(provider);

      // Set model after provider change has populated the options
      const modelField = document.getElementById('model');
      if (modelField && settings.model) {
        modelField.value = settings.model;
      }

    } catch (error) {
      console.error('Error loading settings:', error);
      this.showStatus('Error loading settings', 'error');
      // Fallback to default state
      this.onProviderChange('openai');
    }
  }

  async saveSettings() {
    try {
      const provider = document.querySelector('input[name="provider"]:checked')?.value;
      const openaiApiKey = document.getElementById('openai-api-key').value.trim();
      const anthropicApiKey = document.getElementById('anthropic-api-key').value.trim();
      const model = document.getElementById('model').value;
      const maxTokens = parseInt(document.getElementById('max-tokens').value);
      const maxContextLength = parseInt(document.getElementById('max-context-length').value);
      const triggerKey = document.getElementById('trigger-key').value;

      if (!provider) {
        this.showStatus('Please select an API provider', 'error');
        return;
      }

      // Check that the selected provider has an API key
      const apiKeyField = document.getElementById(`${provider}-api-key`);
      const apiKey = apiKeyField ? apiKeyField.value.trim() : '';
      const providerConfig = this.providers[provider];
      
      if (!apiKey) {
        this.showStatus(`Please enter your ${providerConfig?.name || provider} API key`, 'error');
        return;
      }

      // Model should always be selected now due to auto-selection
      if (!model) {
        this.showStatus('Please select a model', 'error');
        return;
      }

      if (!maxTokens || maxTokens < 50 || maxTokens > 500) {
        this.showStatus('Max tokens must be between 50 and 500', 'error');
        return;
      }

      if (!maxContextLength || maxContextLength < 200 || maxContextLength > 10000) {
        this.showStatus('Max request length must be between 200 and 10,000', 'error');
        return;
      }

      // Build settings object dynamically
      const settings = {
        provider,
        model,
        maxTokens,
        maxContextLength,
        triggerKey
      };
      
      // Add API keys for all providers
      Object.keys(this.providers).forEach(providerId => {
        const keyField = document.getElementById(`${providerId}-api-key`);
        if (keyField) {
          settings[`${providerId}ApiKey`] = keyField.value.trim();
        }
      });

      await browser.storage.local.set({ settings });
      this.showStatus('Settings saved successfully!', 'success');

    } catch (error) {
      this.showStatus('Error saving settings', 'error');
    }
  }

  async resetSettings() {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      try {
        await browser.storage.local.remove('settings');
        this.loadSettings();
        this.showStatus('Settings reset to defaults', 'success');
      } catch (error) {
        this.showStatus('Error resetting settings', 'error');
      }
    }
  }

  async testAPI() {
    const testButton = document.getElementById('test-api');
    const testResult = document.getElementById('test-result');
    
    testButton.disabled = true;
    testButton.textContent = 'Testing...';
    testResult.innerHTML = '';

    try {
      const provider = document.querySelector('input[name="provider"]:checked')?.value;
      const openaiApiKey = document.getElementById('openai-api-key').value.trim();
      const anthropicApiKey = document.getElementById('anthropic-api-key').value.trim();
      const model = document.getElementById('model').value;

      if (!provider || !model) {
        throw new Error('Please select a provider and model before testing');
      }

      // Check that the selected provider has an API key
      if (provider === 'openai' && !openaiApiKey) {
        throw new Error('Please enter your OpenAI API key before testing');
      }

      if (provider === 'anthropic' && !anthropicApiKey) {
        throw new Error('Please enter your Anthropic API key before testing');
      }

      // Temporarily save current settings for test
      const testSettings = {
        provider,
        openaiApiKey,
        anthropicApiKey,
        model,
        maxTokens: parseInt(document.getElementById('max-tokens').value) || 150,
        maxContextLength: parseInt(document.getElementById('max-context-length').value) || 1000,
        triggerKey: document.getElementById('trigger-key').value || 'alt'
      };

      await browser.storage.local.set({ testSettings });

      const testData = {
        title: 'Test Page',
        url: 'https://example.com',
        selectedText: 'This is a test.',
        contextText: 'This is a test of the API connection.'
      };

      const response = await browser.runtime.sendMessage({
        action: 'testAPI',
        data: testData
      });

      if (response.success) {
        testResult.innerHTML = `<div class="success">✅ API test successful!</div>`;
      } else {
        testResult.innerHTML = `<div class="error">❌ API test failed: ${response.error}</div>`;
      }

    } catch (error) {
      testResult.innerHTML = `<div class="error">❌ Test failed: ${error.message}</div>`;
    } finally {
      testButton.disabled = false;
      testButton.textContent = 'Test API Connection';
      // Clean up test settings
      await browser.storage.local.remove('testSettings');
    }
  }

  openAPIKeyPage() {
    const provider = document.querySelector('input[name="provider"]:checked')?.value || 'openai';
    browser.tabs.create({ url: this.apiUrls[provider] });
  }

  showStatus(message, type = 'info') {
    const status = document.getElementById('status');
    status.textContent = message;
    status.className = `status ${type}`;
    
    setTimeout(() => {
      status.textContent = '';
      status.className = 'status';
    }, 3000);
  }
}

// Initialize options manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new OptionsManager();
});