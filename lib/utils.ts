export function die(message: string): never {
	throw new Error(message)
}
