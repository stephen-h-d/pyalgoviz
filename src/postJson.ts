export type PostResult = {
  type: "Ok",
  data: object,
} | {
  type: "Error",
  message: string,
  statusCode?: number,
  responseBody?: string,
} | {
  type: "Unauthorized",
  statusCode: number,
}

export async function postJson(url: string, body: object): Promise<PostResult> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
      },
    });

    if (response.ok) {
      try {
        const data = await response.json() as object;
        return { type: "Ok", data };
      } catch (error) {
        console.error('Error parsing response:', error);
        return { type: "Error", message: 'Error parsing response', statusCode: response.status };
      }
    } else {
      if (response.status === 401 || response.status === 403) {
        return { type: "Unauthorized", statusCode: response.status };
      }
      const responseBody = await response.text();
      console.error('API call error, response:', response);
      return { type: "Error", message: 'API call error', statusCode: response.status, responseBody };
    }
  } catch (error) {
    console.error('Fetch error:', error);
    return { type: "Error", message: 'Network or fetch error' };
  }
}
