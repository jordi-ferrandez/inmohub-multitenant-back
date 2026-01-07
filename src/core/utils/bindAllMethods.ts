export function bindAllMethods<T extends Record<string, any>>(instance: T): T {
  const proto = Object.getPrototypeOf(instance);
  Object.getOwnPropertyNames(proto).forEach((key) => {
    const val = instance[key];
    if (typeof val === "function" && key !== "constructor") {
      (instance as any)[key] = val.bind(instance);
    }
  });
  return instance;
}
