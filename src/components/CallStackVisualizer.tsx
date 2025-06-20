import React, { useState, useEffect } from 'react';
import FunctionNode from './FunctionNode';
import { CallStackNode, ExtendedXqyFunction, XqyInvocation, XqyParameter } from '@/types/xqy';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UploadCloud, XCircle, ChevronsUpDown, ChevronsDownUp, ArrowUpCircle } from 'lucide-react';
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';

// (Keep existing MOCK_FUNCTIONS and MOCK_INVOCATIONS)
const MOCK_FUNCTIONS: ExtendedXqyFunction[] = [
  { id: 'func1', name: 'mainModule:start', filename: 'main.xqy', file: 'main.xqy', line: 10, private: false, loc: 50, numInvocations: 2, invertedLoc: 1/50, parameters: [{filename: 'main.xqy', file: 'main.xqy', function_name: 'mainModule:start', parameter: '$input', type: 'xs:string'}] },
  { id: 'func2', name: 'helper:processData', filename: 'utils.xqy', file: 'utils.xqy', line: 5, private: false, loc: 25, numInvocations: 1, invertedLoc: 1/25, parameters: [{filename: 'utils.xqy', file: 'utils.xqy', function_name: 'helper:processData', parameter: '$data', type: 'element()'}] },
  { id: 'func3', name: 'helper:formatOutput', filename: 'utils.xqy', file: 'utils.xqy', line: 30, private: true, loc: 15, numInvocations: 1, invertedLoc: 1/15 },
  { id: 'func4', name: 'anotherModule:subProcess', filename: 'another.xqy', file: 'another.xqy', line: 8, private: false, loc: 40, numInvocations: 0, invertedLoc: 1/40 },
  { id: 'func5', name: 'deeply:nested:call:one', filename: 'deep.xqy', file: 'deep.xqy', line: 1, private: false, loc: 5, numInvocations: 1, invertedLoc: 1/5 },
  { id: 'func6', name: 'deeply:nested:call:two', filename: 'deep.xqy', file: 'deep.xqy', line: 10, private: false, loc: 5, numInvocations: 1, invertedLoc: 1/5 },
  { id: 'func7', name: 'deeply:nested:call:three', filename: 'deep.xqy', file: 'deep.xqy', line: 20, private: false, loc: 5, numInvocations: 0, invertedLoc: 1/5 },
];

const MOCK_INVOCATIONS: XqyInvocation[] = [
  { filename: 'main.xqy', file: 'main.xqy', caller: 'mainModule:start', invoked_module: 'utils.xqy', invoked_function: 'helper:processData' },
  { filename: 'main.xqy', file: 'main.xqy', caller: 'mainModule:start', invoked_module: 'another.xqy', invoked_function: 'anotherModule:subProcess' },
  { filename: 'utils.xqy', file: 'utils.xqy', caller: 'helper:processData', invoked_module: 'utils.xqy', invoked_function: 'helper:formatOutput' },
  { filename: 'another.xqy', file: 'another.xqy', caller: 'anotherModule:subProcess', invoked_module: 'deep.xqy', invoked_function: 'deeply:nested:call:one' },
  { filename: 'deep.xqy', file: 'deep.xqy', caller: 'deeply:nested:call:one', invoked_module: 'deep.xqy', invoked_function: 'deeply:nested:call:two' },
  { filename: 'deep.xqy', file: 'deep.xqy', caller: 'deeply:nested:call:two', invoked_module: 'deep.xqy', invoked_function: 'deeply:nested:call:three' },
];


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
      .filter(name => !allInvokedFunctions.has(name));
    
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
  const [callTree, setCallTree] = useState<CallStackNode[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [rootFunction, setRootFunction] = useState<string>("");
  const [openNodes, setOpenNodes] = useState<Set<string>>(new Set());

  const currentFunctions = MOCK_FUNCTIONS;
  const currentInvocations = MOCK_INVOCATIONS;

  useEffect(() => {
    const tree = buildCallTree(currentFunctions, currentInvocations, rootFunction || undefined);
    setCallTree(tree);
  }, [rootFunction, currentFunctions, currentInvocations]);

  const handleSetRootByClick = (functionName: string) => {
    setRootFunction(functionName);
    setSearchTerm("");
    setOpenNodes(new Set()); 
    showSuccess(`Set "${functionName}" as root.`);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const loadingToastId = showLoading("Processing SQLite file...");
      console.log("Uploaded file:", file.name);
      setTimeout(() => {
        showSuccess(`File ${file.name} processed (simulated). Tree updated with mock data.`);
        setRootFunction(""); 
        setOpenNodes(new Set()); 
        dismissToast(loadingToastId); 
      }, 2000);
    } else {
      showError("No file selected.");
    }
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

    const parentInvocation = currentInvocations.find(
      (inv) => inv.invoked_function === rootFunction
    );

    if (parentInvocation && parentInvocation.caller) {
      setRootFunction(parentInvocation.caller);
      setSearchTerm(""); 
      setOpenNodes(new Set()); 
      showSuccess(`Stepped up. New root: "${parentInvocation.caller}".`);
    } else {
      showError(`"${rootFunction}" is an entry point or has no known caller in the data.`);
    }
  };
  
  const canStepUp = rootFunction && currentInvocations.some(inv => inv.invoked_function === rootFunction);

  return (
    <div className="p-2 sm:p-4 max-w-6xl mx-auto">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 text-center">XQuery Call Stack Visualizer</h1>
      
      <div className="mb-4 p-3 border rounded-lg bg-gray-50 dark:bg-gray-800">
        <h2 className="text-md sm:text-lg font-semibold mb-2">Controls</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
          <div>
            <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Upload SQLite DB
            </label>
            <Input id="file-upload" type="file" accept=".sqlite,.db,.sqlite3" onChange={handleFileUpload} className="text-sm"/>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Upload XQuery project's SQLite DB.</p>
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
                placeholder="e.g., module:entryPoint or click icon"
                value={rootFunction}
                onChange={(e) => setRootFunction(e.target.value)}
                className="text-sm flex-grow"
              />
              {rootFunction && (
                <Button variant="ghost" size="icon" onClick={() => { setRootFunction(""); setOpenNodes(new Set()); showSuccess("Root function cleared."); }} title="Clear Root Function" className="p-1">
                  <XCircle size={16} />
                </Button>
              )}
            </div>
             <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Define starting point or see current. Click icon on nodes to set.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 items-center border-t pt-3 mt-3">
            <Button onClick={expandAllVisibleNodes} variant="outline" size="sm">
                <ChevronsDownUp size={16} className="mr-2" /> Expand All Visible
            </Button>
            <Button onClick={collapseAllNodes} variant="outline" size="sm">
                <ChevronsUpDown size={16} className="mr-2" /> Collapse All
            </Button>
            <Button onClick={handleStepUp} variant="outline" size="sm" disabled={!canStepUp}>
                <ArrowUpCircle size={16} className="mr-2" /> Step Up One Level
            </Button>
        </div>
      </div>

      {displayedTree.length > 0 ? (
        displayedTree.map((node, index) => (
          <FunctionNode 
            key={node.id} 
            node={node} 
            level={0} 
            levelPrefix={`${index + 1}.`} // Initial prefix for root nodes
            onSetAsRoot={handleSetRootByClick}
            openNodes={openNodes}
            onToggleNode={handleToggleNode}
          />
        ))
      ) : (
        <p className="text-center text-gray-500 dark:text-gray-400 mt-8">
          {searchTerm ? "No functions match your search." : (rootFunction ? "Root function not found or has no callees." : "No call stack data. Upload DB or clear filters.")}
        </p>
      )}
    </div>
  );
};

export default CallStackVisualizer;