export default function debouncing(
    timer: NodeJS.Timeout | undefined,
    setTimer: (timer: NodeJS.Timeout) => void,
    onExpire: () => void,
    delay: number
) {
    if (timer) {
        clearTimeout(timer);
    }
    setTimer(setTimeout(onExpire, delay));
}