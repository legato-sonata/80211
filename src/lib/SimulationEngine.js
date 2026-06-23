export function ipToNum(ip) {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}

export function numToIp(num) {
  return [
    (num >>> 24) & 255,
    (num >>> 16) & 255,
    (num >>> 8) & 255,
    num & 255
  ].join('.');
}

export function getCidrFromMask(mask) {
  if (!mask) return 0;
  return mask.split('.').reduce((acc, octet) => acc + parseInt(octet, 10).toString(2).split('1').length - 1, 0);
}

export function getNetworkAddress(ip, mask) {
  if (!ip || !mask) return '';
  const i = ipToNum(ip);
  const m = ipToNum(mask);
  return numToIp(i & m);
}

export function getBroadcastAddress(ip, mask) {
  if (!ip || !mask) return '';
  const partsIp = ip.split('.');
  const partsMask = mask.split('.');
  if (partsIp.length !== 4 || partsMask.length !== 4) return '';
  const bc = partsIp.map((p, i) => (parseInt(p, 10) | (~parseInt(partsMask[i], 10) & 255)) >>> 0);
  return bc.join('.');
}

export function getFirstHost(ip, mask) {
  const cidr = getCidrFromMask(mask);
  if (cidr >= 31) return 'N/A';
  const nw = getNetworkAddress(ip, mask).split('.');
  nw[3] = (parseInt(nw[3], 10) + 1).toString();
  return nw.join('.');
}

export function getLastHost(ip, mask) {
  const cidr = getCidrFromMask(mask);
  if (cidr >= 31) return 'N/A';
  const bc = getBroadcastAddress(ip, mask).split('.');
  bc[3] = (parseInt(bc[3], 10) - 1).toString();
  return bc.join('.');
}

export function isPrivateIp(ip) {
  if (!ip) return false;
  const parts = ip.split('.').map(p => parseInt(p, 10));
  if (parts[0] === 10) return true;
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  if (parts[0] === 192 && parts[1] === 168) return true;
  if (parts[0] === 169 && parts[1] === 254) return true;
  if (parts[0] === 127) return true;
  return false;
}

export function isOnSameSubnet(ip1, mask1, ip2, mask2) {
  if (!ip1 || !mask1 || !ip2 || !mask2) return false;
  const i1 = ipToNum(ip1);
  const m1 = ipToNum(mask1);
  const i2 = ipToNum(ip2);
  const m2 = ipToNum(mask2);
  return (i1 & m1) === (i2 & m2) && m1 === m2;
}

export function findL2Path(nodes, links, sourceId, targetId) {
  const sourceNode = nodes.find(n => n.id === sourceId);
  const targetNode = nodes.find(n => n.id === targetId);
  
  if (sourceNode && targetNode) {
    const getVlans = (node) => {
      if ((node.type === 'router' || node.type === 'switch') && node.details && node.details.vlans) {
         return node.details.vlans.split(',').map(v => parseInt(v.trim()));
      }
      return [parseInt(node.vlan) || 1];
    };
    
    const sourceVlans = getVlans(sourceNode);
    const targetVlans = getVlans(targetNode);
    
    const hasCommonVlan = sourceVlans.some(v => targetVlans.includes(v));
    if (!hasCommonVlan) return null;
  }

  const queue = [[sourceId]];
  const visited = new Set([sourceId]);

  while (queue.length > 0) {
    const path = queue.shift();
    const currentId = path[path.length - 1];

    if (currentId === targetId) return path;

    const currentNode = nodes.find(n => n.id === currentId);
    if (currentNode.status !== 'online') continue;

    if (currentId !== sourceId && currentId !== targetId && currentNode.type === 'router') {
      continue;
    }

    const connectedLinks = links.filter(l => 
      (l.source === currentId || l.target === currentId) && l.status === 'active'
    );

    for (const link of connectedLinks) {
      const neighborId = link.source === currentId ? link.target : link.source;
      if (!visited.has(neighborId)) {
        visited.add(neighborId);
        queue.push([...path, neighborId]);
      }
    }
  }

  return null;
}

export function findL3Path(nodes, links, sourceId, targetId) {
   const queue = [[sourceId]];
   const visited = new Set([sourceId]);
 
   while (queue.length > 0) {
     const path = queue.shift();
     const currentId = path[path.length - 1];
 
     if (currentId === targetId) return path;
 
     const currentNode = nodes.find(n => n.id === currentId);
     if (currentNode.status !== 'online') continue;
 
     const connectedLinks = links.filter(l => 
       (l.source === currentId || l.target === currentId) && l.status === 'active'
     );
 
     for (const link of connectedLinks) {
       const neighborId = link.source === currentId ? link.target : link.source;
       if (!visited.has(neighborId)) {
         visited.add(neighborId);
         queue.push([...path, neighborId]);
       }
     }
   }
 
   return null;
}

export function simulatePing(topology, sourceId, targetIp) {
  const nodes = topology.nodes;
  const links = topology.links;
  
  const sourceNode = nodes.find(n => n.id === sourceId);
  if (!sourceNode || sourceNode.status !== 'online') {
    return { success: false, message: "Source device is offline or unavailable." };
  }

  const targetNode = nodes.find(n => n.ip === targetIp);
  if (!targetNode) {
    return { success: false, message: "Request timed out." };
  }
  if (targetNode.status !== 'online') {
    return { success: false, message: "Destination host unreachable." };
  }

  if (isOnSameSubnet(sourceNode.ip, sourceNode.subnet, targetNode.ip, targetNode.subnet)) {
    const path = findL2Path(nodes, links, sourceId, targetNode.id);
    if (path) {
      return { success: true, message: `Reply from ${targetIp}: bytes=32 time<1ms TTL=128`, path };
    } else {
      return { success: false, message: "Destination host unreachable." };
    }
  }

  if (!sourceNode.gateway || sourceNode.gateway === '0.0.0.0') {
    return { success: false, message: "Destination host unreachable (No default gateway)." };
  }

  const sourceGatewayNode = nodes.find(n => n.ip === sourceNode.gateway && n.type === 'router');
  if (!sourceGatewayNode) {
    return { success: false, message: "Destination host unreachable (Gateway unreachable)." };
  }

  const pathToGateway = findL2Path(nodes, links, sourceId, sourceGatewayNode.id);
  if (!pathToGateway) {
    return { success: false, message: "Destination host unreachable (Cannot reach gateway)." };
  }
  
  if (pathToGateway.length >= 2) {
    const prevNodeId = pathToGateway[pathToGateway.length - 2];
    const finalLink = links.find(l => 
        (l.source === prevNodeId && l.target === sourceGatewayNode.id) ||
        (l.target === prevNodeId && l.source === sourceGatewayNode.id)
    );
    
    if (finalLink && sourceGatewayNode.details && sourceGatewayNode.details.gatewayPort) {
        const portUsed = finalLink.source === sourceGatewayNode.id ? finalLink.sourcePort : finalLink.targetPort;
        if (portUsed !== sourceGatewayNode.details.gatewayPort) {
            return { success: false, message: `Request timed out (Gateway is on ${sourceGatewayNode.details.gatewayPort}, but connected to ${portUsed || 'Unknown'}).` };
        }
    }
  }

  const routerPath = findL3Path(nodes, links, sourceGatewayNode.id, targetNode.id);
  if (!routerPath) {
     return { success: false, message: "Request timed out (No route to host)." };
  }

  if (!targetNode.gateway || targetNode.gateway === '0.0.0.0') {
    return { success: false, message: "Request timed out (Target has no default gateway to reply)." };
  }

  return { success: true, message: `Reply from ${targetIp}: bytes=32 time=2ms TTL=64`, path: [...pathToGateway, ...routerPath.slice(1)] };
}

export function simulateTracert(topology, sourceId, targetIp) {
  const pingResult = simulatePing(topology, sourceId, targetIp);
  if (!pingResult.success && !pingResult.path) {
    // If there's absolutely no path or a failure right away
    return { success: false, error: pingResult.message };
  }

  const path = pingResult.path || [];
  const hops = [];
  
  // Filter the path to only include L3 hops (Routers) and the final destination
  for (let i = 0; i < path.length; i++) {
    const nodeId = path[i];
    const node = topology.nodes.find(n => n.id === nodeId);
    if (!node) continue;
    
    // Include routers and the final destination
    if (node.type === 'router' || node.ip === targetIp) {
      // Don't include the source node itself if it's somehow in the loop
      if (node.id !== sourceId) {
        hops.push({ ip: node.ip, label: node.label });
      }
    }
  }

  return { success: true, hops };
}

export function simulateNslookup(topology, sourceId, domain) {
  // Simplistic DNS: We assume the router acts as a DNS forwarder or we have a local DNS server.
  // We just search the topology for a node with details.domain === domain
  const nodes = topology.nodes;
  const sourceNode = nodes.find(n => n.id === sourceId);
  if (!sourceNode || sourceNode.status !== 'online') {
    return { success: false, message: "DNS request timed out. \ntimeout was 2 seconds." };
  }

  const targetNode = nodes.find(n => n.details && n.details.domain === domain);
  if (targetNode) {
    return { success: true, ip: targetNode.ip, server: "UnKnown", address: "192.168.1.1" };
  } else {
    return { success: false, message: `*** UnKnown can't find ${domain}: Non-existent domain` };
  }
}

export function simulateDhcp(topology, sourceId) {
  const nodes = topology.nodes;
  const links = topology.links;
  const sourceNode = nodes.find(n => n.id === sourceId);
  
  if (!sourceNode || sourceNode.status !== 'online') {
    return { success: false, message: "Media disconnected." };
  }

  // Find a reachable DHCP server (Router with DHCP details) via L2 path (Broadcast)
  let dhcpServer = null;
  for (const node of nodes) {
    if (node.type === 'router' && node.details && node.details.dhcp) {
      // Must be reachable via L2 (DHCP Discover is a broadcast)
      const path = findL2Path(nodes, links, sourceId, node.id);
      if (path) {
        dhcpServer = node;
        break;
      }
    }
  }

  if (dhcpServer) {
    // Parse range e.g. "192.168.1.100 - 192.168.1.200"
    const range = dhcpServer.details.dhcp.split('-');
    let newIp = "192.168.1.150"; // default fallback
    if (range.length === 2) {
       const start = range[0].trim();
       const endParts = start.split('.');
       const lastOctet = Math.floor(Math.random() * 100) + 100; // Fake random in range
       endParts[3] = lastOctet;
       newIp = endParts.join('.');
    }
    
    // Update node
    sourceNode.ip = newIp;
    sourceNode.subnet = dhcpServer.subnet;
    sourceNode.gateway = dhcpServer.ip;
    
    return { success: true, ip: newIp, subnet: dhcpServer.subnet, gateway: dhcpServer.ip };
  } else {
    // APIPA
    const apippa = `169.254.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`;
    sourceNode.ip = apippa;
    sourceNode.subnet = "255.255.0.0";
    sourceNode.gateway = "0.0.0.0";
    return { success: false, ip: apippa, subnet: "255.255.0.0", gateway: "0.0.0.0", message: "An error occurred while renewing interface Local Area Connection : unable to contact your DHCP server." };
  }
}

export function simulateArp(topology, sourceId) {
  const nodes = topology.nodes;
  const links = topology.links;
  const sourceNode = nodes.find(n => n.id === sourceId);
  
  if (!sourceNode || sourceNode.status !== 'online') {
    return { success: false, message: "Interface: " + (sourceNode?.ip || 'Unknown') + " --- 0x2\n  No ARP Entries Found." };
  }

  const arpEntries = [];
  
  for (const node of nodes) {
    if (node.id === sourceId || node.status !== 'online') continue;
    
    if (isOnSameSubnet(sourceNode.ip, sourceNode.subnet, node.ip, node.subnet)) {
      const path = findL2Path(nodes, links, sourceId, node.id);
      if (path) {
        let mac = "00-00-00-00-00-00";
        if (node.mac) {
           mac = node.mac.toLowerCase().replace(/:/g, '-');
        } else {
           // generate a fake one from ip if none exists
           const p = node.ip ? node.ip.split('.') : ['0','0','0','0'];
           mac = `00-1a-2b-3c-${parseInt(p[2]).toString(16).padStart(2,'0')}-${parseInt(p[3]).toString(16).padStart(2,'0')}`;
        }
        arpEntries.push({ ip: node.ip, mac: mac, type: 'dynamic' });
      }
    }
  }

  if (arpEntries.length === 0) {
    return { success: true, message: "No ARP Entries Found." };
  }

  return { success: true, entries: arpEntries, interfaceIp: sourceNode.ip };
}
