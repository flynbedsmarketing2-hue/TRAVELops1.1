export type ParamsShape<T> = T | Promise<T>;

// Next 16 currently types params as Promise<T>; awaiting also works when a plain object is passed.
export type RouteContext<T> = { params: Promise<T> };

export async function getParams<T>(params: ParamsShape<T>): Promise<T> {
  return await params;
}
