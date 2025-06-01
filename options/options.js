class OptionsManager {
  constructor() {
    this.models = {
      openai: [
        { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (Recommended)' },
        { value: 'gpt-4', label: 'GPT-4' },
        { value: 'gpt-4-turbo-preview', label: 'GPT-4 Turbo' }
      ],
      anthropic: [
        { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet (Recommended)' },
        { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
        { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' }
      ]
    };

    this.apiUrls = {
      openai: 'https://platform.openai.com/api-keys',
      anthropic: 'https://console.anthropic.com/account/keys'
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
    
    this.models[provider].forEach((model, index) => {
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
    const openaiGroup = document.getElementById('openai-api-key-group');
    const anthropicGroup = document.getElementById('anthropic-api-key-group');
    
    if (openaiGroup && anthropicGroup) {
      if (provider === 'openai') {
        openaiGroup.style.display = 'block';
        anthropicGroup.style.display = 'none';
      } else if (provider === 'anthropic') {
        openaiGroup.style.display = 'none';
        anthropicGroup.style.display = 'block';
      }
    } else {
      console.error('API key groups not found:', { openaiGroup, anthropicGroup });
    }
  }


  async loadSettings() {
    try {
      const result = await browser.storage.local.get('settings');
      const settings = result.settings || {};

      console.log('Loading settings:', settings); // Debug log

      // Set provider (default to 'openai' if none set)
      const provider = settings.provider || 'openai';
      console.log('Selected provider:', provider); // Debug log
      
      const providerRadio = document.getElementById(`provider-${provider}`);
      if (providerRadio) {
        providerRadio.checked = true;
        console.log('Set radio button for:', provider); // Debug log
      } else {
        console.error('Could not find radio button for provider:', provider);
      }
      
      // Set other fields first (except model - that needs to be set after provider change)
      const openaiKeyField = document.getElementById('openai-api-key');
      const anthropicKeyField = document.getElementById('anthropic-api-key');
      const maxTokensField = document.getElementById('max-tokens');
      const triggerKeyField = document.getElementById('trigger-key');

      if (openaiKeyField) openaiKeyField.value = settings.openaiApiKey || '';
      if (anthropicKeyField) anthropicKeyField.value = settings.anthropicApiKey || '';
      if (maxTokensField) maxTokensField.value = settings.maxTokens || 150;
      if (triggerKeyField) triggerKeyField.value = settings.triggerKey || 'meta';

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
      const triggerKey = document.getElementById('trigger-key').value;

      if (!provider) {
        this.showStatus('Please select an API provider', 'error');
        return;
      }

      // Check that the selected provider has an API key
      if (provider === 'openai' && !openaiApiKey) {
        this.showStatus('Please enter your OpenAI API key', 'error');
        return;
      }

      if (provider === 'anthropic' && !anthropicApiKey) {
        this.showStatus('Please enter your Anthropic API key', 'error');
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

      const settings = {
        provider,
        openaiApiKey,
        anthropicApiKey,
        model,
        maxTokens,
        triggerKey
      };

      console.log('Saving settings:', settings); // Debug log
      await browser.storage.local.set({ settings });
      console.log('Settings saved to storage'); // Debug log
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
        triggerKey: document.getElementById('trigger-key').value || 'meta'
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