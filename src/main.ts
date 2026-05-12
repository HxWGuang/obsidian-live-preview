import { Plugin, WorkspaceLeaf, TFile, FileSystemAdapter, Notice } from "obsidian";
import { LiveServer } from "./LiveServer";
import { PreviewView, VIEW_TYPE_LIVE_PREVIEW } from "./PreviewView";
import { DEFAULT_SETTINGS, SettingTab, LivePreviewSettings } from "./Settings";

const HTML_EXTENSIONS = new Set(["html", "htm"]);
const WATCH_EXTENSIONS = new Set(["html", "htm", "css", "js"]);

export default class LivePreviewPlugin extends Plugin {
  settings!: LivePreviewSettings;
  liveServer!: LiveServer;
  private currentFile: TFile | null = null;
  private debounceTimer: number | null = null;

  async onload(): Promise<void> {
    await this.loadSettings();

    this.liveServer = new LiveServer(this.settings.port);

    this.registerView(
      VIEW_TYPE_LIVE_PREVIEW,
      (leaf) => new PreviewView(leaf)
    );

    this.addCommand({
      id: "start-live-preview",
      name: "Start Live Preview",
      checkCallback: (checking) => {
        const file = this.app.workspace.getActiveFile();
        if (file && HTML_EXTENSIONS.has(file.extension)) {
          if (!checking) this.startPreview(file);
          return true;
        }
        return false;
      },
    });

    this.addCommand({
      id: "stop-live-preview",
      name: "Stop Live Preview",
      callback: () => this.stopPreview(),
    });

    this.addCommand({
      id: "open-in-browser",
      name: "Open Preview in Browser",
      checkCallback: (checking) => {
        if (this.liveServer.isRunning && this.currentFile) {
          if (!checking) {
            window.open(this.liveServer.getUrl(this.currentFile.path));
          }
          return true;
        }
        return false;
      },
    });

    this.registerEvent(
      this.app.vault.on("modify", (file) => {
        if (file instanceof TFile && WATCH_EXTENSIONS.has(file.extension)) {
          this.onFileChanged();
        }
      })
    );

    this.registerEvent(
      this.app.workspace.on("file-open", (file) => {
        if (
          file &&
          HTML_EXTENSIONS.has(file.extension) &&
          this.settings.autoOpenOnHtml
        ) {
          this.startPreview(file);
        }
      })
    );

    this.addSettingTab(new SettingTab(this.app, this));
  }

  private onFileChanged(): void {
    if (!this.liveServer.isRunning) return;
    if (this.debounceTimer !== null) {
      window.clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = window.setTimeout(() => {
      this.liveServer.sendReload();
    }, this.settings.debounceDelay);
  }

  private async startPreview(file: TFile): Promise<void> {
    const adapter = this.app.vault.adapter;
    if (!(adapter instanceof FileSystemAdapter)) return;

    const vaultRoot = adapter.getBasePath();
    const fileDir = file.parent?.path || "";
    const rootDir = fileDir ? `${vaultRoot}/${fileDir}` : vaultRoot;
    const fileAbsPath = `${vaultRoot}/${file.path}`;

    if (this.liveServer.isRunning) {
      this.liveServer.setRootDir(rootDir);
    } else {
      try {
        await this.liveServer.start(rootDir);
      } catch (err) {
        new Notice(`Live Preview: Failed to start server — ${err}`);
        return;
      }
    }

    this.currentFile = file;

    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_LIVE_PREVIEW);
    let leaf: WorkspaceLeaf | null = leaves[0] || null;
    if (!leaf) {
      leaf = this.app.workspace.getRightLeaf(false) ?? this.app.workspace.getLeaf("split");
      await leaf.setViewState({ type: VIEW_TYPE_LIVE_PREVIEW, active: true });
    }
    this.app.workspace.revealLeaf(leaf);

    const view = leaf.view as PreviewView;
    view.loadUrl(this.liveServer.getUrl(fileAbsPath));
  }

  private async stopPreview(): Promise<void> {
    await this.liveServer.stop();
    this.currentFile = null;
    if (this.debounceTimer !== null) {
      window.clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }

  async onunload(): Promise<void> {
    await this.stopPreview();
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }
}
