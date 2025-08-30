import React, { useState, useEffect } from 'react';
import FunctionNode from './FunctionNode';
import { CallStackNode, ApiFunction, ApiInvocation, XqyFunctionSummary } from '@/types/xqy';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronsUpDown, ChevronsDownUp, RefreshCw, FolderSearch, Zap } from 'lucide-react';
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';
import { setBasePath, getFunctionSummaries, initializeProject, fetchStackData, CallStackData } from '@/utils/api';
import { FunctionSelector } from './FunctionSelector';

const getUniqueFuncId = (name: string, filePath: string) => `${filePath}::${name}`;

const buildCallTree = (
  functions: ApiFunction[],
  invocations: ApiInvocation[],
  rootFunctionName: string,
  rootFilePath: string
): CallStackNode[] => {
  const functionMap = new Map<string, ApiFunction>(
    functions.map(f => [getUniqueFuncId(f.name, f.filePath), f])
  );

  const childrenMap = new Map<string, string[]>();

  invocations.forEach(inv => {
    const callerId = getUniqueFuncId(inv.callerName, inv.callerFilePath);
    
    // If invokedFilePath is null, it's a local call within the same module
    const invokedFilePath = inv.invokedFilePath || inv.callerFilePath;
    // The API still includes arity in the invokedName, so we must strip it.
    const cleanInvokedName = inv.invokedName.split('#')[0];
    const invokedId = getUniqueFuncId(cleanInvokedName, invokedFilePath);

    if (!childrenMap.has(callerId)) {
      childrenMap.set(callerId, []);
    }
    childrenMap.get(callerId)!.push(invokedId);
  });

  const buildNode = (funcId: string, visited: Set<string> = new Set()): CallStackNode | null => {
    if (visited.has(funcId)) {
      console.warn(`Cyclic dependency detected for function: ${funcId}. Skipping further expansion.`);
      return null; 
    }
    visited.add(funcId);

    const func = functionMap.get(funcId);
    if (!func) {
      console.error(`Function data not found for ID: ${funcId}. It will be missing from the tree.`);
      return null;
    }

    const childrenIds = childrenMap.get(funcId) || [];
    const children = childrenIds
      .map(childId => buildNode(childId, new Set(visited)))
      .filter(node => node !== null) as CallStackNode[];
    
    return { ...func, id: funcId, children };
  };

  const rootFuncId = getUniqueFuncId(rootFunctionName, rootFilePath);
  const rootNode = buildNode(rootFuncId);
  return rootNode ? [rootNode] : [];
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
  const [projectLoaded, setProjectLoaded] = useState<boolean>(false);
  const [functionSummaries, setFunctionSummaries] = useState<XqyFunctionSummary[]>([]);
  
  const [allFunctions, setAllFunctions] = useState<ApiFunction[]>([]);
  const [allInvocations, setAllInvocations] = useState<ApiInvocation[]>([]);
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  const [callTree, setCallTree] = useState<CallStackNode[]>([]);
  const [rootFunction, setRootFunction] = useState<{ name: string; filePath: string } | null>(null);
  const [openNodes, setOpenNodes] = useState<Set<string>>(new Set());
  const [persistedRootPrefix, setPersistedRootPrefix] = useState<string | null>(null); 

  useEffect(() => {
    if (rootFunction && allFunctions.length > 0) {
      const tree = buildCallTree(allFunctions, allInvocations, rootFunction.name, rootFunction.filePath);
      setCallTree(tree);
      setOpenNodes(new Set()); // Collapse nodes on new root
    } else {
      setCallTree([]);
    }
  }, [rootFunction, allFunctions, allInvocations]);

  const handleLoadProject = async () => {
    if (!folderPath) {
      showError("Please provide a folder path.");
      return;
    }
    setIsLoading(true);
    setFetchError(null);
    setProjectLoaded(false);
    setFunctionSummaries([]);
    let toastId = showLoading("Loading project and fetching functions...");

    try {
      await setBasePath(folderPath);
      const summaries = await getFunctionSummaries(folderPath);
      setFunctionSummaries(summaries);
      setProjectLoaded(true);
      dismissToast(toastId as string);
      showSuccess(`Project loaded. Found ${summaries.length} functions.`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      setFetchError(errorMessage);
      dismissToast(toastId as string);
      showError(`Failed to load project: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInitialize = async () => {
    if (!folderPath) {
      showError("Please load a project first.");
      return;
    }
    setIsInitializing(true);
    let toastId = showLoading("Initializing project... This may take a while.");
    try {
      await initializeProject(folderPath);
      dismissToast(toastId as string);
      showSuccess("Project initialized successfully. You can now analyze functions.");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      dismissToast(toastId as string);
      showError(`Initialization failed: ${errorMessage}`);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleFunctionSelect = async (selectedFunction: XqyFunctionSummary | null) => {
    if (!selectedFunction) {
      setRootFunction(null);
      setCallTree([]);
      return;
    }
    
    setIsLoading(true);
    setFetchError(null);
    let toastId = showLoading(`Fetching analysis data for ${selectedFunction.name}...`);
    
    try {
      const data: CallStackData = await fetchStackData(folderPath, selectedFunction.name, selectedFunction.module);
      setAllFunctions(data.functions);
      setAllInvocations(data.invocations);
      setRootFunction({ name: selectedFunction.name, filePath: selectedFunction.path });
      setPersistedRootPrefix("1."); // Reset prefix for new analysis
      dismissToast(toastId as string);
      showSuccess(`Analysis complete for ${selectedFunction.name}.`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      setFetchError(errorMessage);
      dismissToast(toastId as string);
      showError(`Analysis failed: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetRootByClick = (functionName: string, filePath: string, clickedNodePrefix: string) => {
    setRootFunction({ name: functionName, filePath: filePath });
    setPersistedRootPrefix(clickedNodePrefix); 
    showSuccess(`Set "${functionName}" as root.`);
  };

  const handleToggleNode = (nodeId: string) => {
    setOpenNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) newSet.delete(nodeId);
      else newSet.add(nodeId);
      return newSet;
    });
  };

  const expandAllVisibleNodes = () => {
    const allIds = getAllNodeIdsRecursive(callTree);
    setOpenNodes(new Set(allIds));
    showSuccess("Expanded all visible nodes.");
  };

  const collapseAllNodes = () => {
    setOpenNodes(new Set());
    showSuccess("Collapsed all nodes.");
  };

  return (
    <div className="p-2 sm:p-4 max-w-6xl mx-auto">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 text-center">XQuery Call Stack Visualizer</h1>
      
      <div className="mb-4 p-3 border rounded-lg bg-gray-50 dark:bg-gray-800 space-y-4">
        <div>
          <h2 className="text-md sm:text-lg font-semibold mb-2">Step 1: Load Project</h2>
          <div className="flex items-center gap-2">
            <Input
              id="folder-path"
              type="text"
              placeholder="/path/to/your/xquery/project"
              value={folderPath}
              onChange={(e) => setFolderPath(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && folderPath && handleLoadProject()}
              className="text-sm"
              disabled={isLoading || isInitializing}
            />
            <Button onClick={handleLoadProject} disabled={!folderPath || isLoading || isInitializing}>
              <FolderSearch size={16} className="mr-2" /> Load Project
            </Button>
          </div>
        </div>

        <div>
          <h2 className="text-md sm:text-lg font-semibold mb-2">Step 2: Analyze a Function</h2>
          <FunctionSelector
            functions={functionSummaries}
            onSelect={handleFunctionSelect}
            disabled={!projectLoaded || isLoading || isInitializing}
          />
        </div>

        <div className="flex flex-wrap gap-2 items-center border-t pt-3 mt-3">
            <Button onClick={handleInitialize} variant="destructive" size="sm" disabled={!projectLoaded || isLoading || isInitializing} title="Re-scan the project. This is slow.">
                <Zap size={16} className="mr-2" /> Initialize Project (Optional)
            </Button>
            <Button onClick={expandAllVisibleNodes} variant="outline" size="sm" disabled={!callTree.length || isLoading}>
                <ChevronsDownUp size={16} className="mr-2" /> Expand All
            </Button>
            <Button onClick={collapseAllNodes} variant="outline" size="sm" disabled={!callTree.length || isLoading}>
                <ChevronsUpDown size={16} className="mr-2" /> Collapse All
            </Button>
        </div>
      </div>

      {(isLoading || isInitializing) && (
        <div className="text-center p-8">
          <RefreshCw className="h-12 w-12 animate-spin text-blue-500 mx-auto my-8" />
          <p className="text-lg text-gray-600 dark:text-gray-400">
            {isInitializing ? 'Initializing Project...' : 'Loading Data...'}
          </p>
        </div>
      )}

      {fetchError && !isLoading && (
        <div className="p-4 max-w-6xl mx-auto text-center text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <p className="text-lg font-semibold">Error</p>
          <p className="text-sm mt-1">{fetchError}</p>
        </div>
      )}

      {!isLoading && !isInitializing && !projectLoaded && (
        <div className="text-center p-8 border-2 border-dashed rounded-lg mt-4">
            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">Ready to Analyze</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Enter the absolute path to your XQuery project folder above and click "Load Project" to begin.
            </p>
        </div>
      )}

      {!isLoading && !isInitializing && projectLoaded && callTree.length === 0 && (
         <p className="text-center text-gray-500 dark:text-gray-400 mt-8">
            {rootFunction ? "Analysis complete, but no call stack found for this function." : "Select a function from the dropdown above to begin analysis."}
         </p>
      )}

      {!isLoading && !isInitializing && callTree.length > 0 && (
        callTree.map((node) => (
          <FunctionNode 
            key={node.id} 
            node={node} 
            level={0} 
            levelPrefix={persistedRootPrefix || "1."}
            onSetAsRoot={handleSetRootByClick}
            openNodes={openNodes}
            onToggleNode={handleToggleNode}
          />
        ))
      )}
    </div>
  );
};

export default CallStackVisualizer;