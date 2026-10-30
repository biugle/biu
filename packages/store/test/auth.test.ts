import assert from "node:assert/strict";
import { test } from "node:test";
import { useBiuAuthStore, useBiuPreferenceStore, type BiuAuthContext } from "../src/index.js";

const signedIn: BiuAuthContext = {
  mode: "SSO",
  authenticated: true,
  user: { id: "demo-user", name: "演示用户" },
};

function preserveAuthState() {
  const preference = useBiuPreferenceStore.getState();
  const auth = useBiuAuthStore.getState();
  return () => {
    useBiuPreferenceStore.setState(preference, true);
    useBiuAuthStore.setState(auth, true);
  };
}

test("auth identity updates and logout reach the legacy preference view", () => {
  const restore = preserveAuthState();
  try {
    useBiuAuthStore.getState().setContext(signedIn);
    assert.strictEqual(useBiuPreferenceStore.getState().auth, signedIn);
    const updated = { ...signedIn, user: { ...signedIn.user!, name: "更新后的身份" } };
    useBiuAuthStore.getState().setContext(updated);
    assert.strictEqual(useBiuPreferenceStore.getState().auth, updated);
    useBiuAuthStore.getState().clear();
    assert.equal(useBiuPreferenceStore.getState().auth, undefined);
  } finally {
    restore();
  }
});

test("legacy setters and configured auth use the authoritative auth store", () => {
  const restore = preserveAuthState();
  try {
    useBiuPreferenceStore.getState().setAuth(signedIn);
    useBiuPreferenceStore.setState((state) => state);
    assert.strictEqual(useBiuAuthStore.getState().context, signedIn);
    const configured = { ...signedIn, user: { name: "配置身份" } };
    useBiuPreferenceStore.getState().initialize({ auth: configured }, "auth-compatibility");
    assert.strictEqual(useBiuAuthStore.getState().context, configured);
    useBiuPreferenceStore.getState().initialize({ locale: "en-US" }, "auth-compatibility");
    assert.strictEqual(useBiuAuthStore.getState().context, configured);
    useBiuPreferenceStore.getState().setAuth(undefined);
    assert.equal(useBiuAuthStore.getState().context, undefined);
  } finally {
    restore();
  }
});

test("raw legacy state updates, updater functions and replacement keep auth consistent", () => {
  const restore = preserveAuthState();
  try {
    useBiuPreferenceStore.setState({ auth: signedIn });
    assert.strictEqual(useBiuAuthStore.getState().context, signedIn);
    let updaterCalls = 0;
    useBiuPreferenceStore.setState((state) => {
      updaterCalls += 1;
      return { auth: { ...state.auth!, user: { name: "Updater identity" } }, theme: "dark" };
    });
    assert.equal(updaterCalls, 1);
    assert.strictEqual(useBiuPreferenceStore.getState().auth, useBiuAuthStore.getState().context);
    assert.equal(useBiuAuthStore.getState().context?.user?.name, "Updater identity");
    assert.equal(useBiuPreferenceStore.getState().theme, "dark");
    const signedOut: BiuAuthContext = { mode: "SSO", authenticated: false };
    useBiuPreferenceStore.setState({ ...useBiuPreferenceStore.getState(), auth: signedOut }, true);
    assert.strictEqual(useBiuAuthStore.getState().context, signedOut);
    useBiuAuthStore.setState({ context: signedIn });
    assert.strictEqual(useBiuPreferenceStore.getState().auth, signedIn);
  } finally {
    restore();
  }
});

test("auth compatibility synchronization emits once and does not loop on equivalent identities", () => {
  const restore = preserveAuthState();
  useBiuAuthStore.getState().clear();
  let authEvents = 0;
  let preferenceEvents = 0;
  const unsubscribeAuth = useBiuAuthStore.subscribe(() => {
    authEvents += 1;
  });
  const unsubscribePreference = useBiuPreferenceStore.subscribe(() => {
    preferenceEvents += 1;
  });
  try {
    useBiuPreferenceStore.setState({ auth: signedIn });
    assert.equal(authEvents, 1);
    assert.equal(preferenceEvents, 1);
    useBiuAuthStore.getState().setContext(signedIn);
    useBiuPreferenceStore.getState().setAuth(signedIn);
    useBiuPreferenceStore.setState((state) => state);
    assert.equal(authEvents, 1);
    assert.equal(preferenceEvents, 1);
    useBiuAuthStore.getState().clear();
    assert.equal(authEvents, 2);
    assert.equal(preferenceEvents, 2);
  } finally {
    unsubscribeAuth();
    unsubscribePreference();
    restore();
  }
});

test("a legacy update of identity and preferences produces one consistent preference notification", () => {
  const restore = preserveAuthState();
  useBiuAuthStore.getState().clear();
  let preferenceEvents = 0;
  const unsubscribe = useBiuPreferenceStore.subscribe((state) => {
    preferenceEvents += 1;
    assert.strictEqual(state.auth, useBiuAuthStore.getState().context);
  });
  try {
    useBiuPreferenceStore.setState({ auth: signedIn, theme: "dark" });
    assert.equal(preferenceEvents, 1);
    assert.equal(useBiuPreferenceStore.getState().theme, "dark");
    useBiuPreferenceStore.setState({ ...useBiuPreferenceStore.getState(), auth: undefined }, true);
    assert.equal(preferenceEvents, 2);
    assert.equal(useBiuAuthStore.getState().context, undefined);
  } finally {
    unsubscribe();
    restore();
  }
});

test("configured identity and preferences initialize in one consistent notification", () => {
  const restore = preserveAuthState();
  useBiuAuthStore.getState().clear();
  useBiuPreferenceStore.setState({ theme: "light", locale: "zh-CN" });
  const updates: Array<{ auth?: BiuAuthContext; theme: string; locale: string }> = [];
  const unsubscribe = useBiuPreferenceStore.subscribe((state) => {
    updates.push({ auth: state.auth, theme: state.theme, locale: state.locale });
    assert.strictEqual(state.auth, useBiuAuthStore.getState().context);
  });
  try {
    useBiuPreferenceStore.getState().initialize({ auth: signedIn, theme: "dark", locale: "en-US" }, "auth-initialize");
    assert.deepEqual(updates, [{ auth: signedIn, theme: "dark", locale: "en-US" }]);
  } finally {
    unsubscribe();
    restore();
  }
});
