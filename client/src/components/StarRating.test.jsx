import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import StarRating from './StarRating';

vi.mock('lucide-react', () => ({
  Star: ({ fill, size, strokeWidth }) => (
    <svg
      data-testid={fill ? 'star-fill' : 'star-base'}
      data-fill={fill}
      data-size={size}
      data-stroke={strokeWidth}
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  ),
}));

function fillWidths() {
  return Array.from(document.querySelectorAll('[data-fill-wrapper]')).map(
    (el) => el.style.width
  );
}

describe('StarRating', () => {
  it('renders 5 stars', () => {
    render(<StarRating />);
    expect(screen.getAllByTestId('star-base')).toHaveLength(5);
    expect(screen.getAllByTestId('star-fill')).toHaveLength(5);
  });

  it('displays the given whole-number rating', () => {
    render(<StarRating rating={3} />);
    expect(fillWidths()).toEqual(['100%', '100%', '100%', '0%', '0%']);
  });

  it('displays a partial fill for a decimal rating', () => {
    render(<StarRating rating={3.4} />);
    expect(fillWidths()).toEqual(['100%', '100%', '100%', '40%', '0%']);
  });

  it('calls onChange with the whole star value on keyboard activation', () => {
    const handleChange = vi.fn();
    render(<StarRating onChange={handleChange} />);
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[2]);
    expect(handleChange).toHaveBeenCalledWith(3);
  });

  it('does not call onChange when readonly', () => {
    const handleChange = vi.fn();
    render(<StarRating rating={2} onChange={handleChange} readonly />);
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[4]);
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('toggles off star when clicking the same rating', () => {
    const handleChange = vi.fn();
    render(<StarRating rating={3} onChange={handleChange} />);
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[2]);
    expect(handleChange).toHaveBeenCalledWith(0);
  });

  it('does not render a numeric value by default', () => {
    render(<StarRating rating={3} />);
    expect(screen.queryByTestId('rating-value')).not.toBeInTheDocument();
  });

  it('shows the numeric value next to the stars when showValue is set', () => {
    render(<StarRating rating={3.4} showValue />);
    expect(screen.getByTestId('rating-value')).toHaveTextContent('3.4 / 5');
  });

  it('shows a placeholder when there is no rating yet', () => {
    render(<StarRating rating={0} showValue />);
    expect(screen.getByTestId('rating-value')).toHaveTextContent('—');
  });
});
