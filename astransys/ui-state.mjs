export const UI_STATES = Object.freeze(['idle', 'pending', 'success', 'error']);

export function initialUiState() {
  return { status: 'idle', requestId: 0, result: null, axes: null, error: null };
}

export function beginUiRequest(state, requestId) {
  return { ...state, status: 'pending', requestId, result: null, axes: null, error: null };
}

export function acceptUiSuccess(state, requestId, result, axes = null) {
  if (requestId !== state.requestId) return state;
  return { ...state, status: 'success', result, axes, error: null };
}

export function acceptUiError(state, requestId, error) {
  if (requestId !== state.requestId) return state;
  return { ...state, status: 'error', result: null, axes: null, error };
}

export function isCurrentRequest(token, currentToken) { return token === currentToken; }
