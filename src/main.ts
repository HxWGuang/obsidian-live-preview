import { Plugin, WorkspaceLeaf, TFile, FileSystemAdapter, Notice } from "obsidian";
import { LiveServer } from "./LiveServer";
import { PreviewView, VIEW_TYPE_LIVE_PREVIEW, PreviewController } from "./PreviewView";
import { DEFAULT_SETTINGS, SettingTab, LivePreviewSettings } from "./Settings";

const WATCH_EXTENSIONS = new Set(["html", "htm", "css", "js"]);

export default class LivePreviewPlugin extends Plugin implements PreviewController {
  settings!: LivePreviewSettings;
  liveServer!: LiveServer;
  private currentFile: TFile | null = null;
  private debounceTimer: number | null = null;

  async onload(): Promise<void> {
    await this.loadSettings();

    this.liveServer = new LiveServer(this.settings.port);

    this.registerExtensions(["html", "htm"], VIEW_TYPE_LIVE_PREVIEW);

    this.registerView(
      VIEW_TYPE_LIVE_PREVIEW,
      (leaf) => new PreviewView(leaf, this)
    );

    this.addCommand({
      id: "start-live-preview",
      name: "Start Live Preview",
      checkCallback: (checking) => {
        const file = this.app.workspace.getActiveFile();
        if (file && (file.extension === "html" || file.extension === "htm")) {
          if (!checking) this.openPreviewForFile(file);
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
            const adapter = this.app.vault.adapter;
            if (adapter instanceof FileSystemAdapter) {
              window.open(
                this.liveServer.getUrl(
                  `${adapter.getBasePath()}/${this.currentFile.path}`
                )
              );
            }
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

    this.addSettingTab(new SettingTab(this.app, this));
  }

  async onFileOpen(file: TFile, view: PreviewView): Promise<void> {
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
    view.loadUrl(this.liveServer.getUrl(fileAbsPath));
  }

  private async openPreviewForFile(file: TFile): Promise<void> {
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_LIVE_PREVIEW);
    let leaf: WorkspaceLeaf | null = leaves[0] || null;
    if (!leaf) {
      leaf = this.app.workspace.getRightLeaf(false) ?? this.app.workspace.getLeaf("split");
    }
    await leaf.setViewState({ type: VIEW_TYPE_LIVE_PREVIEW, active: true });
    this.app.workspace.revealLeaf(leaf);
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
