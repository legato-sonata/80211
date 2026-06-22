<script>
  import { getTopology } from './context.js';
  import Plus from '@lucide/svelte/icons/plus';
  import Server from '@lucide/svelte/icons/server';
  import Router from '@lucide/svelte/icons/router';
  import MonitorSmartphone from '@lucide/svelte/icons/monitor-smartphone';
  import Wifi from '@lucide/svelte/icons/wifi';
  import CreditCard from '@lucide/svelte/icons/credit-card';
  import Cable from '@lucide/svelte/icons/cable';
  import X from '@lucide/svelte/icons/x';
  import Download from '@lucide/svelte/icons/download';
  import Upload from '@lucide/svelte/icons/upload';
  import Image from '@lucide/svelte/icons/image';
  import FileText from '@lucide/svelte/icons/file-text';
  import Activity from '@lucide/svelte/icons/activity';
  import LayoutGrid from '@lucide/svelte/icons/layout-grid';
  import Circle from '@lucide/svelte/icons/circle';
  import Network from '@lucide/svelte/icons/network';
  import PrinterIcon from '@lucide/svelte/icons/printer';
  import Monitor from '@lucide/svelte/icons/monitor';
  import HardDrive from '@lucide/svelte/icons/hard-drive';
  import Trash2 from '@lucide/svelte/icons/trash-2';
  import { toPng, toSvg } from 'html-to-image';

  const topology = getTopology();
  let menuOpen = $state(false);
  let isLoading = $state(false);
  let loadingText = $state("");
  let fileInput;

  const deviceTypes = [
    { type: 'computer', icon: Monitor, label: 'Computer' },
    { type: 'pos', icon: CreditCard, label: 'POS' },
    { type: 'server', icon: HardDrive, label: 'Server' },
    { type: 'router', icon: Router, label: 'Router' },
    { type: 'switch', icon: Server, label: 'Switch' },
    { type: 'ap', icon: Wifi, label: 'WiFi AP' },
    { type: 'camera', icon: MonitorSmartphone, label: 'CCTV' },
    { type: 'printer', icon: PrinterIcon, label: 'Printer' }
  ];

  function handleAdd(type) {
    topology.addNode(type);
    menuOpen = false;
  }

  function handleConnect() {
    topology.toggleLinkingMode();
    menuOpen = false;
  }

  function generateFilename(suffix, ext) {
    const slug = (topology.name || 'topology').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const now = new Date();
    const ymd = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
    const hms = `${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}${String(now.getSeconds()).padStart(2,'0')}`;
    return `${slug}_${suffix}_${ymd}_${hms}.${ext}`;
  }

  function downloadFile(dataUrl, filename) {
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
  }

  function getBoundingBox() {
    if (topology.nodes.length === 0) return { minX: 0, minY: 0, width: 800, height: 600 };
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    topology.nodes.forEach(n => {
      minX = Math.min(minX, n.x);
      minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x + 150);
      maxY = Math.max(maxY, n.y + 150);
    });
    const padding = 100;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;
    return { minX, minY, width: maxX - minX, height: maxY - minY };
  }

  async function exportImage(type, mode) {
    menuOpen = false;
    isLoading = true;
    loadingText = `Exporting ${type.toUpperCase()}...`;
    
    await new Promise(r => setTimeout(r, 50));
    
    try {
      const node = document.querySelector('.transform-layer');
      if (!node) return;
      
      let options = { 
        backgroundColor: '#ffffff',
        skipFonts: true,
        fontEmbedCSS: ''
      };
      
      if (mode === 'full') {
        const bb = getBoundingBox();
        options.width = bb.width;
        options.height = bb.height;
        options.style = {
          transform: `translate(${-bb.minX}px, ${-bb.minY}px) scale(1)`,
          width: `${bb.width}px`,
          height: `${bb.height}px`
        };
      }
      
      const dataUrl = type === 'png' ? await toPng(node, options) : await toSvg(node, options);
      downloadFile(dataUrl, generateFilename('map', type));
    } catch (e) {
      console.error(`${type} export failed`, e);
      alert(`Export failed: ${e.message}`);
    } finally {
      isLoading = false;
    }
  }

  async function exportProject() {
    menuOpen = false;
    isLoading = true;
    loadingText = "Saving Project...";
    await new Promise(r => setTimeout(r, 50));
    
    try {
      const data = topology.exportProject();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      downloadFile(url, generateFilename('project', 'json'));
      URL.revokeObjectURL(url);
    } finally {
      isLoading = false;
    }
  }

  function openReport() {
    menuOpen = false;
    topology.isReportOpen = true;
  }

  async function handleImport(e) {
    menuOpen = false;
    const file = e.target.files[0];
    if (!file) return;
    
    isLoading = true;
    loadingText = "Loading Project...";
    
    try {
      const text = await file.text();
      const success = topology.loadProject(text);
      if (success) {
        window.dispatchEvent(new CustomEvent('reset-zoom'));
      } else {
        alert("Failed to load project: Invalid file format.");
      }
    } catch (err) {
      alert("Error reading file.");
    } finally {
      isLoading = false;
      e.target.value = '';
    }
  }
</script>

{#if isLoading}
  <div class="loading-overlay glass-effect">
    <div class="spinner"></div>
    <div class="loading-text">{loadingText}</div>
  </div>
{/if}

{#if topology.isLinkingMode}
  <div class="linking-toast">
    <span>Tap two nodes to connect</span>
    <button class="cancel-btn" onclick={() => topology.toggleLinkingMode()} aria-label="Cancel connection">
      <X size={16} strokeWidth={2} />
    </button>
  </div>
{/if}

<div class="fab-wrapper">
  {#if menuOpen}
    <div class="fab-menu glass-effect">
      <div class="menu-scroll-container">
        <div class="menu-section">
          <span class="section-label">Add Node</span>
          <div class="tile-grid">
            {#each deviceTypes as device}
              <button class="tile-btn" onclick={() => handleAdd(device.type)}>
                <device.icon size={18} color="var(--text-secondary)" strokeWidth={1.5} />
                <span class="tile-label">{device.label}</span>
              </button>
            {/each}
          </div>
        </div>

        <div class="menu-divider"></div>

        <div class="menu-section">
          <span class="section-label">Project</span>
          <div class="tile-grid">
            <button class="tile-btn" onclick={exportProject}>
              <Download size={18} color="var(--text-secondary)" strokeWidth={1.5} />
              <span class="tile-label">Save</span>
            </button>
            <button class="tile-btn" onclick={() => fileInput.click()}>
              <Upload size={18} color="var(--text-secondary)" strokeWidth={1.5} />
              <span class="tile-label">Load</span>
            </button>
            <button class="tile-btn" onclick={openReport}>
              <FileText size={18} color="var(--text-secondary)" strokeWidth={1.5} />
              <span class="tile-label">Report</span>
            </button>
            <button class="tile-btn" onclick={() => { menuOpen = false; topology.clearAll(); }}>
              <Trash2 size={18} color="var(--text-secondary)" strokeWidth={1.5} />
              <span class="tile-label">Clear</span>
            </button>
          </div>
        </div>

        <div class="menu-divider"></div>

        <div class="menu-section">
          <span class="section-label">Layouts</span>
          <div class="tile-grid">
            <button class="tile-btn" onclick={() => { menuOpen = false; topology.applyHierarchicalLayout(); }}>
              <Network size={18} color="var(--text-secondary)" strokeWidth={1.5} />
              <span class="tile-label">Tree</span>
            </button>
            <button class="tile-btn" onclick={() => { menuOpen = false; topology.applyGridLayout(); }}>
              <LayoutGrid size={18} color="var(--text-secondary)" strokeWidth={1.5} />
              <span class="tile-label">Grid</span>
            </button>
            <button class="tile-btn" onclick={() => { menuOpen = false; topology.applyCircularLayout(); }}>
              <Circle size={18} color="var(--text-secondary)" strokeWidth={1.5} />
              <span class="tile-label">Circle</span>
            </button>
            <button class="tile-btn" onclick={() => { menuOpen = false; topology.autoLayout(); }}>
              <Activity size={18} color="var(--text-secondary)" strokeWidth={1.5} />
              <span class="tile-label">Force</span>
            </button>
          </div>
        </div>

        <!-- Reports section removed and merged into Project -->

        <div class="menu-divider"></div>

        <div class="menu-section">
          <span class="section-label">Export Image</span>
          <div class="tile-grid">
            <button class="tile-btn" onclick={() => exportImage('png', 'full')}>
              <Image size={18} color="var(--text-secondary)" strokeWidth={1.5} />
              <span class="tile-label">PNG Full</span>
            </button>
            <button class="tile-btn" onclick={() => exportImage('png', 'view')}>
              <Image size={18} color="var(--text-secondary)" strokeWidth={1.5} />
              <span class="tile-label">PNG View</span>
            </button>
            <button class="tile-btn" onclick={() => exportImage('svg', 'full')}>
              <Image size={18} color="var(--text-secondary)" strokeWidth={1.5} />
              <span class="tile-label">SVG</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  {/if}
  
  <button class="fab {menuOpen ? 'active' : ''}" onclick={() => menuOpen = !menuOpen} aria-label="Toggle tools menu">
    <div class="fab-icon-wrapper" style="transform: {menuOpen ? 'rotate(45deg)' : 'rotate(0)'};">
      <Plus size={32} color={menuOpen ? 'var(--surface)' : 'var(--text-primary)'} strokeWidth={1.5} />
    </div>
  </button>
</div>

{#if menuOpen}
  <div class="backdrop" onclick={() => menuOpen = false} role="button" tabindex="0" onkeydown={(e) => e.key === 'Escape' && (menuOpen = false)} aria-label="Close menu"></div>
{/if}

<input type="file" accept=".json" bind:this={fileInput} onchange={handleImport} style="display: none;" />

<style>
  .loading-overlay {
    position: fixed;
    top: 0; left: 0; width: 100vw; height: 100vh;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(0,0,0,0.1);
    border-top-color: var(--text-primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .loading-text {
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .fab-wrapper {
    position: fixed;
    bottom: 72px;
    right: 24px;
    z-index: 20;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 16px;
    pointer-events: none;
  }

  .fab {
    width: 64px;
    height: 64px;
    border-radius: 32px;
    border: 1px solid var(--border);
    background: var(--surface);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    transition: background 0.2s, transform 0.1s;
    pointer-events: auto;
    cursor: pointer;
  }

  .fab:active {
    transform: scale(0.95);
  }

  .fab.active {
    background: var(--text-primary);
    border-color: var(--text-primary);
  }
  
  .fab-icon-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s ease-out;
  }
  
  .fab-menu {
    border: 1px solid var(--border);
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border-radius: 12px;
    width: 220px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    overflow: hidden;
    pointer-events: auto;
    max-height: 70vh;
    display: flex;
    flex-direction: column;
  }

  .menu-scroll-container {
    overflow-y: auto;
    width: 100%;
    display: flex;
    flex-direction: column;
    padding-bottom: 8px;
  }

  .menu-section {
    padding: 8px 12px 2px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .section-label {
    font-size: 0.65rem;
    font-weight: 700;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.8px;
  }

  .tile-grid {
    display: flex;
    gap: 4px;
    overflow-x: auto;
    padding-bottom: 4px;
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  
  .tile-grid::-webkit-scrollbar {
    display: none;
  }

  .tile-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    padding: 6px 4px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: rgba(255, 255, 255, 0.5);
    cursor: pointer;
    transition: all 0.15s ease;
    flex: 0 0 54px;
  }

  .tile-btn:hover, .tile-btn:active {
    background: var(--surface);
    border-color: var(--text-secondary);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  }

  .tile-label {
    font-size: 0.6rem;
    font-weight: 600;
    color: var(--text-primary);
    text-align: center;
    line-height: 1.1;
  }

  .menu-divider {
    height: 1px;
    background: var(--border);
    margin: 4px 16px;
    flex-shrink: 0;
  }

  .linking-toast {
    position: fixed;
    top: 24px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--text-primary);
    color: var(--surface);
    padding: 12px 20px;
    border-radius: 32px;
    display: flex;
    align-items: center;
    gap: 12px;
    z-index: 30;
    font-size: 0.85rem;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    animation: slideDown 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }

  .cancel-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255,255,255,0.2);
    border: none;
    color: var(--surface);
    width: 24px;
    height: 24px;
    border-radius: 12px;
    padding: 0;
    cursor: pointer;
  }

  .cancel-btn:active {
    background: rgba(255,255,255,0.3);
  }

  .backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 15;
    background: rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(2px);
    -webkit-backdrop-filter: blur(2px);
  }

  @keyframes slideDown {
    from { transform: translate(-50%, -100%); opacity: 0; }
    to { transform: translate(-50%, 0); opacity: 1; }
  }

  @media (max-width: 768px) {
    .fab-wrapper {
      bottom: 72px;
      right: 24px;
    }
    .linking-toast {
      top: auto;
      bottom: 140px;
    }
  }
</style>
