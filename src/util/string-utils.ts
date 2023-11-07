export function hasText(str: string) {
    return (typeof str === 'string') && str.trim().length > 0
}