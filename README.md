# Network Topology Mapper

A modern, web-based IT asset management and network topology visualization tool. Designed for IT support staff to map physical infrastructure across multiple locations, monitor device statuses, and manage hardware inventory efficiently.

## Features

- Multi-Location Management: Create separate tabs to manage different sites, offices, or network segments independently.
- Interactive Canvas: Drag and drop nodes to build physical network diagrams.
- Device Agnosticism: Document hardware from any vendor using generic device types such as Router, Switch, Server, Computer, POS, Access Point, CCTV Camera, and Printer.
- Link Connections: Draw connections between devices indicating physical uplinks (Ethernet, Fiber) or logical connections (Wireless) and their active status.
- Advanced Configuration Tracking: Store specific device configurations including IP Addresses, MAC/Serial numbers, VLANs, DHCP Ranges, PoE Status, OS, and Storage capacities.
- Maintenance Logs: Track purchase dates and last maintenance records for individual assets.
- Automated Topology Layouts: Apply algorithmic layouts including Force-Directed, Grid, Circular, and Hierarchical Tree structures to instantly organize complex networks.
- Simulated Ticketing System: Generate pre-filled support tickets directly from a device's property panel.
- Export Capabilities: Export the current network map as a PNG or SVG image. Generate comprehensive CSV asset reports for auditing. Save and load project JSON files.

## Technology Stack

- Svelte 5: Reactive UI framework.
- D3-Force: Physics-based network graph simulations.
- Dagre: Directed acyclic graph layout engine for hierarchical trees.
- Html-to-Image: Client-side rendering for PNG/SVG exports.
- Lucide Svelte: Minimalist icon library.

## Getting Started

First, install dependencies:

```sh
npm install
```

Start the development server:

```sh
npm run dev
```

Navigate to `http://localhost:5173` in your browser to view the application.

## Building for Production

To create a production build:

```sh
npm run build
```

You can preview the production build using:

```sh
npm run preview
```
