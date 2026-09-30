import scrollToPackageSection from './scrollToPackageSection';

describe('scrollToPackageSection', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/project/test/quotes_tender');
    document.body.innerHTML = '<div id="3d Laser Scanning Survey"></div>';
    window.requestAnimationFrame = (cb) => cb();
  });

  it('scrolls to the package element and updates the hash without navigation', () => {
    const scrollIntoView = jest.fn();
    document.getElementById('3d Laser Scanning Survey').scrollIntoView = scrollIntoView;

    scrollToPackageSection('3d Laser Scanning Survey');

    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start',
    });
    expect(window.location.hash).toBe(
      `#${encodeURIComponent('3d Laser Scanning Survey')}`,
    );
    expect(window.location.pathname).toBe('/project/test/quotes_tender');
  });

  it('does nothing when packageLabel is empty', () => {
    scrollToPackageSection('');
    expect(window.location.hash).toBe('');
  });
});
