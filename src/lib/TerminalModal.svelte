<script>
  import { getTopology } from './context.js';
  import { simulatePing, simulateTracert } from './SimulationEngine.js';
  import X from '@lucide/svelte/icons/x';
  
  export let node = null;
  export let onClose = () => {};

  const topology = getTopology();
  
  let input = '';
  let outputLines = [];
  
  let terminalContainer;

  function printLine(line) {
    outputLines = [...outputLines, line];
    setTimeout(() => {
      if (terminalContainer) {
        terminalContainer.scrollTop = terminalContainer.scrollHeight;
      }
    }, 10);
  }

  function handleCommand(e) {
    if (e.key === 'Enter') {
      const cmd = input.trim();
      printLine(`C:\\Users\\${node.label}> ${cmd}`);
      input = '';
      
      if (!cmd) return;

      const args = cmd.split(' ');
      const program = args[0].toLowerCase();

      if (program === 'ipconfig') {
        printLine(' ');
        printLine('Windows IP Configuration');
        printLine(' ');
        printLine('Ethernet adapter Local Area Connection:');
        printLine(' ');
        printLine(`   Connection-specific DNS Suffix  . : local`);
        printLine(`   IPv4 Address. . . . . . . . . . . : ${node.ip}`);
        printLine(`   Subnet Mask . . . . . . . . . . . : ${node.subnet || '0.0.0.0'}`);
        printLine(`   Default Gateway . . . . . . . . . : ${node.gateway || '0.0.0.0'}`);
        printLine(' ');
      } else if (program === 'ping') {
        const targetIp = args[1];
        if (!targetIp) {
          printLine('Usage: ping <target_ip>');
          return;
        }
        printLine(`Pinging ${targetIp} with 32 bytes of data:`);
        
        // Simulate 4 pings
        let count = 0;
        const interval = setInterval(() => {
          if (count >= 4) {
            clearInterval(interval);
            printLine(' ');
            printLine(`Ping statistics for ${targetIp}:`);
            printLine(`    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),`);
            return;
          }
          const result = simulatePing(topology, node.id, targetIp);
          printLine(result.message);
          
          if (result.success && result.path) {
             // We can even highlight the path here if we want!
             // For now, let's just log.
          count++;
        }, 1000);
      } else if (program === 'tracert' || program === 'traceroute') {
        const targetIp = args[1];
        if (!targetIp) {
          printLine(`Usage: ${program} <target_ip>`);
          return;
        }
        printLine(`Tracing route to ${targetIp}`);
        printLine('over a maximum of 30 hops:');
        printLine(' ');

        const result = simulateTracert(topology, node.id, targetIp);
        if (!result.success) {
          printLine(`  1    *        *        *     ${result.error || 'Destination host unreachable.'}`);
          printLine(' ');
          printLine('Trace complete.');
          return;
        }

        let hopIndex = 0;
        const interval = setInterval(() => {
          if (hopIndex >= result.hops.length) {
            clearInterval(interval);
            printLine(' ');
            printLine('Trace complete.');
            return;
          }
          const hop = result.hops[hopIndex];
          printLine(`  ${(hopIndex + 1).toString().padEnd(2, ' ')}   <1 ms    <1 ms    <1 ms  ${hop.ip} [${hop.label}]`);
          hopIndex++;
        }, 1000);
      } else if (program === 'cls' || program === 'clear') {
        outputLines = [];
      } else {
        printLine(`'${program}' is not recognized as an internal or external command,`);
        printLine('operable program or batch file.');
      }
    }
  }
</script>

<div class="modal-backdrop" onpointerdown={onClose}>
  <div class="modal-content" onpointerdown={(e) => e.stopPropagation()}>
    <header class="modal-header">
      <h3>Command Prompt - {node.label}</h3>
      <button class="icon-btn" onclick={onClose}>
        <X size={20} />
      </button>
    </header>
    
    <div class="terminal-body" bind:this={terminalContainer} onclick={() => document.getElementById('term-input').focus()}>
      {#each outputLines as line}
        <div class="term-line">{line}</div>
      {/each}
      <div class="term-input-line">
        <span class="prompt">C:\Users\{node.label}&gt;</span>
        <input id="term-input" type="text" bind:value={input} onkeydown={handleCommand} autocomplete="off" spellcheck="false" autofocus />
      </div>
    </div>
  </div>
</div>

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0,0,0,0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 100;
  }
  .modal-content {
    width: 600px;
    height: 400px;
    background: #1e1e1e;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 10px 25px rgba(0,0,0,0.5);
  }
  .modal-header {
    background: #333;
    color: #fff;
    padding: 8px 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-family: var(--font-sans);
  }
  .modal-header h3 {
    margin: 0;
    font-size: 14px;
    font-weight: 500;
  }
  .icon-btn {
    background: transparent;
    border: none;
    color: #ccc;
    cursor: pointer;
  }
  .icon-btn:hover {
    color: #fff;
  }
  .terminal-body {
    flex: 1;
    background: #000;
    color: #ccc;
    font-family: monospace;
    font-size: 14px;
    padding: 10px;
    overflow-y: auto;
    cursor: text;
  }
  .term-line {
    min-height: 1.2em;
    white-space: pre-wrap;
  }
  .term-input-line {
    display: flex;
    align-items: center;
  }
  .prompt {
    margin-right: 8px;
    white-space: pre;
  }
  input[type="text"] {
    background: transparent;
    border: none;
    color: #fff;
    font-family: monospace;
    font-size: 14px;
    flex: 1;
    outline: none;
  }
</style>
