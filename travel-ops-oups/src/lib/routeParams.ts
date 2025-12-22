export type ParamsShape<T> = T | Promise<T>;

export type RouteContext<T> = { params: ParamsShape<T> };

export async function getParams<T>(params: ParamsShape<T>): Promise<T> {
  return await params;
}
