import { ItemView, WorkspaceLeaf } from "obsidian";

export const VIEW_TYPE_LIVE_PREVIEW = "live-preview-view";

export class PreviewView extends ItemView {
  private iframe: HTMLIFrameElement | null = null;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  getViewType(): string {
    return VIEW_TYPE_LIVE_PREVIEW;
  }

  getDisplayText(): string {
    return "Live Preview";
  }

  getIcon(): string {
    return "globe";
  }

  async onOpen(): Promise<void> {
    const container = this.containerEl.children[1];
    container.empty();
    container.style.padding = "0";
    container.style.overflow = "hidden";

    this.iframe = document.createElement("iframe");
    this.iframe.setAttribute("sandbox", "allow-scripts allow-same-origin");
    this.iframe.style.width = "100%";
    this.iframe.style.height = "100%";
    this.iframe.style.border = "none";
    container.appendChild(this.iframe);
  }

  loadUrl(url: string): void {
    if (this.iframe) {
      this.iframe.src = url;
    }
  }

  async onClose(): Promise<void> {
    this.iframe = null;
  }
}
