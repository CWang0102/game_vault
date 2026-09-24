import { render, screen, fireEvent, act } from '@testing-library/react';
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

  it('shows a zeroed-out numeric value when there is no rating yet', () => {
    render(<StarRating rating={0} showValue />);
    expect(screen.getByTestId('rating-value')).toHaveTextContent('0.0 / 5');
  });

  function mockContainerRect(width = 100) {
    const container = screen.getByTestId('star-rating-container');
    container.getBoundingClientRect = () => ({
      left: 0,
      right: width,
      width,
      top: 0,
      bottom: 20,
      height: 20,
      x: 0,
      y: 0,
    });
    return container;
  }

  it('commits a decimal value on a plain click (zero-distance drag)', () => {
    const handleChange = vi.fn();
    render(<StarRating onChange={handleChange} />);
    const container = mockContainerRect(100);
    // 100px wide container / 5 stars = 20px per star; clientX 44 -> raw 2.2 -> quantized 2.3
    fireEvent.mouseDown(container, { clientX: 44 });
    fireEvent.mouseUp(document, { clientX: 44 });
    expect(handleChange).toHaveBeenCalledWith(2.3);
  });

  it('tracks a mouse drag continuously and commits the release position', () => {
    const handleChange = vi.fn();
    render(<StarRating onChange={handleChange} />);
    const container = mockContainerRect(100);
    fireEvent.mouseDown(container, { clientX: 4 });
    fireEvent.mouseMove(document, { clientX: 44 });
    fireEvent.mouseMove(document, { clientX: 84 });
    fireEvent.mouseUp(document, { clientX: 84 });
    expect(handleChange).toHaveBeenCalledWith(4.3);
  });

  it('tracks a touch drag continuously and commits the release position', () => {
    const handleChange = vi.fn();
    render(<StarRating onChange={handleChange} />);
    const container = mockContainerRect(100);
    fireEvent.touchStart(container, { touches: [{ clientX: 4 }] });
    fireEvent.touchMove(document, { touches: [{ clientX: 64 }] });
    fireEvent.touchEnd(document, { touches: [{ clientX: 64 }] });
    expect(handleChange).toHaveBeenCalledWith(3.3);
  });

  it('toggles off via drag to the same value and immediately reflects 0 in the display', async () => {
    // Regression test: the hover/drag preview (hoverRating) is only synced to
    // the container prop on mouseleave, so a commit whose value diverges from
    // the live preview (e.g. a toggle-off) must resync it itself, or the
    // readout and fill keep showing the stale pre-commit preview value.
    const handleChange = vi.fn();
    const { rerender } = render(<StarRating rating={0} onChange={handleChange} showValue />);
    const container = mockContainerRect(100);

    fireEvent.mouseDown(container, { clientX: 44 });
    // Let the rAF-batched hover preview flush, matching real pointer timing,
    // so `hovering` is genuinely true (as it would be mid real interaction)
    // when the commit below fires.
    await act(async () => {
      await new Promise((resolve) => requestAnimationFrame(resolve));
    });
    fireEvent.mouseUp(document, { clientX: 44 });
    expect(handleChange).toHaveBeenLastCalledWith(2.3);

    // Simulate the parent re-rendering with the newly committed rating,
    // as GameModal/StatusConfirmModal do via a controlled `rating` prop.
    rerender(<StarRating rating={2.3} onChange={handleChange} showValue />);

    fireEvent.mouseDown(container, { clientX: 44 });
    await act(async () => {
      await new Promise((resolve) => requestAnimationFrame(resolve));
    });
    fireEvent.mouseUp(document, { clientX: 44 });
    expect(handleChange).toHaveBeenLastCalledWith(0);
    expect(screen.getByTestId('rating-value')).toHaveTextContent('0.0 / 5');
  });
});
