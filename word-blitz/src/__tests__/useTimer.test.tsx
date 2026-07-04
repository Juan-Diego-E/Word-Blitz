import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useTimer } from '../hooks/useTimer';

describe('useTimer', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('cuenta hacia atrás y dispara onExpire UNA sola vez', () => {
    const onExpire = vi.fn();
    const deadline = Date.now() + 3000;
    const { result } = renderHook(() => useTimer(deadline, onExpire));
    expect(result.current.seconds).toBe(3);
    act(() => vi.advanceTimersByTime(3500));
    expect(result.current.seconds).toBe(0);
    expect(onExpire).toHaveBeenCalledTimes(1);
    act(() => vi.advanceTimersByTime(2000));
    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it('limpia el interval al desmontar (no se apilan intervalos)', () => {
    const clearSpy = vi.spyOn(window, 'clearInterval');
    const { unmount } = renderHook(() => useTimer(Date.now() + 5000));
    unmount();
    expect(clearSpy).toHaveBeenCalled();
  });

  it('al cambiar el deadline reinicia sin duplicar ticks', () => {
    const onExpire = vi.fn();
    let deadline = Date.now() + 2000;
    const { result, rerender } = renderHook(({ d }) => useTimer(d, onExpire), {
      initialProps: { d: deadline },
    });
    act(() => vi.advanceTimersByTime(1000));
    deadline = Date.now() + 4000;
    rerender({ d: deadline });
    expect(result.current.seconds).toBe(4);
    act(() => vi.advanceTimersByTime(4200));
    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it('deadline null = timer detenido', () => {
    const { result } = renderHook(() => useTimer(null));
    expect(result.current.seconds).toBeNull();
  });
});
