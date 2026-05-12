import { PluginSettingTab, App, Setting } from "obsidian";
import type LivePreviewPlugin from "./main";

export interface LivePreviewSettings {
  port: number;
  debounceDelay: number;
  autoOpenOnHtml: boolean;
}

export const DEFAULT_SETTINGS: LivePreviewSettings = {
  port: 5500,
  debounceDelay: 300,
  autoOpenOnHtml: true,
};

export class SettingTab extends PluginSettingTab {
  plugin: LivePreviewPlugin;

  constructor(app: App, plugin: LivePreviewPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "Live Preview" });

    new Setting(containerEl)
      .setName("Port")
      .setDesc("Starting port (will auto-increment if busy)")
      .addText((text) =>
        text
          .setValue(String(this.plugin.settings.port))
          .onChange(async (value) => {
            const port = parseInt(value, 10);
            if (!isNaN(port) && port > 0 && port < 65536) {
              this.plugin.settings.port = port;
              await this.plugin.saveSettings();
            }
          })
      );

    new Setting(containerEl)
      .setName("Debounce delay")
      .setDesc("Milliseconds to wait before refreshing after a file change")
      .addText((text) =>
        text
          .setValue(String(this.plugin.settings.debounceDelay))
          .onChange(async (value) => {
            const delay = parseInt(value, 10);
            if (!isNaN(delay) && delay >= 0) {
              this.plugin.settings.debounceDelay = delay;
              await this.plugin.saveSettings();
            }
          })
      );

    new Setting(containerEl)
      .setName("Auto-open on HTML files")
      .setDesc("Automatically start preview when opening an .html or .htm file")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.autoOpenOnHtml)
          .onChange(async (value) => {
            this.plugin.settings.autoOpenOnHtml = value;
            await this.plugin.saveSettings();
          })
      );
  }
}
