declare module 'express' {
  export interface Request {
    [key: string]: any;
  }
  
  export interface Response {
    json(obj: any): Response;
    status(code: number): Response;
    send(body?: any): Response;
    [key: string]: any;
  }
  
  export interface Router {
    get(path: string, handler: (req: Request, res: Response) => void): void;
    post(path: string, handler: (req: Request, res: Response) => void): void;
    put(path: string, handler: (req: Request, res: Response) => void): void;
    delete(path: string, handler: (req: Request, res: Response) => void): void;
    [key: string]: any;
  }
  
  export function Router(): Router;
  
  export default function express(): any;
} 