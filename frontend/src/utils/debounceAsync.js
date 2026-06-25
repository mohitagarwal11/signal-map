function makeCanceledError() {
  return Object.assign(new Error('Canceled'), { name: 'CanceledError' });
}

export function debounceAsync(fn, wait) {
  let timer = null;
  let pendingReject = null;

  return (...args) => {
    if (timer) {
      window.clearTimeout(timer);
      if (pendingReject) {
        pendingReject(makeCanceledError());
        pendingReject = null;
      }
    }

    return new Promise((resolve, reject) => {
      pendingReject = reject;
      timer = window.setTimeout(async () => {
        timer = null;
        pendingReject = null;
        try {
          const res = await fn(...args);
          resolve(res);
        } catch (err) {
          reject(err);
        }
      }, wait);
    });
  };
}
