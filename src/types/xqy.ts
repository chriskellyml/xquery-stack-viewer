// This interface matches the objects in the `functions` array from the API
export interface ApiFunction {
  filePath: string;
  name: string;
  arity: number;
  line: number;
  private: boolean;
  loc: number;
  numInvocations: number;
  invertedLoc: number;
  parameters: {
    name: string;
    type: string;
  }[];
}

// This interface matches the objects in the `invocations` array from the API
export interface ApiInvocation {
  callerFilePath: string;
  callerName: string;
  callerArity: number;
  invokedFilePath: string | null; // Can be null for local calls
  invokedName: string;
  invokedArity: number | null;
}

// This is the internal representation of a node in our call tree
export interface CallStackNode extends ApiFunction {
  id: string;
  children: CallStackNode[];
}

// This matches the function summaries for the dropdown selector
export interface XqyFunctionSummary {
  module: string;
  name: string;
  namespace: string;
  parameters: string;
  path: string;
  arity: number;
}