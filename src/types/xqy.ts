export interface XqyModule {
  filename: string;
  file: string;
  prefix: string;
  uri: string;
  filePath: string;
  numFunctions: number;
  numLines: number;
}

export interface XqyFunction {
  filename: string;
  file: string;
  name: string;
  line: number;
  private: boolean;
  loc: number;
}

export interface ExtendedXqyFunction extends XqyFunction {
  numInvocations: number;
  invertedLoc: number;
  // We'll add callees here when processing the data
  callees?: ExtendedXqyFunction[]; 
  // We'll add parameters here
  parameters?: XqyParameter[];
}

export interface XqyInvocation {
  filename: string;
  file: string;
  caller: string; // Name of the calling function
  invoked_module: string; // Can be null if it's a local function call
  invoked_function: string; // Name of the invoked function
}

export interface XqyParameter {
  filename: string;
  file: string;
  function_name: string;
  parameter: string;
  type: string;
}

// Sample data structure for the visualization
// This would be built from your database queries
export interface CallStackNode extends ExtendedXqyFunction {
  id: string;
  children: CallStackNode[];
}

export interface XqyFunctionSummary {
  module: string;
  name: string;
  namespace: string;
  parameters: string;
  path: string;
}