function followMovedPage() {
  const fragment = window.location.hash;
  if (fragment === "#company" || fragment === "#careers") {
    window.location.replace("/" + fragment.slice(1));
  }
}

followMovedPage();
window.addEventListener("hashchange", followMovedPage);
