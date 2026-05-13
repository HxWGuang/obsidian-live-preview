import { FileView, WorkspaceLeaf, TFile } from "obsidian";

export const VIEW_TYPE_LIVE_PREVIEW = "live-preview-view";

export interface PreviewController {
  onFileOpen(file: TFile, view: PreviewView): Promise<void>;
}

export class PreviewView extends FileView {
  private iframe: HTMLIFrameElement | null = null;
  private controller: PreviewController;

  constructor(leaf: WorkspaceLeaf, controller: PreviewController) {
    super(leaf);
    this.controller = controller;
  }

  getViewType(): string {
    return VIEW_TYPE_LIVE_PREVIEW;
  }

  getDisplayText(): string {
    return this.file?.name ?? "Live Preview";
  }

  getIcon(): string {
    return "globe";
  }

  canAcceptExtension(extension: string): boolean {
    return extension === "html" || extension === "htm";
  }

  async onLoadFile(file: TFile): Promise<void> {
    await this.controller.onFileOpen(file, this);
  }

  async onOpen(): Promise<void> {
    const container = this.contentEl;
    container.empty();
    container.addClass("live-preview-container");

    this.iframe = activeDocument.createElement("iframe");
    this.iframe.setAttribute("sandbox", "allow-scripts allow-same-origin");
    this.iframe.addClass("live-preview-iframe");
    container.appendChild(this.iframe);
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
