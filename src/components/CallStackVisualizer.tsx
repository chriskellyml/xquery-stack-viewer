import React, { useState, useEffect, useCallback } from 'react';
import FunctionNode from './FunctionNode';
import { CallStackNode, ExtendedXqyFunction, XqyInvocation } from '@/types/xqy';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { XCircle, ChevronsUpDown, ChevronsDownUp, ArrowUpCircle, RefreshCw, FolderSearch } from 'lucide-react';
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';
import { fetchCallStackData, CallStackData } from '@/utils/api';

const buildCallTree = (
  functions: ExtendedXqyFunction[],
  invocations: XqyInvocation[],
  rootFunctionName?: string
): CallStackNode[] => {
  const functionMap = new Map<string, ExtendedXqyFunction>(functions.map(f => [f.name, f]));
  const childrenMap = new Map<string, string[]>();

  invocations.forEach(inv => {
    if (!childrenMap.has(inv.caller)) {
      childrenMap.set(inv.caller, []);
    }
    childrenMap.get(inv.caller)!.push(inv.invoked_function);
  });

  const buildNode = (funcName: string, visited: Set<string> = new Set()): CallStackNode | null => {
    if (visited.has(funcName)) {
      console.warn(`Cyclic dependency detected for function: ${funcName}. Skipping further expansion.`);
      return null; 
    }
    visited.add(funcName);

    const func = functionMap.get(funcName);
    if (!func) return null;

    const childrenNames = childrenMap.get(funcName) || [];
    const children = childrenNames
      .map(childName => buildNode(childName, new Set(visited)))
      .filter(node => node !== null) as CallStackNode[];
    
    return { ...func, id: func.name, children };
  };

  let rootNodes: CallStackNode[];
  if (rootFunctionName) {
    const rootNode = buildNode(rootFunctionName);
    rootNodes = rootNode ? [rootNode] : [];
  } else {
    const allInvokedFunctions = new Set(invocations.map(inv => inv.invoked_function));
    const entryPointNames = functions
      .map(f => f.name)
      .filter(name => !allInvokedFunctions.has(name) && functionMap.has(name));
    
    rootNodes = entryPointNames
      .map(name => buildNode(name))
      .filter(node => node !== null) as CallStackNode[];
  }
  return rootNodes;
};

const getAllNodeIdsRecursive = (nodes: CallStackNode[]): string[] => {
  let ids: string[] = [];
  for (const node of nodes) {
    ids.push(node.id);
    if (node.children && node.children.length > 0) {
      ids = ids.concat(getAllNodeIdsRecursive(node.children));
    }
  }
  return ids;
};

const CallStackVisualizer: React.FC = () => {
  const [folderPath, setFolderPath] = useState<string>('');
  const [allFunctions, setAllFunctions] = useState<ExtendedXqyFunction[]>([]);
  const [allInvocations, setAllInvocations] = useState<XqyInvocation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  const [callTree, setCallTree] = useState<CallStackNode[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [rootFunction, setRootFunction] = useState<string>("");
  const [openNodes, setOpenNodes] = useState<Set<string>>(new Set());
  const [persistedRootPrefix, setPersistedRootPrefix] = useState<string | null>(null); 

  const loadData = useCallback(async (path: string) => {
    if (!path) {
      showError("Please provide a folder path.");
      return;
    }
    const loadingToastId = showLoading(`Analyzing folder: ${path}...`);
    setIsLoading(true);
    setFetchError(null);
    try {
      const data: CallStackData = await fetchCallStackData(path);
      setAllFunctions(data.functions);
      setAllInvocations(data.invocations);
      showSuccess("Analysis complete. Data loaded successfully.");
    } catch (error) {
      console.error("Failed to fetch call stack data:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      setFetchError(errorMessage);
      showError(`Failed to load data: ${errorMessage}`);
    } finally {
      setIsLoading(false);
      dismissToast(loadingToastId as string);
    }
  }, []);

  useEffect(() => {
    const tree = buildCallTree(allFunctions, allInvocations, rootFunction || undefined);
    setCallTree(tree);
    if (!rootFunction) {
        setPersistedRootPrefix(null);
    }
  }, [rootFunction, allFunctions, allInvocations]);

  const handleAnalyzeClick = () => {
    // Clear previous results and errors before new analysis
    setAllFunctions([]);
    setAllInvocations([]);
    setFetchError(null);
    setRootFunction("");
    setSearchTerm("");
    loadData(folderPath);
  };

  const handleSetRootByClick = (functionName: string, clickedNodePrefix: string) => {
    setRootFunction(functionName);
    setPersistedRootPrefix(clickedNodePrefix); 
    setSearchTerm("");
    setOpenNodes(new Set()); 
    showSuccess(`Set "${functionName}" as root. Prefix: ${clickedNodePrefix}`);
  };

  const handleClearRoot = () => {
    setRootFunction("");
    setPersistedRootPrefix(null); 
    setOpenNodes(new Set());
    showSuccess("Root function cleared.");
  };
  
  const filterTree = (nodes: CallStackNode[], term: string): CallStackNode[] => {
    if (!term) return nodes;
    return nodes.reduce<CallStackNode[]>((acc, node) => {
      const children = filterTree(node.children || [], term);
      if (node.name.toLowerCase().includes(term.toLowerCase()) || children.length > 0) {
        acc.push({ ...node, children });
      }
      return acc;
    }, []);
  };

  const displayedTree = filterTree(callTree, searchTerm);

  const handleToggleNode = (nodeId: string) => {
    setOpenNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const expandAllVisibleNodes = () => {
    const allIds = getAllNodeIdsRecursive(displayedTree);
    setOpenNodes(new Set(allIds));
    showSuccess("Expanded all visible nodes.");
  };

  const collapseAllNodes = () => {
    setOpenNodes(new Set());
    showSuccess("Collapsed all nodes.");
  };

  const handleStepUp = () => {
    if (!rootFunction) {
      showError("No root function is set to step up from.");
      return;
    }

    const parentInvocation = allInvocations.find(
      (inv) => inv.invoked_function === rootFunction
    );

    if (parentInvocation && parentInvocation.caller) {
      const newRootName = parentInvocation.caller;
      let newPersistedPrefix: string | null = null;

      if (persistedRootPrefix) {
        const prefixWithoutTrailingDot = persistedRootPrefix.endsWith('.') ? persistedRootPrefix.substring(0, persistedRootPrefix.length - 1) : persistedRootPrefix;
        const lastDotIndex = prefixWithoutTrailingDot.lastIndexOf('.');
        
        if (lastDotIndex !== -1) {
          newPersistedPrefix = prefixWithoutTrailingDot.substring(0, lastDotIndex + 1);
        } else {
          newPersistedPrefix = null; 
        }
      }
      
      setRootFunction(newRootName);
      setPersistedRootPrefix(newPersistedPrefix);
      setSearchTerm(""); 
      setOpenNodes(new Set()); 
      showSuccess(`Stepped up. New root: "${newRootName}".`);
    } else {
      showError(`"${rootFunction}" is an entry point or has no known caller in the data.`);
    }
  };
  
  const canStepUp = rootFunction && allInvocations.some(inv => inv.invoked_function === rootFunction);

  return (
    <div className="p-2 sm:p-4 max-w-6xl mx-auto">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 text-center">XQuery Call Stack Visualizer</h1>
      
      <div className="mb-4 p-3 border rounded-lg bg-gray-50 dark:bg-gray-800">
        <h2 className="text-md sm:text-lg font-semibold mb-2">Controls</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
          <div className="sm:col-span-2 lg:col-span-1">
            <label htmlFor="folder-path" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Project Folder Path
            </label>
            <div className="flex items-center gap-2">
                <Input
                  id="folder-path"
                  type="text"
                  placeholder="/path/to/your/xquery/project"
                  value={folderPath}
                  onChange={(e) => setFolderPath(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && folderPath && handleAnalyzeClick()}
                  className="text-sm"
                />
                {folderPath && (
                  <Button onClick={handleAnalyzeClick} disabled={isLoading}>
                      <FolderSearch size={16} className="mr-2" /> Analyze
                  </Button>
                )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Enter the absolute path to your project folder.</p>
          </div>
          <div>
            <label htmlFor="search-term" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Search Functions
            </label>
            <Input
              id="search-term"
              type="text"
              placeholder="Search by function name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-sm"
              disabled={!allFunctions.length}
            />
          </div>
          <div>
            <label htmlFor="root-function" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Set Root / View Current Root
            </label>
            <div className="flex items-center gap-2">
              <Input
                id="root-function"
                type="text"
                placeholder="e.g., module:entryPoint"
                value={rootFunction}
                onChange={(e) => {
                    setRootFunction(e.target.value);
                    if (!e.target.value) setPersistedRootPrefix(null); 
                }}
                className="text-sm flex-grow"
                disabled={!allFunctions.length}
              />
              {rootFunction && (
                <Button variant="ghost" size="icon" onClick={handleClearRoot} title="Clear Root Function" className="p-1">
                  <XCircle size={16} />
                </Button>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 items-center border-t pt-3 mt-3">
            <Button onClick={expandAllVisibleNodes} variant="outline" size="sm" disabled={isLoading || !displayedTree.length}>
                <ChevronsDownUp size={16} className="mr-2" /> Expand All Visible
            </Button>
            <Button onClick={collapseAllNodes} variant="outline" size="sm" disabled={isLoading || !displayedTree.length}>
                <ChevronsUpDown size={16} className="mr-2" /> Collapse All
            </Button>
            <Button onClick={handleStepUp} variant="outline" size="sm" disabled={!canStepUp || isLoading}>
                <ArrowUpCircle size={16} className="mr-2" /> Step Up
            </Button>
            <Button onClick={() => loadData(folderPath)} variant="outline" size="sm" disabled={isLoading || !folderPath} title="Refresh Data">
                <RefreshCw size={16} className="mr-2" /> Refresh
            </Button>
        </div>
      </div>

      {isLoading && (
        <div className="text-center p-8">
          <RefreshCw className="h-12 w-12 animate-spin text-blue-500 mx-auto my-8" />
          <p className="text-lg text-gray-600 dark:text-gray-400">Analyzing Project...</p>
        </div>
      )}

      {fetchError && !isLoading && (
        <div className="p-4 max-w-6xl mx-auto text-center text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <p className="text-lg font-semibold">Error loading data</p>
          <p className="text-sm mt-1">{fetchError}</p>
          <Button onClick={() => loadData(folderPath)} variant="outline" className="mt-4">
            <RefreshCw size={16} className="mr-2" /> Try Again
          </Button>
        </div>
      )}

      {!isLoading && !fetchError && allFunctions.length > 0 && displayedTree.length === 0 && (
         <p className="text-center text-gray-500 dark:text-gray-400 mt-8">
            {searchTerm ? "No functions match your search." : (rootFunction ? "Root function not found or has no callees." : "No call stack data to display.")}
         </p>
      )}

      {!isLoading && !fetchError && allFunctions.length === 0 && (
        <div className="text-center p-8 border-2 border-dashed rounded-lg mt-4">
            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">Ready to Analyze</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Enter the absolute path to your XQuery project folder above and click "Analyze" to begin.
            </p>
        </div>
      )}

      {!isLoading && !fetchError && displayedTree.length > 0 && (
        displayedTree.map((node, index) => {
          let initialPrefix;
          if (rootFunction && persistedRootPrefix && displayedTree.length === 1 && node.name === rootFunction) {
            initialPrefix = persistedRootPrefix;
          } else {
            initialPrefix = `${index + 1}.`; 
          }
          return (
            <FunctionNode 
              key={node.id} 
              node={node} 
              level={0} 
              levelPrefix={initialPrefix}
              onSetAsRoot={handleSetRootByClick}
              openNodes={openNodes}
              onToggleNode={handleToggleNode}
            />
          );
        })
      )}
    </div>
  );
};

export default CallStackVisualizer;