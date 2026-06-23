<script>
  import { getTopology } from './context.js';
  import { simulatePing, simulateTracert, simulateNslookup, simulateDhcp, getCidrFromMask, getNetworkAddress, simulateArp } from './SimulationEngine.js';
  import X from '@lucide/svelte/icons/x';
  
  let { node = null, onClose = () => {} } = $props();

  const topology = getTopology();
  
  let input = $state('');
  let outputLines = $state([]);
  
  let terminalContainer;
  let isRouter = $derived(node?.type === 'router');
  let promptTextStr = $derived(isRouter ? `[admin@${node.label.replace(/\s+/g, '')}] >` : `C:\\Users\\${node.label.replace(/\s+/g, '')}>`);

  $effect(() => {
    if (outputLines.length >= 0 && terminalContainer) {
      terminalContainer.scrollTop = terminalContainer.scrollHeight;
    }
  });

  function printLine(line) {
    outputLines = [...outputLines, line];
  }

  function focusOnMount(el) {
    el.focus();
  }

  function handleCommand(e) {
    e.preventDefault();
    // Do not trim toLowerCase yet, just trim space
    const cmd = input.trim();
    printLine(`${promptTextStr} ${cmd}`);
    input = '';
    
    if (!cmd) return;

    if (isRouter) {
      const lowerCmd = cmd.toLowerCase();
      if (lowerCmd === '/ip address print' || lowerCmd === 'ip address print') {
        printLine('Flags: X - disabled, I - invalid, D - dynamic');
        printLine(' #   ADDRESS            NETWORK         INTERFACE');
        printLine(` 0   ${node.ip}/${getCidrFromMask(node.subnet) || '24'}   ${getNetworkAddress(node.ip, node.subnet).padEnd(15, ' ')} ether1`);
      } else if (lowerCmd === '/ip route print' || lowerCmd === 'ip route print') {
        printLine('Flags: D - dynamic, A - active, c - connect, s - static');
        printLine(` #      DST-ADDRESS        PREF-SRC        GATEWAY         DISTANCE`);
        if (node.gateway && node.gateway !== '0.0.0.0') {
           printLine(` 0 A S  0.0.0.0/0                          ${node.gateway.padEnd(15, ' ')} 1`);
        }
        printLine(` 1 ADC  ${getNetworkAddress(node.ip, node.subnet)}/${getCidrFromMask(node.subnet) || '24'}  ${node.ip.padEnd(15, ' ')}                 0`);
      } else if (lowerCmd === '/ip arp print' || lowerCmd === 'ip arp print') {
         const result = simulateArp(topology, node.id);
         printLine('Flags: X - disabled, I - invalid, H - DHCP, D - dynamic, P - published, C - complete');
         printLine(' #    ADDRESS         MAC-ADDRESS       INTERFACE');
         if (result.success && result.entries) {
           result.entries.forEach((entry, i) => {
             const mac = entry.mac.replace(/-/g, ':').toUpperCase();
             printLine(` ${i} DC ${entry.ip.padEnd(15, ' ')} ${mac} ether1`);
           });
         }
      } else if (lowerCmd.startsWith('ping ')) {
        const targetIp = lowerCmd.split(' ')[1];
        if (!targetIp) { printLine('expected IP address'); return; }
        const result = simulatePing(topology, node.id, targetIp);
        printLine(`  SEQ HOST                                     SIZE TTL TIME  STATUS`);
        if (result.success) {
          printLine(`    0 ${targetIp.padEnd(40, ' ')}   56  64 2ms`);
          printLine(`    1 ${targetIp.padEnd(40, ' ')}   56  64 1ms`);
          printLine('    sent=2 received=2 packet-loss=0% min-rtt=1ms avg-rtt=1ms max-rtt=2ms');
        } else {
          printLine(`    0 ${targetIp.padEnd(40, ' ')}               timeout`);
          printLine('    sent=1 received=0 packet-loss=100%');
        }
      } else if (lowerCmd === 'quit' || lowerCmd === 'exit') {
        onClose();
      } else if (lowerCmd === 'clear' || lowerCmd === '/system console clear') {
         outputLines = [];
      } else {
        printLine('bad command name ' + lowerCmd.split(' ')[0] + ' (line 1 column 1)');
      }
      return;
    }

      const args = cmd.split(' ');
      const program = args[0].toLowerCase();

      if (program === 'ipconfig') {
        if (args[1] === '/renew') {
          printLine(' ');
          printLine('Windows IP Configuration');
          printLine(' ');
          const result = simulateDhcp(topology, node.id);
          if (!result.success) {
            printLine(result.message);
            printLine(' ');
          }
          // Fall through to print the new config
        }
        printLine(' ');
        printLine('Ethernet adapter Local Area Connection:');
        printLine(' ');
        printLine(`   Connection-specific DNS Suffix  . : local`);
        printLine(`   IPv4 Address. . . . . . . . . . . : ${node.ip}`);
        printLine(`   Subnet Mask . . . . . . . . . . . : ${node.subnet || '0.0.0.0'}`);
        printLine(`   Default Gateway . . . . . . . . . : ${node.gateway || '0.0.0.0'}`);
        printLine(' ');
      } else if (program === 'nslookup') {
        const domain = args[1];
        if (!domain) {
          printLine('Default Server:  UnKnown');
          printLine('Address:  192.168.1.1');
          printLine('');
          printLine('> (Interactive mode not supported)');
          return;
        }
        const result = simulateNslookup(topology, node.id, domain);
        if (result.success) {
          printLine(`Server:  ${result.server}`);
          printLine(`Address:  ${result.address}`);
          printLine('');
          printLine(`Name:    ${domain}`);
          printLine(`Address:  ${result.ip}`);
        } else {
          printLine(`Server:  UnKnown`);
          printLine(`Address:  192.168.1.1`);
          printLine('');
          printLine(result.message);
        }
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
          }
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
      } else if (program === 'arp') {
        if (args[1] === '-a') {
           const result = simulateArp(topology, node.id);
           if (!result.success || !result.entries) {
             printLine(result.message);
           } else {
             printLine(`Interface: ${result.interfaceIp} --- 0x2`);
             printLine(`  Internet Address      Physical Address      Type`);
             for (const entry of result.entries) {
               printLine(`  ${entry.ip.padEnd(21, ' ')} ${entry.mac.padEnd(21, ' ')} ${entry.type}`);
             }
           }
        } else {
           printLine('Displays and modifies the IP-to-Physical address translation tables used by address resolution protocol (ARP).');
           printLine('Usage: arp -a');
        }
      } else if (program === 'cls' || program === 'clear') {
        outputLines = [];
      } else {
        printLine(`'${program}' is not recognized as an internal or external command,`);
        printLine('operable program or batch file.');
      }
  }
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && onClose()} />

<div class="modal-backdrop">
  <div class="modal-content" onpointerdown={(e) => e.stopPropagation()} role="dialog" tabindex="-1" aria-modal="true" aria-labelledby="terminal-title">
    <header class="modal-header">
      <h3 id="terminal-title">Terminal - {node.label}</h3>
      <button class="icon-btn" onclick={onClose} aria-label="Close">
        <X size={20} />
      </button>
    </header>
    
    <div class="terminal-body" bind:this={terminalContainer} onclick={() => document.getElementById('term-input').focus()} role="presentation" onkeydown={(e) => e.key === 'Enter' && document.getElementById('term-input').focus()}>
      {#each outputLines as line}
        <div class="term-line">{line}</div>
      {/each}
      <div class="term-input-line">
        <span class="prompt">{promptTextStr}</span>
        <textarea id="term-input" bind:value={input} autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false" name="search" rows="1" onkeydown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCommand(e); } }} use:focusOnMount></textarea>
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
    width: 90%;
    max-width: 550px;
    height: 60vh;
    max-height: 400px;
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
    font-size: 12px;
    line-height: 1.4;
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
  textarea {
    background: transparent;
    border: none;
    color: #fff;
    font-family: monospace;
    font-size: 12px;
    flex: 1;
    outline: none;
    resize: none;
    overflow: hidden;
    padding: 0;
    margin: 0;
    line-height: inherit;
    height: 1.4em;
  }
</style>
