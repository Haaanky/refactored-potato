import { useState, type FormEvent } from 'react'
import { Button } from './Button'

interface Props {
  placeholder: string
  onSubmit: (value: string) => void
  buttonLabel?: string
}

export function InlineForm({ placeholder, onSubmit, buttonLabel = 'Add' }: Props) {
  const [value, setValue] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (value.trim()) {
      onSubmit(value.trim())
      setValue('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder={placeholder}
        className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
      />
      <Button type="submit" variant="primary" disabled={!value.trim()}>
        {buttonLabel}
      </Button>
    </form>
  )
}
