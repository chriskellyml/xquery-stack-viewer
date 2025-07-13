import type { ExtendedXqyFunction, XqyInvocation } from '@/types/xqy';

export interface CallStackData {
  functions: ExtendedXqyFunction[];
  invocations: XqyInvocation[];
}

export const fetchCallStackData = async (folderPath: string): Promise<CallStackData> => {
  if (!folderPath) {
    throw new Error("Folder path is required.");
  }

  const url = `http://localhost:3030/xqanalyse/base?folder=${encodeURIComponent(folderPath)}`;
  console.log(`Fetching data from: ${url}`);

  const response = await fetch(url);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Network response was not ok: ${response.status} ${response.statusText}. Details: ${errorText}`);
  }

  const data = await response.json();
  
  // Assuming the API returns data in the expected { functions: [], invocations: [] } format
  if (!data.functions || !data.invocations) {
      throw new Error("Invalid data format received from API.");
  }

  return data;
};