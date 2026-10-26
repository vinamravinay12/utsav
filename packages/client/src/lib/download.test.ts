import { afterEach, describe, expect, it, vi } from 'vitest';
import { downloadFile, slugify } from './download.js';

describe('downloadFile', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('downloads an in-memory file and releases the URL', () => {
    const create = vi.fn(() => 'blob:utsav/1');
    const revoke = vi.fn();
    Object.assign(URL, { createObjectURL: create, revokeObjectURL: revoke });
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);
    downloadFile('plan.ics', 'BEGIN:VCALENDAR', 'text/calendar');
    expect(create).toHaveBeenCalledWith(expect.any(Blob));
    expect(click).toHaveBeenCalledOnce();
    expect(revoke).toHaveBeenCalledWith('blob:utsav/1');
  });
});

describe('slugify', () => {
  it('makes a safe filename', () => {
    expect(slugify("Asha & Rohan's Wedding!")).toBe('asha-rohan-s-wedding');
    expect(slugify('***')).toBe('event');
  });
});
