import { FileView, WorkspaceLeaf, TFile, setIcon } from "obsidian";

export const VIEW_TYPE_LIVE_PREVIEW = "live-preview-view";

export interface PreviewController {
  onFileOpen(file: TFile, view: PreviewView): Promise<void>;
}

export class PreviewView extends FileView {
  private iframe: HTMLIFrameElement | null = null;
  private controller: PreviewController;
  private mode: "preview" | "source" = "preview";
  private sourceEl: HTMLPreElement | null = null;
  private toggleBtn: HTMLElement | null = null;

  constructor(leaf: WorkspaceLeaf, controller: PreviewController) {
    super(leaf);
    this.controller = controller;
  }

  getViewType(): string {
    return VIEW_TYPE_LIVE_PREVIEW;
  }

  getDisplayText(): string {
    return this.file?.name ?? "HTML Preview";
  }

  getIcon(): string {
    return "globe";
  }

  canAcceptExtension(extension: string): boolean {
    return extension === "html" || extension === "htm";
  }

  async onLoadFile(file: TFile): Promise<void> {
    await this.controller.onFileOpen(file, this);
    if (this.mode === "source") {
      await this.renderSource();
    }
  }

  async onOpen(): Promise<void> {
    const container = this.contentEl;
    container.empty();
    container.addClass("live-preview-container");

    this.iframe = activeDocument.createElement("iframe");
    this.iframe.setAttribute("sandbox", "allow-scripts allow-same-origin");
    this.iframe.addClass("live-preview-iframe");
    container.appendChild(this.iframe);

    this.sourceEl = container.createEl("pre", { cls: "live-preview-source" });
    this.sourceEl.hide();

    this.toggleBtn = this.addAction("code", "View source", () => {
      void this.toggleMode();
    });

    this.registerEvent(
      this.app.vault.on("modify", (file) => {
        if (file === this.file && this.mode === "source") {
          void this.renderSource();
        }
      })
    );
  }

  private async toggleMode(): Promise<void> {
    this.mode = this.mode === "preview" ? "source" : "preview";
    await this.applyMode();
  }

  private async applyMode(): Promise<void> {
    const isSource = this.mode === "source";
    if (isSource) {
      await this.renderSource();
    }
    this.iframe?.toggle(!isSource);
    this.sourceEl?.toggle(isSource);
    if (this.toggleBtn) {
      setIcon(this.toggleBtn, isSource ? "eye" : "code");
      this.toggleBtn.setAttribute("aria-label", isSource ? "View preview" : "View source");
    }
  }

  private async renderSource(): Promise<void> {
    if (!this.file || !this.sourceEl) return;
    const content = await this.app.vault.read(this.file);
    this.sourceEl.setText(content);
  }

  loadUrl(url: string): void {
    if (this.iframe) {
      this.iframe.src = url;
    }
  }

  async onClose(): Promise<void> {
    if (this.iframe) {
      this.iframe.src = "about:blank";
      this.iframe.remove();
      this.iframe = null;
    }
  }
}
