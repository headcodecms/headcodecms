export const isEmpty = (value: unknown) => {
  if (value === null || value === undefined) return true
  if (typeof value === 'string' && value.trim() === '') return true
  if (typeof value === 'object' && Object.keys(value).length === 0) return true
  return false
}
