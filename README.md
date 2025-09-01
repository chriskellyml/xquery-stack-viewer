# XQuery Call Stack Visualizer

A web-based tool for visualizing function call hierarchies in XQuery projects.

## What it does

This app analyzes XQuery (.xqy) files to help you understand the relationships between functions in your codebase. It provides:

- **Project Analysis**: Scan your XQuery project folder to discover all functions
- **Call Stack Visualization**: See which functions call which other functions in a tree structure
- **Interactive Navigation**: 
  - Expand/collapse function branches
  - Click any function to set it as the new root for focused analysis
  - View function details like parameters, lines of code, and invocation counts
- **Function Discovery**: Search and select from all discovered functions in your project

## How to use

1. **Enter the path** to your XQuery project folder
2. **Load the project** to discover all available functions
3. **Select a function** from the dropdown to analyze its call stack
4. **Explore the visualization** to understand your code's structure

## Tech Stack

- React + TypeScript
- Vite
- Tailwind CSS
- shadcn/ui components
