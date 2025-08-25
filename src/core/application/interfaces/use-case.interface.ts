export interface IUseCase<TRequest = any, TResponse = any> {
  execute(request?: TRequest): Promise<TResponse>;
}