type Memo<I, O> = {
    key: I
    value: O
    next?: Memo<I, O>
}

export function useMemo<I, O>(fn: (key: I) => O): (key: I) => O {
    let head: Memo<I, O> | undefined = undefined;
    return (key: I) => {
        let tail: Memo<I, O> | undefined = head;
        while (tail) {
            if (tail.key === key) {
                return tail.value;
            } else {
                tail = tail.next;
            }
        }
        const value: O = fn(key);
        head = {key, value, next: head};
        return value;
    };
}