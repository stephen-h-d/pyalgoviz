export async function postJson(url: string, body: object) {
  const response = await fetch(url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-type': 'application/json; charset=UTF-8',
    },
  });

  if (response.ok) {
    return (await response.json()) as object;
  } else {
    console.error('API call error');
    throw new Error(`Server error: ${response.status}.}`);
  }
}
