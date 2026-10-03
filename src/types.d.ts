type Headers = { [k: string]: string | string[] | undefined };

interface UserFiles {
  [filePath: string]: import('@vercel/build-utils').File;
}

interface RuntimeFiles {
  [filePath: string]: import('@vercel/build-utils').File;
}

interface IncludedFiles {
  [filePath: string]: import('@vercel/build-utils').File;
}

interface MetaOptions {
  meta: import('@vercel/build-utils').Meta;
}

interface AwsRequest {
  method: string,
  path: string,
  host: string,
  headers: Headers,
  body: Buffer | undefined,
}

interface AwsResponse {
  statusCode: number,
  headers: Headers,
  body: string,
  encoding?: string
}

interface CgiInput {
  entrypoint: string,
  path: string,
  host: string,
  method: string,
  headers: Headers,
}

interface PhpInput {
  entrypoint: string,
  path: string,
  uri: string,
  host: string,
  method: string,
  headers: Headers,
  body: Buffer | undefined,
}

interface PhpOutput {
  statusCode: number,
  headers: Headers,
  body: Buffer,
}

interface CgiHeaders {
  [k: string]: string,
}

interface CgiRequest {
  env: Env,
}

interface Env {
  [k: string]: any,
}

interface PhpIni {
  [k: string]: any,
}
