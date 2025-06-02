import { auth } from "@/auth";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

const setHeaders = async () => {
  const session = await auth();
  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  const accessToken = session?.user?.accessToken;
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }
  return headers;
}

const apiGet = async (path: string, params?: {[key: string]: any}, ) => {
  const url = new URL(`${BASE_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });
  }
  const response = await fetch(url.toString(),{
    method: "GET",
    headers: await setHeaders(),
  });

  if (!response.ok) {
    throw new ApiResponseError(response);
  }

  return await response.json();
};

const apiPost = async (path: string, params: {[key: string]: any}, ) => {
  const url = new URL(`${BASE_URL}${path}`);
  const response = await fetch(url.toString(), {
    method: "POST",
    headers: await setHeaders(),
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new ApiResponseError(response);
  }

  return await response.json();
}

const apiPatch = async (path: string, params: {[key: string]: any}, ) => {
  const url = new URL(`${BASE_URL}${path}`);
  const response = await fetch(url.toString(), {
    method: "PATCH",
    headers: await setHeaders(),
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new ApiResponseError(response);
  }

  return await response.json();
}

const apiAuthLogin = async (email: string, password: string) => {
  const loginRes = await fetch((new URL(`${BASE_URL}/auth/login`)).toString(),{
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      username: email,
      password: password,
    }),
  });
  if (!loginRes.ok) {
    throw new ApiResponseError(loginRes);
  }
  const token = await loginRes.json();

  const meRes = await fetch((new URL(`${BASE_URL}/me`)).toString(),{
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token.access_token}`,
    },
  });
  if (!meRes.ok) {
    throw new ApiResponseError(meRes);
  }
  const user = await meRes.json() as Me;

  return {
    id: user.uuid,
    name: user.name,
    email: user.email,
    accessToken: token.access_token as string,
    refreshToken: token.refresh_token as string,
  };
}

const apiAuthRefresh = async (accessToken: string, refreshToken: string) => {
  const url = new URL(`${BASE_URL}/auth/refresh`);
  const response = await fetch(url.toString(),{
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  if (!response.ok) {
    throw new ApiResponseError(response);
  }
  const token = await response.json();
  return {
    accessToken: token.access_token as string,
    refreshToken: token.refresh_token as string,
  };
}

class ApiResponseError extends Error {
  response: Response;

  constructor(response: Response) {
    super(response.statusText);
    this.response = response;
  }
}

export { apiAuthLogin, apiAuthRefresh, apiGet, apiPost, apiPatch };

