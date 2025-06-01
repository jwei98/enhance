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
    document.getElementById('provider-openai').addEventListener('change', () => this.onProviderChange('openai'));
    document.getElementById('provider-anthropic').addEventListener('change', () => this.onProviderChange('anthropic'));
    document.getElementById('save-settings').addEventListener('click', () => this.saveSettings());
    document.getElementById('reset-settings').addEventListener('click', () => this.resetSettings());
    document.getElementById('test-api').addEventListener('click', () => this.testAPI());
    document.getElementById('get-key-link').addEventListener('click', (e) => {
      e.preventDefault();
      this.openAPIKeyPage();
    });
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
    modelSelect.innerHTML = '<option value="">Select a model...</option>';
    
    this.models[provider].forEach(model => {
      const option = document.createElement('option');
      option.value = model.value;
      option.textContent = model.label;
      modelSelect.appendChild(option);
    });
  }

  updateAPIKeyVisibility(provider) {
    const openaiGroup = document.getElementById('openai-api-key-group');
    const anthropicGroup = document.getElementById('anthropic-api-key-group');
    
    if (provider === 'openai') {
      openaiGroup.style.display = 'block';
      anthropicGroup.style.display = 'none';
    } else if (provider === 'anthropic') {
      openaiGroup.style.display = 'none';
      anthropicGroup.style.display = 'block';
    }
  }


  async loadSettings() {
    try {
      const result = await browser.storage.local.get('settings');
      const settings = result.settings || {};

      // Set provider
      const provider = settings.provider || 'openai';
      document.getElementById(`provider-${provider}`).checked = true;
      this.onProviderChange(provider);

      // Set other fields
      document.getElementById('openai-api-key').value = settings.openaiApiKey || '';
      document.getElementById('anthropic-api-key').value = settings.anthropicApiKey || '';
      document.getElementById('model').value = settings.model || '';
      document.getElementById('max-tokens').value = settings.maxTokens || 150;
      document.getElementById('trigger-key').value = settings.triggerKey || 'meta';

      // Update radio button styles
      this.updateRadioStyles();

    } catch (error) {
      this.showStatus('Error loading settings', 'error');
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