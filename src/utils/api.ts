import type { ExtendedXqyFunction, XqyInvocation, XqyFunctionSummary } from '@/types/xqy';

export interface CallStackData {
  functions: ExtendedXqyFunction[];
  invocations: XqyInvocation[];
}

/**
 * Step 1a: Sets the base path on the server. Does not return data.
 */
export const setBasePath = async (folderPath: string): Promise<void> => {
  if (!folderPath) throw new Error("Folder path is required.");
  const url = `http://localhost:3030/xqanalyse/base?folder=${encodeURIComponent(folderPath)}`;
  console.log(`Setting base path: ${url}`);
  const response = await fetch(url, { method: 'PUT' });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Setting base path failed: ${response.status}. ${errorText}`);
  }
  await response.text(); // Consume response body
};

/**
 * Step 1b: Fetches the list of function summaries to populate the selector.
 */
export const getFunctionSummaries = async (folderPath: string): Promise<XqyFunctionSummary[]> => {
  if (!folderPath) throw new Error("Folder path is required.");
  const url = `http://localhost:3030/xqanalyse/functions?folder=${encodeURIComponent(folderPath)}`;
  console.log(`Getting function summaries from: ${url}`);
  const response = await fetch(url, { method: 'GET' });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Fetching function summaries failed: ${response.status}. ${errorText}`);
  }
  return response.json();
};

/**
 * Step 2 (Optional): Initializes the project analysis on the server.
 * This is a long-running, slow process. Does not return data.
 */
export const initializeProject = async (folderPath: string): Promise<void> => {
  if (!folderPath) throw new Error("Folder path is required.");
  const url = `http://localhost:3030/xqanalyse/init?folder=${encodeURIComponent(folderPath)}`;
  console.log(`Initializing project: ${url}`);
  const response = await fetch(url, { method: 'PUT' });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Initialization failed: ${response.status}. ${errorText}`);
  }
  await response.text(); // Consume response body
};

/**
 * Step 3: Fetches the call stack data for a specific function.
 */
export const fetchStackData = async (folderPath: string, functionName: string): Promise<CallStackData> => {
  if (!folderPath) throw new Error("Folder path is required.");
  if (!functionName) throw new Error("Function name is required.");

  const url = `http://localhost:3030/xqanalyse/stack?folder=${encodeURIComponent(folderPath)}&function=${encodeURIComponent(functionName)}`;
  console.log(`Fetching stack data from: ${url}`);
  
  const response = await fetch(url, {
    method: 'GET',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Fetching stack data failed: ${response.status}. ${errorText}`);
  }
  
  const data = await response.json();
  if (!data.functions || !data.invocations) {
    throw new Error("Invalid data format received from stack API.");
  }
  return data;
};