import { getFetchMode } from "./fetchMode";
import { createViewportKey } from "./viewportKey";

const DEFAULT_DEBOUNCE_MS = 300;

function isAbortError(error) {
  return (
    error?.name === "AbortError" ||
    error?.name === "CanceledError" ||
    error?.code === "ERR_CANCELED"
  );
}

export function createViewportController(config) {
  const {
    fetchTowerCount,
    fetchClusters,
    fetchRawTowers,
    onData,
    debounceMs = DEFAULT_DEBOUNCE_MS,
  } = config;

  let debounceTimer = null;
  let activeRequest = null;
  let lastViewportKey = null;
  let requestId = 0;

  const fetchByMode = {
    count: fetchTowerCount,
    cluster: fetchClusters,
    raw: fetchRawTowers,
  };

  function clearDebounce() {
    if (debounceTimer) {
      window.clearTimeout(debounceTimer);
      debounceTimer = null;
    }
  }

  function cancelActiveRequest() {
    if (activeRequest) {
      activeRequest.abort();
      activeRequest = null;
    }
  }

  async function executeRequest({ bounds, zoom }) {
    const mode = getFetchMode(zoom);
    const fetchViewportData = fetchByMode[mode];

    if (!fetchViewportData) {
      return;
    }

    cancelActiveRequest();

    const controller = new AbortController();
    const currentRequestId = requestId + 1;

    activeRequest = controller;
    requestId = currentRequestId;

    try {
      const data = await fetchViewportData({
        bounds,
        zoom,
        signal: controller.signal,
      });

      if (controller.signal.aborted || currentRequestId !== requestId) {
        return;
      }

      onData({
        mode,
        data,
      });
    } catch (error) {
      if (!isAbortError(error)) {
        throw error;
      }
    } finally {
      if (activeRequest === controller) {
        activeRequest = null;
      }
    }
  }

  function handleViewportChange({ bounds, zoom }) {
    clearDebounce();

    debounceTimer = window.setTimeout(() => {
      const viewportKey = createViewportKey(bounds);

      if (viewportKey === lastViewportKey) {
        return;
      }

      lastViewportKey = viewportKey;
      executeRequest({ bounds, zoom }).catch((error) => {
        console.log("Error fetching viewport data:", error);
      });
    }, debounceMs);
  }

  function destroy() {
    clearDebounce();
    cancelActiveRequest();
  }

  return {
    handleViewportChange,
    destroy,
  };
}
