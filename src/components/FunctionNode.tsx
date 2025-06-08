import React from 'react';
import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ChevronRight, GitFork, FileText, Info, Lock, Unlock, Focus } from 'lucide-react';
import type { CallStackNode } from '@/types/xqy';
import { Button } from '@/components/ui/button';

interface FunctionNodeProps {
  node: CallStackNode;
  level: number;
  onSetAsRoot?: (functionName: string) => void;
  openNodes: Set<string>; // Set of IDs for currently open nodes
  onToggleNode: (nodeId: string) => void; // Function to toggle a node's open state
}

const FunctionNode: React.FC<FunctionNodeProps> = ({ node, level, onSetAsRoot, openNodes, onToggleNode }) => {
  const hasParameters = node.parameters && node.parameters.length > 0;
  const hasChildren = node.children && node.children.length > 0;
  // An item is expandable if it has parameters OR children that would be shown inside its accordion content
  const isInternallyExpandable = hasParameters || hasChildren; 

  const indentationClass = `pl-${level * 2}`;

  const handleSetRootClick = (event: React.MouseEvent) => {
    event.stopPropagation(); 
    onSetAsRoot?.(node.name);
  };

  // The Accordion's value prop expects an array of strings for type="multiple" or a string for type="single".
  // Since each FunctionNode has its own Accordion controlling one AccordionItem,
  // value will be the item's value if open, or undefined if closed.
  const accordionValue = openNodes.has(node.id) ? `item-${node.id}` : undefined;

  return (
    <Card className={`mb-1 border-l-2 ${level % 2 === 0 ? 'border-blue-400' : 'border-green-400'}`}>
      <Accordion 
        type="single" 
        collapsible 
        className="w-full" 
        value={accordionValue}
        onValueChange={() => {
          // Only toggle if it's internally expandable. Otherwise, clicking does nothing for the accordion.
          if (isInternallyExpandable) {
            onToggleNode(node.id);
          }
        }}
        disabled={!isInternallyExpandable} // Disable accordion if no content to expand
      >
        <AccordionItem value={`item-${node.id}`} className="border-b-0">
          <AccordionTrigger 
            className={`hover:no-underline p-2 ${indentationClass} ${!isInternallyExpandable ? 'cursor-default' : ''}`}
            // If not internally expandable, clicking the trigger shouldn't try to toggle
            onClick={!isInternallyExpandable ? (e) => e.preventDefault() : undefined}
          >
            <div className="flex items-center space-x-1.5 w-full text-xs sm:text-sm">
              {isInternallyExpandable ? ( // Show chevron only if there's something to expand within this node
                <ChevronRight className="h-4 w-4 shrink-0 transition-transform duration-200" />
              ) : (
                <span className="w-4 h-4 shrink-0"></span> 
              )}
              
              {onSetAsRoot && (
                <Button variant="ghost" size="icon" className="h-5 w-5 p-0 mr-1 shrink-0" onClick={handleSetRootClick} title={`Set ${node.name} as root`}>
                  <Focus size={12} className="text-blue-600 hover:text-blue-800" />
                </Button>
              )}

              <GitFork className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500 shrink-0" />
              <span className="font-medium truncate" title={node.name}>{node.name}</span>
              {node.private ? <Lock size={12} className="text-amber-600 shrink-0" title="Private Function"/> : <Unlock size={12} className="text-green-600 shrink-0" title="Public Function"/>}
              <span className="text-gray-500 truncate hidden md:inline" title={`Module: ${node.filename}`}>[{node.filename}]</span>
              <span className="text-gray-400 truncate hidden sm:inline" title={`Location: ${node.file}:${node.line}`}>({node.file}:{node.line})</span>
              
              <span className="flex-grow"></span> 
              
              <span className="text-muted-foreground whitespace-nowrap mr-1">LOC: {node.loc}</span>
              <span className="text-muted-foreground whitespace-nowrap">Calls: {node.numInvocations}</span>
            </div>
          </AccordionTrigger>
          {isInternallyExpandable && ( // Content is only rendered if it's expandable
            <AccordionContent className={`p-2 pt-0 ${indentationClass}`}>
              <div className="pl-4 border-l border-dashed ml-2 mt-1"> 
                {hasParameters && (
                  <div className="mb-1 p-1.5 bg-slate-50 dark:bg-slate-800 rounded text-xs">
                    <h5 className="font-semibold mt-0.5 mb-0.5 flex items-center"><Info size={12} className="mr-1 text-purple-500" />Parameters:</h5>
                    <ul className="list-disc list-inside pl-1">
                      {node.parameters!.map((param, index) => (
                        <li key={index} className="truncate" title={`${param.parameter}: ${param.type}`}>{param.parameter}: {param.type}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {hasChildren && (
                  <div>
                    <h4 className="text-xs font-semibold mb-0.5 mt-1 flex items-center"><FileText size={12} className="mr-1 text-green-500" />Callees:</h4>
                    {node.children.map((child) => (
                      <FunctionNode 
                        key={child.id} 
                        node={child} 
                        level={level + 1} 
                        onSetAsRoot={onSetAsRoot}
                        openNodes={openNodes}
                        onToggleNode={onToggleNode} 
                      />
                    ))}
                  </div>
                )}
              </div>
            </AccordionContent>
          )}
        </AccordionItem>
      </Accordion>
    </Card>
  );
};

export default FunctionNode;