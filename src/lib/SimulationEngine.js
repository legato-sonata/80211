export function ipToNum(ip) {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0);
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
  
  const routerPath = findL3Path(nodes, links, sourceGatewayNode.id, targetNode.id);
  if (!routerPath) {
     return { success: false, message: "Request timed out (No route to host)." };
  }

  if (!targetNode.gateway || targetNode.gateway === '0.0.0.0') {
    return { success: false, message: "Request timed out (Target has no default gateway to reply)." };
  }

  return { success: true, message: `Reply from ${targetIp}: bytes=32 time=2ms TTL=64`, path: [...pathToGateway, ...routerPath.slice(1)] };
}
