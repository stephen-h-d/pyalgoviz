export interface AlgorithmSummary {
  name: string;
  author_firebase_user_id: string;
  author_display_name: string;
}
export interface AlgorithmSummaries {
  result: AlgorithmSummary[];
}
export const fetchScriptNames = async () => {
  const fetchResult = await fetch('/api/script_names');
  return (await fetchResult.json()) as AlgorithmSummaries;
};
