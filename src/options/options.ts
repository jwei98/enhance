import browser from "webextension-polyfill";

// Utility functions for safe DOM element access with type narrowing
function getElement<T extends HTMLElement>(
  id: string,
  constructor: new (...args: any[]) => T
): T | null {
  const element = document.getElementById(id);
  return element instanceof constructor ? element : null;
}

function querySelector<T extends HTMLElement>(
  selector: string,
  constructor: new (...args: any[]) => T
): T | null {
  const element = document.querySelector(selector);
  return element instanceof constructor ? element : null;
}

interface ModelOption {
  value: string;
  label: string;
}

interface ProviderConfig {
  name: string;
  apiKeyUrl: string;
  continueMethod: "url" | "clipboard";
  continueInfo?: string;
  models: ModelOption[];
}

interface Settings {
  provider: string;
  openaiApiKey: string;
  anthropicApiKey: string;
  model: string;
  maxTokens: number;
  maxContextLength: number;
  triggerKey: string;
  [key: string]: string | number; // For dynamic API key properties
}

interface TestData {
  title: string;
  url: string;
  selectedText: string;
  contextText: string;
}

interface APIResponse {
  success: boolean;
  explanation?: string;
  error?: string;
}

class OptionsManager {
  private providers: Record<string, ProviderConfig>;

  constructor() {
    this.providers = {
      openai: {
        name: "OpenAI",
        apiKeyUrl: "https://platform.openai.com/api-keys",
        continueMethod: "url",
        models: [
          { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo (Recommended)" },
          { value: "gpt-4", label: "GPT-4" },
          { value: "gpt-4-turbo-preview", label: "GPT-4 Turbo" },
        ],
      },
      anthropic: {
        name: "Anthropic",
        apiKeyUrl: "https://console.anthropic.com/account/keys",
        continueMethod: "clipboard",
        continueInfo:
          "When using Anthropic, clicking the continue icon (↗) will open Claude and copy the prompt to your clipboard for pasting.",
        models: [
          {
            value: "claude-3-sonnet-20240229",
            label: "Claude 3 Sonnet (Recommended)",
          },
          { value: "claude-3-opus-20240229", label: "Claude 3 Opus" },
          { value: "claude-3-haiku-20240307", label: "Claude 3 Haiku" },
        ],
      },
    };

    this.init();
  }

  init(): void {
    this.bindEvents();
    this.loadSettings();
  }

  bindEvents(): void {
    const openaiRadio = document.getElementById("provider-openai");
    const anthropicRadio = document.getElementById("provider-anthropic");
    const saveButton = document.getElementById("save-settings");
    const resetButton = document.getElementById("reset-settings");
    const testButton = document.getElementById("test-api");

    if (openaiRadio) {
      openaiRadio.addEventListener("change", () =>
        this.onProviderChange("openai")
      );
    }
    if (anthropicRadio) {
      anthropicRadio.addEventListener("change", () =>
        this.onProviderChange("anthropic")
      );
    }
    if (saveButton) {
      saveButton.addEventListener("click", () => this.saveSettings());
    }
    if (resetButton) {
      resetButton.addEventListener("click", () => this.resetSettings());
    }
    if (testButton) {
      testButton.addEventListener("click", () => this.testAPI());
    }
  }

  onProviderChange(provider: string): void {
    this.updateModelOptions(provider);
    this.updateRadioStyles();
    this.updateAPIKeyVisibility(provider);
    this.clearTestResult();
  }

  updateRadioStyles(): void {
    // Remove selected class from all radio labels
    document.querySelectorAll(".radio-label").forEach((label) => {
      label.classList.remove("selected");
    });

    // Add selected class to the checked radio's label
    const checkedRadio = document.querySelector(
      'input[name="provider"]:checked'
    );
    if (checkedRadio) {
      const label = checkedRadio.closest(".radio-label");
      if (label) {
        label.classList.add("selected");
      }
    }
  }

  updateModelOptions(provider: string): void {
    const modelSelect = document.getElementById("model");
    if (!modelSelect) return;
    modelSelect.innerHTML = "";

    const providerConfig = this.providers[provider];
    if (!providerConfig) return;

    providerConfig.models.forEach((model, index) => {
      const option = document.createElement("option");
      option.value = model.value;
      option.textContent = model.label;
      if (modelSelect) modelSelect.appendChild(option);

      // Auto-select the first model (which is the recommended one)
      if (index === 0) {
        option.selected = true;
      }
    });
  }

  updateAPIKeyVisibility(provider: string): void {
    // Hide all provider-specific groups first
    Object.keys(this.providers).forEach((providerId) => {
      const group = document.getElementById(`${providerId}-api-key-group`);
      if (group) {
        group.style.display = "none";
      }
    });

    // Show the selected provider's group
    const selectedGroup = document.getElementById(`${provider}-api-key-group`);
    if (selectedGroup) {
      selectedGroup.style.display = "block";
    }

    // Handle provider-specific info
    const providerConfig = this.providers[provider];
    const infoElement = document.getElementById("anthropic-continue-info");

    if (infoElement) {
      if (providerConfig?.continueInfo) {
        infoElement.style.display = "block";
        // Update the info text if needed
        const helpText = infoElement.querySelector(".help-text");
        if (helpText) {
          helpText.innerHTML = `💡 <strong>Continue in AI chat:</strong> ${providerConfig.continueInfo}`;
        }
      } else {
        infoElement.style.display = "none";
      }
    }
  }

  async loadSettings(): Promise<void> {
    try {
      const result = await browser.storage.local.get("settings");
      const settings = result.settings || {};

      // Set provider (default to 'openai' if none set)
      const provider = settings.provider || "openai";

      const providerRadio = getElement(
        `provider-${provider}`,
        HTMLInputElement
      );
      if (providerRadio) {
        providerRadio.checked = true;
      } else {
        console.error("Could not find radio button for provider:", provider);
      }

      const openaiKeyField = getElement("openai-api-key", HTMLInputElement);
      const anthropicKeyField = getElement(
        "anthropic-api-key",
        HTMLInputElement
      );
      const maxTokensField = getElement("max-tokens", HTMLInputElement);
      const maxContextLengthField = getElement(
        "max-context-length",
        HTMLInputElement
      );
      const triggerKeyField = getElement("trigger-key", HTMLSelectElement);

      if (openaiKeyField) openaiKeyField.value = settings.openaiApiKey || "";
      if (anthropicKeyField)
        anthropicKeyField.value = settings.anthropicApiKey || "";
      if (maxTokensField)
        maxTokensField.value = String(settings.maxTokens || 150);
      if (maxContextLengthField)
        maxContextLengthField.value = String(settings.maxContextLength || 1000);
      if (triggerKeyField) triggerKeyField.value = settings.triggerKey || "alt";

      // Trigger all provider-related updates (models, styling, visibility)
      this.onProviderChange(provider);

      // Set model after provider change has populated the options
      const modelField = getElement("model", HTMLSelectElement);
      if (modelField && settings.model) {
        modelField.value = settings.model;
      }
    } catch (error) {
      console.error("Error loading settings:", error);
      this.showStatus("Error loading settings", "error");
      // Fallback to default state
      this.onProviderChange("openai");
    }
  }

  async saveSettings(): Promise<void> {
    try {
      const providerRadio = querySelector(
        'input[name="provider"]:checked',
        HTMLInputElement
      );
      const provider = providerRadio?.value;
      const modelField = getElement("model", HTMLSelectElement);
      const model = modelField?.value;
      const maxTokensField = getElement("max-tokens", HTMLInputElement);
      const maxTokens = maxTokensField ? parseInt(maxTokensField.value) : 0;
      const maxContextLengthField = getElement(
        "max-context-length",
        HTMLInputElement
      );
      const maxContextLength = maxContextLengthField
        ? parseInt(maxContextLengthField.value)
        : 0;
      const triggerKeyField = getElement("trigger-key", HTMLSelectElement);
      const triggerKey = triggerKeyField?.value;

      if (!provider) {
        this.showStatus("Please select an API provider", "error");
        return;
      }

      // Check that the selected provider has an API key
      const apiKeyField = getElement(`${provider}-api-key`, HTMLInputElement);
      const apiKey = apiKeyField ? apiKeyField.value.trim() : "";
      const providerConfig = this.providers[provider];

      if (!apiKey) {
        this.showStatus(
          `Please enter your ${providerConfig?.name || provider} API key`,
          "error"
        );
        return;
      }

      // Model should always be selected now due to auto-selection
      if (!model) {
        this.showStatus("Please select a model", "error");
        return;
      }

      if (!maxTokens || maxTokens < 50 || maxTokens > 500) {
        this.showStatus("Max tokens must be between 50 and 500", "error");
        return;
      }

      if (
        !maxContextLength ||
        maxContextLength < 200 ||
        maxContextLength > 10000
      ) {
        this.showStatus(
          "Max request length must be between 200 and 10,000",
          "error"
        );
        return;
      }

      // Build settings object dynamically
      const settings: Settings = {
        provider,
        model: model || "",
        maxTokens,
        maxContextLength,
        triggerKey: triggerKey || "alt",
        openaiApiKey: "",
        anthropicApiKey: "",
      };

      // Add API keys for all providers
      Object.keys(this.providers).forEach((providerId) => {
        const keyField = getElement(`${providerId}-api-key`, HTMLInputElement);
        if (keyField) {
          settings[`${providerId}ApiKey`] = keyField.value.trim();
        }
      });

      await browser.storage.local.set({ settings });
      this.showStatus("Settings saved successfully!", "success");
    } catch (error) {
      this.showStatus("Error saving settings", "error");
    }
  }

  async resetSettings(): Promise<void> {
    if (confirm("Are you sure you want to reset all settings to defaults?")) {
      try {
        await browser.storage.local.remove("settings");
        this.loadSettings();
        this.showStatus("Settings reset to defaults", "success");
      } catch (error) {
        this.showStatus("Error resetting settings", "error");
      }
    }
  }

  async testAPI(): Promise<void> {
    const testButton = getElement("test-api", HTMLButtonElement);
    const testResult = getElement("test-result", HTMLElement);

    if (!testButton || !testResult) return;

    testButton.disabled = true;
    testButton.textContent = "Testing...";
    testResult.innerHTML = "";

    try {
      const providerRadio = querySelector(
        'input[name="provider"]:checked',
        HTMLInputElement
      );
      const provider = providerRadio?.value;
      const modelField = getElement("model", HTMLSelectElement);
      const model = modelField?.value;

      if (!provider || !model) {
        throw new Error("Please select a provider and model before testing");
      }

      // Check that the selected provider has an API key
      const apiKeyField = getElement(`${provider}-api-key`, HTMLInputElement);
      const apiKey = apiKeyField?.value.trim();

      if (!apiKey) {
        const providerConfig = this.providers[provider];
        throw new Error(
          `Please enter your ${
            providerConfig?.name || provider
          } API key before testing`
        );
      }

      // Temporarily save current settings for test
      const maxTokensField = getElement("max-tokens", HTMLInputElement);
      const maxContextLengthField = getElement(
        "max-context-length",
        HTMLInputElement
      );
      const triggerKeyField = getElement("trigger-key", HTMLSelectElement);

      const testSettings: Settings = {
        provider,
        model,
        maxTokens: maxTokensField ? parseInt(maxTokensField.value) || 150 : 150,
        maxContextLength: maxContextLengthField
          ? parseInt(maxContextLengthField.value) || 1000
          : 1000,
        triggerKey: triggerKeyField?.value || "alt",
        openaiApiKey: "",
        anthropicApiKey: "",
      };

      // Add API keys for all providers
      Object.keys(this.providers).forEach((providerId) => {
        const keyField = getElement(`${providerId}-api-key`, HTMLInputElement);
        if (keyField) {
          testSettings[`${providerId}ApiKey`] = keyField.value.trim();
        }
      });

      await browser.storage.local.set({ testSettings });

      const testData: TestData = {
        title: "Test Page",
        url: "https://example.com",
        selectedText: "This is a test.",
        contextText: "This is a test of the API connection.",
      };

      const response = (await browser.runtime.sendMessage({
        action: "testAPI",
        data: testData,
      })) as APIResponse;

      if (response.success) {
        testResult.innerHTML = `<div class="success">✅ API test successful!</div>`;
      } else {
        testResult.innerHTML = `<div class="error">❌ API test failed: ${response.error}</div>`;
      }
    } catch (error) {
      testResult.innerHTML = `<div class="error">❌ Test failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }</div>`;
    } finally {
      testButton.disabled = false;
      testButton.textContent = "Test API Connection";
      // Clean up test settings
      await browser.storage.local.remove("testSettings");
    }
  }

  openAPIKeyPage(): void {
    const providerRadio = querySelector(
      'input[name="provider"]:checked',
      HTMLInputElement
    );
    const provider = providerRadio?.value || "openai";
    const providerConfig = this.providers[provider];
    if (providerConfig) {
      browser.tabs.create({ url: providerConfig.apiKeyUrl });
    }
  }

  clearTestResult(): void {
    const testResult = getElement("test-result", HTMLElement);
    if (testResult) {
      testResult.innerHTML = "";
    }
  }

  showStatus(
    message: string,
    type: "info" | "success" | "error" = "info"
  ): void {
    const status = getElement("status", HTMLElement);
    if (!status) return;

    status.textContent = message;
    status.className = `status ${type}`;

    setTimeout(() => {
      status.textContent = "";
      status.className = "status";
    }, 3000);
  }
}

// Initialize options manager when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new OptionsManager();
});
