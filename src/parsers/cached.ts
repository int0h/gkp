import {Parser} from '../types';

export function cacheParser(parser: Parser): Parser {
    const cache = new Map<string, ReturnType<Parser>>();

    return (code: string): ReturnType<Parser> => {
        let res = cache.get(code);
        if (res) {
            return res;
        }
        res = parser(code);
        cache.set(code, res);
        return res;
    }
}