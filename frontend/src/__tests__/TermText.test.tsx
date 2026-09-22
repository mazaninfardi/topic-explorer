import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { TermText } from '../components/TermText'

describe('TermText', () => {
  it('renders a clickable button per term and reports the canonical term', () => {
    const onTermClick = vi.fn()
    render(
      <TermText text="The transformer is fast." terms={['transformer']} onTermClick={onTermClick} />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'transformer' }))
    expect(onTermClick).toHaveBeenCalledWith('transformer')
  })

  it('matches case-insensitively but passes the stored casing', () => {
    const onTermClick = vi.fn()
    render(
      <TermText text="Transformer models scale." terms={['transformer']} onTermClick={onTermClick} />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Transformer' }))
    expect(onTermClick).toHaveBeenCalledWith('transformer')
  })

  it('renders plain text with no buttons when there are no terms', () => {
    render(<TermText text="no terms here" terms={[]} onTermClick={vi.fn()} />)
    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.getByText('no terms here')).toBeInTheDocument()
  })
})
