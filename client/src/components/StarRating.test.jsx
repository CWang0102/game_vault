import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import StarRating from './StarRating';

vi.mock('lucide-react', () => ({
  Star: ({ fill, size, strokeWidth }) => (
    <svg data-testid="star" data-fill={fill} data-size={size} data-stroke={strokeWidth}>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  ),
}));

describe('StarRating', () => {
  it('renders 5 stars', () => {
    render(<StarRating />);
    const stars = screen.getAllByTestId('star');
    expect(stars).toHaveLength(5);
  });

  it('displays the given rating', () => {
    render(<StarRating rating={3} />);
    const filledStars = screen.getAllByTestId('star');
    // First 3 stars should be filled (filled means data-fill="currentColor")
    expect(filledStars[0]).toHaveAttribute('data-fill', 'currentColor');
    expect(filledStars[1]).toHaveAttribute('data-fill', 'currentColor');
    expect(filledStars[2]).toHaveAttribute('data-fill', 'currentColor');
  });

  it('calls onChange when a star is clicked', async () => {
    const handleChange = vi.fn();
    render(<StarRating onChange={handleChange} />);
    const stars = screen.getAllByTestId('star');
    fireEvent.click(stars[2]);
    expect(handleChange).toHaveBeenCalledWith(3);
  });

  it('does not call onChange when readonly', () => {
    const handleChange = vi.fn();
    render(<StarRating rating={2} onChange={handleChange} readonly />);
    const stars = screen.getAllByTestId('star');
    fireEvent.click(stars[4]);
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('toggles off star when clicking the same rating', () => {
    const handleChange = vi.fn();
    render(<StarRating rating={3} onChange={handleChange} />);
    const stars = screen.getAllByTestId('star');
    fireEvent.click(stars[2]);
    expect(handleChange).toHaveBeenCalledWith(0);
  });
});
