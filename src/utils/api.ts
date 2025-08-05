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
 * Step 3: Fetches the full analysis data (all functions and invocations)
 * needed to build the call stack tree.
 */
export const fetchAnalysisData = async (folderPath: string): Promise<CallStackData> => {
  if (!folderPath) throw new Error("Folder path is required.");
  // Note: This uses the same 'base' endpoint but expects a JSON response.
  const url = `http://localhost:3030/xqanalyse/base?folder=${encodeURIComponent(folderPath)}`;
  console.log(`Fetching full analysis data from: ${url}`);
  const response = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Fetching analysis data failed: ${response.status}. ${errorText}`);
  }
  const data = await response.json();
  if (!data.functions || !data.invocations) {
    throw new Error("Invalid data format received from analysis API.");
  }
  return data;
};