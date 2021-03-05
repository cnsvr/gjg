export class HttpException extends Error {
  status: number;
  param?: string; 
  constructor(status: number,message: string, param?: string) {
    super(message);
    this.status = status;
    this.param = param;
  }
}