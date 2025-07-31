import type { ExtendedXqyFunction, XqyInvocation } from '@/types/xqy';

export interface CallStackData {
  functions: ExtendedXqyFunction[];
  invocations: XqyInvocation[];
}

/**
 * Step 1: Initializes the analysis on the server.
 * This is a long-running process that doesn't return JSON.
 */
export const initializeAnalysis = async (folderPath: string): Promise<void> => {
  if (!folderPath) {
    throw new Error("Folder path is required for initialization.");
  }

  const url = `http://localhost:3030/xqanalyse/init?folder=${encodeURIComponent(folderPath)}`;
  console.log(`Initializing analysis: ${url} using PUT method`);

  const response = await fetch(url, {
    method: 'PUT',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Initialization failed: ${response.status} ${response.statusText}. Details: ${errorText}`);
  }

  // Consume the response body as text but we don't need to use it.
  await response.text(); 
  console.log("Initialization request successful.");
};


/**
 * Step 2: Fetches the results of the analysis from the 'base' endpoint.
 * This endpoint is called after initialization is complete.
 */
export const fetchAnalysisResults = async (folderPath: string): Promise<CallStackData> => {
  if (!folderPath) {
    throw new Error("Folder path is required to fetch results.");
  }

  const url = `http://localhost:3030/xqanalyse/base?folder=${encodeURIComponent(folderPath)}`;
  console.log(`Fetching analysis results from: ${url} using PUT method`);

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Fetching results failed: ${response.status} ${response.statusText}. Details: ${errorText}`);
  }

  const data = await response.json();
  
  if (!data.functions || !data.invocations) {
      throw new Error("Invalid data format received from results API.");
  }

  return data;
};