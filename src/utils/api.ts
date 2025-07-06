import type { ExtendedXqyFunction, XqyInvocation, XqyParameter } from '@/types/xqy';

// Moved MOCK_FUNCTIONS and MOCK_INVOCATIONS here
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

export interface CallStackData {
  functions: ExtendedXqyFunction[];
  invocations: XqyInvocation[];
}

export const fetchCallStackData = (): Promise<CallStackData> => {
  console.log("Simulating API call to fetch call stack data...");
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log("Mock API call successful.");
      resolve({ functions: MOCK_FUNCTIONS, invocations: MOCK_INVOCATIONS });
    }, 1000); // Simulate 1 second delay
  });
};