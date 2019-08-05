import { parse as urlParse } from 'url';
import { join as pathJoin } from 'path';

export const getUserDir = (): string => pathJoin(process.env.LAMBDA_TASK_ROOT || '/', 'user');
export const getPhpDir = (): string => pathJoin(process.env.LAMBDA_TASK_ROOT || '/', 'php');
export const isDev = (): boolean => process.env.NOW_PHP_DEV === '1';

export function normalizeEvent(event: Event): AwsRequest {
    if (event.Action === 'Invoke') {
        const invokeEvent = JSON.parse(event.body);

        const {
            method, path, host, headers = {}, encoding,
        }: InvokedEvent = invokeEvent;

        let { body } = invokeEvent;

        if (body) {
            if (encoding === 'base64') {
                body = Buffer.from(body, encoding);
            } else if (encoding === undefined) {
                body = Buffer.from(body);
            } else {
                throw new Error(`Unsupported encoding: ${encoding}`);
            }
        }

        return {
            method,
            path,
            host,
            headers,
            body,
        };
    }

    const {
        httpMethod: method, path, host, headers = {}, body,
    } = event;

    return {
        method,
        path,
        host,
        headers,
        body,
    };
}

export async function transformFromAwsRequest({
    method, path, host, headers, body,
}: AwsRequest): Promise<PhpInput> {
    const { pathname, search } = urlParse(path);

    const filename = pathJoin(
        getUserDir(),
        process.env.NOW_ENTRYPOINT || pathname || '',
    );

    const uri = pathname + (search || '');

    return { filename, path, uri, host, method, headers, body };
}

export function transformToAwsResponse({ statusCode, headers, body }: PhpOutput): AwsResponse {
    return { statusCode, headers, body: body.toString('base64'), encoding: 'base64' };
}
