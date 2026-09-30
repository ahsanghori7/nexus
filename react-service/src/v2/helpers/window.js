function isIOS() {
  if (/iPad|iPhone|iPod/.test(navigator.platform)) {
    return true;
  }
  return (
    navigator.maxTouchPoints &&
    navigator.maxTouchPoints > 2 &&
    /MacIntel/.test(navigator.platform)
  );
}

function isIpadOS() {
  return (
    navigator.maxTouchPoints &&
    navigator.maxTouchPoints > 2 &&
    /MacIntel/.test(navigator.platform)
  );
}

export { isIOS, isIpadOS };
