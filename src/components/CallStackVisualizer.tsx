import React, { useState, useEffect } from 'react';
import FunctionNode from './FunctionNode';
import { CallStackNode, ExtendedXqyFunction, XqyInvocation, XqyParameter } from '@/types/xqy';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UploadCloud } from 'lucide-react';
import { showError, showSuccess } from '@/utils/toast';

// Placeholder data - replace with actual data loading logic
const MOCK_FUNCTIONS: ExtendedXqyFunction[] = [
  { id: 'func1', name: 'mainModule:start', filename: 'main.xqy', file: 'main.xqy', line: 10, private: false, loc: 50, numInvocations: 2, invertedLoc: 1/50, parameters: [{filename: 'main.xqy', file: 'main.xqy', function_name: 'mainModule:start', parameter: '$input', type: 'xs:string'}] },
  { id: 'func2', name: 'helper:processData', filename: 'utils.xqy', file: 'utils.xqy', line: 5, private: false, loc: 25, numInvocations: 1, invertedLoc: 1/25, parameters: [{filename: 'utils.xqy', file: 'utils.xqy', function_name: 'helper:processData', parameter: '$data', type: 'element()'}] },
  { id: 'func3', name: 'helper:formatOutput', filename: 'utils.xqy', file: 'utils.xqy', line: 30, private: true, loc: 15, numInvocations: 1, invertedLoc: 1/15 },
  { id: 'func4', name: 'anotherModule:subProcess', filename: 'another.xqy', file: 'another.xqy', line: 8, private: false, loc: 40, numInvocations: 0, invertedLoc: 1/40 },
];

const MOCK_INVOCATIONS: XqyInvocation[] = [
  { filename: 'main.xqy', file: 'main.xqy', caller: 'mainModule:start', invoked_module: 'utils.xqy', invoked_function: 'helper:processData' },
  { filename: 'main.xqy', file: 'main.xqy', caller: 'mainModule:start', invoked_module: 'another.xqy', invoked_function: 'anotherModule:subProcess' },
  { filename: 'utils.xqy', file: 'utils.xqy', caller: 'helper:processData', invoked_module: 'utils.xqy', invoked_function: 'helper:formatOutput' },
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

  const buildNode = (funcName: string): CallStackNode | null => {
    const func = functionMap.get(funcName);
    if (!func) return null;

    const childrenNames = childrenMap.get(funcName) || [];
    const children = childrenNames
      .map(childName => buildNode(childName))
      .filter(node => node !== null) as CallStackNode[];
    
    return { ...func, id: func.name, children };
  };

  let rootNodes: CallStackNode[];
  if (rootFunctionName) {
    const rootNode = buildNode(rootFunctionName);
    rootNodes = rootNode ? [rootNode] : [];
  } else {
    // Find functions that are not called by any other function (potential entry points)
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


const CallStackVisualizer: React.FC = () => {
  const [callTree, setCallTree] = useState<CallStackNode[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [rootFunction, setRootFunction] = useState<string>(""); // e.g. "mainModule:start"

  useEffect(() => {
    // Simulate data loading and processing
    // In a real app, you'd fetch and process data from your SQLite DB (via sql.js or backend)
    const tree = buildCallTree(MOCK_FUNCTIONS, MOCK_INVOCATIONS, rootFunction || undefined);
    setCallTree(tree);
  }, [rootFunction]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      showLoading("Processing SQLite file...");
      // Here you would integrate sql.js or send the file to a backend
      // For now, we'll just simulate a delay and success
      console.log("Uploaded file:", file.name);
      // This is where you'd parse the file and update MOCK_FUNCTIONS, MOCK_INVOCATIONS
      // then rebuild the tree.
      setTimeout(() => {
        showSuccess(`File ${file.name} processed (simulated). Tree updated with mock data.`);
        // Potentially re-trigger useEffect by updating some state if data actually changed
      }, 2000);
    } else {
      showError("No file selected.");
    }
  };
  
  // Basic search filter (can be improved)
  const filterTree = (nodes: CallStackNode[], term: string): CallStackNode[] => {
    if (!term) return nodes;
    return nodes.map(node => {
      const children = filterTree(node.children || [], term);
      if (node.name.toLowerCase().includes(term.toLowerCase()) || children.length > 0) {
        return { ...node, children };
      }
      return null;
    }).filter(node => node !== null) as CallStackNode[];
  };

  const displayedTree = filterTree(callTree, searchTerm);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">XQuery Call Stack Visualizer</h1>
      
      <div className="mb-6 p-4 border rounded-lg bg-gray-50">
        <h2 className="text-lg font-semibold mb-2">Controls</h2>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-grow">
            <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-1">
              Upload SQLite DB File
            </label>
            <div className="flex items-center gap-2">
              <Input id="file-upload" type="file" accept=".sqlite,.db,.sqlite3" onChange={handleFileUpload} className="flex-grow"/>
              <Button variant="outline" onClick={() => document.getElementById('file-upload')?.click()} className="sm:hidden">
                <UploadCloud size={16} className="mr-2 sm:hidden"/> Upload
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Upload your XQuery project's SQLite database.</p>
          </div>
          <div className="flex-grow">
            <label htmlFor="search-term" className="block text-sm font-medium text-gray-700 mb-1">
              Search Functions
            </label>
            <Input
              id="search-term"
              type="text"
              placeholder="Search by function name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex-grow">
            <label htmlFor="root-function" className="block text-sm font-medium text-gray-700 mb-1">
              Set Root Function (Optional)
            </label>
            <Input
              id="root-function"
              type="text"
              placeholder="e.g., module:entryPoint"
              value={rootFunction}
              onChange={(e) => setRootFunction(e.target.value)}
            />
             <p className="text-xs text-gray-500 mt-1">Specify a function to start the tree from.</p>
          </div>
        </div>
      </div>

      {displayedTree.length > 0 ? (
        displayedTree.map((node) => (
          <FunctionNode key={node.id} node={node} level={0} />
        ))
      ) : (
        <p className="text-center text-gray-500 mt-8">
          {searchTerm ? "No functions match your search." : "No call stack data to display. Try uploading a database or clearing filters."}
        </p>
      )}
    </div>
  );
};

export default CallStackVisualizer;