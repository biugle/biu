type ChildAppProcess = {
  kill(signal: "SIGTERM"): unknown;
};

type SignalProcess = {
  pid: number;
  once(event: "SIGINT" | "SIGTERM", listener: () => void): unknown;
  kill(pid: number, signal: "SIGINT" | "SIGTERM"): unknown;
};

/** Stop spawned APP servers and let the parent CLI receive its normal exit signal. */
export function installChildAppShutdownHandlers(
  children: readonly ChildAppProcess[],
  signalProcess: SignalProcess = process,
) {
  let shuttingDown = false;
  const stopChildrenAndExit = (signal: "SIGINT" | "SIGTERM") => {
    if (shuttingDown) return;
    shuttingDown = true;
    children.forEach((child) => child.kill("SIGTERM"));
    // A process signal listener replaces Node's default exit behavior. Re-deliver
    // it after killing child servers so the parent dev server cannot be orphaned.
    signalProcess.kill(signalProcess.pid, signal);
  };

  signalProcess.once("SIGINT", () => stopChildrenAndExit("SIGINT"));
  signalProcess.once("SIGTERM", () => stopChildrenAndExit("SIGTERM"));
}

/** Observe every spawned process and drain its rejection during cleanup. */
export function manageChildApps(
  children: readonly (ChildAppProcess & PromiseLike<unknown>)[],
  onFailure: (reason: unknown) => void,
) {
  let stopping = false;
  const stop = async () => {
    if (!stopping) {
      stopping = true;
      children.forEach((child) => child.kill("SIGTERM"));
    }
    await Promise.allSettled(children);
  };
  children.forEach((child) => {
    Promise.resolve(child).catch((reason: unknown) => {
      if (stopping) return;
      void stop();
      onFailure(reason);
    });
  });
  return { stop };
}
