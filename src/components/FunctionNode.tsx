import React from 'react';
import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ChevronRight, GitFork, FileText, Info } from 'lucide-react';
import type { CallStackNode } from '@/types/xqy';

interface FunctionNodeProps {
  node: CallStackNode;
  level: number;
}

const FunctionNode: React.FC<FunctionNodeProps> = ({ node, level }) => {
  const hasChildren = node.children && node.children.length > 0;

  // Reduce indentation multiplier from 4 to 2 (or 3 if 2 is too little)
  // Tailwind JIT needs full class names: ml-0, ml-2, ml-4, ml-6 ...
  // We can create a style object for dynamic margin if Tailwind JIT doesn't pick it up well with template literals.
  // For now, let's assume direct class generation works or use a style prop.
  // A simpler way for Tailwind is to have a set of classes and pick one.
  // However, `ml-${level * X}` is generally fine with JIT. Let's use `level * 2`.
  // Max level for ml classes: if level can go very high, this might be an issue.
  // Let's cap the visual indentation effect or use padding on an inner div.
  // For now, `pl-${level * 2}` on an inner element is safer.
  // The card itself won't have margin, but an inner div will have padding.

  const indentationClass = `pl-${level * 2}`; // e.g., pl-0, pl-2, pl-4 ...

  return (
    <Card className={`mb-1 border-l-2 ${level % 2 === 0 ? 'border-blue-400' : 'border-green-400'}`}>
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value={`item-${node.id}`} className="border-b-0">
          <AccordionTrigger className={`hover:no-underline p-2 ${indentationClass}`}>
            <div className="flex items-center space-x-2 w-full">
              {hasChildren ? <ChevronRight className="h-4 w-4 shrink-0 transition-transform duration-200" /> : <span className="w-4 h-4"></span>}
              <GitFork className="h-4 w-4 text-gray-500" />
              <span className="font-medium text-sm truncate" title={node.name}>{node.name}</span>
              <span className="text-xs text-gray-400 truncate hidden sm:inline">({node.file}:{node.line})</span>
              <span className="flex-grow"></span>
              <span className="text-xs text-muted-foreground mr-1 whitespace-nowrap">LOC: {node.loc}</span>
              <span className="text-xs text-muted-foreground mr-1 whitespace-nowrap">Calls: {node.numInvocations}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className={`p-2 pt-0 ${indentationClass}`}>
            {/* Indent content further than trigger */}
            <div className="pl-4 border-l border-dashed ml-2"> 
              <div className="mb-1 p-1.5 bg-slate-50 dark:bg-slate-800 rounded text-xs">
                <h4 className="font-semibold mb-0.5 flex items-center"><Info size={12} className="mr-1 text-blue-500" />Details:</h4>
                <p><strong>Module:</strong> {node.filename}</p>
                <p><strong>Private:</strong> {node.private ? 'Yes' : 'No'}</p>
                {node.parameters && node.parameters.length > 0 && (
                  <div>
                    <h5 className="font-semibold mt-0.5">Parameters:</h5>
                    <ul className="list-disc list-inside pl-1">
                      {node.parameters.map((param, index) => (
                        <li key={index}>{param.parameter}: {param.type}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              {hasChildren && (
                <div>
                  <h4 className="text-xs font-semibold mb-0.5 mt-1 flex items-center"><FileText size={12} className="mr-1 text-green-500" />Callees:</h4>
                  {node.children.map((child) => (
                    <FunctionNode key={child.id} node={child} level={level + 1} />
                  ))}
                </div>
              )}
              {!hasChildren && <p className="text-xs text-gray-500 italic mt-1">No further invocations.</p>}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
};

export default FunctionNode;