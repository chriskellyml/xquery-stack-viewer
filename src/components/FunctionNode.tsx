import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ChevronRight, GitFork, FileText, Info } from 'lucide-react';
import type { CallStackNode, XqyParameter } from '@/types/xqy';

interface FunctionNodeProps {
  node: CallStackNode;
  level: number;
}

const FunctionNode: React.FC<FunctionNodeProps> = ({ node, level }) => {
  const hasChildren = node.children && node.children.length > 0;

  return (
    <Card className={`mb-2 ml-${level * 4} border-l-4 ${level % 2 === 0 ? 'border-blue-500' : 'border-green-500'}`}>
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value={`item-${node.id}`} className="border-b-0">
          <AccordionTrigger className="hover:no-underline p-3">
            <div className="flex items-center space-x-2 w-full">
              {hasChildren ? <ChevronRight className="h-4 w-4 shrink-0 transition-transform duration-200" /> : <span className="w-4 h-4"></span>}
              <GitFork className="h-5 w-5 text-gray-600" />
              <span className="font-semibold text-sm">{node.name}</span>
              <span className="text-xs text-gray-500">({node.file}:{node.line})</span>
              <span className="flex-grow"></span>
              <span className="text-xs text-muted-foreground mr-2">LOC: {node.loc}</span>
              <span className="text-xs text-muted-foreground mr-2">Invocations: {node.numInvocations}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="p-3 pt-0">
            <div className="pl-6 border-l border-dashed ml-2">
              <div className="mb-2 p-2 bg-slate-50 rounded">
                <h4 className="text-xs font-semibold mb-1 flex items-center"><Info size={14} className="mr-1 text-blue-600" />Details:</h4>
                <p className="text-xs"><strong>Module:</strong> {node.filename}</p>
                <p className="text-xs"><strong>Private:</strong> {node.private ? 'Yes' : 'No'}</p>
                {node.parameters && node.parameters.length > 0 && (
                  <div>
                    <h5 className="text-xs font-semibold mt-1">Parameters:</h5>
                    <ul className="list-disc list-inside pl-2">
                      {node.parameters.map((param, index) => (
                        <li key={index} className="text-xs">{param.parameter}: {param.type}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              {hasChildren && (
                <div>
                  <h4 className="text-xs font-semibold mb-1 mt-2 flex items-center"><FileText size={14} className="mr-1 text-green-600" />Callees:</h4>
                  {node.children.map((child) => (
                    <FunctionNode key={child.id} node={child} level={level + 1} />
                  ))}
                </div>
              )}
              {!hasChildren && <p className="text-xs text-gray-500 italic">No further invocations from this function.</p>}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
};

export default FunctionNode;