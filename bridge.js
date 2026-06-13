export function normalizeUserInputText(text) {
  return (text || '').trim();
}

function resolveOptions(optionsOrChannel) {
  if (typeof optionsOrChannel === 'string') {
    return { broadcastChannel: optionsOrChannel };
  }
  return { ...(optionsOrChannel || {}) };
}

function detectRole() {
  const path = window.location.pathname.toLowerCase();
  if (path.includes('/input')) return 'input';
  if (path.includes('/control')) return 'control';
  return 'poster';
}

function relayUrl() {
  const params = new URLSearchParams(window.location.search);
  const override = params.get('relay');
  if (override) return override.replace(/\/$/, '');
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws`;
}

function createTransport({ project, role, fallbackChannel }) {
  const handlers = [];
  const queue = [];
  let ws = null;
  let wsReady = false;
  let bc = null;
  let bcReady = false;
  let reconnectTimer = null;
  let fallbackTimer = null;

  function dispatch(data) {
    if (!data || typeof data !== 'object') return;
    handlers.forEach((handler) => handler(data));
  }

  function closeBroadcast() {
    if (fallbackTimer) {
      window.clearTimeout(fallbackTimer);
      fallbackTimer = null;
    }
    if (bc) {
      bc.close();
      bc = null;
    }
    bcReady = false;
  }

  function connectBroadcast() {
    if (bcReady || !fallbackChannel || typeof BroadcastChannel === 'undefined') return;
    bc = new BroadcastChannel(fallbackChannel);
    bc.addEventListener('message', (event) => {
      if (!wsReady) dispatch(event.data);
    });
    bcReady = true;
    flush();
  }

  function flush() {
    while (queue.length > 0) {
      if (wsReady && ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(queue.shift()));
        continue;
      }
      if (bcReady) {
        bc.postMessage(queue.shift());
        continue;
      }
      break;
    }
  }

  function scheduleBroadcastFallback() {
    if (fallbackTimer || bcReady) return;
    fallbackTimer = window.setTimeout(() => {
      fallbackTimer = null;
      if (!wsReady) connectBroadcast();
    }, 800);
  }

  function scheduleReconnect() {
    if (reconnectTimer || !project) return;
    reconnectTimer = window.setTimeout(() => {
      reconnectTimer = null;
      connectWebSocket();
    }, 2000);
  }

  function connectWebSocket() {
    if (!project) {
      connectBroadcast();
      return;
    }

    closeBroadcast();
    ws = new WebSocket(`${relayUrl()}?project=${encodeURIComponent(project)}&role=${encodeURIComponent(role)}`);
    scheduleBroadcastFallback();

    ws.addEventListener('open', () => {
      wsReady = true;
      closeBroadcast();
      flush();
    });

    ws.addEventListener('message', (event) => {
      if (!wsReady) return;
      try {
        dispatch(JSON.parse(event.data));
      } catch {
        // ignore malformed payloads
      }
    });

    ws.addEventListener('close', () => {
      wsReady = false;
      ws = null;
      scheduleBroadcastFallback();
      scheduleReconnect();
    });

    ws.addEventListener('error', () => {
      // close handler handles fallback/reconnect
    });
  }

  connectWebSocket();

  return {
    send(payload) {
      queue.push(payload);
      flush();
    },
    onMessage(handler) {
      handlers.push(handler);
    },
    close() {
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      closeBroadcast();
      ws?.close();
    }
  };
}

export function createInputBridge(optionsOrChannel) {
  const options = resolveOptions(optionsOrChannel);
  const transport = createTransport({
    project: options.project || null,
    role: options.role || detectRole(),
    fallbackChannel: options.broadcastChannel
  });
  const textHandlers = [];

  transport.onMessage((data) => {
    if (data.type === 'text' && data.text && data.text.trim().length) {
      textHandlers.forEach((handler) => handler(data.text));
    }
  });

  return {
    send(text) {
      const payload = normalizeUserInputText(text);
      if (!payload.length) return;
      transport.send({ type: 'text', text: payload });
    },
    onText(handler) {
      textHandlers.push(handler);
    },
    close() {
      transport.close();
    }
  };
}